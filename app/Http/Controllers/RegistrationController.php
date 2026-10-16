<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRegistrationRequest;
use App\Models\Registration;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('daftar', [
            'centre' => config('kaizenbros.centre'),
        ]);
    }

    public function store(StoreRegistrationRequest $request): RedirectResponse
    {
        $registration = Registration::query()->create([
            ...$request->validated(),
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
