<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRegistrationRequest;
use App\Models\Registration;
use App\Support\MalaysianIdentityCard;
use App\Support\RegistrationOptions;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('daftar', [
            'centre' => config('kaizenbros.centre'),
            'today' => today()->toDateString(),
            'categories' => RegistrationOptions::options(RegistrationOptions::categories()),
            'relationships' => RegistrationOptions::options(RegistrationOptions::relationships()),
        ]);
    }

    public function store(StoreRegistrationRequest $request): RedirectResponse
    {
        $parsed = MalaysianIdentityCard::parse($request->string('ic_number')->toString());

        $registration = Registration::query()->create([
            ...$request->safe()->except(['ic_number']),
            'ic_number' => $parsed['formatted'],
            'gender' => $parsed['gender'],
            'birth_date' => $parsed['birth_date'],
            'age_years' => $parsed['years'],
            'age_months' => $parsed['months'],
            'reference' => $this->nextReference(),
            'status' => 'BARU',
        ]);

        return redirect()
            ->route('registrations.create')
            ->with('reference', $registration->reference);
    }

    private function nextReference(): string
    {
        do {
            $reference = 'KB-REG-'.random_int(100000, 999999);
        } while (Registration::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
