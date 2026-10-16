<?php

namespace App\Http\Controllers;

use App\Models\DialysisSession;
use App\Models\MedicalRecord;
use App\Models\PatientDocument;
use App\Models\PatientMedication;
use App\Support\BloodReportAnalysis;
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
                ->with(['patient', 'recorder', 'report'])
                ->where('patient_id', $patient->id)
                ->orderBy('examination_date')
                ->get();

        $documents = $patient === null
            ? collect()
            : PatientDocument::query()
                ->where('patient_id', $patient->id)
                ->latest()
                ->get()
                ->map(fn (PatientDocument $document): array => $document->toPortalArray())
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
            'sessions' => $sessionModels
                ->map(fn (DialysisSession $session): array => $session->toPortalArray())
                ->values(),
            'medications' => $medications,
            'records' => BloodReportAnalysis::present($recordModels),
            'documents' => $documents,
            'charts' => [
                'weight' => ClinicCharts::weight($sessionModels),
                'systolic' => ClinicCharts::systolic($sessionModels),
                'diastolic' => ClinicCharts::diastolic($sessionModels),
                'hemoglobin' => ClinicCharts::lab($recordModels, 'hemoglobin'),
                'potassium' => ClinicCharts::lab($recordModels, 'potassium'),
                'phosphate' => ClinicCharts::lab($recordModels, 'phosphate'),
                'urea' => ClinicCharts::lab($recordModels, 'urea'),
                'creatinine' => ClinicCharts::lab($recordModels, 'creatinine'),
            ],
            'today' => today()->toDateString(),
        ]);
    }
}
