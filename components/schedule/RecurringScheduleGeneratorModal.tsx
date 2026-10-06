'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Check, 
  X, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  ChevronRight,
  Info,
  CalendarDays,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Patient, DialysisSession, ShiftSlot, SchedulePattern } from '@/types';
import { INITIAL_CHAIRS } from '@/lib/mock-data';
import { PATIENT_SHIFTS_CONFIG, normalizePatientShift } from './TreatmentScheduleManager';
import { getMalaysiaDate } from '@/lib/malaysia-time';

interface RecurringScheduleGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  existingSessions: DialysisSession[];
  onGenerateBatch: (newSessions: Omit<DialysisSession, 'id'>[]) => void;
  onAuditLog?: (action: string, details: string) => void;
  preselectedPatientId?: number;
}

export function RecurringScheduleGeneratorModal({
  isOpen,
  onClose,
  patients,
  existingSessions,
  onGenerateBatch,
  onAuditLog,
  preselectedPatientId
}: RecurringScheduleGeneratorModalProps) {
  // Form controls
  const activePatients = useMemo(() => patients.filter(p => p.is_active !== false), [patients]);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(() => {
    if (preselectedPatientId) return preselectedPatientId;
    return activePatients[0]?.id || 1;
  });

  const selectedPatient = useMemo(() => {
    return activePatients.find(p => p.id === selectedPatientId) || activePatients[0] || null;
  }, [activePatients, selectedPatientId]);

  // Configuration options
  const [schedulePattern, setSchedulePattern] = useState<SchedulePattern>(() => {
    return selectedPatient?.schedule_pattern || 'ISNIN_RABU_JUMAAT';
  });

  const [preferredShift, setPreferredShift] = useState<ShiftSlot>(() => {
    return normalizePatientShift(selectedPatient?.preferred_shift || 'SYIF_1');
  });

  const [chairNumber, setChairNumber] = useState<string>(() => {
    return selectedPatient?.assigned_chair || 'B-01';
  });

  const [daysCount, setDaysCount] = useState<number>(30); // 30 days
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [targetUf, setTargetUf] = useState<string>('2.5');

  // When patient selection changes, sync default preferences
  const handleSelectPatient = (patientId: number) => {
    setSelectedPatientId(patientId);
    const pat = activePatients.find(p => p.id === patientId);
    if (pat) {
      if (pat.schedule_pattern) setSchedulePattern(pat.schedule_pattern);
      if (pat.preferred_shift) setPreferredShift(normalizePatientShift(pat.preferred_shift));
      if (pat.assigned_chair) setChairNumber(pat.assigned_chair);
    }
  };

  // Generate 30-day preview dates
  const generatedPreview = useMemo(() => {
    if (!selectedPatient) return [];

    const result: Array<{
      dateIso: string;
      dateFormatted: string;
      dayName: string;
      dayOfWeek: number;
      shift: ShiftSlot;
      shiftTitle: string;
      scheduledTime: string;
      chairNumber: string;
      isDuplicate: boolean;
      existingSessionId?: number;
    }> = [];

    const today = new Date();
    const shiftConfig = PATIENT_SHIFTS_CONFIG.find(c => c.id === preferredShift) || PATIENT_SHIFTS_CONFIG[0];

    for (let i = 0; i < daysCount; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);

      const dayOfWeek = targetDate.getDay(); // 0 = Ahad, 1 = Isnin, 2 = Selasa, 3 = Rabu, 4 = Khamis, 5 = Jumaat, 6 = Sabtu

      // Match pattern
      let isMatch = false;
      if (schedulePattern === 'ISNIN_RABU_JUMAAT') {
        isMatch = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5; // Mon, Wed, Fri
      } else if (schedulePattern === 'SELASA_KHAMIS_SABTU') {
        isMatch = dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6; // Tue, Thu, Sat
      } else {
        // Daily except Sunday
        isMatch = dayOfWeek >= 1 && dayOfWeek <= 6;
      }

      if (isMatch) {
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const dateIso = `${year}-${month}-${day}`;

        // Check for existing session on this date for this patient
        const existing = existingSessions.find(
          s => (s.patient_id === selectedPatient.id || (selectedPatient.patient_id_code && s.patient_id_code === selectedPatient.patient_id_code)) &&
               s.scheduled_date === dateIso
        );

        const dayName = targetDate.toLocaleDateString('ms-MY', { weekday: 'long' });
        const dateFormatted = targetDate.toLocaleDateString('ms-MY', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        result.push({
          dateIso,
          dateFormatted,
          dayName,
          dayOfWeek,
          shift: preferredShift,
          shiftTitle: shiftConfig.title,
          scheduledTime: shiftConfig.scheduledDefaultTime,
          chairNumber,
          isDuplicate: !!existing,
          existingSessionId: existing?.id
        });
      }
    }

    return result;
  }, [selectedPatient, schedulePattern, preferredShift, chairNumber, daysCount, existingSessions]);

  const sessionsToCreate = useMemo(() => {
    if (skipDuplicates) {
      return generatedPreview.filter(item => !item.isDuplicate);
    }
    return generatedPreview;
  }, [generatedPreview, skipDuplicates]);

  // Perform Generation
  const handleExecuteGeneration = () => {
    if (!selectedPatient || sessionsToCreate.length === 0) return;

    const dryWeight = selectedPatient.dry_weight_kg || 65.0;
    const ufNum = Number(targetUf) || 2.5;

    const newSessionsList: Omit<DialysisSession, 'id'>[] = sessionsToCreate.map(item => ({
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.name,
      patient_id_code: selectedPatient.patient_id_code,
      dry_weight_kg: dryWeight,
      scheduled_date: item.dateIso,
      scheduled_time: item.scheduledTime,
      shift: item.shift,
      chair_id: INITIAL_CHAIRS.find(c => c.chair_number === item.chairNumber)?.id || 1,
      chair_number: item.chairNumber,
      machine_model: 'Fresenius 4008S NG',
      status: 'BELUM_HADIR',
      pre_weight_kg: Number((dryWeight + ufNum).toFixed(1)),
      target_uf_litres: ufNum,
      pre_bp: selectedPatient.latest_bp || '130/80',
      notes: `Jadual Berulang Automatik 30 Hari (${item.shift} - ${schedulePattern.replace(/_/g, ' ')})`,
      created_at: new Date().toISOString()
    }));

    onGenerateBatch(newSessionsList);

    if (onAuditLog) {
      onAuditLog(
        'JANA_JADUAL_BERULANG_30_HARI',
        `Pentadbir menjana ${newSessionsList.length} sesi jadual rawatan berulang secara automatik untuk pesakit ${selectedPatient.name} (${selectedPatient.patient_id_code}) bagi 30 hari seterusnya (${itemText(preferredShift)} / ${schedulePattern.replace(/_/g, ' ')}).`
      );
    }

    onClose();
  };

  const itemText = (shift: string) => {
    if (shift === 'SYIF_1') return 'Syif 1 (6:00 AM - 10:00 AM)';
    if (shift === 'SYIF_2') return 'Syif 2 (10:30 AM - 2:30 PM)';
    return 'Syif 3 (3:00 PM - 7:00 PM)';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0D182E] border-2 border-cyan-500/90 rounded-3xl max-w-2xl w-full p-6 sm:p-7 text-white space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Sparkles className="w-6 h-6 animate-pulse text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Automasi Kalendar Dialisis
                </span>
                <span className="text-xs text-slate-400 font-mono">30 Hari</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Jana Jadual Rawatan Berulang
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer text-lg transition-colors border border-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Form Inputs Grid */}
        <div className="space-y-4">
          
          {/* Patient Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pilih Pesakit Dialisis *</span>
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => handleSelectPatient(Number(e.target.value))}
              className="w-full bg-[#070D1F] border border-cyan-800/80 rounded-xl px-4 py-3 text-white font-bold text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              {activePatients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patient_id_code}) • Syif Semasa: {p.preferred_shift} • Jadual: {p.schedule_pattern.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Configuration Row: Shift & Pattern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Preferred Shift */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Syif Rawatan (Preferred Shift) *</span>
              </label>
              <select
                value={preferredShift}
                onChange={(e) => setPreferredShift(e.target.value as ShiftSlot)}
                className="w-full bg-[#070D1F] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="SYIF_1">🌅 Syif 1: Sesi Pagi Awal (6:00 AM - 10:00 AM)</option>
                <option value="SYIF_2">☀️ Syif 2: Sesi Tengah Hari (10:30 AM - 2:30 PM)</option>
                <option value="SYIF_3">🌇 Syif 3: Sesi Petang (3:00 PM - 7:00 PM)</option>
              </select>
            </div>

            {/* Schedule Pattern */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                <span>Corak Hari (Schedule Pattern) *</span>
              </label>
              <select
                value={schedulePattern}
                onChange={(e) => setSchedulePattern(e.target.value as SchedulePattern)}
                className="w-full bg-[#070D1F] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="ISNIN_RABU_JUMAAT">📅 Isnin, Rabu, Jumaat (3x Seminggu)</option>
                <option value="SELASA_KHAMIS_SABTU">📅 Selasa, Khamis, Sabtu (3x Seminggu)</option>
                <option value="SETIAP_HARI_KECUALI_AHAD">📅 Setiap Hari Kecuali Ahad (6x Seminggu)</option>
              </select>
            </div>
          </div>

          {/* Chair & Target UF Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Stesen Kerusi Dialisis</span>
              </label>
              <select
                value={chairNumber}
                onChange={(e) => setChairNumber(e.target.value)}
                className="w-full bg-[#070D1F] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                {INITIAL_CHAIRS.map(c => (
                  <option key={c.id} value={c.chair_number}>
                    Stesen {c.chair_number} ({c.bay === 'ISOLATION' ? 'Isolasi' : c.bay.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>Sasaran UF (Liter)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={targetUf}
                onChange={(e) => setTargetUf(e.target.value)}
                className="w-full bg-[#070D1F] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Duplicate handling toggle */}
          <div className="bg-[#070D1F] p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-xs">
                <strong className="text-white block font-bold">Langkau Tarikh yang Telah Dijadualkan</strong>
                <span className="text-slate-400 text-[11px]">Mengelakkan sesi bertindih jika sesi pada tarikh tersebut sudah wujud.</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="w-5 h-5 rounded text-cyan-600 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Live Preview of Generated Calendar Dates */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                Pratonton Sesi Kalendar 30 Hari ({sessionsToCreate.length} Sesi Dijana)
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-800">
              {sessionsToCreate.length} Sesi Baru
            </span>
          </div>

          <div className="bg-[#070D1F] border border-slate-800 rounded-2xl max-h-56 overflow-y-auto p-2 space-y-1.5">
            {generatedPreview.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center italic">Tiada tarikh padanan ditemui bagi corak jadual ini.</p>
            ) : (
              generatedPreview.map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                    item.isDuplicate
                      ? skipDuplicates
                        ? 'bg-slate-950/60 border-slate-800/80 opacity-50'
                        : 'bg-amber-950/40 border-amber-800/70 text-amber-200'
                      : 'bg-slate-900 border-slate-800 hover:border-cyan-700/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-[11px] font-bold text-slate-400 w-6">#{idx + 1}</span>
                    <div>
                      <strong className="text-white block font-bold">{item.dateFormatted}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.scheduledTime} • Stesen {item.chairNumber}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {item.isDuplicate ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                        {skipDuplicates ? 'Dilangkau (Sedia Ada)' : 'Ganti Sesi Sedia Ada'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        Sedia Dijana
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm rounded-xl cursor-pointer transition-all border border-slate-700"
          >
            Batal
          </button>
          
          <button
            type="button"
            disabled={sessionsToCreate.length === 0}
            onClick={handleExecuteGeneration}
            className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl cursor-pointer transition-all shadow-xl shadow-cyan-950/60 flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>JANA & SIMPAN {sessionsToCreate.length} SESI RAWATAN (30 HARI)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
