<?php

namespace App\Services;

use App\Enums\SessionStatus;
use App\Models\ChairBlock;
use App\Models\DialysisSession;
use App\Models\User;
use App\Support\ChairBoard;
use Illuminate\Validation\ValidationException;

class DialysisSessionWorkflow
{
    public function arrive(DialysisSession $session, User $nurse, float $preWeight, ?string $preBp): void
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
            'pre_weight_kg' => $preWeight,
            'pre_bp' => $preBp,
            'nurse_user_id' => $nurse->id,
        ])->save();
    }

    public function call(DialysisSession $session, User $nurse, ?string $chair = null): void
    {
        $this->assertStatus($session, SessionStatus::Menunggu, 'Hanya pesakit yang sudah daftar kaunter boleh dipanggil.');

        if ($session->chair_number !== null) {
            throw ValidationException::withMessages([
                'status' => 'Pesakit ini sudah mempunyai kerusi.',
            ]);
        }

        $this->lockDay($session);
        $next = $this->nextInLine($session);

        if ($next === null || $next->id !== $session->id) {
            $label = $next?->queue_number === null
                ? ''
                : str_pad((string) $next->queue_number, 3, '0', STR_PAD_LEFT);

            throw ValidationException::withMessages([
                'status' => $label === ''
                    ? 'Pesakit yang sampai lebih awal masih menunggu.'
                    : "Pesakit yang sampai lebih awal masih menunggu. Panggil giliran {$label} dahulu.",
            ]);
        }

        $chosen = $chair ?: $this->nextFreeChair($session);
        $this->assertChairUsable($session, $chosen);

        $session->forceFill([
            'chair_number' => $chosen,
            'called_at' => now(),
            'status' => $session->pre_weight_kg === null ? SessionStatus::Menunggu : SessionStatus::SudahHadir,
            'nurse_user_id' => $nurse->id,
        ])->save();
    }

    public function blockChair(string $chair, string $reason, User $nurse): void
    {
        $this->assertKnownChair($chair);
        DialysisSession::query()
            ->whereDate('scheduled_date', today())
            ->lockForUpdate()
            ->get(['id']);

        if ($this->chairIsOccupied($chair, today()->toDateString())) {
            throw ValidationException::withMessages([
                'chair_number' => 'Kerusi ini sedang digunakan. Tandai rosak selepas sesi selesai, atau panggil pesakit ke kerusi lain.',
            ]);
        }

        ChairBlock::query()->updateOrCreate(
            [
                'chair_number' => $chair,
                'blocked_on' => today()->toDateString(),
            ],
            [
                'reason' => $reason,
                'user_id' => $nurse->id,
            ],
        );
    }

    public function restoreChair(string $chair): void
    {
        $this->assertKnownChair($chair);

        ChairBlock::query()
            ->where('chair_number', $chair)
            ->whereDate('blocked_on', today())
            ->delete();
    }

    public function checkIn(DialysisSession $session, User $nurse, float $preWeight, ?string $preBp): void
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

        ChairBlock::query()
            ->whereDate('blocked_on', $session->scheduled_date)
            ->lockForUpdate()
            ->get(['id']);
    }

    public function nextFreeChair(DialysisSession $session): ?string
    {
        return ChairBoard::free($session->scheduled_date, $session->id)[0] ?? null;
    }

    private function nextInLine(DialysisSession $session): ?DialysisSession
    {
        return DialysisSession::query()
            ->whereDate('scheduled_date', $session->scheduled_date)
            ->where('status', SessionStatus::Menunggu)
            ->whereNull('chair_number')
            ->orderBy('queue_number')
            ->orderBy('arrived_at')
            ->orderBy('id')
            ->lockForUpdate()
            ->first();
    }

    private function assertChairUsable(DialysisSession $session, ?string $chair): void
    {
        if ($chair === null) {
            throw ValidationException::withMessages([
                'status' => 'Tiada kerusi kosong. Sila tunggu satu sesi selesai.',
            ]);
        }

        $this->assertKnownChair($chair);

        if ($this->chairIsOccupied($chair, $session->scheduled_date->toDateString(), $session->id)) {
            throw ValidationException::withMessages([
                'chair_number' => 'Kerusi ini sedang digunakan.',
            ]);
        }

        $blocked = ChairBlock::query()
            ->where('chair_number', $chair)
            ->whereDate('blocked_on', $session->scheduled_date)
            ->exists();

        if ($blocked) {
            throw ValidationException::withMessages([
                'chair_number' => 'Kerusi ini ditanda rosak atau tidak sesuai. Sila pilih kerusi lain.',
            ]);
        }
    }

    private function assertKnownChair(string $chair): void
    {
        if (! in_array($chair, ChairBoard::numbers(), true)) {
            throw ValidationException::withMessages([
                'chair_number' => 'Kerusi ini tiada di pusat dialisis.',
            ]);
        }
    }

    private function chairIsOccupied(string $chair, string $date, ?int $exceptSessionId = null): bool
    {
        $query = DialysisSession::query()
            ->whereDate('scheduled_date', $date)
            ->where('chair_number', $chair)
            ->whereIn('status', [
                SessionStatus::Menunggu,
                SessionStatus::SudahHadir,
                SessionStatus::SedangDialisis,
            ]);

        if ($exceptSessionId !== null) {
            $query->whereKeyNot($exceptSessionId);
        }

        return $query->exists();
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
