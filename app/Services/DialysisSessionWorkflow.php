<?php

namespace App\Services;

use App\Enums\SessionStatus;
use App\Models\DialysisSession;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class DialysisSessionWorkflow
{
    public function checkIn(DialysisSession $session, User $nurse, float $preWeight, string $preBp): void
    {
        $this->assertStatus($session, SessionStatus::BelumHadir, 'Sesi ini tidak boleh didaftar masuk dari status semasa.');

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

    private function assertStatus(DialysisSession $session, SessionStatus $expected, string $message): void
    {
        if ($session->status !== $expected) {
            throw ValidationException::withMessages([
                'status' => $message,
            ]);
        }
    }
}
