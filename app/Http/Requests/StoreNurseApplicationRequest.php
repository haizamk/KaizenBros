<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNurseApplicationRequest extends FormRequest
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
            'full_name' => ['required', 'string', 'max:120'],
            'ic_number' => ['required', 'regex:/^\d{6}-\d{2}-\d{4}$/'],
            'phone_number' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:120'],
            'nursing_board_no' => ['required', 'string', 'max:40'],
            'years_experience' => ['nullable', 'integer', 'between:0,60'],
            'preferred_shift' => ['required', 'in:PAGI,PETANG,BERGILIR'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'full_name.required' => 'Nama penuh diperlukan.',
            'ic_number.required' => 'Nombor kad pengenalan diperlukan.',
            'ic_number.regex' => 'Nombor kad pengenalan mestilah dalam format 580101-10-1231.',
            'phone_number.required' => 'Nombor telefon diperlukan.',
            'nursing_board_no.required' => 'Nombor lembaga jururawat diperlukan.',
            'years_experience.integer' => 'Tahun pengalaman mestilah nombor.',
            'years_experience.between' => 'Tahun pengalaman mestilah antara 0 dan 60.',
            'email.email' => 'Alamat emel tidak sah.',
        ];
    }
}
