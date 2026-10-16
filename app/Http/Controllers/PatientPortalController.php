<?php

namespace App\Http\Controllers;

use App\Models\DialysisSession;
use App\Models\PatientMedication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientPortalController extends Controller
{
    public function index(Request $request): Response
    {
        $patient = $request->user()->patient;

        $sessions = $patient === null
            ? collect()
            : DialysisSession::query()
                ->with(['patient', 'nurse'])
                ->where('patient_id', $patient->id)
                ->orderByDesc('scheduled_date')
                ->orderBy('scheduled_time')
                ->limit(8)
                ->get()
                ->map(fn (DialysisSession $session): array => $session->toPortalArray())
                ->values();

        $medications = $patient === null
            ? collect()
            : PatientMedication::query()
                ->where('patient_id', $patient->id)
                ->where('is_active', true)
                ->orderBy('medication_name')
                ->get()
                ->map(fn (PatientMedication $medication): array => $medication->toPortalArray())
                ->values();

        return Inertia::render('pesakit/papan', [
            'patient' => $patient?->toPortalArray(),
            'sessions' => $sessions,
            'medications' => $medications,
            'today' => today()->toDateString(),
        ]);
    }
}
