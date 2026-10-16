<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BlockChairRequest extends FormRequest
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
            'reason' => ['required', 'string', Rule::in(['ROSAK', 'TIDAK_SESUAI'])],
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
            'reason.required' => 'Sila nyatakan sebab kerusi tidak digunakan.',
            'reason.in' => 'Sebab mestilah rosak atau tidak sesuai.',
        ];
    }
}
