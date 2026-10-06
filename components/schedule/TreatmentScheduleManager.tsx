'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Stethoscope, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Check, 
  X, 
  Activity, 
  Droplet, 
  UserCheck, 
  Info,
  CalendarDays,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { DialysisSession, Patient, ShiftSlot, Nurse } from '@/types';
import { INITIAL_CHAIRS, VERIFIED_CENTRE_INFO } from '@/lib/mock-data';
import { WhatsAppReminderModal } from '@/components/shared/WhatsAppReminderModal';
import { QuickStatusModal } from '@/components/shared/QuickStatusModal';
import { getSessionTimerInfo } from '@/lib/dialysis-timer';
import { parseMalaysianIC } from '@/lib/ic-utils';
import { getMalaysiaDate } from '@/lib/malaysia-time';
import { RecurringScheduleGeneratorModal } from './RecurringScheduleGeneratorModal';

export const PATIENT_SHIFTS_CONFIG = [
  {
    id: 'SYIF_1',
    numericId: 1,
    title: 'Syif 1: Sesi Pagi Awal',
    timeRange: '6:00 AM - 10:00 AM',
    scheduledDefaultTime: '06:00 AM - 10:00 AM',
    nurseShiftInCharge: 'Syif Jururawat Pagi (5:30 AM - 3:00 PM)',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-600',
    dotColor: 'bg-amber-400'
  },
  {
    id: 'SYIF_2',
    numericId: 2,
    title: 'Syif 2: Sesi Tengah Hari',
    timeRange: '10:30 AM - 2:30 PM',
    scheduledDefaultTime: '10:30 AM - 02:30 PM',
    nurseShiftInCharge: 'Pertindihan Syif Jururawat (Pagi & Petang)',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-600',
    dotColor: 'bg-cyan-400'
  },
  {
    id: 'SYIF_3',
    numericId: 3,
    title: 'Syif 3: Sesi Petang',
    timeRange: '3:00 PM - 7:00 PM',
    scheduledDefaultTime: '03:00 PM - 07:00 PM',
    nurseShiftInCharge: 'Syif Jururawat Petang (12:00 PM - 8:00 PM)',
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-600',
    dotColor: 'bg-indigo-400'
  }
] as const;

export const normalizePatientShift = (s?: string): 'SYIF_1' | 'SYIF_2' | 'SYIF_3' => {
  if (!s) return 'SYIF_1';
  if (s === 'SYIF_1' || s === 'PAGI' || s.includes('6.00') || s.includes('6:00')) return 'SYIF_1';
  if (s === 'SYIF_2' || s === 'TENGAH_HARI' || s.includes('10.30') || s.includes('10:30')) return 'SYIF_2';
  return 'SYIF_3';
};

interface TreatmentScheduleManagerProps {
  sessions: DialysisSession[];
  patients: Patient[];
  nurses?: Nurse[];
  onUpdateSession: (updated: DialysisSession) => void;
  onAddSession: (newSession: Omit<DialysisSession, 'id'>) => void;
  onAddBatchSessions?: (newSessions: Omit<DialysisSession, 'id'>[]) => void;
  onDeleteSession: (sessionId: number) => void;
  onAuditLog?: (action: string, details: string) => void;
  isNurseView?: boolean;
}

export function TreatmentScheduleManager({
  sessions,
  patients,
  nurses = [],
  onUpdateSession,
  onAddSession,
  onAddBatchSessions,
  onDeleteSession,
  onAuditLog,
  isNurseView = false
}: TreatmentScheduleManagerProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => getMalaysiaDate().dateIso);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'ALL' | 'SYIF_1' | 'SYIF_2' | 'SYIF_3'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [editingSession, setEditingSession] = useState<DialysisSession | null>(null);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringPatientId, setRecurringPatientId] = useState<number | undefined>(undefined);
  const [prefilledStation, setPrefilledStation] = useState<string | null>(null);
  const [prefilledShift, setPrefilledShift] = useState<ShiftSlot>('SYIF_1');
  const [prefilledDate, setPrefilledDate] = useState<string>(selectedDate);
  const [whatsAppPatient, setWhatsAppPatient] = useState<Patient | null>(null);
  const [quickStatusSession, setQuickStatusSession] = useState<DialysisSession | null>(null);

  // Live countdown timer ticker
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Form State for Adding / Editing Session
  const [formPatientId, setFormPatientId] = useState<number>(0);
  const [formDate, setFormDate] = useState<string>(selectedDate);
  const [formShift, setFormShift] = useState<ShiftSlot>('SYIF_1');
  const [formChairNumber, setFormChairNumber] = useState<string>('B-01');
  const [formScheduledTime, setFormScheduledTime] = useState<string>('06:00 AM - 10:00 AM');
  const [formStatus, setFormStatus] = useState<DialysisSession['status']>('BELUM_HADIR');
  const [formPreWeight, setFormPreWeight] = useState<string>('70.0');
  const [formTargetUf, setFormTargetUf] = useState<string>('2.5');
  const [formBp, setFormBp] = useState<string>('130/80');
  const [formNurseName, setFormNurseName] = useState<string>(nurses[0]?.name || 'Sister Siti Fatimah');
  const [formNotes, setFormNotes] = useState<string>('');

  const daysOfWeek = [
    { id: 'ISNIN', label: 'Isnin', short: 'Isn', pattern: 'ISNIN_RABU_JUMAAT' },
    { id: 'SELASA', label: 'Selasa', short: 'Sel', pattern: 'SELASA_KHAMIS_SABTU' },
    { id: 'RABU', label: 'Rabu', short: 'Rab', pattern: 'ISNIN_RABU_JUMAAT' },
    { id: 'KHAMIS', label: 'Khamis', short: 'Kha', pattern: 'SELASA_KHAMIS_SABTU' },
    { id: 'JUMAAT', label: 'Jumaat', short: 'Jum', pattern: 'ISNIN_RABU_JUMAAT' },
    { id: 'SABTU', label: 'Sabtu', short: 'Sab', pattern: 'SELASA_KHAMIS_SABTU' }
  ];

  // Daily Filtered Sessions
  const dailySessions = useMemo(() => {
    return sessions.filter(s => {
      const matchDate = s.scheduled_date === selectedDate;
      const normalizedSessShift = normalizePatientShift(s.shift);
      const matchShift = selectedShiftFilter === 'ALL' || normalizedSessShift === selectedShiftFilter;
      const q = (searchQuery || '').toLowerCase();
      const matchQuery = 
        (s.patient_name || '').toLowerCase().includes(q) ||
        (s.patient_id_code || '').toLowerCase().includes(q) ||
        (s.chair_number || '').toLowerCase().includes(q);
      return matchDate && matchShift && matchQuery;
    });
  }, [sessions, selectedDate, selectedShiftFilter, searchQuery]);

  // Open Add Modal with prefilled station and shift
  const handleOpenAddForStation = (chairNo: string, shift: ShiftSlot, targetDate: string) => {
    const normShift = normalizePatientShift(shift);
    const cfg = PATIENT_SHIFTS_CONFIG.find(c => c.id === normShift) || PATIENT_SHIFTS_CONFIG[0];
    setPrefilledStation(chairNo);
    setPrefilledShift(normShift);
    setPrefilledDate(targetDate);
    setFormChairNumber(chairNo);
    setFormShift(normShift);
    setFormDate(targetDate);
    setFormScheduledTime(cfg.scheduledDefaultTime);
    if (patients.length > 0) {
      setFormPatientId(patients[0].id);
      setFormPreWeight((patients[0].dry_weight_kg + 2.0).toFixed(1));
    }
    setFormStatus('BELUM_HADIR');
    setFormNotes('');
    setIsAddSessionOpen(true);
  };

  // Open Edit Modal for a session
  const handleOpenEditSession = (session: DialysisSession) => {
    const normShift = normalizePatientShift(session.shift);
    setEditingSession(session);
    setFormPatientId(session.patient_id);
    setFormDate(session.scheduled_date);
    setFormShift(normShift);
    setFormChairNumber(session.chair_number);
    setFormScheduledTime(session.scheduled_time || (PATIENT_SHIFTS_CONFIG.find(c => c.id === normShift)?.scheduledDefaultTime || '06:00 AM - 10:00 AM'));
    setFormStatus(session.status);
    setFormPreWeight(session.pre_weight_kg?.toString() || '70.0');
    setFormTargetUf(session.target_uf_litres?.toString() || '2.5');
    setFormBp(session.current_bp || session.pre_bp || '130/80');
    setFormNurseName(session.nurse_name || (nurses[0]?.name || 'Sister Siti Fatimah'));
    setFormNotes(session.notes || '');
  };

  // Save Add / Edit
  const handleSaveSessionForm = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPat = patients.find(p => p.id === Number(formPatientId));
    if (!selectedPat && !editingSession) return;

    const patName = selectedPat ? selectedPat.name : editingSession?.patient_name || 'Pesakit';
    const patCode = selectedPat ? selectedPat.patient_id_code : editingSession?.patient_id_code || 'P00000';
    const dryWeight = selectedPat ? selectedPat.dry_weight_kg : editingSession?.dry_weight_kg || 68.0;

    if (editingSession) {
      const updated: DialysisSession = {
        ...editingSession,
        patient_id: Number(formPatientId),
        patient_name: patName,
        patient_id_code: patCode,
        dry_weight_kg: dryWeight,
        scheduled_date: formDate,
        shift: formShift,
        chair_number: formChairNumber,
        scheduled_time: formScheduledTime,
        status: formStatus,
        pre_weight_kg: Number(formPreWeight) || undefined,
        target_uf_litres: Number(formTargetUf) || undefined,
        pre_bp: formBp,
        current_bp: formBp,
        nurse_name: formNurseName,
        notes: formNotes
      };
      onUpdateSession(updated);
      if (onAuditLog) {
        onAuditLog('KEMASKINI_JADUAL_SESI', `Mengemaskini sesi rawatan pesakit ${patName} di stesen ${formChairNumber} (${formDate} - ${formShift}).`);
      }
      setEditingSession(null);
    } else {
      const newSession: Omit<DialysisSession, 'id'> = {
        patient_id: Number(formPatientId),
        patient_id_code: patCode,
        patient_name: patName,
        dry_weight_kg: dryWeight,
        scheduled_date: formDate,
        scheduled_time: formScheduledTime,
        shift: formShift,
        chair_id: INITIAL_CHAIRS.find(c => c.chair_number === formChairNumber)?.id || 1,
        chair_number: formChairNumber,
        machine_model: 'Fresenius 4008S NG',
        nurse_name: formNurseName,
        status: formStatus,
        pre_weight_kg: Number(formPreWeight) || dryWeight + 2.0,
        target_uf_litres: Number(formTargetUf) || 2.5,
        pre_bp: formBp,
        notes: formNotes
      };
      onAddSession(newSession);
      if (onAuditLog) {
        onAuditLog('TAMBAH_JADUAL_SESI', `Menjadualkan sesi rawatan baru untuk ${patName} di stesen ${formChairNumber} (${formDate} - ${formShift}).`);
      }
      setIsAddSessionOpen(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Clarification Banner: Perbezaan Shif Jururawat vs Shif Rawatan Pesakit */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-900 text-indigo-200 text-xs font-black px-3 py-1 rounded-full border border-indigo-600 flex items-center">
              <Info className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              PANDUAN OPERASI KLINIKAL
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center space-x-1 shadow-inner">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'daily'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Paparan Harian (Daily)</span>
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'weekly'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Paparan Mingguan (Weekly)</span>
              </button>
            </div>

            {/* 30-Day Recurring Calendar Auto-Generator Button */}
            {!isNurseView && (
              <button
                onClick={() => {
                  setRecurringPatientId(undefined);
                  setIsRecurringModalOpen(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 border border-cyan-400/40"
              >
                <Sparkles className="w-4 h-4 fill-cyan-300 text-cyan-200" />
                <span>✨ Jana Jadual Berulang 30 Hari</span>
              </button>
            )}

            {/* Quick Add Session Button */}
            <button
              onClick={() => handleOpenAddForStation('B-01', 'SYIF_1', selectedDate)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Masuk Pesakit ke Sesi</span>
            </button>
          </div>
        </div>

        {/* Visual Shift Explanation Card */}
        <div className="pt-1">
          {/* SHIF RAWATAN PESAKIT (3 Sesi) */}
          <div className="bg-slate-950/80 border-2 border-cyan-500/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-black text-xs">
                  💺
                </div>
                <h4 className="font-black text-white text-sm">Shif Rawatan Pesakit (3 Sesi Rawatan)</h4>
              </div>
              <span className="text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 px-2 py-0.5 rounded-full">
                Sesi Dialisis
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-amber-500/30">
                <span className="font-extrabold text-amber-300 block text-[11px]">1. Syif 1 (Pagi Awal)</span>
                <strong className="text-white font-mono text-xs block">6:00 AM - 10:00 AM</strong>
                <span className="text-[10px] text-slate-400">Tempoh: 4 Jam</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-cyan-500/30">
                <span className="font-extrabold text-cyan-300 block text-[11px]">2. Syif 2 (Tengah Hari)</span>
                <strong className="text-white font-mono text-xs block">10:30 AM - 2:30 PM</strong>
                <span className="text-[10px] text-slate-400">Tempoh: 4 Jam</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-indigo-500/30">
                <span className="font-extrabold text-indigo-300 block text-[11px]">3. Syif 3 (Petang)</span>
                <strong className="text-white font-mono text-xs block">3:00 PM - 7:00 PM</strong>
                <span className="text-[10px] text-slate-400">Tempoh: 4 Jam</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              * Antara setiap syif terdapat rehat 30 minit bagi tujuan sanitasi, disinfeksi mesin Fresenius dan pertukaran litar tiub darah.
            </p>
          </div>
        </div>

        {/* Controls Bar for Daily Mode */}
        {viewMode === 'daily' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
            {/* Date Navigator */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().slice(0, 10));
                }}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 cursor-pointer"
                title="Hari Sebelum"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().slice(0, 10));
                }}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 cursor-pointer"
                title="Hari Selepas"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                className="px-3 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Hari Ini
              </button>
            </div>

            {/* Shift Filter & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setSelectedShiftFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedShiftFilter === 'ALL'
                      ? 'bg-slate-800 text-cyan-300 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua 3 Sesi
                </button>
                {PATIENT_SHIFTS_CONFIG.map(cfg => (
                  <button
                    key={cfg.id}
                    onClick={() => setSelectedShiftFilter(cfg.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedShiftFilter === cfg.id
                        ? 'bg-slate-800 text-cyan-300 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Syif {cfg.numericId} ({cfg.timeRange.split(' - ')[0]})
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pesakit / stesen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY SCHEDULE MATRIX (12 STESEN X 3 SYIF PESAKIT) */}
      {/* ========================================================================= */}
      {viewMode === 'daily' && (
        <div className="space-y-6">
          {PATIENT_SHIFTS_CONFIG.filter(cfg => selectedShiftFilter === 'ALL' || selectedShiftFilter === cfg.id).map(cfg => {
            const shiftSessions = dailySessions.filter(s => normalizePatientShift(s.shift) === cfg.id);

            return (
              <div key={cfg.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`w-3.5 h-3.5 rounded-full ${cfg.dotColor} animate-pulse`} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-black text-white">{cfg.title}</h3>
                        <span className="font-mono text-cyan-400 font-bold text-xs bg-slate-950 border border-slate-700 px-2 py-0.5 rounded">
                          {cfg.timeRange}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {shiftSessions.length} / 12 Stesen Berisi ({12 - shiftSessions.length} Stesen Kosong) • Staf: {cfg.nurseShiftInCharge}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenAddForStation('B-01', cfg.id, selectedDate)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+ Masukkan Pesakit ({cfg.timeRange})</span>
                  </button>
                </div>

                {/* 12 Stations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {INITIAL_CHAIRS.map(chair => {
                    const sessionOnChair = shiftSessions.find(s => s.chair_number === chair.chair_number);
                    const patientInfo = sessionOnChair ? patients.find(p => p.id === sessionOnChair.patient_id) : null;
                    const icData = patientInfo ? parseMalaysianIC(patientInfo.ic_number) : null;

                    if (!sessionOnChair) {
                      // Empty Station Slot
                      return (
                        <div
                          key={chair.id}
                          className="bg-slate-950/60 border border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all group"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {chair.chair_number}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              Kosong / Tersedia
                            </span>
                          </div>

                          <div className="text-center py-3">
                            <Stethoscope className="w-6 h-6 mx-auto text-slate-700 group-hover:text-cyan-500/60 transition-colors" />
                            <p className="text-xs text-slate-500 font-medium mt-1">Tiada Pesakit Dijadualkan</p>
                          </div>

                          <button
                            onClick={() => handleOpenAddForStation(chair.chair_number, cfg.id, selectedDate)}
                            className="w-full py-2 bg-slate-900 hover:bg-indigo-950 text-slate-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tugaskan Pesakit</span>
                          </button>
                        </div>
                      );
                    }

                    // Occupied Station Slot
                    const isSedang = sessionOnChair.status === 'SEDANG_DIALISIS';
                    const isSelesai = sessionOnChair.status === 'SUDAH_SELESAI';
                    const isHadir = sessionOnChair.status === 'SUDAH_HADIR';
                    const timerInfo = getSessionTimerInfo(sessionOnChair, nowMs);

                    return (
                      <div
                        key={chair.id}
                        className={`bg-slate-950 border-2 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-md ${
                          isSedang
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-950/20 to-slate-950'
                            : isSelesai
                            ? 'border-teal-700/70 bg-gradient-to-br from-teal-950/20 to-slate-950'
                            : isHadir
                            ? 'border-blue-600 bg-gradient-to-br from-blue-950/20 to-slate-950'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Header: Station & Status */}
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                              {sessionOnChair.chair_number}
                            </span>
                            <button
                              onClick={() => setQuickStatusSession(sessionOnChair)}
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity flex items-center space-x-1 ${
                                isSedang
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 animate-pulse'
                                  : isSelesai
                                  ? 'bg-teal-950 text-teal-300 border-teal-800'
                                  : isHadir
                                  ? 'bg-blue-950 text-blue-300 border-blue-700'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                              title="Klik untuk tukar status pantas"
                            >
                              <span>{sessionOnChair.status.replace(/_/g, ' ')}</span>
                              <RotateCcw className="w-2.5 h-2.5 ml-0.5 shrink-0" />
                            </button>
                          </div>

                          {/* Patient Name & Age (Tahun & Hari) */}
                          <div className="mt-2.5">
                            <h4 className="font-black text-white text-base leading-snug">
                              {sessionOnChair.patient_name}
                            </h4>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-mono text-cyan-300 font-bold">{sessionOnChair.patient_id_code}</span>
                              {icData?.ageDisplay && (
                                <span>• <strong className="text-emerald-400">{icData.ageDisplay}</strong></span>
                              )}
                            </div>
                          </div>

                          {/* Session Info Grid */}
                          <div className="grid grid-cols-2 gap-1.5 mt-3 text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Masa:</span>
                              <strong className="text-white text-xs">{sessionOnChair.scheduled_time || cfg.timeRange}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Berat Kering:</span>
                              <strong className="text-emerald-400 text-xs">{sessionOnChair.dry_weight_kg} kg</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Target UF:</span>
                              <strong className="text-cyan-400 text-xs">{sessionOnChair.target_uf_litres || 2.5} L</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">BP Semasa:</span>
                              <strong className="text-amber-400 text-xs">{sessionOnChair.current_bp || sessionOnChair.pre_bp || '-'}</strong>
                            </div>
                          </div>

                          {/* Live 4-Hour Countdown Timer Component for SEDANG DIALISIS */}
                          {isSedang && (
                            <div className="mt-2.5 p-2 bg-emerald-950/90 border-2 border-emerald-500/80 rounded-xl text-xs space-y-1 shadow-inner">
                              <div className="flex items-center justify-between font-black text-emerald-300">
                                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                                  <Clock className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                                  <span>Baki Masa 4 Jam:</span>
                                </span>
                                <span className="font-mono text-xs text-white bg-slate-950 px-1.5 py-0.5 rounded border border-emerald-700 font-bold">
                                  {timerInfo.formattedRemaining}
                                </span>
                              </div>
                              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-emerald-800">
                                <div 
                                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full transition-all duration-1000" 
                                  style={{ width: `${timerInfo.progressPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-300 font-mono">
                                <span>Mula: {sessionOnChair.actual_start_time || '08:00 AM'}</span>
                                <span>{timerInfo.progressPercent}% Selesai</span>
                              </div>
                            </div>
                          )}

                          {!isSedang && !isSelesai && (
                            <div className="mt-2 text-[10px] bg-amber-950/40 p-1.5 rounded-lg border border-amber-800/60 text-amber-200 flex items-center justify-between">
                              <span className="truncate">⚠️ Tukar status ke 'SEDANG DIALISIS' untuk timer 4j.</span>
                              <button
                                onClick={() => setQuickStatusSession(sessionOnChair)}
                                className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] cursor-pointer shrink-0 ml-1"
                              >
                                Mula
                              </button>
                            </div>
                          )}

                          {sessionOnChair.nurse_name && (
                            <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1">
                              <span>Staf Jururawat:</span>
                              <strong className="text-slate-300">{sessionOnChair.nurse_name}</strong>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons for this Station */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800">
                          {patientInfo && (
                            <button
                              onClick={() => setWhatsAppPatient(patientInfo)}
                              className="w-full py-1.5 px-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow"
                            >
                              <Send className="w-3 h-3" />
                              <span>📱 Peringatan WhatsApp</span>
                            </button>
                          )}

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => setQuickStatusSession(sessionOnChair)}
                              className="flex-1 py-1.5 px-2 bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1 cursor-pointer shadow"
                              title="Tukar Status Sesi Pantas (Modal Radio)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>🔄 Status</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditSession(sessionOnChair)}
                              className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Adakah anda pasti ingin mengeluarkan pesakit ${sessionOnChair.patient_name} daripada stesen ${sessionOnChair.chair_number}?`)) {
                                  onDeleteSession(sessionOnChair.id);
                                  if (onAuditLog) {
                                    onAuditLog('PADAM_SESI_JADUAL', `Mengeluarkan sesi ${sessionOnChair.patient_name} di stesen ${sessionOnChair.chair_number}.`);
                                  }
                                }
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 rounded-lg transition-colors cursor-pointer"
                              title="Padam / Batalkan Sesi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEEKLY SCHEDULE VIEW (ISNIN HINGGA SABTU DENGAN 3 SESI PESAKIT) */}
      {/* ========================================================================= */}
      {viewMode === 'weekly' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-black text-white">Jadual Mingguan Pesakit Tetap KaizenBros</h3>
                <p className="text-xs text-slate-400">Susunan giliran tetap bagi corak Isnin-Rabu-Jumaat dan Selasa-Khamis-Sabtu merentasi 3 Syif Pesakit</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {daysOfWeek.map(day => {
                const patientsForDay = patients.filter(p => p.schedule_pattern === day.pattern && p.is_active);
                const shift1Patients = patientsForDay.filter(p => normalizePatientShift(p.preferred_shift) === 'SYIF_1');
                const shift2Patients = patientsForDay.filter(p => normalizePatientShift(p.preferred_shift) === 'SYIF_2');
                const shift3Patients = patientsForDay.filter(p => normalizePatientShift(p.preferred_shift) === 'SYIF_3');

                return (
                  <div key={day.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-cyan-400" />
                        <h4 className="font-black text-white text-base">{day.label}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {patientsForDay.length} Pesakit
                      </span>
                    </div>

                    {/* Syif 1 Pesakit (6:00am - 10:00am) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-300">1. Syif 1 (6:00am - 10:00am)</span>
                        <span className="text-[10px] text-slate-400 font-mono">{shift1Patients.length}/12</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1 max-h-32 overflow-y-auto">
                        {shift1Patients.length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic block">Tiada pesakit berjadual</span>
                        ) : (
                          shift1Patients.map(p => {
                            const icData = parseMalaysianIC(p.ic_number);
                            return (
                              <div key={p.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-800/60 last:border-0">
                                <div>
                                  <strong className="text-white block text-xs">{p.name}</strong>
                                  <span className="text-[10px] text-slate-400">{p.patient_id_code} • {icData.ageDisplay || `${p.age} Thn`}</span>
                                </div>
                                <button
                                  onClick={() => setWhatsAppPatient(p)}
                                  className="p-1 text-emerald-400 hover:bg-emerald-950 rounded cursor-pointer"
                                  title="WhatsApp Peringatan"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Syif 2 Pesakit (10:30am - 2:30pm) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-cyan-300">2. Syif 2 (10:30am - 2:30pm)</span>
                        <span className="text-[10px] text-slate-400 font-mono">{shift2Patients.length}/12</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1 max-h-32 overflow-y-auto">
                        {shift2Patients.length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic block">Tiada pesakit berjadual</span>
                        ) : (
                          shift2Patients.map(p => {
                            const icData = parseMalaysianIC(p.ic_number);
                            return (
                              <div key={p.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-800/60 last:border-0">
                                <div>
                                  <strong className="text-white block text-xs">{p.name}</strong>
                                  <span className="text-[10px] text-slate-400">{p.patient_id_code} • {icData.ageDisplay || `${p.age} Thn`}</span>
                                </div>
                                <button
                                  onClick={() => setWhatsAppPatient(p)}
                                  className="p-1 text-emerald-400 hover:bg-emerald-950 rounded cursor-pointer"
                                  title="WhatsApp Peringatan"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Syif 3 Pesakit (3:00pm - 7:00pm) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-indigo-300">3. Syif 3 (3:00pm - 7:00pm)</span>
                        <span className="text-[10px] text-slate-400 font-mono">{shift3Patients.length}/12</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1 max-h-32 overflow-y-auto">
                        {shift3Patients.length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic block">Tiada pesakit berjadual</span>
                        ) : (
                          shift3Patients.map(p => {
                            const icData = parseMalaysianIC(p.ic_number);
                            return (
                              <div key={p.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-800/60 last:border-0">
                                <div>
                                  <strong className="text-white block text-xs">{p.name}</strong>
                                  <span className="text-[10px] text-slate-400">{p.patient_id_code} • {icData.ageDisplay || `${p.age} Thn`}</span>
                                </div>
                                <button
                                  onClick={() => setWhatsAppPatient(p)}
                                  className="p-1 text-emerald-400 hover:bg-emerald-950 rounded cursor-pointer"
                                  title="WhatsApp Peringatan"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MASUK / EDIT SESI DIALISIS */}
      {/* ========================================================================= */}
      {(isAddSessionOpen || editingSession) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  {editingSession ? 'Kemaskini Butiran Sesi' : 'Penjadualan Sesi Baru'}
                </span>
                <h3 className="text-xl font-black text-white">
                  {editingSession ? `Edit Sesi: ${editingSession.patient_name}` : 'Masukkan Pesakit ke Stesen Sesi'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddSessionOpen(false);
                  setEditingSession(null);
                }}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSessionForm} className="p-6 space-y-4 text-xs text-slate-300">
              {/* Patient Selection */}
              <div>
                <label className="block font-bold text-white mb-1">Pilih Pesakit *</label>
                <select
                  required
                  value={formPatientId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setFormPatientId(id);
                    const selected = patients.find(p => p.id === id);
                    if (selected) {
                      setFormPreWeight((selected.dry_weight_kg + 2.0).toFixed(1));
                      const norm = normalizePatientShift(selected.preferred_shift);
                      setFormShift(norm);
                      const defTime = PATIENT_SHIFTS_CONFIG.find(c => c.id === norm)?.scheduledDefaultTime || '06:00 AM - 10:00 AM';
                      setFormScheduledTime(defTime);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-cyan-500"
                >
                  {patients.filter(p => p.is_active).map(p => {
                    const icData = parseMalaysianIC(p.ic_number);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patient_id_code}) - {icData.ageDisplay || `${p.age} Thn`} | Berat Kering: {p.dry_weight_kg}kg
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date, Shift & Chair */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Tarikh Sesi *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white mb-1">Shif Rawatan Pesakit *</label>
                  <select
                    value={formShift}
                    onChange={(e) => {
                      const sh = e.target.value as ShiftSlot;
                      setFormShift(sh);
                      const cfg = PATIENT_SHIFTS_CONFIG.find(c => c.id === sh);
                      if (cfg) setFormScheduledTime(cfg.scheduledDefaultTime);
                    }}
                    className="w-full bg-slate-950 border border-cyan-500/80 rounded-xl px-3 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                  >
                    <option value="SYIF_1">1. Syif 1: 6:00 AM - 10:00 AM (Pagi Awal)</option>
                    <option value="SYIF_2">2. Syif 2: 10:30 AM - 2:30 PM (Tengah Hari)</option>
                    <option value="SYIF_3">3. Syif 3: 3:00 PM - 7:00 PM (Petang)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-white mb-1">Stesen Kerusi (12) *</label>
                  <select
                    value={formChairNumber}
                    onChange={(e) => setFormChairNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                  >
                    {INITIAL_CHAIRS.map(c => (
                      <option key={c.id} value={c.chair_number}>
                        Stesen {c.chair_number} ({c.bay})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Waktu Sesi Rawatan</label>
                  <input
                    type="text"
                    value={formScheduledTime}
                    onChange={(e) => setFormScheduledTime(e.target.value)}
                    placeholder="Contoh: 06:00 AM - 10:00 AM"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white mb-1">Status Sesi</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="BELUM_HADIR">BELUM HADIR (Menunggu Ketibaan)</option>
                    <option value="SUDAH_HADIR">SUDAH HADIR (Di Ruang Menunggu)</option>
                    <option value="SEDANG_DIALISIS">SEDANG DIALISIS (Mesin Berjalan)</option>
                    <option value="SUDAH_SELESAI">SUDAH SELESAI (Discaj)</option>
                  </select>
                </div>
              </div>

              {/* Weights & BP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Berat Pra-Dialisis (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formPreWeight}
                    onChange={(e) => setFormPreWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white mb-1">Sasaran UF (Liter)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formTargetUf}
                    onChange={(e) => setFormTargetUf(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white mb-1">Tekanan Darah (BP)</label>
                  <input
                    type="text"
                    value={formBp}
                    onChange={(e) => setFormBp(e.target.value)}
                    placeholder="130/80"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Staff in charge & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Jururawat Bertugas (2 Syif Staf)</label>
                  <select
                    value={formNurseName}
                    onChange={(e) => setFormNurseName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                  >
                    {nurses.map(n => (
                      <option key={n.id} value={n.name}>{n.name} ({n.staff_id_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-white mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Contoh: Pesakit minta bantal tambahan..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSessionOpen(false);
                    setEditingSession(null);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  {editingSession ? 'Simpan Perubahan Sesi' : 'Jadualkan Sesi Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={!!whatsAppPatient}
        onClose={() => setWhatsAppPatient(null)}
        patient={whatsAppPatient}
        onLogAudit={onAuditLog}
      />

      {/* 30-Day Recurring Dialysis Schedule Generator Modal */}
      <RecurringScheduleGeneratorModal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setRecurringPatientId(undefined);
        }}
        patients={patients}
        existingSessions={sessions}
        preselectedPatientId={recurringPatientId}
        onAuditLog={onAuditLog}
        onGenerateBatch={(newBatch) => {
          if (onAddBatchSessions) {
            onAddBatchSessions(newBatch);
          } else {
            newBatch.forEach(sess => onAddSession(sess));
          }
        }}
      />
    </div>
  );
}
