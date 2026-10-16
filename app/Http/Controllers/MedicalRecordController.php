<?php

namespace App\Http\Controllers;

use App\Enums\ExaminationType;
use App\Enums\UserRole;
use App\Http\Requests\StoreDoctorNoteRequest;
use App\Http\Requests\StoreMedicalRecordRequest;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Support\BloodReportAnalysis;
use App\Support\ClinicCharts;
use App\Support\ClinicFiles;
use App\Support\LabCatalog;
use App\Support\LabPdfPatientMatch;
use App\Support\LabPdfReader;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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

        $recordQuery = MedicalRecord::query()
            ->with(['patient', 'recorder', 'nephrologist', 'report'])
            ->orderByDesc('examination_date')
            ->orderByDesc('id');

        if ($selected) {
            $recordQuery->where('patient_id', $selected->id);
        } else {
            $recordQuery->limit(30);
        }

        $models = $recordQuery->get();
        $records = BloodReportAnalysis::present($models);
        $charts = [];

        if ($selected) {
            foreach (array_keys(LabCatalog::fields()) as $field) {
                $charts[$field] = ClinicCharts::lab($models, $field, 'd/m/y');
            }
        }

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
            'canWriteDoctorNote' => $request->user()->role === UserRole::Admin,
            'charts' => $charts,
            'chartSeries' => LabCatalog::chartSeries(),
        ]);
    }

    public function store(StoreMedicalRecordRequest $request, LabPdfReader $reader): RedirectResponse
    {
        $parsed = $reader->read($request->file('report'));

        if ($parsed['found'] === 0) {
            $message = match (true) {
                $parsed['ocr_attempted'] && ! $parsed['ocr_available'] => 'PDF imbasan tidak dapat dibaca kerana OCR belum dipasang pada pelayan.',
                $parsed['ocr_attempted'] => 'Tiada keputusan darah dibaca walaupun OCR dijalankan. Semak kualiti imbasan atau isi tarikh dan semak semula.',
                $parsed['has_text'] => 'Tiada keputusan darah dibaca daripada PDF ini. Tiada nombor diandaikan.',
                default => 'PDF ini tidak mengandungi teks yang boleh dibaca. Ia mungkin imbasan gambar. Tiada nombor diandaikan.',
            };

            throw ValidationException::withMessages([
                'report' => $message,
            ]);
        }

        $patient = Patient::query()->findOrFail($request->integer('patient_id'));
        LabPdfPatientMatch::assertMatches($patient, $parsed['patient_name'], $parsed['patient_ic']);

        $date = $parsed['date'] ?? $request->validated('examination_date');

        if ($date === null) {
            throw ValidationException::withMessages([
                'examination_date' => 'Tarikh ujian tidak dijumpai dalam PDF. Sila isi tarikh yang tercetak pada laporan.',
            ]);
        }

        if ($date > today()->toDateString()) {
            throw ValidationException::withMessages([
                'examination_date' => 'Tarikh pemeriksaan tidak boleh pada masa hadapan.',
            ]);
        }

        if (MedicalRecord::query()
            ->where('patient_id', $patient->id)
            ->whereDate('examination_date', $date)
            ->exists()) {
            throw ValidationException::withMessages([
                'examination_date' => 'Rekod darah untuk tarikh ini sudah wujud bagi pesakit ini. Muat naik laporan tarikh lain atau semak senarai rekod di bawah.',
            ]);
        }

        DB::transaction(function () use ($request, $parsed, $date): void {
            $record = MedicalRecord::query()->create([
                'patient_id' => $request->integer('patient_id'),
                'examination_date' => $date,
                'examination_type' => $request->validated('examination_type'),
                'clinical_notes' => $request->validated('clinical_notes'),
                'recorded_by' => $request->user()->id,
                ...$parsed['values'],
            ]);

            ClinicFiles::storeMedicalReport($request->file('report'), $record, $request->user()->id);
        });

        $source = $parsed['date'] === null ? 'Tarikh diisi oleh kakitangan.' : 'Tarikh sampel diambil daripada PDF.';
        $method = $parsed['read_method'] === 'ocr' ? ' OCR.' : '.';

        return redirect()
            ->route('nurse.records.index', ['pesakit' => $request->integer('patient_id')])
            ->with('status', "Rekod darah disimpan. {$parsed['found']} bacaan dibaca{$method} Nilai yang tiada dibiarkan kosong. {$source}");
    }

    public function storeDoctorNote(StoreDoctorNoteRequest $request, MedicalRecord $record): RedirectResponse
    {
        $record->forceFill([
            'nephrologist_notes' => $request->validated('nephrologist_notes'),
            'nephrologist_user_id' => $request->user()->id,
            'nephrologist_signed_at' => now(),
        ])->save();

        return back()->with('status', 'Analisa doktor nefrologi disimpan.');
    }
}
