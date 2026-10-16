<?php

namespace App\Support;

use App\Models\MedicalRecord;
use App\Models\MedicalReport;
use App\Models\PatientDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ClinicFiles
{
    /**
     * @return array<int, string>
     */
    public static function rules(bool $required = false): array
    {
        return [
            $required ? 'required' : 'nullable',
            'file',
            'mimes:pdf,jpg,jpeg,png,webp',
            'max:8192',
        ];
    }

    /**
     * @param  array<int, string>  $fields
     */
    public static function dropEmptyUploads(FormRequest $request, array $fields): void
    {
        foreach ($fields as $field) {
            if ($request->hasFile($field)) {
                continue;
            }

            $request->files->remove($field);
            $request->request->remove($field);
        }
    }

    /**
     * @param  array{registration_id?: int|null, patient_id?: int|null, uploaded_by?: int|null, category: mixed}  $attributes
     */
    public static function storePatientDocument(UploadedFile $file, array $attributes): PatientDocument
    {
        $extension = self::extension($file, 'document');
        $folder = isset($attributes['registration_id'])
            ? 'permohonan/'.$attributes['registration_id']
            : 'pesakit/'.$attributes['patient_id'];
        $path = $file->storeAs($folder, (string) Str::uuid().'.'.$extension, 'patient_documents');

        if ($path === false) {
            throw ValidationException::withMessages([
                'document' => 'Dokumen gagal disimpan. Sila cuba lagi.',
            ]);
        }

        return PatientDocument::query()->create([
            'registration_id' => $attributes['registration_id'] ?? null,
            'patient_id' => $attributes['patient_id'] ?? null,
            'uploaded_by' => $attributes['uploaded_by'] ?? null,
            'disk' => 'patient_documents',
            'path' => $path,
            'original_name' => self::originalName($file),
            'mime' => $file->getMimeType() ?: 'application/octet-stream',
            'size' => (int) $file->getSize(),
            'category' => $attributes['category'],
        ]);
    }

    public static function storeMedicalReport(UploadedFile $file, MedicalRecord $record, ?int $uploadedBy): MedicalReport
    {
        $extension = self::extension($file, 'report');
        $path = $file->storeAs('pesakit/'.$record->patient_id, (string) Str::uuid().'.'.$extension, 'medical_reports');

        if ($path === false) {
            throw ValidationException::withMessages([
                'report' => 'Laporan perubatan gagal disimpan. Sila cuba lagi.',
            ]);
        }

        return MedicalReport::query()->create([
            'patient_id' => $record->patient_id,
            'medical_record_id' => $record->id,
            'uploaded_by' => $uploadedBy,
            'disk' => 'medical_reports',
            'path' => $path,
            'original_name' => self::originalName($file),
            'mime' => $file->getMimeType() ?: 'application/octet-stream',
            'size' => (int) $file->getSize(),
        ]);
    }

    public static function download(string $disk, string $path, string $name, string $expectedDisk): StreamedResponse
    {
        abort_unless($disk === $expectedDisk, 404);
        abort_if(str_contains($path, '..'), 404);
        abort_unless(Storage::disk($expectedDisk)->exists($path), 404);

        return Storage::disk($expectedDisk)->download($path, $name);
    }

    private static function extension(UploadedFile $file, string $errorField): string
    {
        $extension = strtolower((string) $file->guessExtension());

        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        if (! in_array($extension, ['pdf', 'jpg', 'png', 'webp'], true)) {
            throw ValidationException::withMessages([
                $errorField => 'Jenis fail tidak dibenarkan. Sila muat naik PDF atau gambar.',
            ]);
        }

        return $extension;
    }

    private static function originalName(UploadedFile $file): string
    {
        $name = basename(str_replace('\\', '/', $file->getClientOriginalName()));
        $name = preg_replace('/[^\p{L}\p{N}\s._\-()]+/u', '', $name) ?? '';
        $name = trim($name);

        return $name === '' ? 'dokumen' : mb_substr($name, 0, 180);
    }
}
