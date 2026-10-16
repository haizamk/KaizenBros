<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Nurse = 'nurse';
    case Patient = 'patient';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Pentadbir',
            self::Nurse => 'Jururawat',
            self::Patient => 'Pesakit',
        };
    }
}
