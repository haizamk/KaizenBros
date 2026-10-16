<?php

namespace App\Http\Controllers;

use App\Models\MedicalReport;
use App\Support\ClinicFiles;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MedicalReportController extends Controller
{
    public function download(MedicalReport $report): StreamedResponse
    {
        return ClinicFiles::download($report->disk, $report->path, $report->original_name, 'medical_reports');
    }

    public function downloadOwn(Request $request, MedicalReport $report): StreamedResponse
    {
        $patientId = $request->user()->patient?->id;

        abort_unless($patientId !== null && $report->patient_id === $patientId, 403);

        return ClinicFiles::download($report->disk, $report->path, $report->original_name, 'medical_reports');
    }
}
