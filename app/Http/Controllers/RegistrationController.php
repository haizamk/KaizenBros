<?php

namespace App\Http\Controllers;

use App\Enums\DocumentCategory;
use App\Http\Requests\StoreRegistrationRequest;
use App\Models\Registration;
use App\Support\ClinicFiles;
use App\Support\MalaysianIdentityCard;
use App\Support\RegistrationOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
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

        $registration = DB::transaction(function () use ($request, $parsed): Registration {
            $registration = Registration::query()->create([
                ...$request->safe()->except(['ic_number', 'kad_pengenalan', 'surat_doktor', 'lain']),
                'ic_number' => $parsed['formatted'],
                'gender' => $parsed['gender'],
                'birth_date' => $parsed['birth_date'],
                'age_years' => $parsed['years'],
                'age_months' => $parsed['months'],
                'reference' => $this->nextReference(),
                'status' => 'BARU',
            ]);

            $this->storeUploads($request, $registration);

            return $registration;
        });

        return redirect()
            ->route('registrations.create')
            ->with('reference', $registration->reference);
    }

    private function storeUploads(StoreRegistrationRequest $request, Registration $registration): void
    {
        $files = [
            'kad_pengenalan' => DocumentCategory::KadPengenalan,
            'surat_doktor' => DocumentCategory::SuratDoktor,
            'lain' => DocumentCategory::Lain,
        ];

        foreach ($files as $field => $category) {
            if (! $request->hasFile($field)) {
                continue;
            }

            ClinicFiles::storePatientDocument($request->file($field), [
                'registration_id' => $registration->id,
                'category' => $category,
            ]);
        }
    }

    private function nextReference(): string
    {
        do {
            $reference = 'KB-REG-'.random_int(100000, 999999);
        } while (Registration::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
