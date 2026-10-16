<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRegistrationRequest extends FormRequest
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
            'gender' => ['required', 'in:LELAKI,PEREMPUAN'],
            'address' => ['nullable', 'string', 'max:255'],
            'medical_notes' => ['nullable', 'string', 'max:1000'],
            'nok_name' => ['nullable', 'string', 'max:120'],
            'nok_phone' => ['nullable', 'string', 'max:20'],
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
            'gender.required' => 'Jantina diperlukan.',
            'email.email' => 'Alamat emel tidak sah.',
        ];
    }
}
