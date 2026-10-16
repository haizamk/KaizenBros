<?php

namespace App\Enums;

enum ExaminationType: string
{
    case Berkala = 'BERKALA_3_BULAN';
    case Tahunan = 'TAHUNAN';
    case Khas = 'KHAS';

    public function label(): string
    {
        return match ($this) {
            self::Berkala => 'Pemeriksaan berkala 3 bulan',
            self::Tahunan => 'Pemeriksaan tahunan',
            self::Khas => 'Pemeriksaan khas',
        };
    }
}
