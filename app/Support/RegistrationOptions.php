<?php

namespace App\Support;

class RegistrationOptions
{
    /**
     * @return array<string, string>
     */
    public static function categories(): array
    {
        return [
            'PESAKIT_BARU' => 'Pesakit baru dialisis',
            'PINDAH_PUSAT' => 'Pertukaran dari pusat dialisis lain',
            'TRANSIT' => 'Pesakit percutian atau transit',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function relationships(): array
    {
        return [
            'SUAMI_ISTERI' => 'Suami atau isteri',
            'ANAK' => 'Anak',
            'IBU_BAPA' => 'Ibu atau bapa',
            'ADIK_BERADIK' => 'Adik-beradik',
            'PENJAGA' => 'Penjaga sah',
            'LAIN' => 'Lain-lain',
        ];
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(array $map): array
    {
        return collect($map)
            ->map(fn (string $label, string $value): array => [
                'value' => $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }
}
