<?php

namespace App\Enums;

enum DocumentCategory: string
{
    case KadPengenalan = 'KAD_PENGENALAN';
    case SuratDoktor = 'SURAT_DOKTOR';
    case Lain = 'LAIN';

    public function label(): string
    {
        return match ($this) {
            self::KadPengenalan => 'Kad pengenalan',
            self::SuratDoktor => 'Surat doktor',
            self::Lain => 'Dokumen lain',
        };
    }
}
