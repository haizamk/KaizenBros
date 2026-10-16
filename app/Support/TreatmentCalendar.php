<?php

namespace App\Support;

use App\Models\Patient;
use Carbon\CarbonInterface;

class TreatmentCalendar
{
    /**
     * @return array<int, array<string, string>>
     */
    public static function upcoming(Patient $patient, int $count = 8): array
    {
        $weekdays = $patient->schedule_pattern->weekdays();
        $cursor = today()->copy()->addDay();
        $visits = [];

        while (count($visits) < $count && $cursor->lt(today()->copy()->addYear())) {
            if (in_array($cursor->dayOfWeek, $weekdays, true)) {
                $visits[] = self::describe($cursor, $patient);
            }

            $cursor = $cursor->addDay();
        }

        return $visits;
    }

    /**
     * @return array<string, string>
     */
    public static function describe(CarbonInterface $date, Patient $patient): array
    {
        return [
            'date' => $date->toDateString(),
            'date_label' => MalayDate::long($date),
            'relative' => MalayDate::relative($date),
            'schedule_label' => $patient->schedule_pattern->label(),
            'shift_label' => $patient->preferred_shift->label(),
            'time_range' => $patient->preferred_shift->timeRange(),
        ];
    }
}
