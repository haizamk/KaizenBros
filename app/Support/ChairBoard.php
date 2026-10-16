<?php

namespace App\Support;

use App\Enums\SessionStatus;
use App\Models\ChairBlock;
use App\Models\DialysisSession;
use Carbon\CarbonInterface;

class ChairBoard
{
    /**
     * @return array<int, string>
     */
    public static function numbers(): array
    {
        /** @var array<int, string> $chairs */
        $chairs = config('kaizenbros.centre.chairs', []);

        return array_values($chairs);
    }

    /**
     * @return array<int, string>
     */
    public static function free(CarbonInterface $date, ?int $exceptSessionId = null): array
    {
        $occupied = array_keys(self::occupiedNames($date, $exceptSessionId));
        $blocked = array_keys(self::blocked($date));

        return array_values(array_filter(
            self::numbers(),
            fn (string $number): bool => ! in_array($number, $occupied, true) && ! in_array($number, $blocked, true),
        ));
    }

    /**
     * @return array<int, array{number: string, state: string, patient_name: string|null, reason: string|null, reason_label: string|null}>
     */
    public static function tiles(?CarbonInterface $date = null): array
    {
        $date ??= today();
        $occupied = self::occupiedNames($date);
        $blocked = self::blocked($date);
        $tiles = [];

        foreach (self::numbers() as $number) {
            if (isset($blocked[$number])) {
                $tiles[] = [
                    'number' => $number,
                    'state' => 'rosak',
                    'patient_name' => null,
                    'reason' => $blocked[$number]['reason'],
                    'reason_label' => $blocked[$number]['reason_label'],
                ];

                continue;
            }

            if (isset($occupied[$number])) {
                $tiles[] = [
                    'number' => $number,
                    'state' => 'digunakan',
                    'patient_name' => $occupied[$number],
                    'reason' => null,
                    'reason_label' => null,
                ];

                continue;
            }

            $tiles[] = [
                'number' => $number,
                'state' => 'kosong',
                'patient_name' => null,
                'reason' => null,
                'reason_label' => null,
            ];
        }

        return $tiles;
    }

    /**
     * @return array<string, string>
     */
    private static function occupiedNames(CarbonInterface $date, ?int $exceptSessionId = null): array
    {
        $query = DialysisSession::query()
            ->with('patient')
            ->whereDate('scheduled_date', $date)
            ->whereNotNull('chair_number')
            ->whereIn('status', [
                SessionStatus::Menunggu,
                SessionStatus::SudahHadir,
                SessionStatus::SedangDialisis,
            ]);

        if ($exceptSessionId !== null) {
            $query->whereKeyNot($exceptSessionId);
        }

        $names = [];

        foreach ($query->get() as $session) {
            if ($session->chair_number !== null) {
                $names[$session->chair_number] = $session->patient->name;
            }
        }

        return $names;
    }

    /**
     * @return array<string, array{reason: string, reason_label: string}>
     */
    private static function blocked(CarbonInterface $date): array
    {
        $blocks = [];

        foreach (ChairBlock::query()->whereDate('blocked_on', $date)->get() as $block) {
            $blocks[$block->chair_number] = [
                'reason' => $block->reason,
                'reason_label' => $block->reasonLabel(),
            ];
        }

        return $blocks;
    }
}
