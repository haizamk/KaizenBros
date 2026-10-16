<?php

namespace App\Services;

use App\Enums\SessionStatus;
use App\Models\DialysisSession;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class DialysisSessionWorkflow
{
    public function arrive(DialysisSession $session, User $nurse): void
    {
        $this->assertStatus($session, SessionStatus::BelumHadir, 'Pesakit ini sudah didaftarkan di kaunter.');
        $this->lockDay($session);

        $next = (int) DialysisSession::query()
            ->whereDate('scheduled_date', $session->scheduled_date)
            ->lockForUpdate()
            ->max('queue_number');

        $session->forceFill([
            'status' => SessionStatus::Menunggu,
            'queue_number' => $next + 1,
            'arrived_at' => now(),
            'chair_number' => null,
            'called_at' => null,
            'nurse_user_id' => $nurse->id,
        ])->save();
    }

    public function call(DialysisSession $session, User $nurse): void
    {
        $this->assertStatus($session, SessionStatus::Menunggu, 'Hanya pesakit yang sudah daftar kaunter boleh dipanggil.');

        if ($session->chair_number !== null) {
            throw ValidationException::withMessages([
                'status' => 'Pesakit ini sudah mempunyai kerusi.',
            ]);
        }

        $this->lockDay($session);
        $chair = $this->nextFreeChair($session);

        if ($chair === null) {
            throw ValidationException::withMessages([
                'status' => 'Tiada kerusi kosong. Sila tunggu satu sesi selesai.',
            ]);
        }

        $session->forceFill([
            'chair_number' => $chair,
            'called_at' => now(),
            'nurse_user_id' => $nurse->id,
        ])->save();
    }

    public function checkIn(DialysisSession $session, User $nurse, float $preWeight, string $preBp): void
    {
        $this->assertStatus($session, SessionStatus::Menunggu, 'Rekod berat hanya boleh dibuat selepas pesakit dipanggil ke kerusi.');

        if ($session->chair_number === null) {
            throw ValidationException::withMessages([
                'status' => 'Pesakit belum dipanggil ke kerusi kosong.',
            ]);
        }

        $session->forceFill([
            'status' => SessionStatus::SudahHadir,
            'pre_weight_kg' => $preWeight,
            'pre_bp' => $preBp,
            'nurse_user_id' => $nurse->id,
        ])->save();
    }

    public function start(DialysisSession $session, User $nurse): void
    {
        $this->assertStatus($session, SessionStatus::SudahHadir, 'Dialisis hanya boleh dimulakan selepas pesakit didaftar masuk.');

        $session->forceFill([
            'status' => SessionStatus::SedangDialisis,
            'started_at' => now(),
            'nurse_user_id' => $nurse->id,
        ])->save();
    }

    public function recordDuring(DialysisSession $session, User $nurse, string $intraBp): void
    {
        $this->assertStatus($session, SessionStatus::SedangDialisis, 'Tekanan darah semasa hanya boleh direkodkan ketika dialisis sedang berjalan.');

        $session->forceFill([
            'intra_bp' => $intraBp,
            'nurse_user_id' => $nurse->id,
        ])->save();
    }

    public function complete(DialysisSession $session, User $nurse, float $postWeight, string $postBp, ?string $notes): void
    {
        $this->assertStatus($session, SessionStatus::SedangDialisis, 'Sesi hanya boleh ditamatkan semasa dialisis sedang berjalan.');

        $session->forceFill([
            'status' => SessionStatus::SudahSelesai,
            'post_weight_kg' => $postWeight,
            'post_bp' => $postBp,
            'nurse_notes' => $notes,
            'completed_at' => now(),
            'nurse_user_id' => $nurse->id,
        ])->save();
    }

    private function lockDay(DialysisSession $session): void
    {
        DialysisSession::query()
            ->whereDate('scheduled_date', $session->scheduled_date)
            ->lockForUpdate()
            ->get(['id']);
    }

    public function nextFreeChair(DialysisSession $session): ?string
    {
        $occupied = DialysisSession::query()
            ->whereDate('scheduled_date', $session->scheduled_date)
            ->whereNotNull('chair_number')
            ->where('status', '!=', SessionStatus::SudahSelesai)
            ->whereKeyNot($session->id)
            ->pluck('chair_number');

        /** @var array<int, string> $chairs */
        $chairs = config('kaizenbros.centre.chairs', []);

        foreach ($chairs as $chair) {
            if (! $occupied->contains($chair)) {
                return $chair;
            }
        }

        return null;
    }

    private function assertStatus(DialysisSession $session, SessionStatus $expected, string $message): void
    {
        if ($session->status !== $expected) {
            throw ValidationException::withMessages([
                'status' => $message,
            ]);
        }
    }
}
