<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FrontpageTest extends TestCase
{
    use RefreshDatabase;

    public function test_frontpage_includes_the_semenyih_google_map(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertSee('class="dark"', false)
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('centre.map.embed_url', 'https://maps.google.com/maps?q=2.92592,101.86000+(Pusat+Dialisis+KaizenBros)&z=19&output=embed')
                ->where('centre.map.google_url', 'https://maps.google.com/?q=2.92592,101.86000')
                ->where('centre.map.waze_url', 'https://waze.com/ul?ll=2.92592,101.86000&navigate=yes')
                ->where('centre.name', 'Pusat Dialisis KaizenBros Semenyih')
            );
    }

    public function test_light_appearance_cookie_removes_the_dark_page_class(): void
    {
        $this->withUnencryptedCookie('appearance', 'light')
            ->get(route('home'))
            ->assertOk()
            ->assertDontSee('class="dark"', false);
    }
}
