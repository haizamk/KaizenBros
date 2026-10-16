<?php

namespace App\Http\Controllers;

use App\Enums\DocumentCategory;
use App\Http\Requests\StorePatientDocumentRequest;
use App\Models\Patient;
use App\Models\PatientDocument;
use App\Models\Registration;
use App\Support\ClinicFiles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ClinicDocumentController extends Controller
{
    public function storeForRegistration(StorePatientDocumentRequest $request, Registration $registration): RedirectResponse
    {
        $this->ensureRoom($registration->documents()->count());

        ClinicFiles::storePatientDocument($request->file('document'), [
            'registration_id' => $registration->id,
            'uploaded_by' => $request->user()->id,
            'category' => $request->enum('category', DocumentCategory::class),
        ]);

        return back()->with('status', 'Dokumen permohonan disimpan.');
    }

    public function storeForPatient(StorePatientDocumentRequest $request, Patient $patient): RedirectResponse
    {
        $this->ensureRoom($patient->documents()->count());

        ClinicFiles::storePatientDocument($request->file('document'), [
            'patient_id' => $patient->id,
            'uploaded_by' => $request->user()->id,
            'category' => $request->enum('category', DocumentCategory::class),
        ]);

        return back()->with('status', 'Dokumen pesakit disimpan.');
    }

    public function download(PatientDocument $document): StreamedResponse
    {
        return ClinicFiles::download($document->disk, $document->path, $document->original_name, 'patient_documents');
    }

    public function downloadOwn(Request $request, PatientDocument $document): StreamedResponse
    {
        $patientId = $request->user()->patient?->id;

        abort_unless($patientId !== null && $document->patient_id === $patientId, 403);

        return ClinicFiles::download($document->disk, $document->path, $document->original_name, 'patient_documents');
    }

    private function ensureRoom(int $count): void
    {
        if ($count >= 12) {
            throw ValidationException::withMessages([
                'document' => 'Had dokumen untuk rekod ini sudah penuh.',
            ]);
        }
    }
}
