<?php

namespace App\Http\Requests;

use App\Enums\ExaminationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreMedicalRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'examination_date' => ['required', 'date', 'before_or_equal:today'],
            'examination_type' => ['required', Rule::enum(ExaminationType::class)],
            'hemoglobin' => ['nullable', 'numeric', 'between:3,20'],
            'potassium' => ['nullable', 'numeric', 'between:2,9'],
            'phosphate' => ['nullable', 'numeric', 'between:0.3,4'],
            'urea' => ['nullable', 'numeric', 'between:1,80'],
            'creatinine' => ['nullable', 'numeric', 'between:20,2500'],
            'clinical_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $filled = collect(['hemoglobin', 'potassium', 'phosphate', 'urea', 'creatinine'])
                ->contains(fn (string $field): bool => $this->filled($field));

            if (! $filled) {
                $validator->errors()->add('hemoglobin', 'Sekurang-kurangnya satu keputusan ujian diperlukan.');
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'Pilih pesakit.',
            'examination_date.required' => 'Tarikh pemeriksaan diperlukan.',
            'examination_date.before_or_equal' => 'Tarikh pemeriksaan tidak boleh pada masa hadapan.',
            'examination_type.required' => 'Jenis pemeriksaan diperlukan.',
        ];
    }
}
