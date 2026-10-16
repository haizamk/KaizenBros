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
        $models = DialysisSession::query()
            ->with(['patient', 'nurse'])
            ->whereDate('scheduled_date', today())
            ->orderByRaw('queue_number is null')
            ->orderBy('queue_number')
            ->orderBy('scheduled_time')
            ->get();

        $next = $models->first(
            fn (DialysisSession $session): bool => $session->status === SessionStatus::Menunggu && $session->chair_number === null,
        );
        $free = ChairBoard::free(today());
        $suggested = $free[0] ?? null;
        $ahead = $next?->queue_number === null
            ? null
            : str_pad((string) $next->queue_number, 3, '0', STR_PAD_LEFT);

        return $models
            ->map(function (DialysisSession $session) use ($next, $free, $suggested, $ahead): array {
                $data = $session->toPortalArray();
                $data['patient']['phone'] = $session->patient->phone;
                $data['whatsapp_url'] = WhatsAppLink::sessionReminder(
                    $session->patient->phone,
                    $session->patient->name,
                    $session->scheduled_date->format('d/m/Y'),
                    $session->scheduled_time,
                    $session->chair_number ?? 'akan ditentukan',
                );
                $waiting = $session->status === SessionStatus::Menunggu && $session->chair_number === null;
                $data['can_call'] = $waiting && $next !== null && $session->id === $next->id;
                $data['suggested_chair'] = $suggested;
                $data['free_chairs'] = $free;
                $data['ahead_label'] = $waiting && $data['can_call'] === false ? $ahead : null;

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
            'menunggu' => $sessions->where('status', SessionStatus::Menunggu->value)->count(),
            'hadir' => $sessions->where('status', SessionStatus::SudahHadir->value)->count(),
            'sedang' => $sessions->where('status', SessionStatus::SedangDialisis->value)->count(),
            'selesai' => $selesai,
            'kerusi_kosong' => count(ChairBoard::free(today())),
            'kerusi_rosak' => count(array_filter(
                ChairBoard::tiles(),
                fn (array $chair): bool => $chair['state'] === 'rosak',
            )),
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
