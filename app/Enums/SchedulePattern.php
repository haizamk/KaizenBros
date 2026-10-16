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

    /**
     * @return array<int, int>
     */
    public function weekdays(): array
    {
        return match ($this) {
            self::IsninRabuJumaat => [1, 3, 5],
            self::SelasaKhamisSabtu => [2, 4, 6],
        };
    }
}
