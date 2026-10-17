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
     * @return array<int, array{number: string, state: string, patient_name: string|null, reason: string|null, reason_label: string|null, session_id: int|null, session_status: string|null, dialysis_started_at: string|null}>
     */
    public static function tiles(?CarbonInterface $date = null): array
    {
        $date ??= today();
        $occupied = self::occupiedSessions($date);
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
                    'session_id' => null,
                    'session_status' => null,
                    'dialysis_started_at' => null,
                ];

                continue;
            }

            if (isset($occupied[$number])) {
                $session = $occupied[$number];
                $tiles[] = [
                    'number' => $number,
                    'state' => 'digunakan',
                    'patient_name' => $session['patient_name'],
                    'reason' => null,
                    'reason_label' => $session['status'] === SessionStatus::SedangDialisis
                        ? SessionStatus::SedangDialisis->label()
                        : $session['status']->label(),
                    'session_id' => $session['session_id'],
                    'session_status' => $session['status']->value,
                    'dialysis_started_at' => $session['dialysis_started_at'],
                ];

                continue;
            }

            $tiles[] = [
                'number' => $number,
                'state' => 'kosong',
                'patient_name' => null,
                'reason' => null,
                'reason_label' => null,
                'session_id' => null,
                'session_status' => null,
                'dialysis_started_at' => null,
            ];
        }

        return $tiles;
    }

    /**
     * @return array<string, string>
     */
    private static function occupiedNames(CarbonInterface $date, ?int $exceptSessionId = null): array
    {
        $names = [];

        foreach (self::occupiedSessions($date, $exceptSessionId) as $chair => $session) {
            $names[$chair] = $session['patient_name'];
        }

        return $names;
    }

    /**
     * @return array<string, array{session_id: int, patient_name: string, status: SessionStatus, dialysis_started_at: string|null}>
     */
    private static function occupiedSessions(CarbonInterface $date, ?int $exceptSessionId = null): array
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

        $sessions = [];

        foreach ($query->get() as $session) {
            if ($session->chair_number === null) {
                continue;
            }

            $sessions[$session->chair_number] = [
                'session_id' => $session->id,
                'patient_name' => $session->patient->name,
                'status' => $session->status,
                'dialysis_started_at' => $session->status === SessionStatus::SedangDialisis
                    ? $session->started_at?->toIso8601String()
                    : null,
            ];
        }

        return $sessions;
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
