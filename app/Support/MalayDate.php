<?php

namespace App\Support;

use Carbon\CarbonInterface;

class MalayDate
{
    public static function long(CarbonInterface $date): string
    {
        $days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
        $months = [1 => 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

        return $days[$date->dayOfWeek].', '.$date->day.' '.$months[$date->month].' '.$date->year;
    }

    public static function relative(CarbonInterface $date): string
    {
        if ($date->isToday()) {
            return 'Hari ini';
        }

        if ($date->isTomorrow()) {
            return 'Esok';
        }

        if ($date->isYesterday()) {
            return 'Semalam';
        }

        $days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

        return $days[$date->dayOfWeek];
    }
}
