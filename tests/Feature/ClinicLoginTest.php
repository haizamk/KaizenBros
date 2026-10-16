<?php

namespace Tests\Feature;

use App\Enums\SchedulePattern;
use App\Enums\ShiftSlot;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ClinicLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_nurse_can_sign_in_with_phone_or_identity_card_after_saving_them(): void
    {
        $nurse = User::factory()->create([
            'role' => 'nurse',
            'email' => 'nurse@kaizenbros.com.my',
            'phone' => null,
            'ic_number' => null,
        ]);

        $this->actingAs($nurse)
            ->post(route('nurse.identity.update'), [
                'phone' => '019-388 9922',
                'ic_number' => '710303101123',
            ])
            ->assertRedirect();

        $nurse->refresh();
        $this->assertSame('0193889922', $nurse->phone);
        $this->assertSame('710303-10-1123', $nurse->ic_number);

        auth()->logout();

        $this->post(route('login.store'), [
            'email' => '0193889922',
            'password' => 'password',
        ])->assertRedirect(route('dashboard', absolute: false));

        auth()->logout();

        $this->post(route('login.store'), [
            'email' => '710303-10-1123',
            'password' => 'password',
        ])->assertRedirect(route('dashboard', absolute: false));

        auth()->logout();

        $this->post(route('login.store'), [
            'email' => 'nurse@kaizenbros.com.my',
            'password' => 'password',
        ])->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_clearing_patients_keeps_nurse_and_admin_accounts(): void
    {
        Storage::fake('medical_reports');
        Storage::fake('patient_documents');
        Storage::disk('medical_reports')->put('pesakit/1/laporan.pdf', 'laporan');
        Storage::disk('patient_documents')->put('permohonan/1/kad.pdf', 'kad');

        $nurse = User::factory()->create(['role' => 'nurse', 'email' => 'nurse@kaizenbros.com.my']);
        $admin = User::factory()->create(['role' => 'admin', 'email' => 'admin@kaizenbros.com.my']);
        $owner = User::factory()->create(['role' => 'patient', 'email' => 'pesakit@demo.test']);

        Patient::query()->create([
            'user_id' => $owner->id,
            'patient_id_code' => 'P-1001',
            'name' => 'Tan Ah Kow',
            'ic_number' => '580101-10-1231',
            'gender' => 'LELAKI',
            'age' => 68,
            'phone' => '0123001001',
            'dry_weight_kg' => 62.5,
            'vascular_access' => 'AVF',
            'access_location' => 'Lengan kiri',
            'sponsor' => 'PERKESO / SOCSO',
            'schedule_pattern' => SchedulePattern::IsninRabuJumaat,
            'preferred_shift' => ShiftSlot::Syif1,
            'is_active' => true,
        ]);

        $this->artisan('clinic:clear-patients', ['--force' => true])->assertSuccessful();

        $this->assertDatabaseCount('patients', 0);
        $this->assertDatabaseCount('registrations', 0);
        $this->assertDatabaseHas('users', ['id' => $nurse->id, 'role' => 'nurse']);
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);
        $this->assertDatabaseMissing('users', ['id' => $owner->id]);
        Storage::disk('medical_reports')->assertMissing('pesakit/1/laporan.pdf');
        Storage::disk('patient_documents')->assertMissing('permohonan/1/kad.pdf');
    }
}
