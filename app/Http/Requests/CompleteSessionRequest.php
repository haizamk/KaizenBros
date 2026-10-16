<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompleteSessionRequest extends FormRequest
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
            'post_weight_kg' => ['required', 'numeric', 'between:20,200'],
            'post_bp' => ['required', 'regex:/^\d{2,3}\/\d{2,3}$/'],
            'nurse_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'post_weight_kg.required' => 'Berat selepas dialisis diperlukan.',
            'post_weight_kg.between' => 'Berat mestilah antara 20kg dan 200kg.',
            'post_bp.required' => 'Tekanan darah selepas dialisis diperlukan.',
            'post_bp.regex' => 'Tekanan darah mestilah dalam format 120/80.',
        ];
    }
}
