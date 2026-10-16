<?php

namespace App\Http\Controllers;

use App\Actions\ApprovePatientRegistration;
use App\Enums\DocumentCategory;
use App\Enums\SchedulePattern;
use App\Enums\SessionStatus;
use App\Enums\ShiftSlot;
use App\Http\Requests\ApproveRegistrationRequest;
use App\Models\DialysisSession;
use App\Models\NurseApplication;
use App\Models\Patient;
use App\Models\PatientDocument;
use App\Models\Registration;
use App\Support\EnrolmentOptions;
use App\Support\NurseBoard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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

        $sessions = NurseBoard::todaySessions();

        return Inertia::render('admin/papan', [
            'today' => NurseBoard::counts($sessions),
            'patients' => $patients,
            'registrations' => $registrations,
            'nurseApplications' => $nurseApplications,
            'patientDocuments' => $patientDocuments,
            'shifts' => collect(ShiftSlot::cases())->map(fn (ShiftSlot $shift): array => [
                'value' => $shift->value,
                'label' => $shift->label(),
                'time_range' => $shift->timeRange(),
            ])->values(),
            'schedules' => collect(SchedulePattern::cases())->map(fn (SchedulePattern $pattern): array => [
                'value' => $pattern->value,
                'label' => $pattern->label(),
            ])->values(),
            'sponsors' => EnrolmentOptions::sponsorChoices(),
            'accesses' => EnrolmentOptions::accessChoices(),
            'documentCategories' => collect(DocumentCategory::cases())->map(fn (DocumentCategory $category): array => [
                'value' => $category->value,
                'label' => $category->label(),
            ])->values(),
            'notice' => session('status'),
        ]);
    }

    public function updateShift(Request $request, Patient $patient): RedirectResponse
    {
        $data = $request->validate([
            'preferred_shift' => ['required', Rule::enum(ShiftSlot::class)],
        ]);

        $shift = ShiftSlot::from($data['preferred_shift']);
        $patient->forceFill(['preferred_shift' => $shift])->save();

        DialysisSession::query()
            ->where('patient_id', $patient->id)
            ->whereDate('scheduled_date', today())
            ->where('status', SessionStatus::BelumHadir)
            ->update([
                'shift' => $shift->value,
                'scheduled_time' => $shift->startTime(),
            ]);

        return back()->with('status', 'Syif pesakit dikemas kini.');
    }

    public function approveRegistration(ApproveRegistrationRequest $request, Registration $registration, ApprovePatientRegistration $enrolment): RedirectResponse
    {
        $patient = $enrolment->open($registration, $request->user(), $request->validated());
        $today = in_array(today()->dayOfWeek, $patient->schedule_pattern->weekdays(), true)
            ? 'Pesakit dimasukkan dalam senarai hari ini.'
            : 'Hari ini bukan hari rawatan jadual ini. Pesakit muncul pada hari rawatan yang seterusnya.';

        return back()->with('status', "Permohonan diluluskan. Nombor pesakit {$patient->patient_id_code}. Pesakit boleh log masuk dengan nombor telefon, nombor pesakit, atau kad pengenalan, bersama kata laluan yang ditetapkan. {$today}");
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
