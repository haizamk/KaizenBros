<?php

namespace App\Http\Requests;

use App\Enums\SchedulePattern;
use App\Enums\ShiftSlot;
use App\Support\EnrolmentOptions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApproveRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $weight = str_replace(',', '.', trim((string) $this->input('dry_weight_kg')));

        $this->merge([
            'dry_weight_kg' => $weight,
            'sponsor_other' => trim((string) $this->input('sponsor_other')),
            'vascular_access_other' => trim((string) $this->input('vascular_access_other')),
            'access_location' => trim((string) $this->input('access_location')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'dry_weight_kg' => ['required', 'numeric', 'min:20', 'max:200'],
            'preferred_shift' => ['required', Rule::enum(ShiftSlot::class)],
            'schedule_pattern' => ['required', Rule::enum(SchedulePattern::class)],
            'vascular_access' => ['required', Rule::in(array_keys(EnrolmentOptions::accesses()))],
            'vascular_access_other' => ['nullable', 'string', 'max:80', 'required_if:vascular_access,LAIN'],
            'access_location' => ['required', 'string', 'max:80'],
            'sponsor' => ['required', Rule::in(array_keys(EnrolmentOptions::sponsors()))],
            'sponsor_other' => ['nullable', 'string', 'max:80', 'required_if:sponsor,LAIN'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.required' => 'Kata laluan awal diperlukan.',
            'password.min' => 'Kata laluan awal sekurang-kurangnya 6 aksara.',
            'dry_weight_kg.required' => 'Berat kering diperlukan.',
            'preferred_shift.required' => 'Pilih syif.',
            'schedule_pattern.required' => 'Pilih jadual rawatan.',
            'vascular_access.required' => 'Akses dialisis diperlukan.',
            'vascular_access_other.required_if' => 'Nyatakan jenis akses dialisis.',
            'access_location.required' => 'Lokasi akses diperlukan. Contohnya lengan kiri.',
            'sponsor.required' => 'Penaja diperlukan.',
            'sponsor_other.required_if' => 'Nyatakan penaja.',
        ];
    }
}
