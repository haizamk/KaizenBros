<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckInSessionRequest;
use App\Http\Requests\CompleteSessionRequest;
use App\Http\Requests\RecordIntraBpRequest;
use App\Models\DialysisSession;
use App\Services\DialysisSessionWorkflow;
use App\Support\MalayDate;
use App\Support\WhatsAppLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class NurseSessionController extends Controller
{
    public function __construct(private readonly DialysisSessionWorkflow $workflow) {}

    public function index(): Response
    {
        $sessions = DialysisSession::query()
            ->with(['patient', 'nurse'])
            ->whereDate('scheduled_date', today())
            ->orderBy('scheduled_time')
            ->orderBy('chair_number')
            ->get()
            ->map(function (DialysisSession $session): array {
                $data = $session->toPortalArray();
                $data['whatsapp_url'] = WhatsAppLink::sessionReminder(
                    $session->patient->phone,
                    $session->patient->name,
                    $session->scheduled_date->format('d/m/Y'),
                    $session->scheduled_time,
                    $session->chair_number,
                );

                return $data;
            })
            ->values();

        return Inertia::render('jururawat/hari-ini', [
            'sessions' => $sessions,
            'today' => $this->malayDate(),
        ]);
    }

    private function malayDate(): string
    {
        return MalayDate::long(today());
    }

    public function recordDuring(RecordIntraBpRequest $request, DialysisSession $session): RedirectResponse
    {
        DB::transaction(function () use ($request, $session): void {
            $locked = $this->lock($session);
            $this->workflow->recordDuring($locked, $request->user(), (string) $request->validated('intra_bp'));
        });

        return back()->with('status', 'Tekanan darah semasa disimpan.');
    }

    public function checkIn(CheckInSessionRequest $request, DialysisSession $session): RedirectResponse
    {
        DB::transaction(function () use ($request, $session): void {
            $locked = $this->lock($session);
            $this->workflow->checkIn(
                $locked,
                $request->user(),
                (float) $request->validated('pre_weight_kg'),
                (string) $request->validated('pre_bp'),
            );
        });

        return back();
    }

    public function start(Request $request, DialysisSession $session): RedirectResponse
    {
        DB::transaction(function () use ($request, $session): void {
            $locked = $this->lock($session);
            $this->workflow->start($locked, $request->user());
        });

        return back();
    }

    public function complete(CompleteSessionRequest $request, DialysisSession $session): RedirectResponse
    {
        DB::transaction(function () use ($request, $session): void {
            $locked = $this->lock($session);
            $this->workflow->complete(
                $locked,
                $request->user(),
                (float) $request->validated('post_weight_kg'),
                (string) $request->validated('post_bp'),
                $request->validated('nurse_notes'),
            );
        });

        return back();
    }

    private function lock(DialysisSession $session): DialysisSession
    {
        return DialysisSession::query()->lockForUpdate()->findOrFail($session->id);
    }
}
