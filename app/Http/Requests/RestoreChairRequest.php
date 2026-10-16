<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RestoreChairRequest extends FormRequest
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
            'chair_number' => ['required', 'string', Rule::in(config('kaizenbros.centre.chairs', []))],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'chair_number.required' => 'Sila pilih kerusi.',
            'chair_number.in' => 'Kerusi ini tiada di pusat dialisis.',
        ];
    }
}
