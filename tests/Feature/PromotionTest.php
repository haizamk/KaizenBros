<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PromotionTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotion_pages_are_public(): void
    {
        $this->get(route('promotions.patients'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('promosi/pesakit-baru'));

        $this->get(route('promotions.transport'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('promosi/pengangkutan'));

        $this->get(route('promotions.nurses'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('promosi/jururawat'));
    }

    public function test_nurse_application_is_stored_without_creating_a_login(): void
    {
        $this->post(route('promotions.nurses.store'), [
            'full_name' => 'Nur Aisyah binti Rahman',
            'ic_number' => '900101-10-1234',
            'phone_number' => '012-3001777',
            'email' => 'aisyah@demo.kaizenbros.my',
            'nursing_board_no' => 'RN-44120',
            'years_experience' => 6,
            'preferred_shift' => 'PAGI',
            'notes' => 'Berpengalaman unit dialisis.',
        ])->assertRedirect(route('promotions.nurses'));

        $this->assertDatabaseHas('nurse_applications', [
            'full_name' => 'Nur Aisyah binti Rahman',
            'nursing_board_no' => 'RN-44120',
            'status' => 'BARU',
        ]);
        $this->assertDatabaseMissing('users', [
            'email' => 'aisyah@demo.kaizenbros.my',
        ]);
        $this->assertGuest();
    }

    public function test_nurse_application_requires_a_name(): void
    {
        $this->from(route('promotions.nurses'))
            ->post(route('promotions.nurses.store'), [
                'full_name' => '',
                'ic_number' => '900101-10-1234',
                'phone_number' => '012-3001777',
                'nursing_board_no' => 'RN-44120',
                'preferred_shift' => 'PAGI',
            ])
            ->assertRedirect(route('promotions.nurses'))
            ->assertSessionHasErrors('full_name');

        $this->assertDatabaseCount('nurse_applications', 0);
    }

    public function test_admin_can_see_a_nurse_application(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->post(route('promotions.nurses.store'), [
            'full_name' => 'Nur Aisyah binti Rahman',
            'ic_number' => '900101-10-1234',
            'phone_number' => '012-3001777',
            'nursing_board_no' => 'RN-44120',
            'preferred_shift' => 'PETANG',
        ])->assertRedirect();

        $this->actingAs($admin)
            ->get(route('admin.home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/papan')
                ->has('nurseApplications', 1)
                ->where('nurseApplications.0.full_name', 'Nur Aisyah binti Rahman')
            );
    }
}
