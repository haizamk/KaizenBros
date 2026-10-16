<?php

namespace App\Http\Requests;

use App\Enums\SchedulePattern;
use App\Enums\ShiftSlot;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApproveRegistrationRequest extends FormRequest
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
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'dry_weight_kg' => ['required', 'numeric', 'min:20', 'max:200'],
            'preferred_shift' => ['required', Rule::enum(ShiftSlot::class)],
            'schedule_pattern' => ['required', Rule::enum(SchedulePattern::class)],
            'vascular_access' => ['required', 'string', 'max:80'],
            'access_location' => ['required', 'string', 'max:80'],
            'sponsor' => ['required', 'string', 'max:80'],
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
            'access_location.required' => 'Lokasi akses diperlukan.',
            'sponsor.required' => 'Penaja diperlukan.',
        ];
    }
}
