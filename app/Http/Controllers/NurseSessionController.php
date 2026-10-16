<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckInSessionRequest;
use App\Http\Requests\CompleteSessionRequest;
use App\Http\Requests\RecordIntraBpRequest;
use App\Models\DialysisSession;
use App\Models\User;
use App\Services\DialysisSessionWorkflow;
use App\Support\NurseBoard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class NurseSessionController extends Controller
{
    public function __construct(private readonly DialysisSessionWorkflow $workflow) {}

    public function index(Request $request): Response
    {
        $sessions = NurseBoard::todaySessions();
        $counts = NurseBoard::counts($sessions);

        return Inertia::render('jururawat/hari-ini', [
            'sessions' => $sessions,
            'counts' => $counts,
            'today' => $counts['date_label'],
            'nurseName' => $request->user()->name,
        ]);
    }

    public function summary(): Response
    {
        $sessions = NurseBoard::todaySessions();

        return Inertia::render('jururawat/ringkasan', [
            'sessions' => $sessions,
            'counts' => NurseBoard::counts($sessions),
        ]);
    }

    public function schedule(): Response
    {
        return Inertia::render('jururawat/jadual', [
            'patients' => NurseBoard::schedule(),
        ]);
    }

    public function patients(): Response
    {
        return Inertia::render('jururawat/pesakit', [
            'patients' => NurseBoard::patients(),
        ]);
    }

    public function sessions(Request $request): Response
    {
        $sessions = NurseBoard::todaySessions();

        return Inertia::render('jururawat/sesi', [
            'sessions' => $sessions,
            'counts' => NurseBoard::counts($sessions),
            'focus' => $request->integer('fokus') ?: null,
            'status' => session('status'),
        ]);
    }

    public function settings(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('jururawat/tetapan', [
            'nurseName' => $user->name,
            'role' => $user->role->label(),
            'centre' => config('kaizenbros.centre'),
        ]);
    }

    public function arrive(Request $request, DialysisSession $session): RedirectResponse
    {
        DB::transaction(function () use ($request, $session): void {
            $locked = $this->lock($session);
            $this->workflow->arrive($locked, $request->user());
        });

        return back()->with('status', 'Pesakit didaftarkan di kaunter.');
    }

    public function call(Request $request, DialysisSession $session): RedirectResponse
    {
        DB::transaction(function () use ($request, $session): void {
            $locked = $this->lock($session);
            $this->workflow->call($locked, $request->user());
        });

        return back()->with('status', 'Nombor giliran dipanggil ke kerusi kosong.');
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
