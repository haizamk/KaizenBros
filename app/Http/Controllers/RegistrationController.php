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
                ...$request->safe()->except(['ic_number', 'dokumen']),
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

        return redirect()->route('registrations.received', ['reference' => $registration->reference]);
    }

    public function received(string $reference): Response
    {
        abort_unless(preg_match('/^KB-REG-\d{6}$/', $reference) === 1, 404);

        $centre = config('kaizenbros.centre');
        $phone = preg_replace('/\D+/', '', (string) $centre['phone_main']) ?? '';
        $message = 'Salam, saya baru menghantar permohonan pesakit. Nombor rujukan saya ialah '.$reference.'.';

        return Inertia::render('daftar/selesai', [
            'reference' => $reference,
            'centreName' => $centre['name'],
            'address' => $centre['address'],
            'phoneLabel' => $centre['phone_main'],
            'email' => $centre['email'],
            'hours' => $centre['operating_hours'],
            'whatsappUrl' => 'https://wa.me/'.$centre['whatsapp_number'].'?text='.rawurlencode($message),
            'callUrl' => 'tel:'.$phone,
            'emailUrl' => 'mailto:'.$centre['email'].'?subject='.rawurlencode('Permohonan pesakit '.$reference),
        ]);
    }

    private function storeUploads(StoreRegistrationRequest $request, Registration $registration): void
    {
        foreach ($request->file('dokumen', []) as $file) {
            ClinicFiles::storePatientDocument($file, [
                'registration_id' => $registration->id,
                'category' => DocumentCategory::Lain,
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
