<?php

namespace App\Support;

class EnrolmentOptions
{
    /**
     * @return array<string, string>
     */
    public static function sponsors(): array
    {
        $options = [];

        foreach (config('kaizenbros.centre.panels') as $panel) {
            $options[$panel] = $panel;
        }

        return [
            ...$options,
            'TUNAI' => 'Tunai',
            'INSURANS' => 'Insurans',
            'LAIN' => 'Lain-lain',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function accesses(): array
    {
        return [
            'AVF' => 'Fistula (AVF)',
            'AVG' => 'Graft (AVG)',
            'PERMCATH' => 'Kateter kekal (Permcath)',
            'SEMENTARA' => 'Kateter sementara',
            'LAIN' => 'Lain-lain',
        ];
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function sponsorChoices(): array
    {
        return self::choices(self::sponsors());
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function accessChoices(): array
    {
        return self::choices(self::accesses());
    }

    public static function sponsorLabel(string $value, ?string $other): string
    {
        if ($value === 'LAIN') {
            return trim((string) $other);
        }

        return self::sponsors()[$value] ?? $value;
    }

    public static function accessLabel(string $value, ?string $other): string
    {
        if ($value === 'LAIN') {
            return trim((string) $other);
        }

        return self::accesses()[$value] ?? $value;
    }

    /**
     * @param  array<string, string>  $options
     * @return array<int, array{value: string, label: string}>
     */
    private static function choices(array $options): array
    {
        $choices = [];

        foreach ($options as $value => $label) {
            $choices[] = ['value' => $value, 'label' => $label];
        }

        return $choices;
    }
}
