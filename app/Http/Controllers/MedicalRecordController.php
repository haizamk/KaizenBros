<?php

namespace App\Http\Controllers;

use App\Enums\ExaminationType;
use App\Http\Requests\StoreMedicalRecordRequest;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Support\BloodReportAnalysis;
use App\Support\ClinicFiles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MedicalRecordController extends Controller
{
    public function index(Request $request): Response
    {
        $patients = Patient::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'patient_id_code']);

        $selectedId = $request->integer('pesakit');
        $selected = $patients->firstWhere('id', $selectedId);

        $recordQuery = MedicalRecord::query()->with(['patient', 'recorder', 'report']);

        if ($selected) {
            $recordQuery->where('patient_id', $selected->id);
        } else {
            $recordQuery->orderByDesc('examination_date')->limit(20);
        }

        $records = BloodReportAnalysis::present($recordQuery->get());

        return Inertia::render('jururawat/darah', [
            'patients' => $patients->map(fn (Patient $patient): array => [
                'id' => $patient->id,
                'name' => $patient->name,
                'patient_id_code' => $patient->patient_id_code,
            ])->values(),
            'selectedPatientId' => $selected?->id,
            'records' => $records,
            'status' => $request->session()->get('status'),
            'examinationTypes' => collect(ExaminationType::cases())->map(fn (ExaminationType $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
            ])->values(),
        ]);
    }

    public function store(StoreMedicalRecordRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $record = MedicalRecord::query()->create([
                ...$request->safe()->only([
                    'patient_id',
                    'examination_date',
                    'examination_type',
                    'hemoglobin',
                    'potassium',
                    'phosphate',
                    'urea',
                    'creatinine',
                    'clinical_notes',
                ]),
                'recorded_by' => $request->user()->id,
            ]);

            if ($request->hasFile('report')) {
                ClinicFiles::storeMedicalReport($request->file('report'), $record, $request->user()->id);
            }
        });

        return redirect()
            ->route('nurse.records.index', ['pesakit' => $request->integer('patient_id')])
            ->with('status', 'Rekod darah disimpan.');
    }
}
