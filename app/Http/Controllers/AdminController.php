<?php

namespace App\Http\Controllers;

use App\Enums\DocumentCategory;
use App\Models\NurseApplication;
use App\Models\Patient;
use App\Models\PatientDocument;
use App\Models\Registration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(): Response
    {
        $patients = Patient::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (Patient $patient): array => $patient->toPortalArray())
            ->values();

        $registrations = Registration::query()
            ->with('documents')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (Registration $registration): array => $registration->toPortalArray())
            ->values();

        $patientDocuments = PatientDocument::query()
            ->with('patient')
            ->whereNotNull('patient_id')
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn (PatientDocument $document): array => [
                ...$document->toPortalArray(),
                'patient_name' => $document->patient?->name,
            ])
            ->values();

        $nurseApplications = NurseApplication::query()
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (NurseApplication $application): array => $application->toPortalArray())
            ->values();

        return Inertia::render('admin/papan', [
            'patients' => $patients,
            'registrations' => $registrations,
            'nurseApplications' => $nurseApplications,
            'patientDocuments' => $patientDocuments,
            'documentCategories' => collect(DocumentCategory::cases())->map(fn (DocumentCategory $category): array => [
                'value' => $category->value,
                'label' => $category->label(),
            ])->values(),
            'notice' => session('status'),
        ]);
    }

    public function approveRegistration(Registration $registration): RedirectResponse
    {
        $this->review($registration, 'DILULUSKAN');

        return back()->with('status', 'Permohonan pesakit diluluskan.');
    }

    public function rejectRegistration(Registration $registration): RedirectResponse
    {
        $this->review($registration, 'DITOLAK');

        return back()->with('status', 'Permohonan pesakit ditolak.');
    }

    private function review(Registration $registration, string $status): void
    {
        if ($registration->status !== 'BARU') {
            throw ValidationException::withMessages([
                'status' => 'Permohonan ini sudah disemak.',
            ]);
        }

        $registration->update([
            'status' => $status,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);
    }
}
