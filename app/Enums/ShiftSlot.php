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
            self::Syif2 => 'Syif 2 · 10:30 pagi',
            self::Syif3 => 'Syif 3 · 3:00 petang',
        };
    }

    public function timeRange(): string
    {
        return match ($this) {
            self::Syif1 => '6:00 pagi – 10:00 pagi',
            self::Syif2 => '10:30 pagi – 2:30 petang',
            self::Syif3 => '3:00 petang – 7:00 malam',
        };
    }

    public function startTime(): string
    {
        return match ($this) {
            self::Syif1 => '06:00',
            self::Syif2 => '10:30',
            self::Syif3 => '15:00',
        };
    }
}
