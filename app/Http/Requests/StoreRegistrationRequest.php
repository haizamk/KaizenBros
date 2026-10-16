<?php

namespace App\Http\Requests;

use App\Support\ClinicFiles;
use App\Support\MalaysianIdentityCard;
use App\Support\RegistrationOptions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'phone_number' => $this->normalizePhone($this->input('phone_number')),
            'nok_phone' => $this->normalizePhone($this->input('nok_phone')),
        ]);

        ClinicFiles::dropEmptyUploads($this, ['dokumen']);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'min:3', 'max:120', 'regex:/^[\p{L}][\p{L}\s\'.\-]*$/u'],
            'ic_number' => ['required', 'string', 'max:20'],
            'phone_number' => ['required', 'regex:/^01\d{8,9}$/'],
            'email' => ['nullable', 'email', 'max:120'],
            'address' => ['required', 'string', 'min:10', 'max:255'],
            'patient_category' => ['required', Rule::in(array_keys(RegistrationOptions::categories()))],
            'medical_notes' => ['nullable', 'string', 'max:1000'],
            'nok_name' => ['required', 'string', 'min:3', 'max:120', 'regex:/^[\p{L}][\p{L}\s\'.\-]*$/u'],
            'nok_relationship' => ['required', Rule::in(array_keys(RegistrationOptions::relationships()))],
            'nok_phone' => ['required', 'regex:/^01\d{8,9}$/'],
            'nok_email' => ['nullable', 'email', 'max:120'],
            'dokumen' => ['nullable', 'array', 'max:5'],
            'dokumen.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:8192'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->has('ic_number')) {
                return;
            }

            $parsed = MalaysianIdentityCard::parse((string) $this->input('ic_number'));

            if (! $parsed['valid']) {
                $validator->errors()->add('ic_number', $parsed['message'] ?? 'Nombor kad pengenalan tidak sah.');
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'full_name.required' => 'Nama penuh mengikut kad pengenalan diperlukan.',
            'full_name.regex' => 'Nama mestilah mengikut kad pengenalan dan bermula dengan huruf.',
            'ic_number.required' => 'Nombor kad pengenalan diperlukan.',
            'phone_number.required' => 'Nombor telefon diperlukan.',
            'phone_number.regex' => 'Nombor telefon mestilah nombor mudah alih Malaysia, contoh 012-3456789.',
            'email.email' => 'Alamat emel tidak sah.',
            'address.required' => 'Alamat kediaman diperlukan.',
            'address.min' => 'Alamat kediaman terlalu pendek.',
            'patient_category.required' => 'Kategori pesakit diperlukan.',
            'nok_name.required' => 'Nama waris diperlukan.',
            'nok_name.regex' => 'Nama waris mestilah bermula dengan huruf.',
            'nok_relationship.required' => 'Hubungan waris diperlukan.',
            'nok_phone.required' => 'Nombor telefon waris diperlukan.',
            'nok_phone.regex' => 'Nombor telefon waris mestilah nombor mudah alih Malaysia.',
            'nok_email.email' => 'Alamat emel waris tidak sah.',
            'dokumen.max' => 'Muat naik paling banyak 5 fail.',
            'dokumen.*.mimes' => 'Setiap fail mestilah PDF atau gambar.',
            'dokumen.*.max' => 'Setiap fail tidak boleh melebihi 8 MB.',
        ];
    }

    private function normalizePhone(mixed $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';

        if (str_starts_with($digits, '60')) {
            $digits = '0'.substr($digits, 2);
        }

        return $digits === '' ? null : $digits;
    }
}
