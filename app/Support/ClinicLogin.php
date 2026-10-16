<?php

namespace App\Support;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Str;

class ClinicLogin
{
    public static function find(string $identifier): ?User
    {
        $raw = trim($identifier);

        if ($raw === '') {
            return null;
        }

        $ids = [];

        if (str_contains($raw, '@')) {
            $user = User::query()->where('email', Str::lower($raw))->first();

            if ($user !== null) {
                $ids[] = $user->id;
            }
        }

        $digits = self::digits($raw);
        $compact = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $raw) ?? '');

        if ($digits !== '') {
            $phoneKeys = self::phoneKeys($digits);

            foreach (User::query()->get(['id', 'phone', 'ic_number']) as $user) {
                if (self::samePhone($user->phone, $phoneKeys) || self::sameIdentity($user->ic_number, $digits)) {
                    $ids[] = $user->id;
                }
            }

            foreach (Patient::query()->whereNotNull('user_id')->get(['user_id', 'phone', 'ic_number', 'patient_id_code']) as $patient) {
                if (self::samePhone($patient->phone, $phoneKeys) || self::sameIdentity($patient->ic_number, $digits) || self::sameCode($patient->patient_id_code, $compact, $digits)) {
                    $ids[] = (int) $patient->user_id;
                }
            }
        } elseif ($compact !== '') {
            foreach (Patient::query()->whereNotNull('user_id')->get(['user_id', 'patient_id_code']) as $patient) {
                if (self::sameCode($patient->patient_id_code, $compact, '')) {
                    $ids[] = (int) $patient->user_id;
                }
            }
        }

        $ids = array_values(array_unique($ids));

        if (count($ids) !== 1) {
            return null;
        }

        return User::query()->find($ids[0]);
    }

    /**
     * @param  array<int, string>  $phoneKeys
     */
    private static function samePhone(?string $stored, array $phoneKeys): bool
    {
        $digits = self::digits((string) $stored);

        return $digits !== '' && in_array($digits, $phoneKeys, true);
    }

    private static function sameIdentity(?string $stored, string $digits): bool
    {
        return $digits !== '' && strlen($digits) === 12 && self::digits((string) $stored) === $digits;
    }

    private static function sameCode(string $stored, string $compact, string $digits): bool
    {
        $normalized = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $stored) ?? '');

        if ($compact !== '' && $normalized === $compact) {
            return true;
        }

        $storedDigits = self::digits($stored);

        return $digits !== ''
            && strlen($digits) <= 6
            && ctype_digit($compact)
            && $storedDigits === $digits;
    }

    /**
     * @return array<int, string>
     */
    private static function phoneKeys(string $digits): array
    {
        $keys = [$digits];

        if (str_starts_with($digits, '60') && strlen($digits) > 2) {
            $keys[] = '0'.substr($digits, 2);
        }

        if (str_starts_with($digits, '0') && strlen($digits) > 1) {
            $keys[] = '60'.substr($digits, 1);
            $keys[] = substr($digits, 1);
        }

        return array_values(array_unique($keys));
    }

    private static function digits(string $value): string
    {
        return preg_replace('/\D+/', '', $value) ?? '';
    }
}
