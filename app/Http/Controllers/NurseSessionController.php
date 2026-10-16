<?php

namespace App\Http\Controllers;

use App\Http\Requests\ArriveSessionRequest;
use App\Http\Requests\BlockChairRequest;
use App\Http\Requests\CallSessionRequest;
use App\Http\Requests\CheckInSessionRequest;
use App\Http\Requests\CompleteSessionRequest;
use App\Http\Requests\RecordIntraBpRequest;
use App\Http\Requests\RestoreChairRequest;
use App\Models\DialysisSession;
use App\Models\User;
use App\Services\DialysisSessionWorkflow;
use App\Support\ChairBoard;
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
            'chairs' => ChairBoard::tiles(),
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

    public function arrive(ArriveSessionRequest $request, DialysisSession $session): RedirectResponse
    {
        DB::transaction(function () use ($request, $session): void {
            $locked = $this->lock($session);
            $this->workflow->arrive(
                $locked,
                $request->user(),
                (float) $request->validated('pre_weight_kg'),
                $this->optionalBp($request->validated('pre_bp')),
            );
        });

        return back()->with('status', 'Pesakit didaftarkan di kaunter. Berat badan disimpan.');
    }

    public function call(CallSessionRequest $request, DialysisSession $session): RedirectResponse
    {
        DB::transaction(function () use ($request, $session): void {
            $locked = $this->lock($session);
            $this->workflow->call($locked, $request->user(), $request->validated('chair_number'));
        });

        $session->refresh();

        return back()->with('status', "Giliran dipanggil ke kerusi {$session->chair_number}.");
    }

    public function blockChair(BlockChairRequest $request): RedirectResponse
    {
        $chair = (string) $request->validated('chair_number');
        $reason = $request->validated('reason') === 'TIDAK_SESUAI' ? 'tidak sesuai' : 'rosak';

        DB::transaction(function () use ($request): void {
            $this->workflow->blockChair(
                (string) $request->validated('chair_number'),
                (string) $request->validated('reason'),
                $request->user(),
            );
        });

        return back()->with('status', "Kerusi {$chair} ditanda {$reason} dan tidak akan dipilih secara automatik.");
    }

    public function restoreChair(RestoreChairRequest $request): RedirectResponse
    {
        $chair = (string) $request->validated('chair_number');

        DB::transaction(function () use ($chair): void {
            $this->workflow->restoreChair($chair);
        });

        return back()->with('status', "Kerusi {$chair} dipulihkan dan boleh digunakan semula.");
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
                $this->optionalBp($request->validated('pre_bp')),
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

    private function optionalBp(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return $value;
    }
}
