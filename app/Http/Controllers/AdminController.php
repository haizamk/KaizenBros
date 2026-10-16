<?php

namespace App\Http\Controllers;

use App\Models\NurseApplication;
use App\Models\Patient;
use App\Models\Registration;
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
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (Registration $registration): array => $registration->toPortalArray())
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
        ]);
    }
}
