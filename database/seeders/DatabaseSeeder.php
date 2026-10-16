<?php

namespace Database\Seeders;

use App\Enums\ExaminationType;
use App\Enums\SchedulePattern;
use App\Enums\SessionStatus;
use App\Enums\ShiftSlot;
use App\Enums\UserRole;
use App\Models\DialysisSession;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\PatientMedication;
use App\Models\Registration;
use App\Models\User;
use App\Support\DemoClinicHistory;
use App\Support\MalaysianIdentityCard;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = collect(config('kaizenbros.demo_accounts'))->keyBy('role');

        $nurse = $this->account($accounts->get('Jururawat'), UserRole::Nurse, '019-3889922');
        $this->account($accounts->get('Pentadbir'), UserRole::Admin, '03-8727 8899');
        $tanUser = $this->account($accounts->get('Pesakit'), UserRole::Patient, '012-3001001');

        $tan = $this->patient($tanUser, [
            'patient_id_code' => 'P-1001',
            'name' => 'Tan Ah Kow',
            'ic_number' => '580101-10-1231',
            'gender' => 'LELAKI',
            'age' => 68,
            'phone' => '012-3001001',
            'email' => $tanUser->email,
            'address' => 'Bandar Rinching, Semenyih',
            'dry_weight_kg' => 62.50,
            'vascular_access' => 'AVF',
            'access_location' => 'Lengan kiri',
            'sponsor' => 'PERKESO / SOCSO',
            'schedule_pattern' => SchedulePattern::IsninRabuJumaat,
            'preferred_shift' => ShiftSlot::Syif1,
            'allergies' => 'Tiada diketahui',
        ]);

        $siti = $this->patient(null, [
            'patient_id_code' => 'P-1002',
            'name' => 'Siti Aminah binti Hassan',
            'ic_number' => '620202-08-2468',
            'gender' => 'PEREMPUAN',
            'age' => 64,
            'phone' => '012-3001002',
            'dry_weight_kg' => 54.20,
            'vascular_access' => 'AVF',
            'access_location' => 'Lengan kanan',
            'sponsor' => 'Zakat Selangor',
            'schedule_pattern' => SchedulePattern::IsninRabuJumaat,
            'preferred_shift' => ShiftSlot::Syif1,
            'allergies' => 'Penicillin',
        ]);

        $rajesh = $this->patient(null, [
            'patient_id_code' => 'P-1003',
            'name' => 'Rajesh a/l Kumar',
            'ic_number' => '700515-14-1357',
            'gender' => 'LELAKI',
            'age' => 56,
            'phone' => '012-3001003',
            'dry_weight_kg' => 71.00,
            'vascular_access' => 'Permcath',
            'access_location' => 'Jugular kanan',
            'sponsor' => 'JPA / KWAP',
            'schedule_pattern' => SchedulePattern::IsninRabuJumaat,
            'preferred_shift' => ShiftSlot::Syif2,
            'allergies' => 'Tiada diketahui',
        ]);

        $lim = $this->patient(null, [
            'patient_id_code' => 'P-1004',
            'name' => 'Lim Mei Ling',
            'ic_number' => '650808-10-2460',
            'gender' => 'PEREMPUAN',
            'age' => 61,
            'phone' => '012-3001004',
            'dry_weight_kg' => 49.80,
            'vascular_access' => 'AVF',
            'access_location' => 'Lengan kiri',
            'sponsor' => 'NKF',
            'schedule_pattern' => SchedulePattern::IsninRabuJumaat,
            'preferred_shift' => ShiftSlot::Syif1,
            'allergies' => 'Tiada diketahui',
        ]);

        DialysisSession::query()->create([
            'patient_id' => $tan->id,
            'queue_number' => 2,
            'chair_number' => 'A-01',
            'scheduled_date' => today(),
            'scheduled_time' => '06:00',
            'shift' => ShiftSlot::Syif1,
            'status' => SessionStatus::SedangDialisis,
            'arrived_at' => now()->subMinutes(50),
            'called_at' => now()->subMinutes(45),
            'pre_weight_kg' => 64.20,
            'pre_bp' => '148/86',
            'started_at' => now()->subMinutes(40),
            'nurse_user_id' => $nurse->id,
        ]);

        DialysisSession::query()->create([
            'patient_id' => $siti->id,
            'queue_number' => 3,
            'chair_number' => 'A-02',
            'scheduled_date' => today(),
            'scheduled_time' => '06:00',
            'shift' => ShiftSlot::Syif1,
            'status' => SessionStatus::SudahHadir,
            'arrived_at' => now()->subMinutes(30),
            'called_at' => now()->subMinutes(20),
            'pre_weight_kg' => 56.10,
            'pre_bp' => '152/90',
            'nurse_user_id' => $nurse->id,
        ]);

        DialysisSession::query()->create([
            'patient_id' => $rajesh->id,
            'chair_number' => null,
            'scheduled_date' => today(),
            'scheduled_time' => '10:30',
            'shift' => ShiftSlot::Syif2,
            'status' => SessionStatus::BelumHadir,
        ]);

        DialysisSession::query()->create([
            'patient_id' => $lim->id,
            'queue_number' => 1,
            'chair_number' => 'A-03',
            'scheduled_date' => today(),
            'scheduled_time' => '06:00',
            'shift' => ShiftSlot::Syif1,
            'status' => SessionStatus::SudahSelesai,
            'arrived_at' => now()->subHours(6),
            'called_at' => now()->subHours(6),
            'pre_weight_kg' => 51.40,
            'post_weight_kg' => 49.90,
            'pre_bp' => '138/78',
            'post_bp' => '128/74',
            'started_at' => now()->subHours(5),
            'completed_at' => now()->subHour(),
            'nurse_user_id' => $nurse->id,
            'nurse_notes' => 'Sesi selesai tanpa komplikasi.',
        ]);

        $this->completedSession($tan, $nurse, 14, 65.10, 63.40, '156/92', '140/84');
        $this->completedSession($tan, $nurse, 9, 64.80, 62.90, '150/88', '136/80');
        $this->completedSession($tan, $nurse, 5, 64.40, 62.60, '146/84', '132/78');

        MedicalRecord::query()->create([
            'patient_id' => $tan->id,
            'recorded_by' => $nurse->id,
            'examination_date' => today()->subMonths(3),
            'examination_type' => ExaminationType::Berkala,
            'hemoglobin' => 10.4,
            'potassium' => 5.6,
            'phosphate' => 1.90,
            'urea' => 22.4,
            'creatinine' => 780.0,
            'clinical_notes' => 'Kalium tinggi. Nasihat diet rendah kalium diberikan.',
        ]);

        MedicalRecord::query()->create([
            'patient_id' => $tan->id,
            'recorded_by' => $nurse->id,
            'examination_date' => today()->subDays(7),
            'examination_type' => ExaminationType::Berkala,
            'hemoglobin' => 11.1,
            'potassium' => 4.70,
            'phosphate' => 1.60,
            'urea' => 18.2,
            'creatinine' => 690.0,
            'clinical_notes' => 'Keputusan berkala lebih stabil.',
        ]);

        PatientMedication::query()->create([
            'patient_id' => $tan->id,
            'medication_name' => 'Erythropoietin',
            'dosage' => '4000 IU',
            'frequency' => '3 kali seminggu',
            'route' => 'Subkutaneus',
            'is_active' => true,
        ]);

        PatientMedication::query()->create([
            'patient_id' => $tan->id,
            'medication_name' => 'Calcium carbonate',
            'dosage' => '500 mg',
            'frequency' => '3 kali sehari bersama makanan',
            'route' => 'Oral',
            'is_active' => true,
        ]);

        $ahmadIdentity = MalaysianIdentityCard::parse('710303-10-1123');

        Registration::query()->create([
            'reference' => 'KB-REG-240016',
            'full_name' => 'Ahmad Zulkifli bin Osman',
            'ic_number' => $ahmadIdentity['formatted'],
            'phone_number' => '0123001999',
            'email' => 'ahmad.zulkifli@demo.kaizenbros.my',
            'gender' => $ahmadIdentity['gender'],
            'birth_date' => $ahmadIdentity['birth_date'],
            'age_years' => $ahmadIdentity['years'],
            'age_months' => $ahmadIdentity['months'],
            'address' => 'No. 18, Jalan Rinching, 43500 Semenyih, Selangor',
            'patient_category' => 'PESAKIT_BARU',
            'medical_notes' => 'Rujukan nefrologi. Menunggu slot dialisis tetap.',
            'nok_name' => 'Farah Ahmad',
            'nok_relationship' => 'ANAK',
            'nok_phone' => '0123001888',
            'status' => 'BARU',
        ]);

        DemoClinicHistory::ensure();
    }

    /**
     * @param  array{role: string, name: string, email: string, password: string}  $account
     */
    private function account(array $account, UserRole $role, string $phone): User
    {
        $user = User::query()->create([
            'name' => $account['name'],
            'email' => $account['email'],
            'password' => $account['password'],
            'role' => $role,
            'phone' => $phone,
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();

        return $user;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function patient(?User $user, array $attributes): Patient
    {
        return Patient::query()->create([
            ...$attributes,
            'user_id' => $user?->id,
            'is_active' => true,
        ]);
    }

    private function completedSession(Patient $patient, User $nurse, int $daysAgo, float $preWeight, float $postWeight, string $preBp, string $postBp): void
    {
        $date = today()->subDays($daysAgo);

        DialysisSession::query()->create([
            'patient_id' => $patient->id,
            'chair_number' => 'A-01',
            'scheduled_date' => $date,
            'scheduled_time' => '06:00',
            'shift' => ShiftSlot::Syif1,
            'status' => SessionStatus::SudahSelesai,
            'pre_weight_kg' => $preWeight,
            'post_weight_kg' => $postWeight,
            'pre_bp' => $preBp,
            'post_bp' => $postBp,
            'started_at' => $date->copy()->setTime(6, 5),
            'completed_at' => $date->copy()->setTime(10, 10),
            'nurse_user_id' => $nurse->id,
        ]);
    }
}
