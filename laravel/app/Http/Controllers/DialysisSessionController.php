<?php

namespace App\Http\Controllers;

use App\Models\DialysisSession;
use App\Models\Patient;
use App\Models\VitalSign;
use App\Models\AuditLog;
use App\Models\Alert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DialysisSessionController extends Controller
{
    /**
     * Nurse Check-In: Records pre-dialysis weight & BP, starts session
     */
    public function checkIn(Request $request, $id)
    {
        $session = DialysisSession::with('patient')->findOrFail($id);

        $validated = $request->validate([
            'pre_weight_kg' => 'required|numeric|min:30|max:200',
            'systolic_bp' => 'required|integer|min:60|max:260',
            'diastolic_bp' => 'required|integer|min:30|max:160',
            'pulse_rate' => 'nullable|integer|min:30|max:180',
            'start_now' => 'nullable|boolean',
        ]);

        return DB::transaction(function () use ($session, $validated, $request) {
            $preBp = "{$validated['systolic_bp']}/{$validated['diastolic_bp']}";
            $dryWeight = $session->dry_weight_kg;
            $weightGain = max(0, $validated['pre_weight_kg'] - $dryWeight);
            $targetUf = round($weightGain + 0.3, 2); // 300ml rinseback allowance

            $session->pre_weight_kg = $validated['pre_weight_kg'];
            $session->pre_bp = $preBp;
            $session->current_bp = $preBp;
            $session->target_uf_litres = $targetUf;
            $session->nurse_in_charge = auth()->user()->name ?? 'Staff Nurse';

            if (!empty($validated['start_now'])) {
                $session->status = 'SEDANG_DIALISIS';
                $session->actual_start_time = now()->format('H:i:s');
            } else {
                $session->status = 'SUDAH_HADIR';
            }

            $session->save();

            // Log Pre-Dialysis Vital Sign
            VitalSign::create([
                'dialysis_session_id' => $session->id,
                'recorded_at' => now()->format('g:i A'),
                'phase' => 'PRE_DIALYSIS',
                'systolic_bp' => $validated['systolic_bp'],
                'diastolic_bp' => $validated['diastolic_bp'],
                'pulse_rate' => $validated['pulse_rate'] ?? 75,
                'nurse_name' => auth()->user()->name ?? 'Staff Nurse',
            ]);

            // Audit Log
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_name' => auth()->user()->name ?? 'Jururawat',
                'user_role' => auth()->user()->role?->name ?? 'STAFF_NURSE',
                'action' => 'CHECK_IN_PESAKIT',
                'entity_type' => 'dialysis_sessions',
                'entity_id' => $session->id,
                'details' => "Check-in pesakit {$session->patient->name} ({$session->patient->patient_id_code}) di stesen {$session->chair->chair_number}. Berat Sebelum: {$validated['pre_weight_kg']}kg, BP: {$preBp}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pesakit berjaya check-in & sesi dimulakan.',
                'session' => $session->fresh(['patient', 'vitalSigns']),
            ]);
        });
    }

    /**
     * Update intra-dialysis readings (hourly BP & machine telemetry)
     */
    public function recordHourlyVital(Request $request, $id)
    {
        $session = DialysisSession::findOrFail($id);

        $validated = $request->validate([
            'systolic_bp' => 'required|integer|min:60|max:260',
            'diastolic_bp' => 'required|integer|min:30|max:160',
            'pulse_rate' => 'required|integer|min:30|max:180',
            'uf_rate_ml_hr' => 'nullable|integer',
            'blood_flow_rate_qb' => 'nullable|integer',
            'venous_pressure' => 'nullable|integer',
        ]);

        $vital = VitalSign::create([
            'dialysis_session_id' => $session->id,
            'recorded_at' => now()->format('g:i A'),
            'phase' => 'HOURLY',
            'systolic_bp' => $validated['systolic_bp'],
            'diastolic_bp' => $validated['diastolic_bp'],
            'pulse_rate' => $validated['pulse_rate'],
            'uf_rate_ml_hr' => $validated['uf_rate_ml_hr'] ?? null,
            'blood_flow_rate_qb' => $validated['blood_flow_rate_qb'] ?? null,
            'venous_pressure' => $validated['venous_pressure'] ?? null,
            'nurse_name' => auth()->user()->name ?? 'Staff Nurse',
        ]);

        $session->current_bp = "{$validated['systolic_bp']}/{$validated['diastolic_bp']}";
        $session->save();

        return response()->json([
            'success' => true,
            'message' => 'Bacaan berkala berjaya direkodkan.',
            'vital' => $vital,
        ]);
    }

    /**
     * Add clinical note during dialysis
     */
    public function addNote(Request $request, $id)
    {
        $session = DialysisSession::findOrFail($id);

        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $timestamp = now()->format('H:i');
        $newNote = "[{$timestamp}] {$validated['notes']}";
        $session->notes = $session->notes ? ($session->notes . "\n" . $newNote) : $newNote;
        $session->save();

        AuditLog::create([
            'user_id' => auth()->id(),
            'user_name' => auth()->user()->name ?? 'Jururawat',
            'user_role' => auth()->user()->role?->name ?? 'STAFF_NURSE',
            'action' => 'TAMBAH_CATATAN_KLINIKAL',
            'entity_type' => 'dialysis_sessions',
            'entity_id' => $session->id,
            'details' => "Nota klinikal ditambah pada sesi {$session->session_code}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Catatan berjaya ditambah.',
            'notes' => $session->notes,
        ]);
    }

    /**
     * Finish dialysis session: records post weight & BP
     */
    public function finishSession(Request $request, $id)
    {
        $session = DialysisSession::with('patient')->findOrFail($id);

        $validated = $request->validate([
            'post_weight_kg' => 'required|numeric|min:30|max:200',
            'post_systolic_bp' => 'required|integer|min:60|max:260',
            'post_diastolic_bp' => 'required|integer|min:30|max:160',
            'notes' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($session, $validated, $request) {
            $postBp = "{$validated['post_systolic_bp']}/{$validated['post_diastolic_bp']}";
            $actualUf = $session->pre_weight_kg ? round($session->pre_weight_kg - $validated['post_weight_kg'], 2) : 0;

            $session->post_weight_kg = $validated['post_weight_kg'];
            $session->post_bp = $postBp;
            $session->actual_uf_litres = max(0, $actualUf);
            $session->actual_end_time = now()->format('H:i:s');
            $session->status = 'SUDAH_SELESAI';
            if (!empty($validated['notes'])) {
                $session->notes .= "\n[Tamat Sesi] " . $validated['notes'];
            }
            $session->save();

            // Update patient's latest records
            $session->patient->update([
                'latest_weight_kg' => $validated['post_weight_kg'],
                'latest_bp' => $postBp,
            ]);

            // Post-dialysis vital sign
            VitalSign::create([
                'dialysis_session_id' => $session->id,
                'recorded_at' => now()->format('g:i A'),
                'phase' => 'POST_DIALYSIS',
                'systolic_bp' => $validated['post_systolic_bp'],
                'diastolic_bp' => $validated['post_diastolic_bp'],
                'pulse_rate' => 72,
                'nurse_name' => auth()->user()->name ?? 'Staff Nurse',
            ]);

            // Resolve any open post-weight alert
            Alert::where('dialysis_session_id', $session->id)
                ->where('alert_type', 'POST_WEIGHT_MISSING')
                ->update(['is_resolved' => true, 'resolved_at' => now()]);

            // Audit Log
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_name' => auth()->user()->name ?? 'Jururawat',
                'user_role' => auth()->user()->role?->name ?? 'STAFF_NURSE',
                'action' => 'TAMATKAN_SESI_DIALISIS',
                'entity_type' => 'dialysis_sessions',
                'entity_id' => $session->id,
                'details' => "Sesi dialisis ditamatkan untuk {$session->patient->name}. Berat Selepas: {$validated['post_weight_kg']}kg, BP Selepas: {$postBp}, Jumlah Cecair Ditapis: {$actualUf}L",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Sesi dialisis berjaya ditamatkan.',
                'session' => $session->fresh(),
            ]);
        });
    }
}
