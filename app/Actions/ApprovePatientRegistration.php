<?php

namespace App\Actions;

use App\Enums\SchedulePattern;
use App\Enums\SessionStatus;
use App\Enums\ShiftSlot;
use App\Enums\UserRole;
use App\Models\DialysisSession;
use App\Models\Patient;
use App\Models\PatientDocument;
use App\Models\Registration;
use App\Models\User;
use App\Support\EnrolmentOptions;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApprovePatientRegistration
{
    /**
     * @param  array{password: string, dry_weight_kg: float|int|string, preferred_shift: string, schedule_pattern: string, vascular_access: string, access_location: string, sponsor: string}  $clinical
     */
    public function open(Registration $registration, User $reviewer, array $clinical): Patient
    {
        if ($registration->status !== 'BARU') {
            throw ValidationException::withMessages([
                'status' => 'Permohonan ini sudah disemak.',
            ]);
        }

        if (User::query()->where('ic_number', $registration->ic_number)->exists()
            || Patient::query()->where('ic_number', $registration->ic_number)->exists()) {
            throw ValidationException::withMessages([
                'ic_number' => 'Kad pengenalan ini sudah ada dalam rekod pusat.',
            ]);
        }

        return DB::transaction(function () use ($registration, $reviewer, $clinical): Patient {
            $code = $this->nextCode();
            $email = $this->portalEmail($registration->email, $code);
            $shift = ShiftSlot::from($clinical['preferred_shift']);
            $pattern = SchedulePattern::from($clinical['schedule_pattern']);

            $user = User::query()->create([
                'name' => $registration->full_name,
                'email' => $email,
                'password' => $clinical['password'],
                'role' => UserRole::Patient,
                'phone' => $registration->phone_number,
                'ic_number' => $registration->ic_number,
                'email_verified_at' => now(),
            ]);

            $patient = Patient::query()->create([
                'user_id' => $user->id,
                'patient_id_code' => $code,
                'name' => $registration->full_name,
                'ic_number' => $registration->ic_number,
                'gender' => $registration->gender,
                'age' => $registration->age_years ?? 0,
                'phone' => $registration->phone_number,
                'email' => $registration->email,
                'address' => $registration->address,
                'dry_weight_kg' => $clinical['dry_weight_kg'],
                'vascular_access' => EnrolmentOptions::accessLabel($clinical['vascular_access'], $clinical['vascular_access_other'] ?? null),
                'access_location' => $clinical['access_location'],
                'sponsor' => EnrolmentOptions::sponsorLabel($clinical['sponsor'], $clinical['sponsor_other'] ?? null),
                'schedule_pattern' => $pattern,
                'preferred_shift' => $shift,
                'allergies' => null,
                'is_active' => true,
            ]);

            PatientDocument::query()
                ->where('registration_id', $registration->id)
                ->update(['patient_id' => $patient->id]);

            if (in_array(today()->dayOfWeek, $pattern->weekdays(), true)) {
                DialysisSession::query()->create([
                    'patient_id' => $patient->id,
                    'chair_number' => null,
                    'scheduled_date' => today()->toDateString(),
                    'scheduled_time' => $shift->startTime(),
                    'shift' => $shift,
                    'status' => SessionStatus::BelumHadir,
                ]);
            }

            $registration->update([
                'status' => 'DILULUSKAN',
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
            ]);

            return $patient;
        });
    }

    private function nextCode(): string
    {
        $highest = Patient::query()
            ->pluck('patient_id_code')
            ->map(fn (string $code): int => (int) preg_replace('/\D+/', '', $code))
            ->max() ?? 1000;

        return 'P-'.str_pad((string) ($highest + 1), 4, '0', STR_PAD_LEFT);
    }

    private function portalEmail(?string $email, string $code): string
    {
        $email = $email === null ? '' : strtolower(trim($email));
        $fallback = strtolower(str_replace('-', '', $code)).'@pesakit.kaizenbros.my';

        if ($email === '' || User::query()->where('email', $email)->exists()) {
            return $fallback;
        }

        return $email;
    }
}
