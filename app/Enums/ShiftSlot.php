<?php

namespace App\Enums;

enum ShiftSlot: string
{
    case Syif1 = 'SYIF_1';
    case Syif2 = 'SYIF_2';
    case Syif3 = 'SYIF_3';

    public function label(): string
    {
        return match ($this) {
            self::Syif1 => 'Syif 1 · 6:00 pagi',
            self::Syif2 => 'Syif 2 · 11:00 pagi',
            self::Syif3 => 'Syif 3 · 4:00 petang',
        };
    }
}
