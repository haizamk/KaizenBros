<?php

namespace App\Http\Requests;

use App\Support\MalaysianIdentityCard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffIdentityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $phone = preg_replace('/\D+/', '', (string) $this->input('phone')) ?? '';

        if (str_starts_with($phone, '60')) {
            $phone = '0'.substr($phone, 2);
        }

        $ic = trim((string) $this->input('ic_number'));
        $parsed = $ic === '' ? null : MalaysianIdentityCard::parse($ic);

        $this->merge([
            'phone' => $phone === '' ? null : $phone,
            'ic_number' => $parsed['formatted'] ?? ($ic === '' ? null : $ic),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'phone' => ['nullable', 'regex:/^01\d{8,9}$/'],
            'ic_number' => [
                'nullable',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || $value === '') {
                        return;
                    }

                    $parsed = MalaysianIdentityCard::parse((string) $value);

                    if (! $parsed['valid']) {
                        $fail($parsed['message'] ?? 'Nombor kad pengenalan tidak sah.');
                    }
                },
                Rule::unique('users', 'ic_number')->ignore($this->user()?->id),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.regex' => 'Nombor telefon mestilah nombor mudah alih Malaysia.',
            'ic_number.unique' => 'Kad pengenalan ini sudah digunakan.',
        ];
    }
}
