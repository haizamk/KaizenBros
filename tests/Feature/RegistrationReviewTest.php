<?php

namespace Tests\Feature;

use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_invalid_identity_card_and_missing_guardian_are_rejected(): void
    {
        $this->travelTo('2026-10-16 08:00:00');

        $this->from(route('registrations.create'))
            ->post(route('registrations.store'), [
                'full_name' => 'Ahmad Zulkifli',
                'ic_number' => '710230-10-1123',
                'phone_number' => '12345',
                'address' => 'Pendek',
                'patient_category' => 'PESAKIT_BARU',
                'nok_name' => '',
                'nok_relationship' => 'ANAK',
                'nok_phone' => '',
            ])
            ->assertRedirect(route('registrations.create'))
            ->assertSessionHasErrors(['ic_number', 'phone_number', 'address', 'nok_name', 'nok_phone']);

        $this->assertDatabaseCount('registrations', 0);
    }

    public function test_even_identity_card_digit_is_stored_as_female(): void
    {
        $this->travelTo('2026-10-16 08:00:00');

        $this->post(route('registrations.store'), $this->payload('900615-08-2468'))
            ->assertRedirect(route('registrations.create'));

        $registration = Registration::query()->firstOrFail();
        $this->assertSame('900615-08-2468', $registration->ic_number);
        $this->assertSame('PEREMPUAN', $registration->gender);
        $this->assertSame(36, $registration->age_years);
        $this->assertSame(4, $registration->age_months);
        $this->assertSame('1990-06-15', $registration->birth_date?->toDateString());
        $this->assertDatabaseMissing('users', [
            'email' => 'pesakit@demo.test',
        ]);
    }

    public function test_admin_approves_a_registration_without_opening_a_portal_account(): void
    {
        $this->travelTo('2026-10-16 08:00:00');
        $admin = User::factory()->create(['role' => 'admin']);
        $patient = User::factory()->create(['role' => 'patient']);

        $this->post(route('registrations.store'), $this->payload('580101-10-1231'));
        $registration = Registration::query()->firstOrFail();

        $this->actingAs($patient)
            ->post(route('admin.registrations.approve', $registration))
            ->assertForbidden();

        $this->actingAs($admin)
            ->post(route('admin.registrations.approve', $registration))
            ->assertRedirect();

        $registration->refresh();
        $this->assertSame('DILULUSKAN', $registration->status);
        $this->assertSame($admin->id, $registration->reviewed_by);
        $this->assertDatabaseMissing('users', [
            'email' => 'pesakit@demo.test',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('registrations.0.status_label', 'Diluluskan')
                ->where('registrations.0.age_label', '68 tahun 9 bulan')
                ->where('registrations.0.can_review', false)
            );

        $this->actingAs($admin)
            ->from(route('admin.home'))
            ->post(route('admin.registrations.reject', $registration))
            ->assertRedirect(route('admin.home'))
            ->assertSessionHasErrors('status');
    }

    /**
     * @return array<string, string>
     */
    private function payload(string $ic): array
    {
        return [
            'full_name' => 'Siti Aminah',
            'ic_number' => $ic,
            'phone_number' => '+60123001999',
            'email' => 'pesakit@demo.test',
            'address' => 'No. 27, Jalan 5/10, Semenyih',
            'patient_category' => 'PINDAH_PUSAT',
            'nok_name' => 'Aminah Hassan',
            'nok_relationship' => 'IBU_BAPA',
            'nok_phone' => '011-23456789',
        ];
    }
}
