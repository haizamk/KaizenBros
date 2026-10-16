<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordIntraBpRequest extends FormRequest
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
            'intra_bp' => ['required', 'regex:/^\d{2,3}\/\d{2,3}$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'intra_bp.required' => 'Tekanan darah semasa dialisis diperlukan.',
            'intra_bp.regex' => 'Tekanan darah mestilah dalam format 120/80.',
        ];
    }
}
