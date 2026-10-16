<?php

namespace App\Support;

use App\Models\DialysisSession;
use App\Models\MedicalRecord;
use Illuminate\Support\Collection;

class ClinicCharts
{
    /**
     * @param  Collection<int, DialysisSession>  $sessions
     * @return array<int, array{label: string, value: float}>
     */
    public static function weight(Collection $sessions): array
    {
        return self::ordered($sessions)
            ->filter(fn (DialysisSession $session): bool => $session->pre_weight_kg !== null)
            ->map(fn (DialysisSession $session): array => [
                'label' => $session->scheduled_date->format('d/m'),
                'value' => (float) $session->pre_weight_kg,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, DialysisSession>  $sessions
     * @return array<int, array{label: string, value: float}>
     */
    public static function systolic(Collection $sessions): array
    {
        return self::bloodPressure($sessions, 1);
    }

    /**
     * @param  Collection<int, DialysisSession>  $sessions
     * @return array<int, array{label: string, value: float}>
     */
    public static function diastolic(Collection $sessions): array
    {
        return self::bloodPressure($sessions, 2);
    }

    /**
     * @param  Collection<int, MedicalRecord>  $records
     * @return array<int, array{label: string, value: float}>
     */
    public static function lab(Collection $records, string $field): array
    {
        return $records
            ->sortBy(fn (MedicalRecord $record): string => $record->examination_date->toDateString())
            ->filter(fn (MedicalRecord $record): bool => $record->{$field} !== null)
            ->map(fn (MedicalRecord $record): array => [
                'label' => $record->examination_date->format('d/m'),
                'value' => (float) $record->{$field},
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, DialysisSession>  $sessions
     * @return Collection<int, DialysisSession>
     */
    private static function ordered(Collection $sessions): Collection
    {
        return $sessions
            ->sortBy(fn (DialysisSession $session): string => $session->scheduled_date->format('Y-m-d').$session->scheduled_time)
            ->values();
    }

    /**
     * @param  Collection<int, DialysisSession>  $sessions
     * @return array<int, array{label: string, value: float}>
     */
    private static function bloodPressure(Collection $sessions, int $part): array
    {
        return self::ordered($sessions)
            ->map(function (DialysisSession $session) use ($part): ?array {
                if (! is_string($session->pre_bp) || ! preg_match('/^(\d{2,3})\/(\d{2,3})$/', $session->pre_bp, $matches)) {
                    return null;
                }

                return [
                    'label' => $session->scheduled_date->format('d/m'),
                    'value' => (float) $matches[$part],
                ];
            })
            ->filter()
            ->values()
            ->all();
    }
}
