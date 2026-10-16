<?php

namespace App\Support;

use App\Models\Patient;
use Illuminate\Validation\ValidationException;

class LabPdfPatientMatch
{
    public static function assertMatches(Patient $patient, ?string $pdfName, ?string $pdfIc): void
    {
        $pdfDigits = self::digits($pdfIc);
        $patientDigits = self::digits($patient->ic_number);

        if (strlen($pdfDigits) === 12 && strlen($patientDigits) === 12 && $pdfDigits !== $patientDigits) {
            throw ValidationException::withMessages([
                'report' => 'Nombor kad pengenalan pada PDF tidak sepadan dengan pesakit yang dipilih.',
            ]);
        }

        if ($pdfName !== null && $pdfName !== '' && ! self::nameMatches($pdfName, $patient->name)) {
            throw ValidationException::withMessages([
                'report' => 'Nama pada PDF tidak sepadan dengan pesakit yang dipilih. Semak pesakit dan fail sebelum simpan.',
            ]);
        }
    }

    public static function nameMatches(string $pdfName, string $patientName): bool
    {
        $left = self::normalizeName($pdfName);
        $right = self::normalizeName($patientName);

        if ($left === '' || $right === '') {
            return true;
        }

        if ($left === $right || str_contains($left, $right) || str_contains($right, $left)) {
            return true;
        }

        similar_text($left, $right, $percent);

        return $percent >= 82;
    }

    private static function normalizeName(string $name): string
    {
        $name = strtoupper($name);
        $name = preg_replace('/\b(DR|SISTER|MR|MRS|MS)\b\.?/u', ' ', $name) ?? $name;
        $name = preg_replace('/[^A-Z0-9\s]/u', ' ', $name) ?? $name;
        $name = preg_replace('/\s+/u', ' ', $name) ?? $name;

        return trim($name);
    }

    private static function digits(?string $value): string
    {
        return preg_replace('/\D+/', '', (string) $value) ?? '';
    }
}
