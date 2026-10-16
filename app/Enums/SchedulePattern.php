<?php

namespace App\Enums;

enum SchedulePattern: string
{
    case IsninRabuJumaat = 'ISNIN_RABU_JUMAAT';
    case SelasaKhamisSabtu = 'SELASA_KHAMIS_SABTU';

    public function label(): string
    {
        return match ($this) {
            self::IsninRabuJumaat => 'Isnin, Rabu, Jumaat',
            self::SelasaKhamisSabtu => 'Selasa, Khamis, Sabtu',
        };
    }
}
