<?php

namespace App\Support;

use App\Enums\ExaminationType;
use App\Enums\SessionStatus;
use App\Enums\ShiftSlot;
use App\Models\DialysisSession;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\User;

class DemoClinicHistory
{
    public static function ensure(): void
    {
        $patient = Patient::query()->where('patient_id_code', 'P-1001')->first();

        if ($patient === null) {
            return;
        }

        $nurseId = User::query()->where('role', 'nurse')->value('id');

        self::session($patient, $nurseId, 45, 65.40, 63.10, '154/90', '136/82');
        self::session($patient, $nurseId, 200, 66.20, 63.80, '160/94', '142/86');
        self::session($patient, $nurseId, 500, 67.10, 64.40, '164/96', '146/88');

        self::lab($patient, $nurseId, 8, 10.8, 5.10, 1.72, 20.1, 740);
        self::lab($patient, $nurseId, 14, 9.6, 5.80, 2.10, 28.4, 910);
        self::lab($patient, $nurseId, 20, 11.4, 4.90, 1.55, 16.8, 640);

        DialysisSession::query()
            ->where('patient_id', $patient->id)
            ->whereNull('intra_bp')
            ->whereNotNull('pre_bp')
            ->each(function (DialysisSession $session): void {
                $session->forceFill(['intra_bp' => self::during($session->pre_bp)])->save();
            });
    }

    private static function session(Patient $patient, mixed $nurseId, int $daysAgo, float $preWeight, float $postWeight, string $preBp, string $postBp): void
    {
        $date = today()->subDays($daysAgo);

        DialysisSession::query()->firstOrCreate(
            [
                'patient_id' => $patient->id,
                'scheduled_date' => $date->toDateString(),
                'scheduled_time' => '06:00',
            ],
            [
                'chair_number' => 'A-01',
                'shift' => ShiftSlot::Syif1,
                'status' => SessionStatus::SudahSelesai,
                'pre_weight_kg' => $preWeight,
                'post_weight_kg' => $postWeight,
                'pre_bp' => $preBp,
                'intra_bp' => self::during($preBp),
                'post_bp' => $postBp,
                'started_at' => $date->copy()->setTime(6, 5),
                'completed_at' => $date->copy()->setTime(10, 10),
                'nurse_user_id' => $nurseId,
            ],
        );
    }

    private static function lab(Patient $patient, mixed $nurseId, int $monthsAgo, float $hemoglobin, float $potassium, float $phosphate, float $urea, float $creatinine): void
    {
        $date = today()->subMonths($monthsAgo)->toDateString();

        MedicalRecord::query()->firstOrCreate(
            [
                'patient_id' => $patient->id,
                'examination_date' => $date,
            ],
            [
                'recorded_by' => $nurseId,
                'examination_type' => ExaminationType::Berkala,
                'hemoglobin' => $hemoglobin,
                'potassium' => $potassium,
                'phosphate' => $phosphate,
                'urea' => $urea,
                'creatinine' => $creatinine,
                'clinical_notes' => 'Keputusan demo untuk perbandingan '.$monthsAgo.' bulan.',
            ],
        );
    }

    private static function during(?string $pre): ?string
    {
        if ($pre === null || ! preg_match('/^(\d{2,3})\/(\d{2,3})$/', $pre, $matches)) {
            return null;
        }

        return max(90, (int) $matches[1] - 6).'/'.max(50, (int) $matches[2] - 4);
    }
}
