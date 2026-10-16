<?php

namespace App\Http\Controllers;

use App\Models\DialysisSession;
use App\Models\MedicalRecord;
use App\Models\PatientMedication;
use App\Support\ClinicCharts;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientPortalController extends Controller
{
    public function index(Request $request): Response
    {
        $patient = $request->user()->patient;

        $sessionModels = $patient === null
            ? collect()
            : DialysisSession::query()
                ->with(['patient', 'nurse'])
                ->where('patient_id', $patient->id)
                ->orderByDesc('scheduled_date')
                ->orderBy('scheduled_time')
                ->limit(12)
                ->get();

        $recordModels = $patient === null
            ? collect()
            : MedicalRecord::query()
                ->with(['patient', 'recorder'])
                ->where('patient_id', $patient->id)
                ->orderBy('examination_date')
                ->get();

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
            'sessions' => $sessionModels
                ->map(fn (DialysisSession $session): array => $session->toPortalArray())
                ->values(),
            'medications' => $medications,
            'records' => $recordModels
                ->sortByDesc(fn (MedicalRecord $record) => $record->examination_date->toDateString())
                ->map(fn (MedicalRecord $record): array => $record->toPortalArray())
                ->values(),
            'charts' => [
                'weight' => ClinicCharts::weight($sessionModels),
                'systolic' => ClinicCharts::systolic($sessionModels),
                'diastolic' => ClinicCharts::diastolic($sessionModels),
                'hemoglobin' => ClinicCharts::lab($recordModels, 'hemoglobin'),
                'potassium' => ClinicCharts::lab($recordModels, 'potassium'),
            ],
            'today' => today()->toDateString(),
        ]);
    }
}
