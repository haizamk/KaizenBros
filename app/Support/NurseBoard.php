<?php

namespace App\Support;

use App\Enums\SessionStatus;
use App\Models\DialysisSession;
use App\Models\Patient;
use Illuminate\Support\Collection;

class NurseBoard
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public static function todaySessions(): Collection
    {
        return DialysisSession::query()
            ->with(['patient', 'nurse'])
            ->whereDate('scheduled_date', today())
            ->orderBy('scheduled_time')
            ->orderBy('chair_number')
            ->get()
            ->map(function (DialysisSession $session): array {
                $data = $session->toPortalArray();
                $data['patient']['phone'] = $session->patient->phone;
                $data['whatsapp_url'] = WhatsAppLink::sessionReminder(
                    $session->patient->phone,
                    $session->patient->name,
                    $session->scheduled_date->format('d/m/Y'),
                    $session->scheduled_time,
                    $session->chair_number,
                );

                return $data;
            })
            ->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $sessions
     * @return array<string, int|bool|string>
     */
    public static function counts(Collection $sessions): array
    {
        $total = $sessions->count();
        $selesai = $sessions->where('status', SessionStatus::SudahSelesai->value)->count();

        return [
            'total' => $total,
            'belum' => $sessions->where('status', SessionStatus::BelumHadir->value)->count(),
            'hadir' => $sessions->where('status', SessionStatus::SudahHadir->value)->count(),
            'sedang' => $sessions->where('status', SessionStatus::SedangDialisis->value)->count(),
            'selesai' => $selesai,
            'percent' => $total === 0 ? 0 : (int) round(($selesai / $total) * 100),
            'clinic_closed' => now()->format('H:i') >= '19:00',
            'date_label' => MalayDate::long(today()),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public static function patients(): Collection
    {
        return Patient::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function (Patient $patient): array {
                $data = $patient->toPortalArray();
                $data['whatsapp_url'] = WhatsAppLink::message(
                    $patient->phone,
                    "Salam {$patient->name}, ini Pusat Dialisis KaizenBros Semenyih.",
                );

                return $data;
            })
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public static function schedule(): Collection
    {
        return Patient::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function (Patient $patient): array {
                $data = $patient->toPortalArray();
                $data['upcoming'] = array_slice(TreatmentCalendar::upcoming($patient, 3), 0, 3);

                return $data;
            })
            ->values();
    }
}
