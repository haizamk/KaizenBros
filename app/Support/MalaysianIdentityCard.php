<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class MalaysianIdentityCard
{
    /**
     * @return array{
     *     valid: bool,
     *     message: string|null,
     *     formatted: string|null,
     *     birth_date: string|null,
     *     years: int|null,
     *     months: int|null,
     *     gender: string|null,
     *     gender_label: string|null,
     *     age_label: string|null
     * }
     */
    public static function parse(string $input, ?CarbonInterface $today = null): array
    {
        $empty = [
            'valid' => false,
            'message' => null,
            'formatted' => null,
            'birth_date' => null,
            'years' => null,
            'months' => null,
            'gender' => null,
            'gender_label' => null,
            'age_label' => null,
        ];

        $digits = preg_replace('/\D+/', '', $input) ?? '';

        if ($digits === '') {
            return $empty;
        }

        if (strlen($digits) !== 12) {
            return [
                ...$empty,
                'message' => 'Nombor kad pengenalan mestilah 12 digit.',
            ];
        }

        $today = CarbonImmutable::parse($today ?? now())->timezone('Asia/Kuala_Lumpur')->startOfDay();
        $year = ((int) substr($digits, 0, 2) > $today->year % 100 ? 1900 : 2000) + (int) substr($digits, 0, 2);
        $month = (int) substr($digits, 2, 2);
        $day = (int) substr($digits, 4, 2);

        if (! checkdate($month, $day, $year)) {
            return [
                ...$empty,
                'message' => 'Tarikh lahir pada nombor kad pengenalan tidak sah.',
            ];
        }

        $birth = CarbonImmutable::create($year, $month, $day, 0, 0, 0, 'Asia/Kuala_Lumpur');

        if ($birth->greaterThan($today)) {
            $birth = $birth->subYears(100);

            if (! checkdate($birth->month, $birth->day, $birth->year) || $birth->greaterThan($today)) {
                return [
                    ...$empty,
                    'message' => 'Tarikh lahir pada nombor kad pengenalan tidak sah.',
                ];
            }
        }

        $difference = $birth->diff($today);
        $gender = ((int) $digits[11]) % 2 === 1 ? 'LELAKI' : 'PEREMPUAN';

        return [
            'valid' => true,
            'message' => null,
            'formatted' => substr($digits, 0, 6).'-'.substr($digits, 6, 2).'-'.substr($digits, 8, 4),
            'birth_date' => $birth->toDateString(),
            'years' => $difference->y,
            'months' => $difference->m,
            'gender' => $gender,
            'gender_label' => $gender === 'LELAKI' ? 'Lelaki' : 'Perempuan',
            'age_label' => $difference->y.' tahun '.$difference->m.' bulan',
        ];
    }
}
