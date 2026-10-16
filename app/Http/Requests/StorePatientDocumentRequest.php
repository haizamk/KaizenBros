<?php

namespace App\Http\Requests;

use App\Enums\DocumentCategory;
use App\Enums\UserRole;
use App\Support\ClinicFiles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePatientDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category' => ['required', Rule::enum(DocumentCategory::class)],
            'document' => ClinicFiles::rules(required: true),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category.required' => 'Jenis dokumen diperlukan.',
            'document.required' => 'Sila pilih fail untuk dimuat naik.',
            'document.mimes' => 'Dokumen mestilah PDF atau gambar.',
            'document.max' => 'Dokumen melebihi 8 MB.',
        ];
    }
}
