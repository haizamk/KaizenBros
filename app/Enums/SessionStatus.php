<?php

namespace App\Enums;

enum SessionStatus: string
{
    case BelumHadir = 'BELUM_HADIR';
    case SudahHadir = 'SUDAH_HADIR';
    case SedangDialisis = 'SEDANG_DIALISIS';
    case SudahSelesai = 'SUDAH_SELESAI';

    public function label(): string
    {
        return match ($this) {
            self::BelumHadir => 'Belum hadir',
            self::SudahHadir => 'Sudah hadir',
            self::SedangDialisis => 'Sedang dialisis',
            self::SudahSelesai => 'Selesai',
        };
    }
}
