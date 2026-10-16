<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNurseApplicationRequest;
use App\Models\NurseApplication;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    public function patients(): Response
    {
        return Inertia::render('promosi/pesakit-baru');
    }

    public function transport(): Response
    {
        return Inertia::render('promosi/pengangkutan');
    }

    public function nurses(): Response
    {
        return Inertia::render('promosi/jururawat');
    }

    public function storeNurse(StoreNurseApplicationRequest $request): RedirectResponse
    {
        $application = NurseApplication::query()->create([
            ...$request->validated(),
            'reference' => $this->nextReference(),
            'status' => 'BARU',
        ]);

        return redirect()
            ->route('promotions.nurses')
            ->with('nurse_reference', $application->reference);
    }

    private function nextReference(): string
    {
        do {
            $reference = 'KB-STAF-'.random_int(100000, 999999);
        } while (NurseApplication::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
