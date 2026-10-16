<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ArriveSessionRequest extends FormRequest
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
            'pre_weight_kg' => ['required', 'numeric', 'between:20,200'],
            'pre_bp' => ['nullable', 'regex:/^\d{2,3}\/\d{2,3}$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'pre_weight_kg.required' => 'Berat badan diperlukan semasa pesakit tiba.',
            'pre_weight_kg.between' => 'Berat mestilah antara 20kg dan 200kg.',
            'pre_bp.regex' => 'Tekanan darah mestilah dalam format 120/80.',
        ];
    }
}
