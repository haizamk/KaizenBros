<?php

namespace Tests\Feature;

use App\Enums\ExaminationType;
use App\Enums\SchedulePattern;
use App\Enums\SessionStatus;
use App\Enums\ShiftSlot;
use App\Models\DialysisSession;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClinicWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_sent_to_login_before_the_nurse_board(): void
    {
        $this->get(route('nurse.home'))->assertRedirect(route('login'));
    }

    public function test_patient_cannot_open_the_nurse_or_admin_board(): void
    {
        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($patient)->get(route('nurse.home'))->assertForbidden();
        $this->actingAs($patient)->get(route('nurse.records.index'))->assertForbidden();
        $this->actingAs($patient)->post(route('nurse.records.store'), [])->assertForbidden();
        $this->actingAs($patient)->get(route('admin.home'))->assertForbidden();
        $this->actingAs($patient)->post(route('nurse.sessions.arrive', $this->sessionFor($this->patientRecord())))->assertForbidden();
    }

    public function test_nurse_moves_a_session_from_arrival_to_completion(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse']);
        $session = $this->sessionFor($this->patientRecord());

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.arrive', $session), [
                'pre_weight_kg' => 65.4,
                'pre_bp' => '140/90',
            ])
            ->assertRedirect();

        $session->refresh();
        $this->assertSame(SessionStatus::Menunggu, $session->status);
        $this->assertSame(1, $session->queue_number);
        $this->assertNull($session->chair_number);
        $this->assertSame('65.40', $session->pre_weight_kg);

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.call', $session))
            ->assertRedirect();

        $session->refresh();
        $this->assertSame('A-01', $session->chair_number);
        $this->assertSame(SessionStatus::SudahHadir, $session->status);

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.start', $session))
            ->assertRedirect();

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.complete', $session), [
                'post_weight_kg' => 63.1,
                'post_bp' => '128/80',
                'nurse_notes' => 'Stabil',
            ])
            ->assertRedirect();

        $session->refresh();
        $this->assertSame(SessionStatus::SudahSelesai, $session->status);
        $this->assertSame('63.10', $session->post_weight_kg);
        $this->assertNotNull($session->completed_at);
    }

    public function test_dialysis_cannot_start_before_check_in(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse']);
        $session = $this->sessionFor($this->patientRecord());

        $this->actingAs($nurse)
            ->from(route('nurse.home'))
            ->post(route('nurse.sessions.start', $session))
            ->assertRedirect(route('nurse.home'))
            ->assertSessionHasErrors('status');

        $this->assertSame(SessionStatus::BelumHadir, $session->refresh()->status);
    }

    public function test_patient_portal_only_contains_that_patients_record(): void
    {
        $owner = User::factory()->create(['role' => 'patient', 'name' => 'Tan Ah Kow']);
        $other = $this->patientRecord(null, 'P-2002', 'Siti Aminah binti Hassan');
        $ownPatient = $this->patientRecord($owner, 'P-1001', 'Tan Ah Kow');
        $this->sessionFor($ownPatient);
        $this->sessionFor($other, 'A-09');

        $this->actingAs($owner)
            ->get(route('patient.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('pesakit/papan')
                ->where('patient.patient_id_code', 'P-1001')
                ->where('todaySession.chair_visible', false)
                ->where('todaySession.chair_number', null)
                ->missing('records')
            )
            ->assertDontSee('Siti Aminah binti Hassan')
            ->assertDontSee('wa.me');
    }

    public function test_patient_portal_shows_only_their_blood_results_and_chart(): void
    {
        $owner = User::factory()->create(['role' => 'patient']);
        $ownPatient = $this->patientRecord($owner, 'P-1001', 'Tan Ah Kow');
        $other = $this->patientRecord(null, 'P-2002', 'Siti Aminah binti Hassan');

        MedicalRecord::query()->create([
            'patient_id' => $ownPatient->id,
            'examination_date' => today()->subDays(7),
            'examination_type' => ExaminationType::Berkala,
            'hemoglobin' => 11.1,
            'potassium' => 4.70,
        ]);
        MedicalRecord::query()->create([
            'patient_id' => $other->id,
            'examination_date' => today()->subDays(2),
            'examination_type' => ExaminationType::Khas,
            'hemoglobin' => 7.2,
            'potassium' => 6.40,
        ]);

        $this->actingAs($owner)
            ->get(route('patient.blood'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('pesakit/darah')
                ->has('records', 1)
                ->where('records.0.hemoglobin', '11.1')
                ->where('records.0.potassium_needs_attention', false)
                ->where('charts.hemoglobin.0.value', 11.1)
                ->where('months', 6)
            )
            ->assertDontSee('7.2')
            ->assertDontSee('wa.me');
    }

    public function test_nurse_stores_a_blood_record_and_rejects_an_empty_panel(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse', 'name' => 'Sister Siti']);
        $patient = $this->patientRecord();

        $this->actingAs($nurse)
            ->from(route('nurse.records.index'))
            ->post(route('nurse.records.store'), [
                'patient_id' => $patient->id,
                'examination_date' => today()->toDateString(),
                'examination_type' => ExaminationType::Berkala->value,
                'clinical_notes' => 'Tiada nilai',
            ])
            ->assertRedirect(route('nurse.records.index'))
            ->assertSessionHasErrors('hemoglobin');

        $this->assertDatabaseCount('medical_records', 0);

        $this->actingAs($nurse)
            ->post(route('nurse.records.store'), [
                'patient_id' => $patient->id,
                'examination_date' => today()->toDateString(),
                'examination_type' => ExaminationType::Berkala->value,
                'hemoglobin' => 10.4,
                'potassium' => 5.6,
                'clinical_notes' => 'Kalium tinggi.',
            ])
            ->assertRedirect(route('nurse.records.index', ['pesakit' => $patient->id]));

        $this->assertDatabaseHas('medical_records', [
            'patient_id' => $patient->id,
            'recorded_by' => $nurse->id,
            'hemoglobin' => 10.4,
            'potassium' => 5.60,
        ]);

        $this->actingAs($nurse)
            ->get(route('nurse.records.index', ['pesakit' => $patient->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('jururawat/darah')
                ->has('records', 1)
                ->where('records.0.potassium_needs_attention', true)
                ->where('records.0.recorded_by', 'Sister Siti')
            );
    }

    public function test_patient_sees_the_queue_number_before_the_chair(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse']);
        $owner = User::factory()->create(['role' => 'patient']);
        $session = $this->sessionFor($this->patientRecord($owner));

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.arrive', $session), ['pre_weight_kg' => 70])
            ->assertRedirect();

        $this->actingAs($owner)
            ->get(route('patient.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('todaySession.queue_label', '001')
                ->where('todaySession.queue_turn', 1)
                ->where('todaySession.queue_position', 1)
                ->where('todaySession.ahead_count', 0)
                ->where('todaySession.chair_visible', false)
                ->where('todaySession.chair_number', null)
            );

        $this->actingAs($nurse)->post(route('nurse.sessions.call', $session))->assertRedirect();

        $this->actingAs($owner)
            ->get(route('patient.session'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('todaySession.queue_label', '001')
                ->where('todaySession.queue_turn', 1)
                ->where('todaySession.queue_position', null)
                ->where('todaySession.chair_visible', true)
                ->where('todaySession.chair_number', 'A-01')
                ->where('todaySession.time_range', '6:00 pagi – 10:00 pagi')
            );
    }

    public function test_today_page_registers_the_named_patient_and_shows_their_place(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse']);
        $admin = User::factory()->create(['role' => 'admin']);
        $firstOwner = User::factory()->create(['role' => 'patient']);
        $secondOwner = User::factory()->create(['role' => 'patient']);
        $first = $this->sessionFor($this->patientRecord($firstOwner, 'P-1001', 'Pesakit Awal'));
        $second = $this->sessionFor($this->patientRecord($secondOwner, 'P-1002', 'Pesakit Kemudian'), 'A-02');

        $this->actingAs($nurse)
            ->get(route('nurse.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('jururawat/hari-ini')
                ->has('arrivals', 2)
                ->where('arrivals.0.can_register', true)
            );

        $this->actingAs($admin)
            ->from(route('nurse.home'))
            ->post(route('nurse.sessions.arrive', $first), [
                'pre_weight_kg' => 70.5,
                'pre_bp' => '130/80',
            ])
            ->assertRedirect(route('nurse.home'))
            ->assertSessionHas('status', fn (string $status): bool => str_contains($status, '001') && str_contains($status, 'ke-1'));

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.arrive', $second), ['pre_weight_kg' => 61])
            ->assertRedirect();

        $this->actingAs($secondOwner)
            ->get(route('patient.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('todaySession.queue_label', '002')
                ->where('todaySession.queue_turn', 2)
                ->where('todaySession.queue_position', 2)
                ->where('todaySession.ahead_count', 1)
                ->where('todaySession.pre_weight_kg', '61.00')
                ->where('todaySession.pre_bp', null)
            );

        $this->actingAs($firstOwner)
            ->get(route('patient.session'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('todaySession.queue_label', '001')
                ->where('todaySession.queue_position', 1)
                ->where('todaySession.pre_bp', '130/80')
            );
    }

    public function test_arrival_requires_weight_and_keeps_blood_pressure_optional(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse']);
        $session = $this->sessionFor($this->patientRecord());

        $this->actingAs($nurse)
            ->from(route('nurse.home'))
            ->post(route('nurse.sessions.arrive', $session), [])
            ->assertRedirect(route('nurse.home'))
            ->assertSessionHasErrors('pre_weight_kg');

        $this->assertSame(SessionStatus::BelumHadir, $session->refresh()->status);

        $this->actingAs($nurse)
            ->from(route('nurse.home'))
            ->post(route('nurse.sessions.arrive', $session), [
                'pre_weight_kg' => 64.5,
                'pre_bp' => 'tinggi',
            ])
            ->assertRedirect(route('nurse.home'))
            ->assertSessionHasErrors('pre_bp');

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.arrive', $session), ['pre_weight_kg' => 64.5])
            ->assertRedirect();

        $session->refresh();
        $this->assertSame('64.50', $session->pre_weight_kg);
        $this->assertNull($session->pre_bp);
        $this->assertSame(SessionStatus::Menunggu, $session->status);
    }

    public function test_the_next_chair_goes_to_whoever_arrived_first_unless_the_nurse_bypasses_it(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse']);
        $early = $this->sessionFor($this->patientRecord(null, 'P-1001', 'Pesakit Awal'));
        $later = $this->sessionFor($this->patientRecord(null, 'P-1002', 'Pesakit Kemudian'), 'A-02');
        $third = $this->sessionFor($this->patientRecord(null, 'P-1003', 'Pesakit Ketiga'), 'A-03');

        $this->actingAs($nurse)->post(route('nurse.sessions.arrive', $early), ['pre_weight_kg' => 60])->assertRedirect();
        $this->actingAs($nurse)->post(route('nurse.sessions.arrive', $later), ['pre_weight_kg' => 61])->assertRedirect();

        $this->actingAs($nurse)
            ->from(route('nurse.home'))
            ->post(route('nurse.sessions.call', $later))
            ->assertRedirect(route('nurse.home'))
            ->assertSessionHasErrors('status');

        $this->assertNull($later->refresh()->chair_number);

        $this->actingAs($nurse)
            ->post(route('nurse.chairs.block'), [
                'chair_number' => 'A-01',
                'reason' => 'ROSAK',
            ])
            ->assertRedirect();

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.call', $early))
            ->assertRedirect();

        $early->refresh();
        $this->assertSame('A-02', $early->chair_number);
        $this->assertSame(SessionStatus::SudahHadir, $early->status);

        $this->actingAs($nurse)
            ->from(route('nurse.home'))
            ->post(route('nurse.chairs.block'), [
                'chair_number' => 'A-02',
                'reason' => 'TIDAK_SESUAI',
            ])
            ->assertRedirect(route('nurse.home'))
            ->assertSessionHasErrors('chair_number');

        $this->actingAs($nurse)
            ->from(route('nurse.home'))
            ->post(route('nurse.sessions.call', $later), ['chair_number' => 'A-02'])
            ->assertRedirect(route('nurse.home'))
            ->assertSessionHasErrors('chair_number');

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.call', $later), ['chair_number' => 'A-05'])
            ->assertRedirect();

        $this->assertSame('A-05', $later->refresh()->chair_number);

        $this->actingAs($nurse)->post(route('nurse.sessions.arrive', $third), ['pre_weight_kg' => 62])->assertRedirect();

        $this->actingAs($nurse)
            ->from(route('nurse.home'))
            ->post(route('nurse.sessions.call', $third), ['chair_number' => 'A-01'])
            ->assertRedirect(route('nurse.home'))
            ->assertSessionHasErrors('chair_number');

        $this->actingAs($nurse)->post(route('nurse.sessions.start', $early))->assertRedirect();
        $this->actingAs($nurse)->post(route('nurse.sessions.complete', $early), [
            'post_weight_kg' => 58.4,
            'post_bp' => '120/80',
        ])->assertRedirect();

        $this->actingAs($nurse)->post(route('nurse.sessions.call', $third))->assertRedirect();
        $this->assertSame('A-02', $third->refresh()->chair_number);

        $this->actingAs($nurse)
            ->post(route('nurse.chairs.restore'), ['chair_number' => 'A-01'])
            ->assertRedirect();

        $fourth = $this->sessionFor($this->patientRecord(null, 'P-1004', 'Pesakit Keempat'), 'A-04');
        $this->actingAs($nurse)->post(route('nurse.sessions.arrive', $fourth), ['pre_weight_kg' => 63])->assertRedirect();
        $this->actingAs($nurse)->post(route('nurse.sessions.call', $fourth))->assertRedirect();
        $this->assertSame('A-01', $fourth->refresh()->chair_number);

        $this->actingAs($nurse)
            ->get(route('nurse.sessions'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('counts.kerusi_rosak', 0)
                ->where('chairs.0.number', 'A-01')
                ->where('chairs.0.state', 'digunakan')
            );
    }

    public function test_a_patient_cannot_mark_a_chair_out_of_service(): void
    {
        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($patient)
            ->post(route('nurse.chairs.block'), [
                'chair_number' => 'A-01',
                'reason' => 'ROSAK',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_change_a_patient_shift_and_today_session_follows(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $patient = $this->patientRecord();
        $session = $this->sessionFor($patient);

        $this->actingAs($admin)
            ->post(route('admin.patients.shift', $patient), ['preferred_shift' => ShiftSlot::Syif2->value])
            ->assertRedirect();

        $this->assertSame(ShiftSlot::Syif2, $patient->refresh()->preferred_shift);
        $this->assertSame(ShiftSlot::Syif2, $session->refresh()->shift);
        $this->assertSame('10:30', substr((string) $session->scheduled_time, 0, 5));
    }

    public function test_nurse_pages_stay_separate_and_share_today_counts_with_admin(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse']);
        $admin = User::factory()->create(['role' => 'admin']);
        $patientUser = User::factory()->create(['role' => 'patient']);
        $this->sessionFor($this->patientRecord());

        $this->actingAs($patientUser)->get(route('nurse.summary'))->assertForbidden();
        $this->actingAs($patientUser)->get(route('nurse.settings'))->assertForbidden();

        $this->actingAs($nurse)
            ->get(route('nurse.summary'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('jururawat/ringkasan')
                ->where('counts.total', 1)
                ->where('counts.belum', 1)
            );

        foreach ([
            'nurse.schedule' => 'jururawat/jadual',
            'nurse.patients' => 'jururawat/pesakit',
            'nurse.sessions' => 'jururawat/sesi',
            'nurse.settings' => 'jururawat/tetapan',
        ] as $name => $component) {
            $this->actingAs($nurse)->get(route($name))->assertOk()->assertInertia(fn (Assert $page) => $page->component($component));
        }

        $this->actingAs($admin)
            ->get(route('admin.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/papan')
                ->where('today.total', 1)
                ->where('today.belum', 1)
            );
    }

    public function test_nurse_board_includes_a_whatsapp_reminder_link(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse']);
        $this->sessionFor($this->patientRecord());

        $this->actingAs($nurse)
            ->get(route('nurse.sessions'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('jururawat/sesi')
                ->where('sessions.0.whatsapp_url', fn (string $url): bool => str_contains($url, 'https://wa.me/60123001001?text='))
            );
    }

    public function test_only_staff_can_record_blood_pressure_during_dialysis(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse']);
        $owner = User::factory()->create(['role' => 'patient']);
        $patient = $this->patientRecord($owner);
        $session = $this->sessionFor($patient);
        $session->update([
            'status' => SessionStatus::SedangDialisis,
            'started_at' => now(),
            'pre_weight_kg' => 64.2,
            'pre_bp' => '148/86',
        ]);

        $this->actingAs($owner)
            ->post(route('nurse.sessions.intra', $session), ['intra_bp' => '130/80'])
            ->assertForbidden();

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.intra', $session), ['intra_bp' => '130/80'])
            ->assertRedirect();

        $this->assertSame('130/80', $session->refresh()->intra_bp);

        $waiting = $this->sessionFor($patient, 'A-02');
        $this->actingAs($nurse)
            ->from(route('nurse.home'))
            ->post(route('nurse.sessions.intra', $waiting), ['intra_bp' => '120/70'])
            ->assertSessionHasErrors('status');
    }

    public function test_blood_page_can_compare_six_or_twenty_four_months(): void
    {
        $owner = User::factory()->create(['role' => 'patient']);
        $patient = $this->patientRecord($owner);

        MedicalRecord::query()->create([
            'patient_id' => $patient->id,
            'examination_date' => today()->subDays(7),
            'examination_type' => ExaminationType::Berkala,
            'hemoglobin' => 11.1,
        ]);
        MedicalRecord::query()->create([
            'patient_id' => $patient->id,
            'examination_date' => today()->subMonths(10),
            'examination_type' => ExaminationType::Berkala,
            'hemoglobin' => 8.1,
            'potassium' => 5.9,
        ]);

        $this->actingAs($owner)
            ->get(route('patient.blood', ['tempoh' => 6]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('records', 1)->where('months', 6))
            ->assertDontSee('8.1');

        $this->actingAs($owner)
            ->get(route('patient.blood', ['tempoh' => 24]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('records', 2)
                ->where('records.1.analysis.statuses.potassium', 'TINGGI')
            );
    }

    public function test_public_registration_is_stored_without_creating_a_login(): void
    {
        $this->travelTo('2026-10-16 08:00:00');

        $this->post(route('registrations.store'), [
            'full_name' => 'Ahmad Zulkifli',
            'ic_number' => '710303101123',
            'phone_number' => '012-3001999',
            'email' => 'ahmad@demo.test',
            'gender' => 'PEREMPUAN',
            'address' => 'No. 18, Jalan Rinching, Semenyih',
            'patient_category' => 'PESAKIT_BARU',
            'medical_notes' => 'Rujukan',
            'nok_name' => 'Farah Ahmad',
            'nok_relationship' => 'ANAK',
            'nok_phone' => '012-3001888',
        ])->assertRedirect(route('registrations.create'));

        $this->assertDatabaseHas('registrations', [
            'full_name' => 'Ahmad Zulkifli',
            'ic_number' => '710303-10-1123',
            'phone_number' => '0123001999',
            'gender' => 'LELAKI',
            'age_years' => 55,
            'age_months' => 7,
            'status' => 'BARU',
        ]);
        $this->assertDatabaseMissing('users', [
            'email' => 'ahmad@demo.test',
        ]);
        $this->assertGuest();
    }

    private function patientRecord(?User $user = null, string $code = 'P-1001', string $name = 'Tan Ah Kow'): Patient
    {
        return Patient::query()->create([
            'user_id' => $user?->id,
            'patient_id_code' => $code,
            'name' => $name,
            'ic_number' => '580101-10-1231',
            'gender' => 'LELAKI',
            'age' => 68,
            'phone' => '012-3001001',
            'dry_weight_kg' => 62.5,
            'vascular_access' => 'AVF',
            'access_location' => 'Lengan kiri',
            'sponsor' => 'PERKESO / SOCSO',
            'schedule_pattern' => SchedulePattern::IsninRabuJumaat,
            'preferred_shift' => ShiftSlot::Syif1,
            'allergies' => 'Tiada diketahui',
            'is_active' => true,
        ]);
    }

    private function sessionFor(Patient $patient, string $chair = 'A-01'): DialysisSession
    {
        return DialysisSession::query()->create([
            'patient_id' => $patient->id,
            'chair_number' => $chair,
            'scheduled_date' => today(),
            'scheduled_time' => '06:00',
            'shift' => ShiftSlot::Syif1,
            'status' => SessionStatus::BelumHadir,
        ]);
    }
}
