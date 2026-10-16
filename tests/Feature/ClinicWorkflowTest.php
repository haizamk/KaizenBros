<?php

namespace Tests\Feature;

use App\Enums\SchedulePattern;
use App\Enums\SessionStatus;
use App\Enums\ShiftSlot;
use App\Models\DialysisSession;
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
        $this->actingAs($patient)->get(route('admin.home'))->assertForbidden();
    }

    public function test_nurse_moves_a_session_from_arrival_to_completion(): void
    {
        $nurse = User::factory()->create(['role' => 'nurse']);
        $session = $this->sessionFor($this->patientRecord());

        $this->actingAs($nurse)
            ->post(route('nurse.sessions.check-in', $session), [
                'pre_weight_kg' => 65.4,
                'pre_bp' => '140/90',
            ])
            ->assertRedirect();

        $this->assertSame(SessionStatus::SudahHadir, $session->refresh()->status);

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
                ->has('sessions', 1)
            )
            ->assertDontSee('Siti Aminah binti Hassan');
    }

    public function test_public_registration_is_stored_without_creating_a_login(): void
    {
        $this->post(route('registrations.store'), [
            'full_name' => 'Ahmad Zulkifli',
            'ic_number' => '710303-10-1123',
            'phone_number' => '012-3001999',
            'email' => 'ahmad@demo.test',
            'gender' => 'LELAKI',
            'address' => 'Semenyih',
            'medical_notes' => 'Rujukan',
            'nok_name' => 'Farah',
            'nok_phone' => '012-3001888',
        ])->assertRedirect(route('registrations.create'));

        $this->assertDatabaseHas('registrations', [
            'full_name' => 'Ahmad Zulkifli',
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
