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
    public static function weight(Collection $sessions, string $labelFormat = 'd/m'): array
    {
        return self::weightField($sessions, 'pre_weight_kg', $labelFormat);
    }

    /**
     * @param  Collection<int, DialysisSession>  $sessions
     * @return array<int, array{label: string, value: float}>
     */
    public static function postWeight(Collection $sessions, string $labelFormat = 'd/m'): array
    {
        return self::weightField($sessions, 'post_weight_kg', $labelFormat);
    }

    /**
     * @param  array<int, array{label: string, value: float}>  $points
     * @return array<int, array{label: string, value: float}>
     */
    public static function constant(array $points, float $value): array
    {
        return array_map(fn (array $point): array => [
            'label' => $point['label'],
            'value' => $value,
        ], $points);
    }

    /**
     * @param  Collection<int, DialysisSession>  $sessions
     * @return array<int, array{label: string, value: float}>
     */
    public static function systolic(Collection $sessions): array
    {
        return self::pressure($sessions, 'pre_bp', 1);
    }

    /**
     * @param  Collection<int, DialysisSession>  $sessions
     * @return array<int, array{label: string, value: float}>
     */
    public static function diastolic(Collection $sessions): array
    {
        return self::pressure($sessions, 'pre_bp', 2);
    }

    /**
     * @param  Collection<int, MedicalRecord>  $records
     * @return array<int, array{label: string, value: float}>
     */
    public static function lab(Collection $records, string $field, string $labelFormat = 'd/m'): array
    {
        return $records
            ->sortBy(fn (MedicalRecord $record): string => $record->examination_date->toDateString())
            ->filter(fn (MedicalRecord $record): bool => $record->{$field} !== null)
            ->map(fn (MedicalRecord $record): array => [
                'label' => $record->examination_date->format($labelFormat),
                'value' => (float) $record->{$field},
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, DialysisSession>  $sessions
     * @return array<int, array{label: string, value: float}>
     */
    public static function pressure(Collection $sessions, string $field, int $part, string $labelFormat = 'd/m'): array
    {
        return self::ordered($sessions)
            ->map(function (DialysisSession $session) use ($field, $part, $labelFormat): ?array {
                $reading = $session->{$field};

                if (! is_string($reading) || ! preg_match('/^(\d{2,3})\/(\d{2,3})$/', $reading, $matches)) {
                    return null;
                }

                return [
                    'label' => $session->scheduled_date->format($labelFormat),
                    'value' => (float) $matches[$part],
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, DialysisSession>  $sessions
     * @return array<int, array{label: string, value: float}>
     */
    private static function weightField(Collection $sessions, string $field, string $labelFormat): array
    {
        return self::ordered($sessions)
            ->filter(fn (DialysisSession $session): bool => $session->{$field} !== null)
            ->map(fn (DialysisSession $session): array => [
                'label' => $session->scheduled_date->format($labelFormat),
                'value' => (float) $session->{$field},
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
}
