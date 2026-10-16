<?php

namespace App\Http\Requests;

use App\Enums\ExaminationType;
use App\Support\ClinicFiles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMedicalRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        ClinicFiles::dropEmptyUploads($this, ['report']);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'examination_date' => ['nullable', 'date', 'before_or_equal:today'],
            'examination_type' => ['required', Rule::enum(ExaminationType::class)],
            'clinical_notes' => ['nullable', 'string', 'max:1000'],
            'report' => ['required', 'file', 'mimes:pdf', 'max:102400'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'Pilih pesakit.',
            'examination_date.date' => 'Tarikh pemeriksaan tidak sah.',
            'examination_date.before_or_equal' => 'Tarikh pemeriksaan tidak boleh pada masa hadapan.',
            'examination_type.required' => 'Jenis pemeriksaan diperlukan.',
            'report.required' => 'Sila muat naik PDF laporan darah.',
            'report.mimes' => 'Laporan darah mestilah fail PDF.',
            'report.max' => 'Fail PDF tidak boleh melebihi 100 MB.',
        ];
    }
}
