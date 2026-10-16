<?php

namespace App\Http\Requests;

use App\Enums\ExaminationType;
use App\Support\LabCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMedicalRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merged = [];

        foreach (array_keys(LabCatalog::fields()) as $key) {
            $value = $this->input($key);

            if ($value === '') {
                $merged[$key] = null;
            }
        }

        if ($merged !== []) {
            $this->merge($merged);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'examination_date' => ['required', 'date', 'before_or_equal:today'],
            'examination_type' => ['required', Rule::enum(ExaminationType::class)],
            'clinical_notes' => ['nullable', 'string', 'max:1000'],
            ...LabCatalog::valueValidationRules(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'examination_date.required' => 'Tarikh pemeriksaan diperlukan.',
            'examination_date.date' => 'Tarikh pemeriksaan tidak sah.',
            'examination_date.before_or_equal' => 'Tarikh pemeriksaan tidak boleh pada masa hadapan.',
            'examination_type.required' => 'Jenis pemeriksaan diperlukan.',
        ];
    }
}
