<?php

namespace App\Http\Controllers;

use App\Enums\SessionStatus;
use App\Models\DialysisSession;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\PatientDocument;
use App\Models\PatientMedication;
use App\Support\BloodReportAnalysis;
use App\Support\ClinicCharts;
use App\Support\LabCatalog;
use App\Support\MalayDate;
use App\Support\TreatmentCalendar;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class PatientPortalController extends Controller
{
    public function index(Request $request): Response
    {
        $patient = $this->patient($request);

        return Inertia::render('pesakit/papan', [
            'patient' => $patient?->toPortalArray(),
            'todaySession' => $this->todaySession($patient),
            'nextVisit' => $patient === null ? null : TreatmentCalendar::upcoming($patient, 1)[0] ?? null,
            'medicationCount' => $patient === null ? 0 : $patient->medications()->where('is_active', true)->count(),
            'todayLabel' => MalayDate::long(today()),
        ]);
    }

    public function session(Request $request): Response
    {
        $patient = $this->patient($request);

        return Inertia::render('pesakit/sesi', [
            'patient' => $patient?->toPortalArray(),
            'todaySession' => $this->todaySession($patient),
            'todayLabel' => MalayDate::long(today()),
        ]);
    }

    public function schedule(Request $request): Response
    {
        $patient = $this->patient($request);
        $past = $patient === null
            ? collect()
            : $this->sessions($patient)
                ->filter(fn (DialysisSession $session): bool => $session->scheduled_date->lt(today()))
                ->sortByDesc(fn (DialysisSession $session): string => $session->scheduled_date->toDateString())
                ->take(8)
                ->map(fn (DialysisSession $session): array => $this->sessionCard($session))
                ->values();

        return Inertia::render('pesakit/jadual', [
            'patient' => $patient?->toPortalArray(),
            'upcoming' => $patient === null ? [] : TreatmentCalendar::upcoming($patient),
            'past' => $past,
            'todayLabel' => MalayDate::long(today()),
        ]);
    }

    public function medications(Request $request): Response
    {
        $patient = $this->patient($request);
        $medications = $patient === null
            ? collect()
            : PatientMedication::query()
                ->where('patient_id', $patient->id)
                ->where('is_active', true)
                ->orderBy('medication_name')
                ->get()
                ->map(fn (PatientMedication $medication): array => $medication->toPortalArray())
                ->values();

        return Inertia::render('pesakit/ubat', [
            'patient' => $patient?->toPortalArray(),
            'medications' => $medications,
        ]);
    }

    public function blood(Request $request): Response
    {
        $patient = $this->patient($request);
        $months = $this->bloodMonths($request);
        $records = $patient === null ? collect() : $this->records($patient);
        $visible = $months === 0
            ? $records
            : $records->filter(fn (MedicalRecord $record): bool => $record->examination_date->toDateString() >= today()->subMonths($months)->toDateString());
        $presented = BloodReportAnalysis::present($visible)->values();
        $charts = [];

        foreach (array_keys(LabCatalog::fields()) as $field) {
            $charts[$field] = ClinicCharts::lab($visible, $field, 'd/m/y');
        }

        return Inertia::render('pesakit/darah', [
            'patient' => $patient?->toPortalArray(),
            'months' => $months,
            'periodLabel' => $months === 0 ? 'sepanjang masa' : $months.' bulan',
            'records' => $presented,
            'documents' => $this->documents($patient),
            'charts' => $charts,
            'chartSeries' => LabCatalog::chartSeries(),
        ]);
    }

    public function weights(Request $request): Response
    {
        return $this->measurementPage($request, 'pesakit/timbang');
    }

    public function history(Request $request): Response
    {
        return $this->measurementPage($request, 'pesakit/rekod');
    }

    private function measurementPage(Request $request, string $component): Response
    {
        $patient = $this->patient($request);
        $months = $this->months($request);
        $from = today()->subMonths($months);
        $sessions = $patient === null
            ? collect()
            : $this->sessions($patient)->filter(fn (DialysisSession $session): bool => $session->scheduled_date->gte($from));
        $pre = ClinicCharts::weight($sessions, 'd/m/y');
        $format = 'd/m/y';

        return Inertia::render($component, [
            'patient' => $patient?->toPortalArray(),
            'months' => $months,
            'sessions' => $sessions
                ->sortByDesc(fn (DialysisSession $session): string => $session->scheduled_date->toDateString().$session->scheduled_time)
                ->map(fn (DialysisSession $session): array => $this->sessionCard($session))
                ->values(),
            'charts' => [
                'preWeight' => $pre,
                'postWeight' => ClinicCharts::postWeight($sessions, $format),
                'dryWeight' => $patient === null ? [] : ClinicCharts::constant($pre, (float) $patient->dry_weight_kg),
                'preSystolic' => ClinicCharts::pressure($sessions, 'pre_bp', 1, $format),
                'intraSystolic' => ClinicCharts::pressure($sessions, 'intra_bp', 1, $format),
                'postSystolic' => ClinicCharts::pressure($sessions, 'post_bp', 1, $format),
                'preDiastolic' => ClinicCharts::pressure($sessions, 'pre_bp', 2, $format),
                'intraDiastolic' => ClinicCharts::pressure($sessions, 'intra_bp', 2, $format),
                'postDiastolic' => ClinicCharts::pressure($sessions, 'post_bp', 2, $format),
            ],
        ]);
    }

    private function patient(Request $request): ?Patient
    {
        return $request->user()->patient;
    }

    /**
     * @return Collection<int, DialysisSession>
     */
    private function sessions(Patient $patient): Collection
    {
        return DialysisSession::query()
            ->where('patient_id', $patient->id)
            ->orderBy('scheduled_date')
            ->get();
    }

    /**
     * @return Collection<int, MedicalRecord>
     */
    private function records(Patient $patient): Collection
    {
        return MedicalRecord::query()
            ->with(['patient', 'recorder', 'nephrologist', 'report'])
            ->where('patient_id', $patient->id)
            ->orderBy('examination_date')
            ->get();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function documents(?Patient $patient): Collection
    {
        if ($patient === null) {
            return collect();
        }

        return PatientDocument::query()
            ->where('patient_id', $patient->id)
            ->latest()
            ->get()
            ->map(fn (PatientDocument $document): array => $document->toPortalArray())
            ->values();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function todaySession(?Patient $patient): ?array
    {
        if ($patient === null) {
            return null;
        }

        $session = DialysisSession::query()
            ->where('patient_id', $patient->id)
            ->whereDate('scheduled_date', today())
            ->orderBy('scheduled_time')
            ->first();

        return $session === null ? null : $this->sessionCard($session);
    }

    /**
     * @return array<string, mixed>
     */
    private function sessionCard(DialysisSession $session): array
    {
        $chairVisible = $session->chair_number !== null && $session->called_at !== null;
        $place = $this->queuePlace($session);

        return [
            'id' => $session->id,
            'scheduled_date' => $session->scheduled_date->toDateString(),
            'date_label' => MalayDate::long($session->scheduled_date),
            'scheduled_time' => substr((string) $session->scheduled_time, 0, 5),
            'queue_label' => $session->queue_number === null ? null : str_pad((string) $session->queue_number, 3, '0', STR_PAD_LEFT),
            'queue_turn' => $place['queue_turn'],
            'queue_position' => $place['queue_position'],
            'ahead_count' => $place['ahead_count'],
            'chair_number' => $chairVisible ? $session->chair_number : null,
            'chair_visible' => $chairVisible,
            'status' => $session->status->value,
            'status_label' => $this->statusHeadline($session, $place),
            'shift_label' => $session->shift->label(),
            'time_range' => $session->shift->timeRange(),
            'pre_weight_kg' => $session->pre_weight_kg,
            'post_weight_kg' => $session->post_weight_kg,
            'pre_bp' => $session->pre_bp,
            'intra_bp' => $session->intra_bp,
            'post_bp' => $session->post_bp,
            'started_at' => $session->started_at?->toIso8601String(),
            'completed_at' => $session->completed_at?->toIso8601String(),
        ];
    }

    /**
     * @param  array{queue_turn: int|null, queue_position: int|null, ahead_count: int|null}  $place
     */
    private function statusHeadline(DialysisSession $session, array $place): string
    {
        if (! $session->scheduled_date->isToday() && $session->status === SessionStatus::SudahSelesai) {
            return 'Selesai';
        }

        $number = $session->queue_number === null ? null : str_pad((string) $session->queue_number, 3, '0', STR_PAD_LEFT);

        return match ($session->status) {
            SessionStatus::BelumHadir => 'Belum tiba di klinik. Sila ke kaunter untuk daftar ketibaan.',
            SessionStatus::Menunggu => $session->chair_number === null
                ? "Nombor giliran {$number} sudah didaftarkan. Anda giliran ke-{$place['queue_turn']} hari ini, dan kini ke-{$place['queue_position']} dalam barisan menunggu. {$this->aheadSentence($place['ahead_count'])}"
                : "Nombor giliran {$number} dipanggil. Anda giliran ke-{$place['queue_turn']} hari ini. Sila ke kerusi {$session->chair_number}.",
            SessionStatus::SudahHadir => "Sudah berada di kerusi. Nombor giliran {$number}, giliran ke-{$place['queue_turn']} hari ini.",
            SessionStatus::SedangDialisis => "Sedang menjalani dialisis. Nombor giliran {$number}, giliran ke-{$place['queue_turn']} hari ini.",
            SessionStatus::SudahSelesai => $number === null
                ? 'Rawatan hari ini telah selesai.'
                : "Rawatan hari ini telah selesai. Nombor giliran {$number}, giliran ke-{$place['queue_turn']} hari ini.",
        };
    }

    /**
     * @return array{queue_turn: int|null, queue_position: int|null, ahead_count: int|null}
     */
    private function queuePlace(DialysisSession $session): array
    {
        if ($session->queue_number === null) {
            return [
                'queue_turn' => null,
                'queue_position' => null,
                'ahead_count' => null,
            ];
        }

        if ($session->status !== SessionStatus::Menunggu || $session->chair_number !== null) {
            return [
                'queue_turn' => $session->queue_number,
                'queue_position' => null,
                'ahead_count' => null,
            ];
        }

        $ahead = DialysisSession::query()
            ->whereDate('scheduled_date', $session->scheduled_date)
            ->where('status', SessionStatus::Menunggu)
            ->whereNull('chair_number')
            ->where('queue_number', '<', $session->queue_number)
            ->count();

        return [
            'queue_turn' => $session->queue_number,
            'queue_position' => $ahead + 1,
            'ahead_count' => $ahead,
        ];
    }

    private function aheadSentence(?int $ahead): string
    {
        if ($ahead === null || $ahead === 0) {
            return 'Tiada pesakit di hadapan anda.';
        }

        if ($ahead === 1) {
            return 'Seorang pesakit di hadapan anda.';
        }

        return "{$ahead} pesakit di hadapan anda.";
    }

    private function bloodMonths(Request $request): int
    {
        if ($request->query('tempoh') === 'semua') {
            return 0;
        }

        return $this->months($request);
    }

    private function months(Request $request): int
    {
        $months = $request->integer('tempoh');

        return in_array($months, [6, 12, 24], true) ? $months : 6;
    }
}
