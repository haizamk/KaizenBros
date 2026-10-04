'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { 
  Users, 
  Stethoscope, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Square, 
  Save, 
  Plus, 
  FileText, 
  BarChart3, 
  Settings, 
  Home, 
  Droplet, 
  Activity, 
  Calendar, 
  ChevronRight, 
  Download, 
  Printer, 
  UserCheck, 
  Bell, 
  Check, 
  X,
  Pill,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Trash2,
  RotateCcw,
  Edit3,
  AlertTriangle,
  Send,
  CalendarDays,
  Moon,
  Sun,
  TrendingUp,
  Scale,
  Zap
} from 'lucide-react';
import { WhatsAppReminderModal } from '@/components/shared/WhatsAppReminderModal';
import { TreatmentScheduleManager } from '@/components/schedule/TreatmentScheduleManager';
import { parseMalaysianIC } from '@/lib/ic-utils';
import { useMalaysiaTime } from '@/hooks/useMalaysiaTime';
import { calculateNextDialysis } from '@/lib/malaysia-time';
import { 
  DialysisSession, 
  Patient, 
  ActionableAlert, 
  DailyReportSummary, 
  SessionStatus,
  Nurse,
  PatientCheckIn,
  DialysisChair,
  CentreProfile,
  ShiftSlot
} from '@/types';
import { 
  INITIAL_TODAY_SESSIONS, 
  INITIAL_PATIENTS, 
  INITIAL_ACTIONABLE_ALERTS, 
  INITIAL_DAILY_SUMMARY,
  INITIAL_CHECK_INS,
  INITIAL_CHAIRS,
  INITIAL_MACHINES,
  INITIAL_NURSES,
  VERIFIED_CENTRE_INFO
} from '@/lib/mock-data';

export function DialysisCountdownTimer({ session }: { session?: DialysisSession }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!session || session.status !== 'SEDANG_DIALISIS') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session?.status]);

  if (!session) {
    return (
      <span className="text-[11px] text-slate-500 font-mono">Tiada Sesi Hari Ini</span>
    );
  }

  if (session.status === 'SUDAH_SELESAI') {
    return (
      <span className="inline-flex items-center text-[11px] font-bold text-teal-300 bg-teal-950/90 border border-teal-700 px-2.5 py-1 rounded-lg">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-teal-400 shrink-0" />
        Selesai ({session.actual_end_time || 'Discaj'})
      </span>
    );
  }

  if (session.status === 'GAGAL_HABIS_DIALISIS' || session.status === 'TAMAT_AWAL' || session.status === 'BATAL') {
    return (
      <span className="inline-flex items-center text-[11px] font-bold text-rose-300 bg-rose-950/90 border border-rose-700 px-2.5 py-1 rounded-lg">
        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400 shrink-0" />
        {session.status === 'GAGAL_HABIS_DIALISIS' ? 'Gagal Habis' : session.status === 'BATAL' ? 'Batal' : 'Tamat Awal'}
      </span>
    );
  }

  if (session.status !== 'SEDANG_DIALISIS') {
    return (
      <span className="inline-flex items-center text-[11px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-lg">
        <Clock className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />
        {session.status.replace(/_/g, ' ')} (Piawaian 4 Jam)
      </span>
    );
  }

  // Active Dialysis Countdown calculation (4 hours standard duration)
  const FOUR_HOURS_MS = 4 * 3600 * 1000;
  let startMs = session.start_timestamp;
  if (!startMs && session.actual_start_time) {
    const match = session.actual_start_time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let hrs = parseInt(match[1]);
      const mins = parseInt(match[2]);
      const ampm = match[3];
      if (ampm && ampm.toUpperCase() === 'PM' && hrs < 12) hrs += 12;
      if (ampm && ampm.toUpperCase() === 'AM' && hrs === 12) hrs = 0;
      const d = new Date();
      d.setHours(hrs, mins, 0, 0);
      startMs = d.getTime();
    }
  }
  if (!startMs) {
    startMs = Date.now() - (3.5 * 3600 * 1000);
  }

  const elapsedMs = Math.max(0, now - startMs);
  const remainingMs = FOUR_HOURS_MS - elapsedMs;

  if (remainingMs <= 0) {
    const graceElapsedMs = elapsedMs - FOUR_HOURS_MS;
    const graceRemainingMs = Math.max(0, (3600 * 1000) - graceElapsedMs);
    const graceMinutes = Math.floor(graceRemainingMs / 60000);
    const graceSeconds = Math.floor((graceRemainingMs % 60000) / 1000);

    return (
      <div className="space-y-1">
        <span className="inline-flex items-center text-[11px] font-black text-amber-300 bg-amber-950/90 border border-amber-500 px-2.5 py-1 rounded-lg animate-pulse">
          <Clock className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />
          Masa 4 Jam Tamat (Auto-Discaj: {graceMinutes}m {graceSeconds}s)
        </span>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-amber-400 h-full w-full animate-pulse" />
        </div>
      </div>
    );
  }

  const hours = Math.floor(remainingMs / (1000 * 3600));
  const minutes = Math.floor((remainingMs % (1000 * 3600)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
  const percentProgress = Math.min(100, Math.max(0, (elapsedMs / FOUR_HOURS_MS) * 100));

  return (
    <div className="space-y-1 min-w-[140px]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-bold text-emerald-400 flex items-center text-[11px]">
          <Clock className="w-3.5 h-3.5 mr-1 text-emerald-400 animate-spin shrink-0" style={{ animationDuration: '4s' }} />
          Baki: {hours > 0 ? `${hours}j ` : ''}{String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
        </span>
        <span className="text-[10px] text-slate-400 font-mono font-semibold">{percentProgress.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
        <div 
          className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full transition-all duration-1000" 
          style={{ width: `${percentProgress}%` }}
        />
      </div>
    </div>
  );
}

interface NursePortalProps {
  currentNurseName?: string;
  patients?: Patient[];
  sessions?: DialysisSession[];
  onUpdateSession?: (session: DialysisSession) => void;
  onAuditLog?: (action: string, details: string) => void;
  checkInQueue?: PatientCheckIn[];
  onCheckInPatient?: (patientId: number, preWeight: number, preBp: string, notes?: string) => void;
  onAssignStation?: (patientId: number, chairNumber: string, machineModel: string) => void;
  onClearQueue?: () => void;
  onStaffLogout?: () => void;
}

export function NursePortal({
  currentNurseName = 'Sister Siti Fatimah',
  patients: propPatients,
  sessions: propSessions,
  onUpdateSession,
  onAuditLog,
  checkInQueue: propQueue,
  onCheckInPatient,
  onAssignStation,
  onClearQueue,
  onStaffLogout
}: NursePortalProps) {
  // Navigation tabs:
  // 🏠 Hari Ini, 📅 Jadual Rawatan, 👥 Pesakit, 🩺 Sesi Dialisis, 📋 Rekod, 📊 Laporan, ⚙️ Tetapan
  const [activeNav, setActiveNav] = useState<'hari_ini' | 'jadual' | 'pesakit' | 'sesi' | 'rekod' | 'laporan' | 'tetapan'>('hari_ini');

  const [sessions, setSessions] = useState<DialysisSession[]>(() => {
    if (propSessions && propSessions.length > 0) return propSessions;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kaizenbros_sessions');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return INITIAL_TODAY_SESSIONS;
  });

  // Sync sessions when propSessions updates from root
  useEffect(() => {
    if (propSessions && propSessions.length > 0) {
      setSessions(propSessions);
    }
  }, [propSessions]);

  const malaysiaTime = useMalaysiaTime();

  // Dynamic clinical shift calculation based on real Malaysian hour
  const nurseShiftDisplay = useMemo(() => {
    const totalMinutes = malaysiaTime.hour * 60 + malaysiaTime.minute;
    if (totalMinutes >= (5 * 60 + 30) && totalMinutes < (15 * 60)) {
      return 'Syif Jururawat Bertugas: Syif Pagi (5:30 AM - 3:00 PM)';
    } else if (totalMinutes >= (12 * 60) && totalMinutes < (20 * 60)) {
      return 'Syif Jururawat Bertugas: Syif Petang (12:00 PM - 8:00 PM)';
    } else {
      return 'Pusat Rawatan Ditutup (Panggilan Kecemasan Atas Panggilan Sahaja)';
    }
  }, [malaysiaTime.hour, malaysiaTime.minute]);

  const [alerts, setAlerts] = useState<ActionableAlert[]>(INITIAL_ACTIONABLE_ALERTS);
  const [patientsList, setPatientsList] = useState<Patient[]>(() => {
    if (propPatients && propPatients.length > 0) return propPatients;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kaizenbros_patients');
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return INITIAL_PATIENTS;
  });

  const [prevPropPatients, setPrevPropPatients] = useState<Patient[] | undefined>(propPatients);
  if (propPatients !== prevPropPatients) {
    setPrevPropPatients(propPatients);
    if (propPatients && propPatients.length > 0) {
      setPatientsList(propPatients);
    }
  }

  // FCFS Live Check-In Queue (Pruned against valid registered patients)
  const [internalQueue, setInternalQueue] = useState<PatientCheckIn[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedPatients = localStorage.getItem('kaizenbros_patients');
        const currentPatients: Patient[] = storedPatients ? JSON.parse(storedPatients) : INITIAL_PATIENTS;
        const validIds = new Set(currentPatients.filter(p => p.is_active).map(p => p.id));
        
        const stored = localStorage.getItem('kaizenbros_queue');
        if (stored) {
          const parsed: PatientCheckIn[] = JSON.parse(stored);
          const valid = parsed.filter(q => validIds.has(q.patient_id));
          return valid;
        }
      } catch {}
    }
    return INITIAL_CHECK_INS;
  });

  // Strictly filter queue so ghost / deleted patients can NEVER appear
  const queueList = useMemo(() => {
    const rawQueue = propQueue !== undefined ? propQueue : internalQueue;
    const validPatientIds = new Set(patientsList.filter(p => p.is_active).map(p => p.id));
    return rawQueue.filter(q => validPatientIds.has(q.patient_id));
  }, [propQueue, internalQueue, patientsList]);

  const setQueueList = (updater: PatientCheckIn[] | ((prev: PatientCheckIn[]) => PatientCheckIn[])) => {
    setInternalQueue(updater);
  };

  // WhatsApp Reminder State
  const [whatsAppPatient, setWhatsAppPatient] = useState<Patient | null>(null);

  // State for nurses roster per shift
  const [nursesList, setNursesList] = useState<Nurse[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kaizenbros_nurses');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return INITIAL_NURSES;
  });

  // State for centre profile info
  const [centreProfile, setCentreProfile] = useState<CentreProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kaizenbros_centre_profile');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return VERIFIED_CENTRE_INFO;
  });

  const [selectedShiftForNurseTetapan, setSelectedShiftForNurseTetapan] = useState<ShiftSlot>('PETANG');

  // Station Allocation Modal State
  const [assigningPatient, setAssigningPatient] = useState<PatientCheckIn | null>(null);
  const [selectedChairNumber, setSelectedChairNumber] = useState<string>('B-01');
  const [selectedMachineModel, setSelectedMachineModel] = useState<string>('Fresenius 4008S NG');
  const [selectedDialyzer, setSelectedDialyzer] = useState<string>('Fresenius FX80 Cordiax');
  const [selectedAnticoagulant, setSelectedAnticoagulant] = useState<string>('Heparin 2000 IU bolus, 1000 IU/hr');

  // Assisted Counter Check-In Modal State
  const [showCounterCheckInModal, setShowCounterCheckInModal] = useState<boolean>(false);
  const [counterPatientId, setCounterPatientId] = useState<number>(0);
  const [counterWeight, setCounterWeight] = useState<string>('70.0');
  const [counterBp, setCounterBp] = useState<string>('');
  const [counterNotes, setCounterNotes] = useState<string>('');

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'SEMUA' | 'BELUM_HADIR' | 'SUDAH_HADIR' | 'SEDANG_DIALISIS' | 'SUDAH_SELESAI'>('SEMUA');

  // Modals
  const [selectedSessionForCheckIn, setSelectedSessionForCheckIn] = useState<DialysisSession | null>(null);
  const [selectedSessionForActive, setSelectedSessionForActive] = useState<DialysisSession | null>(null);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [patientDetailTab, setPatientDetailTab] = useState<'ringkasan' | 'maklumat' | 'jadual' | 'rekod' | 'vitals' | 'ubat' | 'catatan' | 'dokumen'>('ringkasan');

  // Check-In Form Fields
  const [checkInWeight, setCheckInWeight] = useState<string>('76.4');
  const [checkInSystolic, setCheckInSystolic] = useState<string>('148');
  const [checkInDiastolic, setCheckInDiastolic] = useState<string>('82');
  const [checkInStartNow, setCheckInStartNow] = useState<boolean>(true);

  // Active Session Form Fields
  const [hourlySystolic, setHourlySystolic] = useState<string>('');
  const [hourlyDiastolic, setHourlyDiastolic] = useState<string>('');
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [finishWeight, setFinishWeight] = useState<string>('');
  const [finishSystolic, setFinishSystolic] = useState<string>('128');
  const [finishDiastolic, setFinishDiastolic] = useState<string>('76');
  const [showFinishConfirm, setShowFinishConfirm] = useState<boolean>(false);

  // Dedicated Weight Management State for Nurse (Pra & After Dialisis)
  const [weightModalSession, setWeightModalSession] = useState<DialysisSession | null>(null);
  const [weightModalPreWeight, setWeightModalPreWeight] = useState<number>(75.0);
  const [weightModalPostWeight, setWeightModalPostWeight] = useState<string>('');
  const [weightModalPreSys, setWeightModalPreSys] = useState<string>('138');
  const [weightModalPreDia, setWeightModalPreDia] = useState<string>('82');
  const [weightModalPostSys, setWeightModalPostSys] = useState<string>('124');
  const [weightModalPostDia, setWeightModalPostDia] = useState<string>('78');
  const [weightModalStatus, setWeightModalStatus] = useState<SessionStatus>('SEDANG_DIALISIS');
  const [weightModalError, setWeightModalError] = useState<string | null>(null);

  const openWeightModalForSession = (s: DialysisSession) => {
    setWeightModalSession(s);
    setWeightModalPreWeight(s.pre_weight_kg ? Number(s.pre_weight_kg) : Number((s.dry_weight_kg + 1.8).toFixed(1)));
    setWeightModalPostWeight(s.post_weight_kg ? String(s.post_weight_kg) : '');
    
    if (s.pre_bp && s.pre_bp.includes('/')) {
      const parts = s.pre_bp.split('/');
      setWeightModalPreSys(parts[0]);
      setWeightModalPreDia(parts[1]);
    } else {
      setWeightModalPreSys('138');
      setWeightModalPreDia('82');
    }

    if (s.post_bp && s.post_bp.includes('/')) {
      const parts = s.post_bp.split('/');
      setWeightModalPostSys(parts[0]);
      setWeightModalPostDia(parts[1]);
    } else {
      setWeightModalPostSys('124');
      setWeightModalPostDia('78');
    }

    setWeightModalStatus(s.status);
    setWeightModalError(null);
  };

  // Quick Session Status Modal State for Nurses
  const [quickStatusSession, setQuickStatusSession] = useState<DialysisSession | null>(null);
  const [quickStatusValue, setQuickStatusValue] = useState<SessionStatus>('SEDANG_DIALISIS');
  const [quickStatusReason, setQuickStatusReason] = useState<string>('');

  // Warning Modal State for Nurses when session starts
  const [showNurseStartWarningModal, setShowNurseStartWarningModal] = useState<boolean>(false);

  // Unstarted sessions count (checked in / assigned station but not SEDANG_DIALISIS)
  const unstartedSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'SUDAH_HADIR' || (s.chair_number && s.status === 'BELUM_HADIR'));
  }, [sessions]);

  const openQuickStatusForPatient = (patient: Patient) => {
    let sess = sessions.find(s => s.patient_id === patient.id);
    if (!sess) {
      const nowStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
      sess = {
        id: Math.floor(Math.random() * 900000) + 100000,
        patient_id: patient.id,
        patient_id_code: patient.patient_id_code,
        patient_name: patient.name,
        chair_id: 1,
        chair_number: patient.assigned_chair || 'B-01',
        scheduled_date: new Date().toISOString().slice(0, 10),
        scheduled_time: '08:00 AM',
        status: 'SEDANG_DIALISIS',
        dry_weight_kg: patient.dry_weight_kg,
        pre_weight_kg: patient.latest_weight_kg || patient.dry_weight_kg + 1.5,
        target_uf_litres: 2.0,
        actual_start_time: nowStr,
        start_timestamp: Date.now(),
        pre_bp: patient.latest_bp || '135/85'
      };
      setSessions(prev => [sess!, ...prev]);
    }
    setQuickStatusSession(sess);
    setQuickStatusValue(sess.status);
    setQuickStatusReason(sess.status_reason || '');
  };

  const handleSaveQuickStatus = () => {
    if (!quickStatusSession) return;
    const nowStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
    const nowMs = Date.now();

    const updated: DialysisSession = {
      ...quickStatusSession,
      status: quickStatusValue,
      status_reason: quickStatusReason || undefined,
      actual_start_time: quickStatusValue === 'SEDANG_DIALISIS' ? (quickStatusSession.actual_start_time || nowStr) : quickStatusSession.actual_start_time,
      start_timestamp: quickStatusValue === 'SEDANG_DIALISIS' ? (quickStatusSession.start_timestamp || nowMs) : quickStatusSession.start_timestamp,
      actual_end_time: (quickStatusValue === 'SUDAH_SELESAI' || quickStatusValue === 'GAGAL_HABIS_DIALISIS' || quickStatusValue === 'TAMAT_AWAL') ? (quickStatusSession.actual_end_time || nowStr) : quickStatusSession.actual_end_time,
      updated_at: new Date().toISOString()
    };

    setSessions(prev => {
      const next = prev.map(s => s.id === updated.id ? updated : s);
      try {
        localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (onUpdateSession) onUpdateSession(updated);

    if (onAuditLog) {
      onAuditLog(
        'TUKAR_STATUS_SESI',
        `Jururawat ${currentNurseName} menukar status pesakit ${quickStatusSession.patient_name} (${quickStatusSession.patient_id_code}) kepada '${quickStatusValue.replace(/_/g, ' ')}'${quickStatusReason ? ` (Sebab: ${quickStatusReason})` : ''}.`
      );
    }

    showToast(`✓ Status pesakit ${quickStatusSession.patient_name} ditukar kepada '${quickStatusValue.replace(/_/g, ' ')}'`);
    setQuickStatusSession(null);
  };

  const handleBatchStartDialysis = () => {
    const nowStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
    const nowMs = Date.now();

    setSessions(prev => {
      const next = prev.map(s => {
        if (s.status === 'SUDAH_HADIR' || (s.chair_number && s.status === 'BELUM_HADIR')) {
          return {
            ...s,
            status: 'SEDANG_DIALISIS' as SessionStatus,
            actual_start_time: s.actual_start_time || nowStr,
            start_timestamp: nowMs,
            updated_at: new Date().toISOString()
          };
        }
        return s;
      });
      try {
        localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (onAuditLog) {
      onAuditLog(
        'MULA_BATCH_DIALISIS',
        `Jururawat ${currentNurseName} menukar pukal ${unstartedSessions.length} pesakit kepada 'SEDANG DIALISIS'.`
      );
    }

    showToast(`✓ Berjaya menukar status ${unstartedSessions.length} pesakit kepada 'SEDANG DIALISIS' & memulakan timer 4 jam!`);
    setShowNurseStartWarningModal(false);
  };

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to extract last 9 dialysis session weights for a patient
  const getPatientWeightHistory = (patientId: number, dryWeight: number) => {
    // Find all actual sessions for this patient that have pre_weight_kg
    const actualPatientSessions = sessions
      .filter(s => s.patient_id === patientId && s.pre_weight_kg)
      .map(s => ({
        date: s.scheduled_date ? s.scheduled_date.slice(5) : 'Hari Ini', // mm-dd format
        weight: Number(s.pre_weight_kg),
        isActual: true,
      }));

    // Pad with realistic historical sessions to complete 9 points
    const needed = 9 - actualPatientSessions.length;
    const history = [...actualPatientSessions];

    for (let i = 1; i <= needed; i++) {
      // Fluctuate weights around target dry weight + (1.2 to 2.8 kg)
      const seed = (Math.sin(i * 1.7) * 1.1) + 1.8;
      const date = new Date();
      date.setDate(date.getDate() - (i * 2.5)); // 2.5 days spacing approx
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dateStr = `${month}-${day}`;

      history.push({
        date: dateStr,
        weight: Number((dryWeight + seed).toFixed(1)),
        isActual: false,
      });
    }

    // Sort chronologically (oldest to newest)
    return history.slice(0, 9).reverse();
  };

  // Computed Real-Time Counters (Mandatory 24 / 18 / 14 / 4 / 6)
  const stats = useMemo(() => {
    const total = sessions.length;
    const selesai = sessions.filter(s => s.status === 'SUDAH_SELESAI').length;
    const sedang = sessions.filter(s => s.status === 'SEDANG_DIALISIS').length;
    const hadir = sessions.filter(s => s.status === 'SUDAH_HADIR' || s.status === 'SEDANG_DIALISIS' || s.status === 'SUDAH_SELESAI').length;
    const belum = sessions.filter(s => s.status === 'BELUM_HADIR').length;
    return { total, hadir, sedang, selesai, belum };
  }, [sessions]);

  // Filtered Sessions List
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchQuery = 
        s.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.patient_id_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.chair_number.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;
      if (statusFilter === 'SEMUA') return true;
      return s.status === statusFilter;
    });
  }, [sessions, searchQuery, statusFilter]);

  // ACTION: MANUAL STATION & MACHINE ALLOCATION (FCFS WORKFLOW)
  const handleManualStationAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningPatient) return;

    const currentTimeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Update queue list
    const updatedQueue = queueList.map(item => {
      if (item.id === assigningPatient.id) {
        return {
          ...item,
          status: 'SEDANG_DIALISIS' as const,
          assigned_chair: selectedChairNumber,
          assigned_machine_model: selectedMachineModel,
          assigned_nurse_name: currentNurseName,
          called_at: currentTimeStr
        };
      }
      return item;
    });
    setQueueList(updatedQueue);
    try {
      localStorage.setItem('kaizenbros_queue', JSON.stringify(updatedQueue));
    } catch {}

    // Update or create active session
    setSessions(prev => {
      const existing = prev.find(s => s.patient_id === assigningPatient.patient_id);
      const preW = assigningPatient.pre_weight_kg || 70.0;
      const dryW = assigningPatient.dry_weight_kg || 68.0;
      const targetUf = +(Math.max(0, preW - dryW) + 0.3).toFixed(1);

      if (existing) {
        return prev.map(s => {
          if (s.id === existing.id) {
            return {
              ...s,
              chair_number: selectedChairNumber,
              machine_model: selectedMachineModel,
              dialyzer_type: selectedDialyzer,
              anticoagulant: selectedAnticoagulant,
              status: 'SEDANG_DIALISIS' as const,
              actual_start_time: currentTimeStr,
              pre_weight_kg: preW,
              target_uf_litres: targetUf,
              actual_uf_litres: 0.1,
              nurse_in_charge: currentNurseName
            };
          }
          return s;
        });
      } else {
        const newSession: DialysisSession = {
          id: Date.now(),
          session_code: `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${selectedChairNumber.replace('B-', '')}`,
          patient_id: assigningPatient.patient_id,
          patient_id_code: assigningPatient.patient_id_code,
          patient_name: assigningPatient.patient_name,
          chair_id: parseInt(selectedChairNumber.replace('B-', ''), 10) || 1,
          chair_number: selectedChairNumber,
          machine_id: parseInt(selectedChairNumber.replace('B-', ''), 10) || 1,
          machine_model: selectedMachineModel,
          scheduled_date: new Date().toISOString().slice(0, 10),
          scheduled_shift: 'PETANG',
          scheduled_time: '2:00 PM',
          actual_start_time: currentTimeStr,
          status: 'SEDANG_DIALISIS',
          dry_weight_kg: dryW,
          pre_weight_kg: preW,
          target_uf_litres: targetUf,
          actual_uf_litres: 0.1,
          pre_bp: assigningPatient.pre_bp || '140/80',
          current_bp: assigningPatient.pre_bp || '140/80',
          dialyzer_type: selectedDialyzer,
          anticoagulant: selectedAnticoagulant,
          nurse_in_charge: currentNurseName,
          vital_signs: [
            {
              id: Date.now(),
              dialysis_session_id: Date.now(),
              recorded_at: currentTimeStr,
              phase: 'PRE_DIALYSIS',
              systolic_bp: parseInt((assigningPatient.pre_bp || '140/80').split('/')[0], 10) || 140,
              diastolic_bp: parseInt((assigningPatient.pre_bp || '140/80').split('/')[1], 10) || 80,
              pulse_rate: 76,
              nurse_name: currentNurseName
            }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return [newSession, ...prev];
      }
    });

    if (onAuditLog) {
      onAuditLog(
        'PENUGASAN_STESEN_FCFS',
        `Jururawat ${currentNurseName} menugaskan Stesen Kerusi ${selectedChairNumber} (${selectedMachineModel}) kepada pesakit ${assigningPatient.patient_name} (Giliran ${assigningPatient.queue_number}). Rawatan dialisis dimulakan.`
      );
    }

    if (onAssignStation) {
      onAssignStation(assigningPatient.patient_id, selectedChairNumber, selectedMachineModel);
    }

    showToast(`✓ Pesakit ${assigningPatient.patient_name} berjaya ditugaskan ke Kerusi ${selectedChairNumber}.`);
    setAssigningPatient(null);
  };

  // ACTION: CLEAR ALL PATIENT QUEUE (KOSONGKAN PAPAN GILIRAN)
  const handleClearQueue = () => {
    if (confirm('Adakah anda pasti ingin mengosongkan semua senarai giliran ketibaan pesakit hari ini?')) {
      setQueueList([]);
      setSessions(prev => prev.map(s => ({
        ...s,
        status: 'BELUM_HADIR' as SessionStatus,
        pre_weight_kg: undefined,
        pre_bp: undefined,
        current_bp: undefined,
        chair_number: '',
        machine_model: ''
      })));
      try {
        localStorage.setItem('kaizenbros_queue', JSON.stringify([]));
        localStorage.setItem('kaizenbros_sessions', JSON.stringify([]));
      } catch {}
      if (onClearQueue) {
        onClearQueue();
      }
      if (onAuditLog) {
        onAuditLog('RESET_PAPAN_GILIRAN', `Jururawat ${currentNurseName} telah mengosongkan semua senarai giliran ketibaan pesakit.`);
      }
      showToast('✓ Papan giliran ketibaan pesakit telah berjaya dikosongkan.');
    }
  };

  // ACTION: REMOVE SINGLE ITEM FROM QUEUE
  const handleRemoveFromQueue = (queueId: string, patientName: string) => {
    const updated = queueList.filter(q => q.id !== queueId);
    setQueueList(updated);
    try {
      localStorage.setItem('kaizenbros_queue', JSON.stringify(updated));
    } catch {}
    if (onAuditLog) {
      onAuditLog('KELUARKAN_GILIRAN', `Jururawat ${currentNurseName} mengeluarkan ${patientName} daripada giliran.`);
    }
    showToast(`✓ Rekod giliran ${patientName} telah dikeluarkan.`);
  };

  // ACTION: NURSE SHIFT ASSIGNMENT IN NURSE PORTAL
  const handleAssignNurseToShift = (nurseId: number, shift: ShiftSlot, bay: string, onDuty: boolean = true) => {
    const updated = nursesList.map(n => n.id === nurseId ? {
      ...n,
      shift_today: shift,
      assigned_bay: bay,
      is_on_duty: onDuty
    } : n);
    setNursesList(updated);
    try {
      localStorage.setItem('kaizenbros_nurses', JSON.stringify(updated));
    } catch {}
    const nurse = nursesList.find(n => n.id === nurseId);
    if (nurse && onAuditLog) {
      onAuditLog('TETAPAN_SYIF_JURURAWAT', `Sister/Jururawat menetapkan ${nurse.name} bagi Syif ${shift} di ${bay}.`);
    }
    showToast(`✓ Syif ${shift} dikemaskini untuk ${nurse?.name || 'Jururawat'}.`);
  };

  const handleToggleNurseDuty = (nurseId: number) => {
    const updated = nursesList.map(n => n.id === nurseId ? { ...n, is_on_duty: !n.is_on_duty } : n);
    setNursesList(updated);
    try {
      localStorage.setItem('kaizenbros_nurses', JSON.stringify(updated));
    } catch {}
    const nurse = nursesList.find(n => n.id === nurseId);
    if (nurse && onAuditLog) {
      onAuditLog('STATUS_TUGAS_JURURAWAT', `Status bertugas ${nurse.name}: ${!nurse.is_on_duty ? 'On Duty' : 'Off Duty'}`);
    }
    showToast(`✓ Status ${nurse?.name} ditukar kepada ${!nurse?.is_on_duty ? 'On Duty' : 'Off Duty'}.`);
  };

  // ACTION: NURSE FRONT-DESK ASSISTED CHECK-IN
  const handleNursePerformCounterCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patientsList.find(p => p.id === counterPatientId);
    if (!patient) return;

    const preW = parseFloat(counterWeight);
    if (isNaN(preW) || preW <= 20) {
      alert('Sila masukkan berat badan yang sah.');
      return;
    }

    const nextQNum = `Q-${(queueList.length + 1).toString().padStart(2, '0')}`;
    const currentTimeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    const finalBp = counterBp.trim() || '-';

    const newCheckIn: PatientCheckIn = {
      id: `CHK-${Date.now()}`,
      patient_id: patient.id,
      patient_id_code: patient.patient_id_code,
      patient_name: patient.name,
      queue_number: nextQNum,
      check_in_time: currentTimeStr,
      check_in_timestamp: Date.now(),
      shift: 'PETANG',
      status: 'MENUNGGU_GILIRAN',
      pre_weight_kg: preW,
      dry_weight_kg: patient.dry_weight_kg,
      pre_bp: finalBp,
      notes: counterNotes || 'Check-in di kaunter jururawat (FCFS).'
    };

    const updatedQueue = [...queueList, newCheckIn];
    setQueueList(updatedQueue);
    try {
      localStorage.setItem('kaizenbros_queue', JSON.stringify(updatedQueue));
    } catch {}

    if (onAuditLog) {
      onAuditLog(
        'CHECK_IN_KAUNTER_FCFS',
        `Pendaftaran ketibaan (Check-In) pesakit ${patient.name} (${patient.patient_id_code}) diterima di kaunter. No. Giliran: ${nextQNum}. Berat: ${preW}kg, BP: ${finalBp}`
      );
    }

    if (onCheckInPatient) {
      onCheckInPatient(patient.id, preW, finalBp, counterNotes);
    }

    showToast(`✓ ${patient.name} berjaya didaftar masuk (No Giliran: ${nextQNum}).`);
    setShowCounterCheckInModal(false);
    setCounterNotes('');
  };

  // ACTION 1: CHECK-IN PESAKIT
  const handlePerformCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForCheckIn) return;

    const preWeight = parseFloat(checkInWeight);
    const sys = parseInt(checkInSystolic, 10);
    const dia = parseInt(checkInDiastolic, 10);

    if (isNaN(preWeight) || isNaN(sys) || isNaN(dia)) {
      alert('Sila masukkan berat dan bacaan tekanan darah yang sah.');
      return;
    }

    const preBpStr = `${sys}/${dia}`;
    const newStatus: SessionStatus = checkInStartNow ? 'SEDANG_DIALISIS' : 'SUDAH_HADIR';
    const currentTimeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionForCheckIn.id) {
        return {
          ...s,
          pre_weight_kg: preWeight,
          pre_bp: preBpStr,
          current_bp: preBpStr,
          status: newStatus,
          actual_start_time: checkInStartNow ? currentTimeStr : undefined,
          target_uf_litres: +(Math.max(0, preWeight - s.dry_weight_kg) + 0.3).toFixed(1),
          actual_uf_litres: 0.1,
          nurse_in_charge: currentNurseName,
          vital_signs: [
            ...s.vital_signs,
            {
              id: Date.now(),
              dialysis_session_id: s.id,
              recorded_at: currentTimeStr,
              phase: 'PRE_DIALYSIS',
              systolic_bp: sys,
              diastolic_bp: dia,
              pulse_rate: 76,
              nurse_name: currentNurseName
            }
          ]
        };
      }
      return s;
    }));

    if (onAuditLog) {
      onAuditLog(
        'CHECK_IN_PESAKIT',
        `Check-in pesakit ${selectedSessionForCheckIn.patient_name} (${selectedSessionForCheckIn.patient_id_code}) di kerusi ${selectedSessionForCheckIn.chair_number}. Berat: ${preWeight}kg, BP: ${preBpStr}`
      );
    }

    showToast(`✓ Pesakit ${selectedSessionForCheckIn.patient_name} berjaya check-in.`);
    setSelectedSessionForCheckIn(null);
  };

  // ACTION 2: RECORD HOURLY READING
  const handleAddHourlyVital = () => {
    if (!selectedSessionForActive) return;
    const sys = parseInt(hourlySystolic, 10);
    const dia = parseInt(hourlyDiastolic, 10);
    if (isNaN(sys) || isNaN(dia)) {
      showToast('⚠️ Sila masukkan bacaan Systolic dan Diastolic.');
      return;
    }

    const bpStr = `${sys}/${dia}`;
    const timeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionForActive.id) {
        const updated = {
          ...s,
          current_bp: bpStr,
          vital_signs: [
            ...s.vital_signs,
            {
              id: Date.now(),
              dialysis_session_id: s.id,
              recorded_at: timeStr,
              phase: 'HOURLY' as const,
              systolic_bp: sys,
              diastolic_bp: dia,
              pulse_rate: 74,
              nurse_name: currentNurseName
            }
          ]
        };
        setSelectedSessionForActive(updated);
        if (onUpdateSession) onUpdateSession(updated);
        return updated;
      }
      return s;
    }));

    // Resolve alert if exists
    setAlerts(prev => prev.filter(a => !(a.session_id === selectedSessionForActive.id && a.alert_type === 'BP_INCOMPLETE')));

    setHourlySystolic('');
    setHourlyDiastolic('');
    showToast(`✓ Tekanan darah ${bpStr} berjaya direkodkan.`);
  };

  // ACTION 3: ADD CLINICAL NOTE
  const handleAddClinicalNote = () => {
    if (!selectedSessionForActive || !newNoteText.trim()) return;
    const timeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
    const noteEntry = `[${timeStr}] ${newNoteText.trim()}`;

    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionForActive.id) {
        const updatedNotes = s.notes ? `${s.notes}\n${noteEntry}` : noteEntry;
        const updated = { ...s, notes: updatedNotes };
        setSelectedSessionForActive(updated);
        if (onUpdateSession) onUpdateSession(updated);
        return updated;
      }
      return s;
    }));

    setNewNoteText('');
    showToast('✓ Rekod berjaya disimpan.');
  };

  // ACTION 4: FINISH DIALYSIS SESSION
  const handleFinishSession = () => {
    if (!selectedSessionForActive) return;
    const postW = parseFloat(finishWeight);
    const postSys = parseInt(finishSystolic, 10);
    const postDia = parseInt(finishDiastolic, 10);

    if (isNaN(postW) || isNaN(postSys) || isNaN(postDia)) {
      showToast('⚠️ Sila lengkapkan berat selepas dialisis dan tekanan darah akhir.');
      return;
    }

    const postBpStr = `${postSys}/${postDia}`;
    const actualUf = selectedSessionForActive.pre_weight_kg ? +(selectedSessionForActive.pre_weight_kg - postW).toFixed(2) : 1.5;
    const currentTimeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    const finishedSession: DialysisSession = {
      ...selectedSessionForActive,
      post_weight_kg: postW,
      post_bp: postBpStr,
      actual_uf_litres: actualUf,
      actual_end_time: currentTimeStr,
      status: 'SUDAH_SELESAI',
      nurse_in_charge: currentNurseName
    };

    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionForActive.id) {
        return finishedSession;
      }
      return s;
    }));

    try {
      localStorage.setItem('kaizenbros_sessions', JSON.stringify(
        sessions.map(s => s.id === selectedSessionForActive.id ? finishedSession : s)
      ));
    } catch {}

    if (onUpdateSession) {
      onUpdateSession(finishedSession);
    }

    // Update patient's latest record
    setPatientsList(prev => {
      const next = prev.map(p => {
        if (p.id === selectedSessionForActive.patient_id) {
          return {
            ...p,
            latest_weight_kg: postW,
            latest_bp: postBpStr
          };
        }
        return p;
      });
      try {
        localStorage.setItem('kaizenbros_patients', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Resolve any post-weight alerts for this session
    setAlerts(prev => prev.filter(a => !(a.session_id === selectedSessionForActive.id && a.alert_type === 'POST_WEIGHT_MISSING')));

    if (onAuditLog) {
      onAuditLog(
        'TAMATKAN_SESI_DIALISIS',
        `Sesi dialisis ditamatkan untuk ${selectedSessionForActive.patient_name}. Berat Selepas: ${postW}kg, BP Selepas: ${postBpStr}, Jumlah Cecair Ditapis: ${actualUf}L`
      );
    }

    showToast('✓ Sesi dialisis berjaya ditamatkan.');
    setShowFinishConfirm(false);
    setSelectedSessionForActive(null);
  };

  // ACTION 5: NURSE INPUTS / EDITS PRE & POST DIALYSIS WEIGHTS
  const handleSaveNurseWeights = () => {
    if (!weightModalSession) return;

    if (isNaN(weightModalPreWeight) || weightModalPreWeight <= 0) {
      setWeightModalError('Sila masukkan nilai Berat Pra-Dialisis yang sah.');
      return;
    }

    const postNum = weightModalPostWeight.trim() !== '' ? parseFloat(weightModalPostWeight) : undefined;
    if (postNum !== undefined && (isNaN(postNum) || postNum <= 0)) {
      setWeightModalError('Sila masukkan nilai Berat Selepas Dialisis yang sah.');
      return;
    }

    const preBpStr = `${weightModalPreSys.trim() || '138'}/${weightModalPreDia.trim() || '82'}`;
    const postBpStr = postNum !== undefined ? `${weightModalPostSys.trim() || '124'}/${weightModalPostDia.trim() || '78'}` : undefined;
    const actualUf = postNum !== undefined ? Number((weightModalPreWeight - postNum).toFixed(2)) : weightModalSession.actual_uf_litres;

    // Final status: if post-weight entered and currently not completed, can change to completed if chosen
    const finalStatus: SessionStatus = weightModalStatus;

    let updatedSessionObj: DialysisSession | null = null;

    setSessions(prev => {
      const next = prev.map(s => {
        if (s.id === weightModalSession.id) {
          updatedSessionObj = {
            ...s,
            pre_weight_kg: weightModalPreWeight,
            post_weight_kg: postNum,
            pre_bp: preBpStr,
            post_bp: postBpStr || s.post_bp,
            current_bp: postBpStr || preBpStr,
            actual_uf_litres: actualUf,
            status: finalStatus,
            nurse_in_charge: currentNurseName,
            updated_at: new Date().toISOString()
          };
          return updatedSessionObj;
        }
        return s;
      });
      try {
        localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (updatedSessionObj) {
      if (onUpdateSession) {
        onUpdateSession(updatedSessionObj);
      }
      if (selectedSessionForActive?.id === updatedSessionObj.id) {
        setSelectedSessionForActive(updatedSessionObj);
      }

      // Update patient's latest record
      setPatientsList(prev => {
        const next = prev.map(p => {
          if (p.id === updatedSessionObj!.patient_id) {
            return {
              ...p,
              latest_weight_kg: postNum ?? weightModalPreWeight,
              latest_bp: postBpStr || preBpStr
            };
          }
          return p;
        });
        try {
          localStorage.setItem('kaizenbros_patients', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (onAuditLog) {
        onAuditLog(
          'KEMASKINI_BERAT_JURURAWAT',
          `Jururawat ${currentNurseName} merekodkan: ${updatedSessionObj.patient_name} - Berat Pra: ${weightModalPreWeight}kg, Berat Selepas: ${postNum !== undefined ? `${postNum}kg` : 'Belum diisi'}, Cecair Ditapis: ${actualUf !== undefined ? `${actualUf}L` : '-'}.`
        );
      }

      showToast(`✓ Data berat ${updatedSessionObj.patient_name} (Pra: ${weightModalPreWeight}kg, Selepas: ${postNum !== undefined ? `${postNum}kg` : '-'}) berjaya disimpan.`);
      setWeightModalSession(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border-2 border-emerald-400 animate-slideDown">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP CLINICAL HEADER FOR NURSE */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">
                PORTAL KLINIKAL JURURAWAT
              </span>
              <span className="bg-cyan-950 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-800">
                LJM Diiktiraf
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                SELAMAT DATANG, <span className="text-cyan-400">{currentNurseName.toUpperCase()}</span>
              </h1>

              {onStaffLogout && (
                <button
                  onClick={onStaffLogout}
                  className="sm:hidden px-3 py-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center space-x-1 flex-shrink-0"
                  title="Log Keluar daripada sesi jururawat"
                >
                  <X className="w-3.5 h-3.5 text-rose-300" />
                  <span>Log Keluar</span>
                </button>
              )}
            </div>
            <p suppressHydrationWarning className="text-xs sm:text-sm text-slate-400 font-medium">
              🇲🇾 {malaysiaTime.formattedDate}
              {' • '}
              <span suppressHydrationWarning className="text-cyan-300 font-mono font-semibold">
                {malaysiaTime.formattedTime12 ? `${malaysiaTime.formattedTime12} MYT` : '--:--:-- MYT'}
              </span>
              {' • '}
              <strong suppressHydrationWarning className="text-emerald-300">
                {malaysiaTime.isMounted ? nurseShiftDisplay : 'Syif Jururawat Bertugas'}
              </strong>
            </p>
          </div>

          {/* Quick Actionable Alerts Pill */}
          {alerts.length > 0 && (
            <div className="bg-amber-950/80 border border-amber-600/80 rounded-2xl px-4 py-2 flex items-center space-x-3 text-amber-200">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 animate-pulse">
                <Bell className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="block text-amber-300 font-bold">🔔 {alerts.length} PERLU PERHATIAN</strong>
                <span className="text-slate-300">{alerts[0].message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Automatic Rollover Notice for Nurses when past 7:00 PM */}
        {malaysiaTime.isAfter7pm && (
          <div className="mt-4 bg-indigo-950/90 border-2 border-indigo-500 rounded-2xl p-4 flex items-start space-x-3 text-indigo-100 shadow-xl">
            <Moon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs space-y-1">
              <strong className="block text-cyan-300 font-bold text-sm">
                🌙 PEMBERITAHUAN KLINIKAL AUTOMATIK (LEPAS JAM 7:00 PM)
              </strong>
              <p className="text-slate-200 leading-relaxed">
                Waktu rawatan hemodialisis bagi syif hari ini telah tamat pada jam 7:00 PM. Sistem telah menyelaraskan tarikh dan waktu dialisis bagi setiap pesakit secara automatik kepada <strong>sesi dialisis seterusnya</strong> mengikut giliran tetap masing-masing (Isnin/Rabu/Jumaat atau Selasa/Khamis/Sabtu).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* NURSE NAVIGATION BAR (Only 6 Clean Items as Requested) */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-14 z-30 px-4 sm:px-8 backdrop-blur">
        <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveNav('hari_ini')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeNav === 'hari_ini'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>🏠 Hari Ini</span>
          </button>

          <button
            onClick={() => setActiveNav('jadual')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeNav === 'jadual'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>📅 Jadual Rawatan</span>
          </button>

          <button
            onClick={() => setActiveNav('pesakit')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeNav === 'pesakit'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Pesakit</span>
          </button>

          <button
            onClick={() => setActiveNav('sesi')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeNav === 'sesi'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>🩺 Sesi Dialisis</span>
          </button>

          <button
            onClick={() => setActiveNav('rekod')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeNav === 'rekod'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📋 Rekod</span>
          </button>

          <button
            onClick={() => setActiveNav('laporan')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeNav === 'laporan'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 Laporan</span>
          </button>

          <button
            onClick={() => setActiveNav('tetapan')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeNav === 'tetapan'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>⚙️ Tetapan</span>
          </button>
        </div>
      </div>

      {/* MAIN CLINICAL CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-8 space-y-6">
        
        {/* VIEW 1: HARI INI DASHBOARD */}
        {activeNav === 'hari_ini' && (
          <div className="space-y-6">
            {/* Warning Banner for Unstarted Sessions */}
            {unstartedSessions.length > 0 && (
              <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-500/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-950/40">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-black shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>PERINGATAN SYIF DIALISIS: {unstartedSessions.length} PESAKIT BELUM DITUKAR KE 'SEDANG DIALISIS'</span>
                    </h4>
                    <p className="text-xs text-amber-200 mt-0.5">
                      Sila tukar status pesakit ke <strong>'Sedang Dialisis'</strong> untuk memulakan pemantauan & timer 4 jam automatik.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleBatchStartDialysis}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center space-x-1"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>Mula Semua ({unstartedSessions.length})</span>
                  </button>
                  <button
                    onClick={() => setShowNurseStartWarningModal(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Lihat Senarai
                  </button>
                </div>
              </div>
            )}

            {/* MANDATORY 5 STATUS COUNTERS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* 1. JUMLAH PESAKIT */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  JUMLAH PESAKIT
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                  {stats.total}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Jadual hari ini (3 syif)</span>
              </div>

              {/* 2. SUDAH HADIR */}
              <div className="bg-slate-900 border-2 border-blue-900/60 rounded-2xl p-4 sm:p-5 shadow-sm">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                  SUDAH HADIR
                </span>
                <div className="text-3xl sm:text-4xl font-black text-blue-300 mt-1">
                  {stats.hadir}
                </div>
                <span className="text-[11px] text-blue-500/80 font-medium">Check-in selesai</span>
              </div>

              {/* 3. SEDANG DIALISIS */}
              <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-4 sm:p-5 shadow-md shadow-emerald-950/20">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mr-1.5 inline-block" />
                  SEDANG DIALISIS
                </span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-300 mt-1">
                  {stats.sedang}
                </div>
                <span className="text-[11px] text-emerald-500 font-medium">Aktif di mesin</span>
              </div>

              {/* 4. SUDAH SELESAI */}
              <div className="bg-slate-900 border-2 border-teal-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                  SUDAH SELESAI
                </span>
                <div className="text-3xl sm:text-4xl font-black text-teal-300 mt-1">
                  {stats.selesai}
                </div>
                <span className="text-[11px] text-teal-500 font-medium">Sesi tamat & discaj</span>
              </div>

              {/* 5. BELUM HADIR */}
              <div className="bg-slate-900 border-2 border-amber-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  BELUM HADIR
                </span>
                <div className="text-3xl sm:text-4xl font-black text-amber-300 mt-1">
                  {stats.belum}
                </div>
                <span className="text-[11px] text-amber-500 font-medium">Menunggu kedatangan</span>
              </div>
            </div>

            {/* FCFS LIVE ARRIVAL QUEUE & DYNAMIC STATION ASSIGNMENT DASHBOARD */}
            <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-950 text-indigo-300 text-xs font-black px-3 py-1 rounded-full border border-indigo-700 uppercase tracking-wider flex items-center">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mr-1.5" />
                      Sistem Giliran Fleksibel (First Come, First Served)
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {queueList.filter(q => q.status === 'MENUNGGU_GILIRAN').length} Menunggu Stesen / {queueList.length} Tiba
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center">
                    📋 Papan Giliran Ketibaan Pesakit Hari Ini
                  </h2>
                  <p className="text-xs text-slate-400">
                    Pesakit yang sampai dahulu dipanggil mengikut susunan masa tiba. Stesen kerusi dan mesin dialisis ditugaskan secara manual mengikut kekosongan semasa.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {queueList.length > 0 && (
                    <button
                      onClick={handleClearQueue}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-rose-950 active:bg-rose-900 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                      title="Kosongkan semua pesakit dalam papan giliran"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kosongkan Giliran</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowCounterCheckInModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Check-In Pesakit Kaunter</span>
                  </button>
                </div>
              </div>

              {/* Live Queue Cards / Empty State */}
              {queueList.length === 0 ? (
                <div className="bg-slate-950/80 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-900 text-slate-500 rounded-2xl flex items-center justify-center mx-auto border border-slate-800">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-base">Papan Giliran Ketibaan Kosong</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Tiada pesakit dalam giliran ketibaan hari ini. Pendaftaran masuk (check-in) dikendalikan sepenuhnya oleh jururawat di kaunter. Sila klik <strong>{'+ Check-In Pesakit Kaunter'}</strong> untuk mendaftar pesakit yang tiba.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setShowCounterCheckInModal(true)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all inline-flex items-center space-x-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Check-In Pesakit Pertama</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {queueList.map((item, idx) => {
                    const isWaiting = item.status === 'MENUNGGU_GILIRAN';
                    const isOnDialysis = item.status === 'SEDANG_DIALISIS';

                    const qPre = item.pre_weight_kg ? Number(item.pre_weight_kg) : 0;
                    const qDry = item.dry_weight_kg ? Number(item.dry_weight_kg) : 0;
                    const qExcess = qPre && qDry ? qPre - qDry : 0;
                    const qUrgent = qExcess > 2.0;

                    return (
                      <div
                        key={item.id}
                        className={`bg-slate-950 border-2 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-md ${
                          qUrgent
                            ? 'border-rose-600 shadow-rose-950/40 bg-gradient-to-br from-rose-950/20 to-slate-950'
                            : isWaiting
                            ? 'border-amber-500/90 shadow-amber-950/20 bg-gradient-to-br from-amber-950/20 to-slate-950'
                            : isOnDialysis
                            ? 'border-emerald-600/70 bg-gradient-to-br from-emerald-950/20 to-slate-950'
                            : 'border-slate-800 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-9 h-9 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 border ${
                              isWaiting 
                                ? 'bg-amber-500 text-slate-950 border-amber-400' 
                                : isOnDialysis 
                                ? 'bg-emerald-600 text-white border-emerald-400' 
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {item.queue_number}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="font-black text-white text-sm leading-tight">{item.patient_name}</h4>
                                {qUrgent && (
                                  <span className="animate-pulse bg-rose-950 text-rose-300 border border-rose-600 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center space-x-1 uppercase tracking-wider shrink-0">
                                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span>Urgent (+{qExcess.toFixed(1)}kg)</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 block">{item.patient_id_code}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                              isWaiting
                                ? 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
                                : isOnDialysis
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                : 'bg-teal-950 text-teal-300 border-teal-800'
                            }`}>
                              {isWaiting ? 'Menunggu Kerusi' : isOnDialysis ? `Di Kerusi ${item.assigned_chair}` : 'Selesai'}
                            </span>

                            <button
                              onClick={() => handleRemoveFromQueue(item.id, item.patient_name)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg cursor-pointer"
                              title="Keluarkan pesakit daripada senarai giliran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">Masa Tiba (FCFS)</span>
                            <span className="font-mono font-bold text-amber-300 text-xs">{item.check_in_time}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">Berat Semasa</span>
                            <span className="font-mono font-bold text-emerald-400 text-xs">{item.pre_weight_kg ? `${item.pre_weight_kg} kg` : '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">Tekanan Darah (BP)</span>
                            <span className="font-mono font-bold text-cyan-400 text-xs">{item.pre_bp || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">Stesen Ditugaskan</span>
                            <span className="font-mono font-bold text-white text-xs">{item.assigned_chair || 'Belum Dipilih'}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        {isWaiting ? (
                          <button
                            onClick={() => {
                              setAssigningPatient(item);
                              // Find first available chair
                              const activeChairs = new Set(sessions.filter(s => s.status === 'SEDANG_DIALISIS').map(s => s.chair_number));
                              const firstFree = INITIAL_CHAIRS.find(c => !activeChairs.has(c.chair_number));
                              if (firstFree) setSelectedChairNumber(firstFree.chair_number);
                            }}
                            className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Panggil & Tugaskan Stesen (Kerusi/Mesin)</span>
                          </button>
                        ) : isOnDialysis ? (
                          <button
                            onClick={() => {
                              const target = sessions.find(s => s.patient_id === item.patient_id);
                              if (target) setSelectedSessionForActive(target);
                            }}
                            className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span>Buka Pemantauan Sesi ({item.assigned_chair})</span>
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {alerts.length > 0 && (
              <div className="bg-amber-950/40 border-2 border-amber-600/70 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 font-black text-sm uppercase tracking-wider">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>🔔 PERLU PERHATIAN SEGERA</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alerts.map(a => (
                    <div key={a.id} className="bg-slate-900/90 border border-amber-800/80 rounded-xl p-3 flex justify-between items-start">
                      <div>
                        <strong className="text-white text-sm block font-bold">{a.patient_name} ({a.chair_number})</strong>
                        <p className="text-xs text-amber-300 mt-0.5">{a.message}</p>
                      </div>
                      <button
                        onClick={() => {
                          const targetSession = sessions.find(s => s.id === a.session_id);
                          if (targetSession) setSelectedSessionForActive(targetSession);
                        }}
                        className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg ml-2 flex-shrink-0 cursor-pointer"
                      >
                        Tindakan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEARCH AND FILTERS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="🔎 Cari nama / ID pesakit / no stesen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-cyan-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setStatusFilter('SEMUA')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'SEMUA' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Semua ({sessions.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('BELUM_HADIR')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'BELUM_HADIR' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Belum Hadir ({stats.belum})
                  </button>
                  <button
                    onClick={() => setStatusFilter('SEDANG_DIALISIS')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'SEDANG_DIALISIS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Sedang Dialisis ({stats.sedang})
                  </button>
                  <button
                    onClick={() => setStatusFilter('SUDAH_SELESAI')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'SUDAH_SELESAI' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Selesai ({stats.selesai})
                  </button>
                </div>
              </div>

              {/* TODAY'S PATIENTS CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredSessions.map((s) => {
                  const isSedang = s.status === 'SEDANG_DIALISIS';
                  const isSelesai = s.status === 'SUDAH_SELESAI';
                  const isBelum = s.status === 'BELUM_HADIR';
                  const isHadir = s.status === 'SUDAH_HADIR';

                  const preWeight = s.pre_weight_kg ? Number(s.pre_weight_kg) : 0;
                  const dryWeight = s.dry_weight_kg ? Number(s.dry_weight_kg) : 0;
                  const weightExcess = preWeight && dryWeight ? preWeight - dryWeight : 0;
                  const isExcessiveWeight = weightExcess > 2.0;

                  return (
                    <div
                      key={s.id}
                      className={`bg-slate-950 border-2 rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between space-y-4 ${
                        isExcessiveWeight
                          ? 'border-rose-600 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/30'
                          : isSedang 
                          ? 'border-emerald-500 shadow-md shadow-emerald-950/30' 
                          : isSelesai 
                          ? 'border-teal-700/60 opacity-90' 
                          : isHadir 
                          ? 'border-blue-600' 
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Header: Name, ID, Chair */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="text-lg font-black text-white leading-tight">
                                {s.patient_name.toUpperCase()}
                              </h3>
                              {isExcessiveWeight && (
                                <span className="animate-pulse inline-flex items-center text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-600 px-2.5 py-0.5 rounded-lg uppercase tracking-wider shrink-0">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mr-1 shrink-0" />
                                  <span>URGENT (+{weightExcess.toFixed(1)}kg)</span>
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-400">
                              {s.patient_id_code}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-400 block">Stesen</span>
                            <span className="text-xl font-black text-cyan-400">
                              {s.chair_number}
                            </span>
                          </div>
                        </div>

                        {/* Middle info */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-900 p-2 rounded-lg">
                            <span className="text-slate-400 block">Masa Temujanji</span>
                            <span className="font-bold text-white text-sm">{s.scheduled_time}</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg">
                            <span className="text-slate-400 block">Berat Kering</span>
                            <span className="font-bold text-emerald-400 text-sm">{s.dry_weight_kg} kg</span>
                          </div>

                          {s.pre_weight_kg && (
                            <div className="bg-slate-900 p-2 rounded-lg">
                              <span className="text-slate-400 block">Berat Sebelum</span>
                              <span className="font-bold text-white text-sm">{s.pre_weight_kg} kg</span>
                            </div>
                          )}

                          {s.post_weight_kg && (
                            <div className="bg-slate-900 p-2 rounded-lg">
                              <span className="text-slate-400 block">Berat Selepas</span>
                              <span className="font-bold text-cyan-300 text-sm">{s.post_weight_kg} kg</span>
                            </div>
                          )}

                          {s.pre_bp && (
                            <div className="bg-slate-900 p-2 rounded-lg">
                              <span className="text-slate-400 block">Tekanan Darah</span>
                              <span className="font-bold text-cyan-400 text-sm">{s.current_bp || s.pre_bp}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge & 4-Hour Countdown */}
                        <div className="mt-3 space-y-1.5">
                          <DialysisCountdownTimer session={s} />
                          {s.status_reason && (
                            <p className="text-[10px] text-amber-300/90 bg-amber-950/40 p-1.5 rounded-lg border border-amber-900/60 font-mono">
                              Catatan: {s.status_reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Main Action Buttons: Minimum 48px Touch Target */}
                      <div className="pt-2 flex items-center space-x-1.5">
                        {isBelum && (
                          <button
                            onClick={() => {
                              setSelectedSessionForCheckIn(s);
                              setCheckInWeight(s.dry_weight_kg ? (s.dry_weight_kg + 1.4).toFixed(1) : '76.4');
                              setCheckInSystolic('148');
                              setCheckInDiastolic('82');
                            }}
                            className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>CHECK-IN</span>
                          </button>
                        )}

                        {isSedang && (
                          <button
                            onClick={() => setSelectedSessionForActive(s)}
                            className="flex-1 min-h-[48px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                          >
                            <Stethoscope className="w-4 h-4" />
                            <span>[ BUKA SESI ]</span>
                          </button>
                        )}

                        {isSelesai && (
                          <button
                            onClick={() => setSelectedSessionForActive(s)}
                            className="flex-1 min-h-[48px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer border border-slate-700"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Lihat Rekod</span>
                          </button>
                        )}

                        {/* Quick Status Button */}
                        <button
                          onClick={() => {
                            setQuickStatusSession(s);
                            setQuickStatusValue(s.status);
                            setQuickStatusReason(s.status_reason || '');
                          }}
                          className="px-2.5 min-h-[48px] bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition-all shrink-0"
                          title="Tukar Status Sesi Pantas"
                        >
                          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="hidden sm:inline">Status</span>
                        </button>

                        {/* Direct Weight Entry & Update button */}
                        <button
                          onClick={() => openWeightModalForSession(s)}
                          className="px-2.5 min-h-[48px] bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-500 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition-all shrink-0"
                          title="Masukkan atau Kemaskini Berat Pra & After Dialisis"
                        >
                          <Scale className="w-4 h-4 text-cyan-400" />
                          <span className="hidden sm:inline">Berat</span>
                        </button>

                        <button
                          onClick={() => {
                            const foundPatient = patientsList.find(p => p.id === s.patient_id);
                            if (foundPatient) setWhatsAppPatient(foundPatient);
                          }}
                          className="px-3 min-h-[48px] bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-800 flex items-center justify-center space-x-1 cursor-pointer"
                          title="Hantar Peringatan Sesi (WhatsApp)"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>

                        <button
                          onClick={() => {
                            const foundPatient = patientsList.find(p => p.id === s.patient_id) || INITIAL_PATIENTS[0];
                            if (foundPatient) setSelectedPatientForDetail(foundPatient);
                          }}
                          className="px-3 min-h-[48px] bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center cursor-pointer"
                          title="Profil Pesakit"
                        >
                          Profil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1.5: JADUAL RAWATAN (DAILY & WEEKLY TREATMENT SCHEDULE) */}
        {activeNav === 'jadual' && (
          <TreatmentScheduleManager
            sessions={sessions}
            patients={patientsList}
            nurses={nursesList}
            onUpdateSession={(updated) => {
              setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
              try {
                localStorage.setItem('kaizenbros_sessions', JSON.stringify(sessions.map(s => s.id === updated.id ? updated : s)));
              } catch {}
            }}
            onAddSession={(newSess) => {
              const newId = sessions.length > 0 ? Math.max(...sessions.map(s => s.id)) + 1 : 1;
              const newObj: DialysisSession = { ...newSess, id: newId };
              setSessions(prev => [newObj, ...prev]);
              try {
                localStorage.setItem('kaizenbros_sessions', JSON.stringify([newObj, ...sessions]));
              } catch {}
            }}
            onDeleteSession={(sessionId) => {
              setSessions(prev => prev.filter(s => s.id !== sessionId));
              try {
                localStorage.setItem('kaizenbros_sessions', JSON.stringify(sessions.filter(s => s.id !== sessionId)));
              } catch {}
            }}
            onAuditLog={onAuditLog}
            isNurseView={true}
          />
        )}

        {/* VIEW 2: PESAKIT DIRECTORY */}
        {activeNav === 'pesakit' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">Senarai Pesakit Tetap</h2>
                <p className="text-xs text-slate-400">Pangkalan data pesakit hemodialisis KaizenBros Semenyih</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">ID / Nama Pesakit</th>
                      <th className="px-5 py-3.5">No. Kad Pengenalan & Umur</th>
                      <th className="px-5 py-3.5">Corak Jadual</th>
                      <th className="px-5 py-3.5">Stesen & Akses</th>
                      <th className="px-5 py-3.5">Status & Countdown (4 Jam)</th>
                      <th className="px-5 py-3.5">Berat Kering</th>
                      <th className="px-5 py-3.5">Penaja</th>
                      <th className="px-5 py-3.5 text-right">Tindakan Pantas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {patientsList.map((p) => {
                      const icData = parseMalaysianIC(p.ic_number);
                      const pSession = sessions.find(s => s.patient_id === p.id);

                      return (
                        <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="px-5 py-4 font-medium">
                            <strong className="text-white block font-bold text-base">{p.name}</strong>
                            <span className="text-xs font-mono text-cyan-400">{p.patient_id_code}</span>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs">
                            <span className="text-slate-200 block font-semibold">{p.ic_number}</span>
                            <span className="text-emerald-400 font-bold font-sans text-[11px] block mt-0.5">
                              {icData.ageDisplay || `${p.age} Tahun`}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <span className="font-semibold text-white block">{p.schedule_pattern.replace(/_/g, ' ')}</span>
                            <span className="text-slate-400">Syif {p.preferred_shift}</span>
                            {p.next_dialysis_date ? (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 mt-1">
                                Seterusnya: {p.next_dialysis_day}, {p.next_dialysis_time}
                              </span>
                            ) : (
                              (() => {
                                const next = calculateNextDialysis(p, malaysiaTime.effectiveDate);
                                return (
                                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 mt-1">
                                    Seterusnya: {next.dayName}, {next.timeRange}
                                  </span>
                                );
                              })()
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <strong className="text-cyan-400 block font-bold">{p.assigned_chair}</strong>
                            <span>{p.vascular_access}</span>
                          </td>
                          <td className="px-5 py-4">
                            <DialysisCountdownTimer session={pSession} />
                          </td>
                          <td className="px-5 py-4 font-bold text-emerald-400 text-base">{p.dry_weight_kg} kg</td>
                          <td className="px-5 py-4 text-xs">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">
                              {p.sponsor.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => openQuickStatusForPatient(p)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs rounded-lg cursor-pointer inline-flex items-center space-x-1 shadow"
                              title="Tukar Status Sesi Pesakit Hari Ini"
                            >
                              <Zap className="w-3.5 h-3.5 fill-slate-950" />
                              <span>Status</span>
                            </button>
                            <button
                              onClick={() => {
                                if (pSession) openWeightModalForSession(pSession);
                                else openQuickStatusForPatient(p);
                              }}
                              className="px-2.5 py-1.5 bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 font-bold text-xs rounded-lg cursor-pointer inline-flex items-center space-x-1"
                              title="Masukkan / Kemaskini Berat Pra & After Dialisis"
                            >
                              <Scale className="w-3.5 h-3.5 text-cyan-300" />
                              <span>Berat</span>
                            </button>
                            <button
                              onClick={() => setWhatsAppPatient(p)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center space-x-1 shadow"
                              title="Hantar Peringatan Sesi (WhatsApp)"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Peringatan</span>
                            </button>
                            <button
                              onClick={() => setSelectedPatientForDetail(p)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer border border-slate-700"
                            >
                              Profil
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SESI DIALISIS LIVE MONITOR */}
        {activeNav === 'sesi' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white flex items-center">
              <Stethoscope className="w-6 h-6 mr-2 text-cyan-400" />
              Pemantauan Stesen Dialisis (12 Kerusi Fresenius)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sessions.slice(0, 12).map((s) => {
                const isActive = s.status === 'SEDANG_DIALISIS';
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (isActive) setSelectedSessionForActive(s);
                      else if (s.status === 'BELUM_HADIR') setSelectedSessionForCheckIn(s);
                    }}
                    className={`bg-slate-900 border-2 rounded-2xl p-4 transition-all cursor-pointer ${
                      isActive 
                        ? 'border-emerald-500 hover:scale-[1.02] shadow-lg shadow-emerald-950/40' 
                        : 'border-slate-800 hover:border-slate-700 opacity-80'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-black text-cyan-400">{s.chair_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isActive ? 'Aktif' : s.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm truncate">{s.patient_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Mula: {s.actual_start_time || s.scheduled_time}</p>
                    
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pra:</span>
                        <strong className="text-amber-300 font-bold font-mono">{s.pre_weight_kg ? `${s.pre_weight_kg}kg` : '--'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Selepas:</span>
                        <strong className="text-cyan-300 font-bold font-mono">{s.post_weight_kg ? `${s.post_weight_kg}kg` : '--'}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openWeightModalForSession(s);
                      }}
                      className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-cyan-900/60 text-slate-200 hover:text-cyan-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center justify-center space-x-1 cursor-pointer transition-all"
                    >
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Input / Edit Berat</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: REKOD KLINIKAL */}
        {activeNav === 'rekod' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Rekod Sesi Dialisis Selesai</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="divide-y divide-slate-800">
                {sessions.filter(s => s.status === 'SUDAH_SELESAI').map(s => (
                  <div key={s.id} className="py-3 flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <strong className="text-white text-base block font-bold">{s.patient_name} ({s.patient_id_code})</strong>
                      <p className="text-xs text-slate-400">
                        {s.scheduled_date} | Stesen {s.chair_number} | {s.actual_start_time} - {s.actual_end_time}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Pra: <strong className="text-amber-300">{s.pre_weight_kg || '--'} kg</strong> (BP: {s.pre_bp || '--'}) • Selepas: <strong className="text-cyan-300">{s.post_weight_kg || '--'} kg</strong> (BP: {s.post_bp || '--'})
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Cecair Ditapis</span>
                        <strong className="text-cyan-400 text-sm font-bold">{s.actual_uf_litres ? `${s.actual_uf_litres} L` : '--'}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => openWeightModalForSession(s)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-600 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit Berat</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: LAPORAN OPERASI */}
        {activeNav === 'laporan' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-2xl font-black text-white">Laporan Operasi Klinikal Harian</h2>
                <p className="text-xs text-slate-400">Ringkasan kehadiran pesakit, penapisan ultrafiltration, dan kualiti rawatan</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," + 
                      "ID,Nama Pesakit,Stesen,Status,Berat Sebelum,Berat Selepas,BP Sebelum,BP Selepas,UF Ditapis\n" +
                      sessions.map(s => `${s.patient_id_code},${s.patient_name},${s.chair_number},${s.status},${s.pre_weight_kg || ''},${s.post_weight_kg || ''},${s.pre_bp || ''},${s.post_bp || ''},${s.actual_uf_litres || ''}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `laporan_dialisis_${new Date().toISOString().slice(0,10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    showToast('✓ Laporan CSV berjaya dimuat turun.');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Eksport CSV</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-semibold">Kadar Kehadiran Sesi</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">100%</div>
                <p className="text-xs text-slate-500 mt-1">Tiada pesakit tidak hadir (No-Show: 0)</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-semibold">Jumlah Cecair Dikeluarkan</span>
                <div className="text-3xl font-black text-cyan-400 mt-1">28.4 L</div>
                <p className="text-xs text-slate-500 mt-1">Purata 1.57 L setiap pesakit selesai</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-semibold">Insiden Klinikal</span>
                <div className="text-3xl font-black text-white mt-1">0</div>
                <p className="text-xs text-slate-500 mt-1">Tiada komplikasi hipotensi teruk dilaporkan</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: TETAPAN PUSAT & JADUAL BERTUGAS SYIF JURURAWAT */}
        {activeNav === 'tetapan' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-cyan-950 text-cyan-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-cyan-800 uppercase">
                    Tetapan Klinikal & Kakitangan
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Pusat Dialisis KaizenBros</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">Tetapan Pusat Dialisis & Syif Jururawat</h2>
                <p className="text-xs text-slate-400">
                  Urus penugasan jururawat bertugas mengikut 2 syif waktu operasi klinikal (5:30 AM - 3:00 PM & 12:00 PM - 8:00 PM).
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center space-x-3 text-xs">
                <span className="text-slate-400">Jururawat Log Masuk:</span>
                <strong className="text-cyan-300">{currentNurseName}</strong>
              </div>
            </div>

            {/* Shift Selector - 2 Clinical Shifts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'PAGI', label: 'Syif 1: Pagi (5:30 AM - 3:00 PM)', time: '5:30 AM - 3:00 PM' },
                { id: 'PETANG', label: 'Syif 2: Petang (12:00 PM - 8:00 PM)', time: '12:00 PM - 8:00 PM' }
              ].map(shift => {
                const isSelected = selectedShiftForNurseTetapan === shift.id;
                const onDutyCount = nursesList.filter(n => n.shift_today === shift.id && n.is_on_duty).length;
                const totalInShift = nursesList.filter(n => n.shift_today === shift.id).length;

                return (
                  <button
                    key={shift.id}
                    onClick={() => setSelectedShiftForNurseTetapan(shift.id as ShiftSlot)}
                    className={`p-5 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-950/80 to-slate-900 border-cyan-500 shadow-xl shadow-cyan-950/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <strong className="text-white text-base font-bold">{shift.label}</strong>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {onDutyCount} / {totalInShift} Bertugas
                      </span>
                    </div>
                    <p className="text-sm text-cyan-300 font-mono font-bold mt-1.5">{shift.time}</p>
                  </button>
                );
              })}
            </div>

            {/* Nurses In Selected Shift */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Jururawat Bertugas Bagi Syif {selectedShiftForNurseTetapan === 'PAGI' ? '1 (Pagi: 5:30 AM - 3:00 PM)' : '2 (Petang: 12:00 PM - 8:00 PM)'}:</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {nursesList.filter(n => n.shift_today === selectedShiftForNurseTetapan).length} Jururawat
                </span>
              </div>

              {nursesList.filter(n => n.shift_today === selectedShiftForNurseTetapan).length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
                  <p className="text-white font-bold text-xs">Tiada Jururawat Ditugaskan Bagi Syif {selectedShiftForNurseTetapan === 'PAGI' ? '1 (Pagi)' : '2 (Petang)'}</p>
                  <p className="text-slate-400 text-[11px]">Sila masukkan jururawat dari senarai di bawah ke dalam syif ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {nursesList
                    .filter(n => n.shift_today === selectedShiftForNurseTetapan)
                    .map((nurse) => (
                      <div key={nurse.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                              {nurse.staff_id_code}
                            </span>
                            <h4 className="font-bold text-white text-sm mt-1">{nurse.name}</h4>
                            <p className="text-[11px] text-slate-400">{nurse.title}</p>
                          </div>

                          <button
                            onClick={() => handleToggleNurseDuty(nurse.id)}
                            className={`text-[10px] font-black px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                              nurse.is_on_duty
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {nurse.is_on_duty ? '🟢 On Duty' : '⚪ Off Duty'}
                          </button>
                        </div>

                        <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800/80 text-slate-300">
                          <p><strong>LJM:</strong> <span className="font-mono text-slate-200">{nurse.nursing_board_no}</span></p>
                          
                          {/* Bay Assignment Selector */}
                          <div className="flex items-center space-x-2 pt-0.5">
                            <span className="font-bold text-white text-[11px]">Bay:</span>
                            <select
                              value={nurse.assigned_bay || 'BAY_A'}
                              onChange={(e) => handleAssignNurseToShift(nurse.id, nurse.shift_today, e.target.value, nurse.is_on_duty)}
                              className="bg-slate-900 border border-slate-700 text-cyan-300 rounded-lg px-2 py-1 text-[11px] font-bold"
                            >
                              <option value="BAY_A">Bay A (B01 - B06)</option>
                              <option value="BAY_B">Bay B (B07 - B11)</option>
                              <option value="ISOLATION">Bilik Isolasi (B12)</option>
                            </select>
                          </div>

                          {/* Shift Switcher */}
                          <div className="flex items-center space-x-2 pt-0.5">
                            <span className="font-bold text-white text-[11px]">Syif:</span>
                            <select
                              value={nurse.shift_today}
                              onChange={(e) => handleAssignNurseToShift(nurse.id, e.target.value as ShiftSlot, nurse.assigned_bay || 'BAY_A', nurse.is_on_duty)}
                              className="bg-slate-900 border border-slate-700 text-amber-300 rounded-lg px-2 py-1 text-[11px] font-bold"
                            >
                              <option value="PAGI">Syif 1: Pagi (5:30 AM - 3:00 PM)</option>
                              <option value="PETANG">Syif 2: Petang (12:00 PM - 8:00 PM)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Quick Add Other Nurses into this Shift */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">
                  + Masukkan Jururawat Lain ke Syif {selectedShiftForNurseTetapan === 'PAGI' ? '1 (5:30 AM - 3:00 PM)' : '2 (12:00 PM - 8:00 PM)'}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {nursesList
                    .filter(n => n.shift_today !== selectedShiftForNurseTetapan)
                    .map(nurse => (
                      <button
                        key={nurse.id}
                        onClick={() => handleAssignNurseToShift(nurse.id, selectedShiftForNurseTetapan, nurse.assigned_bay || 'BAY_A', true)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-900 border border-slate-700 hover:border-cyan-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{nurse.name} [Kini: Syif {nurse.shift_today === 'PAGI' ? '1 (Pagi)' : '2 (Petang)'}]</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Centre Profile Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white">{centreProfile.name}</h3>
                <span className="text-emerald-400 font-mono font-bold">Lesen: {centreProfile.kkm_license}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p><strong>Alamat:</strong> <span className="text-slate-300">{centreProfile.address}</span></p>
                  <p><strong>Telefon Utama:</strong> <span className="font-mono text-white">{centreProfile.phone_main}</span></p>
                  <p><strong>Hotline Kecemasan 24 Jam:</strong> <span className="font-mono text-rose-400 font-bold">{centreProfile.hotline_24h}</span></p>
                </div>
                <div className="space-y-1.5">
                  <p><strong>Pakar Nefrologi (PIC):</strong> <span className="text-cyan-300">{centreProfile.medical_director || 'Dr. Azman bin Khairuddin'}</span></p>
                  <p><strong>Ketua Jururawat (Sister):</strong> <span className="text-amber-300">{centreProfile.head_nurse || 'Sister Siti Fatimah'}</span></p>
                  <p><strong>Kapasiti Mesin:</strong> <span className="text-white font-bold">{centreProfile.capacity_machines} Stesen Mesin Fresenius</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CHECK-IN SCREEN (AS EXPLICITLY SPECIFIED IN PROMPT)               */}
      {/* Shows: Patient Name, Appointment: 2:00 PM, Chair: B-08,                   */}
      {/* Berat Sebelum: [ 76.4 ] kg, Tekanan Darah: [ 148 ] / [ 82 ],             */}
      {/* Button: [ SIMPAN & MULAKAN SESI ]                                         */}
      {/* ========================================================================= */}
      {selectedSessionForCheckIn && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl max-w-lg w-full p-6 sm:p-7 text-white space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                  CHECK-IN PESAKIT
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">
                  {selectedSessionForCheckIn.patient_name.toUpperCase()}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSessionForCheckIn(null)}
                className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            {/* Quick Context Bar */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block">Appointment</span>
                <strong className="text-lg font-bold text-white">
                  {selectedSessionForCheckIn.scheduled_time}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Chair</span>
                <strong className="text-2xl font-black text-cyan-400">
                  {selectedSessionForCheckIn.chair_number}
                </strong>
              </div>
            </div>

            <form onSubmit={handlePerformCheckIn} className="space-y-5">
              {/* Berat Sebelum */}
              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1.5">
                  Berat Sebelum:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={checkInWeight}
                    onChange={(e) => setCheckInWeight(e.target.value)}
                    className="w-full min-h-[56px] bg-slate-950 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl px-5 text-2xl font-black text-white tracking-wide"
                    placeholder="76.4"
                  />
                  <span className="absolute right-5 top-4 text-slate-400 text-lg font-bold">
                    kg
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Berat Kering: <strong className="text-emerald-400">{selectedSessionForCheckIn.dry_weight_kg} kg</strong>
                </p>

                {/* Patient Weight History Trend Chart (Last 9 Sessions) */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300 uppercase tracking-wider flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-cyan-400 animate-pulse" />
                      Trend Berat 9 Sesi Terakhir (kg)
                    </span>
                    <span className="text-[10px] bg-emerald-950/50 border border-emerald-900/60 px-2 py-0.5 rounded text-emerald-400 font-bold">
                      Target: {selectedSessionForCheckIn.dry_weight_kg} kg
                    </span>
                  </div>

                  <div className="h-[120px] w-full relative pt-2">
                    {(() => {
                      const historyData = getPatientWeightHistory(selectedSessionForCheckIn.patient_id, selectedSessionForCheckIn.dry_weight_kg);
                      const dryW = selectedSessionForCheckIn.dry_weight_kg;
                      
                      // Calculate min & max for vertical scaling
                      const weights = historyData.map(d => d.weight);
                      const minW = Math.min(...weights, dryW) - 1.0;
                      const maxW = Math.max(...weights, dryW) + 1.5;
                      const range = maxW - minW || 1;

                      // Map weights to SVG coordinates (width 400, height 80)
                      const width = 400;
                      const height = 80;
                      const points = historyData.map((d, index) => {
                        const x = (index / 8) * (width - 40) + 20;
                        const y = height - ((d.weight - minW) / range) * (height - 25) - 10;
                        return { x, y, ...d };
                      });

                      // Target line Y coordinate
                      const dryY = height - ((dryW - minW) / range) * (height - 25) - 10;

                      return (
                        <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-full overflow-visible select-none">
                          {/* Target Dry Weight Reference Line */}
                          <line 
                            x1="10" 
                            y1={dryY} 
                            x2={width - 10} 
                            y2={dryY} 
                            stroke="#10b981" 
                            strokeWidth="1.5" 
                            strokeDasharray="3,3" 
                            opacity="0.8" 
                          />
                          <text 
                            x={width - 10} 
                            y={dryY - 3} 
                            fill="#10b981" 
                            fontSize="8" 
                            fontWeight="bold" 
                            textAnchor="end"
                          >
                            DRY TARGET
                          </text>

                          {/* Connection line with beautiful gradient */}
                          <path
                            d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                            fill="none"
                            stroke="url(#weightChartGradient)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Color Gradient definitions */}
                          <defs>
                            <linearGradient id="weightChartGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="50%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#f43f5e" />
                            </linearGradient>
                          </defs>

                          {/* Plot circles & text tags */}
                          {points.map((p, i) => {
                            const isExcess = (p.weight - dryW) > 2.0;
                            return (
                              <g key={i}>
                                {/* Glowing outer ring for urgent excessive variance */}
                                <circle 
                                  cx={p.x} 
                                  cy={p.y} 
                                  r={isExcess ? "8" : "5"} 
                                  fill={isExcess ? '#f43f5e' : '#06b6d4'} 
                                  opacity="0.25" 
                                />
                                <circle 
                                  cx={p.x} 
                                  cy={p.y} 
                                  r="3.5" 
                                  fill={isExcess ? '#f43f5e' : '#06b6d4'} 
                                  stroke="#0f172a" 
                                  strokeWidth="1" 
                                />
                                
                                {/* Label representing the actual weight */}
                                <text 
                                  x={p.x} 
                                  y={p.y - 7} 
                                  fill={isExcess ? '#fb7185' : '#e2e8f0'} 
                                  fontSize="8" 
                                  fontWeight="black" 
                                  textAnchor="middle"
                                >
                                  {p.weight}
                                </text>

                                {/* Date underneath the point */}
                                <text 
                                  x={p.x} 
                                  y={height + 12} 
                                  fill="#64748b" 
                                  fontSize="7.5" 
                                  fontWeight="bold" 
                                  textAnchor="middle"
                                >
                                  {p.date}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal pt-1.5 text-center">
                    💡 <strong className="text-slate-300">Tip Klinikal:</strong> Bandingkan corak di atas untuk menentukan sama ada peningkatan berat &gt;2.0kg berlaku secara mengejut (*sudden*) atau sememangnya kronik (*chronic*).
                  </p>
                </div>
              </div>

              {/* Tekanan Darah */}
              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1.5">
                  Tekanan Darah:
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      required
                      value={checkInSystolic}
                      onChange={(e) => setCheckInSystolic(e.target.value)}
                      className="w-full min-h-[56px] bg-slate-950 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl px-4 text-2xl font-black text-white text-center"
                      placeholder="148"
                    />
                    <span className="text-[11px] text-slate-400 block text-center mt-1 font-semibold">Systolic</span>
                  </div>

                  <span className="text-3xl font-black text-slate-500">/</span>

                  <div className="flex-1">
                    <input
                      type="number"
                      required
                      value={checkInDiastolic}
                      onChange={(e) => setCheckInDiastolic(e.target.value)}
                      className="w-full min-h-[56px] bg-slate-950 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl px-4 text-2xl font-black text-white text-center"
                      placeholder="82"
                    />
                    <span className="text-[11px] text-slate-400 block text-center mt-1 font-semibold">Diastolic</span>
                  </div>
                </div>
              </div>

              {/* Option to start session immediately */}
              <div className="flex items-center space-x-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="start_now_toggle"
                  checked={checkInStartNow}
                  onChange={(e) => setCheckInStartNow(e.target.checked)}
                  className="w-5 h-5 text-emerald-500 rounded cursor-pointer accent-emerald-500"
                />
                <label htmlFor="start_now_toggle" className="text-sm font-medium text-slate-200 cursor-pointer">
                  Mulakan dialisis di mesin sekarang (Status: 🟢 Sedang Dialisis)
                </label>
              </div>

              {/* Submit Button (> 48px Touch Target) */}
              <button
                type="submit"
                className="w-full min-h-[58px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-lg sm:text-xl rounded-2xl shadow-xl shadow-emerald-950/40 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>[ SIMPAN & MULAKAN SESI ]</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ACTIVE DIALYSIS SCREEN (AS EXPLICITLY SPECIFIED IN PROMPT)        */}
      {/* Display: Patient Name, ID, 🟢 SEDANG DIALISIS, Chair, START time           */}
      {/* BERAT: Sebelum, Selepas, Berat Kering                                     */}
      {/* TEKANAN DARAH: Sebelum, Semasa, Selepas                                   */}
      {/* CATATAN: [ TAMBAH CATATAN ]                                               */}
      {/* Buttons: [ SIMPAN ], [ TAMATKAN SESI ]                                    */}
      {/* ========================================================================= */}
      {selectedSessionForActive && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-white space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {selectedSessionForActive.patient_name.toUpperCase()}
                </h3>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {selectedSessionForActive.patient_id_code}
                  </span>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    🟢 SEDANG DIALISIS
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-semibold">Stesen Kerusi</span>
                <span className="text-3xl font-black text-cyan-400">
                  {selectedSessionForActive.chair_number}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  START: {selectedSessionForActive.actual_start_time || '2:05 PM'}
                </span>
              </div>
            </div>

            {/* SECTION 1: BERAT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>BERAT (PRA & AFTER DIALISIS)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => openWeightModalForSession(selectedSessionForActive)}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Masukkan / Edit Berat</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-semibold">Sebelum (Pra)</span>
                  <strong className="text-xl font-bold text-amber-300 block mt-0.5 font-mono">
                    {selectedSessionForActive.pre_weight_kg || '--'} kg
                  </strong>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-semibold">Selepas (After)</span>
                  <strong className="text-xl font-bold text-cyan-400 block mt-0.5 font-mono">
                    {selectedSessionForActive.post_weight_kg ? `${selectedSessionForActive.post_weight_kg} kg` : '[ -- ]'}
                  </strong>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-semibold">Berat Kering</span>
                  <strong className="text-xl font-bold text-emerald-400 block mt-0.5 font-mono">
                    {selectedSessionForActive.dry_weight_kg} kg
                  </strong>
                </div>
              </div>
            </div>

            {/* SECTION 2: TEKANAN DARAH */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                TEKANAN DARAH
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Sebelum</span>
                  <strong className="text-xl font-bold text-white block mt-0.5">
                    {selectedSessionForActive.pre_bp || '--'}
                  </strong>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Semasa</span>
                  <strong className="text-xl font-bold text-emerald-400 block mt-0.5">
                    {selectedSessionForActive.current_bp || '[ -- ]'}
                  </strong>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Selepas</span>
                  <strong className="text-xl font-bold text-slate-400 block mt-0.5">
                    {selectedSessionForActive.post_bp || '[ -- ]'}
                  </strong>
                </div>
              </div>

              {/* Log Hourly BP Row */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 mt-2">
                <span className="text-xs font-bold text-slate-300">Kemaskini BP Jam Ini:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Sys"
                    value={hourlySystolic}
                    onChange={(e) => setHourlySystolic(e.target.value)}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-sm"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    placeholder="Dia"
                    value={hourlyDiastolic}
                    onChange={(e) => setHourlyDiastolic(e.target.value)}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddHourlyVital}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Rekod BP
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 3: CATATAN */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                CATATAN KLINIKAL
              </h4>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 min-h-[70px] max-h-32 overflow-y-auto text-sm text-slate-200 whitespace-pre-line">
                {selectedSessionForActive.notes || 'Tiada catatan tambahan setakat ini.'}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Taip nota pemerhatian jururawat..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={handleAddClinicalNote}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  [ TAMBAH CATATAN ]
                </button>
              </div>
            </div>

            {/* FINISH CONFIRMATION SUB-FORM */}
            {showFinishConfirm && (
              <div className="p-5 bg-rose-950/40 border-2 border-rose-500 rounded-2xl space-y-4 animate-fadeIn">
                <h4 className="font-black text-rose-400 text-base">
                  Lengkapkan Maklumat Penamat Sesi:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">Berat Selepas (kg):</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="contoh: 75.0"
                      value={finishWeight}
                      onChange={(e) => setFinishWeight(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-lg font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">BP Akhir (Systolic / Diastolic):</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="128"
                        value={finishSystolic}
                        onChange={(e) => setFinishSystolic(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-lg font-bold text-white text-center"
                      />
                      <span>/</span>
                      <input
                        type="number"
                        placeholder="76"
                        value={finishDiastolic}
                        onChange={(e) => setFinishDiastolic(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-lg font-bold text-white text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleFinishSession}
                    className="flex-1 min-h-[48px] bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-base cursor-pointer shadow-lg"
                  >
                    Sahkan & Tamatkan Sesi Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFinishConfirm(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 4: ACTIONS [ SIMPAN ] & [ TAMATKAN SESI ] */}
            {!showFinishConfirm && (
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    showToast('✓ Rekod berjaya disimpan.');
                    setSelectedSessionForActive(null);
                  }}
                  className="w-full sm:flex-1 min-h-[50px] bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-base cursor-pointer border border-slate-700 flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>[ SIMPAN ]</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFinishWeight(selectedSessionForActive.dry_weight_kg ? selectedSessionForActive.dry_weight_kg.toString() : '75.0');
                    setShowFinishConfirm(true);
                  }}
                  className="w-full sm:flex-1 min-h-[50px] bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black rounded-xl text-base cursor-pointer shadow-lg shadow-rose-950/40 flex items-center justify-center space-x-2"
                >
                  <Square className="w-5 h-5 fill-white" />
                  <span>[ TAMATKAN SESI ]</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL STATION & MACHINE ALLOCATION (FCFS WORKFLOW)               */}
      {/* ========================================================================= */}
      {assigningPatient && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-2xl w-full p-6 text-white space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-700 font-mono font-black text-sm">
                  {assigningPatient.queue_number}
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    Penugasan Stesen Fleksibel (First Come, First Served)
                  </span>
                  <h3 className="text-lg font-black text-white">
                    Panggil Masuk: {assigningPatient.patient_name}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setAssigningPatient(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualStationAllocation} className="space-y-4 text-xs">
              {/* Patient Quick Vitals Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">No. ID Pesakit</span>
                  <strong className="text-white font-mono">{assigningPatient.patient_id_code}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Masa Tiba</span>
                  <strong className="text-amber-300 font-mono">{assigningPatient.check_in_time}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Berat Tiba / Kering</span>
                  <strong className="text-emerald-400 font-mono">
                    {assigningPatient.pre_weight_kg || 70} kg / {assigningPatient.dry_weight_kg || 68} kg
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">BP Semasa Tiba</span>
                  <strong className="text-cyan-400 font-mono">{assigningPatient.pre_bp || '140/80'}</strong>
                </div>
              </div>

              {/* 12-Chair Status & Selection Grid */}
              <div>
                <label className="block font-black text-sm text-slate-200 mb-2 flex items-center justify-between">
                  <span>Pilih Kerusi Hemodialisis (12 Stesen) *</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    🟢 Hijau = Kosong/Sedia | 🔵 Biru = Sedang Digunakan
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {INITIAL_CHAIRS.map((chair) => {
                    const activeSession = sessions.find(
                      s => s.chair_number === chair.chair_number && s.status === 'SEDANG_DIALISIS'
                    );
                    const isOccupied = !!activeSession;
                    const isSelected = selectedChairNumber === chair.chair_number;

                    return (
                      <button
                        key={chair.id}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => {
                          setSelectedChairNumber(chair.chair_number);
                          const mach = INITIAL_MACHINES.find(m => m.chair_number === chair.chair_number);
                          if (mach) setSelectedMachineModel(mach.brand_model);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isOccupied
                            ? 'bg-slate-950/80 border-slate-800 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-amber-500/20 border-amber-400 shadow-lg ring-2 ring-amber-400/50'
                            : 'bg-slate-950 hover:bg-slate-850 border-emerald-700/60 hover:border-emerald-500 cursor-pointer'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-mono font-black text-sm ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                            {chair.chair_number}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-blue-500' : 'bg-emerald-400'}`} />
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {chair.bay === 'ISOLATION' ? 'Isolasi Khas' : chair.bay.replace('_', ' ')}
                        </p>
                        <p className={`text-[10px] font-bold mt-1 truncate ${
                          isOccupied ? 'text-blue-400' : isSelected ? 'text-amber-300' : 'text-emerald-400'
                        }`}>
                          {isOccupied ? `Diisi: ${activeSession?.patient_name?.split(' ')[0]}` : '● SEDIA / KOSONG'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Machine & Dialysis Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Model Mesin Dialisis</label>
                  <select
                    value={selectedMachineModel}
                    onChange={(e) => setSelectedMachineModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    <option value="Fresenius 4008S NG">Fresenius 4008S NG (Standard HD)</option>
                    <option value="Fresenius 5008S CorDiax (Online HDF)">Fresenius 5008S CorDiax (Online HDF)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Jenis Dialyzer (Penapis)</label>
                  <select
                    value={selectedDialyzer}
                    onChange={(e) => setSelectedDialyzer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    <option value="Fresenius FX80 Cordiax">Fresenius FX80 Cordiax (High Flux)</option>
                    <option value="Fresenius FX60 Cordiax">Fresenius FX60 Cordiax (Low/Mid Flux)</option>
                    <option value="Elisio 17M Polynephron">Elisio 17M Polynephron</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Preskripsi Antikoagulan (Heparin / LMWH)</label>
                <input
                  type="text"
                  value={selectedAnticoagulant}
                  onChange={(e) => setSelectedAnticoagulant(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-[11px] text-amber-200">
                ⚠️ <strong>Pengesahan Stesen:</strong> Menekan butang di bawah akan menandakan Kerusi <strong>{selectedChairNumber}</strong> sebagai SEDANG DIGUNAKAN, memulakan pemasa rawatan, dan merekodkan giliran masuk pesakit secara rasmi.
              </div>

              <div className="pt-2 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningPatient(null)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl transition-all shadow-xl cursor-pointer flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Sahkan Penugasan Kerusi {selectedChairNumber} & Mula Dialisis</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FRONT-DESK ASSISTED CHECK-IN                                       */}
      {/* ========================================================================= */}
      {showCounterCheckInModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    Kaunter Pendaftaran Masuk
                  </span>
                  <h3 className="text-lg font-black text-white">Check-In Pesakit Tiba</h3>
                </div>
              </div>
              <button 
                onClick={() => setShowCounterCheckInModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleNursePerformCounterCheckIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Pilih Pesakit yang Tiba *</label>
                {patientsList.length === 0 ? (
                  <div className="bg-slate-950 border border-amber-600/60 rounded-xl p-3 text-amber-300 text-xs">
                    Tiada pesakit berdaftar lagi dalam sistem. Sila daftar pesakit baru terlebih dahulu di Portal Pentadbir.
                  </div>
                ) : (
                  <select
                    value={counterPatientId || patientsList[0]?.id}
                    onChange={(e) => {
                      const pid = parseInt(e.target.value, 10);
                      setCounterPatientId(pid);
                      const p = patientsList.find(pt => pt.id === pid);
                      if (p) {
                        setCounterWeight((p.latest_weight_kg || p.dry_weight_kg || 70).toString());
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm"
                  >
                    {patientsList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patient_id_code}) • Syif {p.preferred_shift} • Kering: {p.dry_weight_kg}kg
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Berat Semasa Tiba (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={counterWeight}
                    onChange={(e) => setCounterWeight(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-emerald-500 rounded-xl p-2.5 text-white font-mono font-bold text-lg"
                    placeholder="Cth: 76.4"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-200">Tekanan Darah (BP)</label>
                    <span className="text-[10px] text-slate-400">Pilihan / Boleh Kosongkan</span>
                  </div>
                  <input
                    type="text"
                    value={counterBp}
                    onChange={(e) => setCounterBp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold text-lg"
                    placeholder="Cth: 148/82"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Catatan Tambahan (Pilihan)</label>
                <input
                  type="text"
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="Cth: Rasa sedikit pening, fistula tiada bengkak"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-[11px] text-emerald-200">
                ✓ Pesakit akan diberikan Nombor Giliran mengikut susunan masa ketibaan sekarang (First Come, First Served) dan dimasukkan ke dalam Senarai Menunggu Stesen.
              </div>

              <div className="pt-2 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCounterCheckInModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all shadow-lg cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Daftar Masuk Pesakit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PATIENT PROFILE — NURSE (AS EXPLICITLY SPECIFIED IN PROMPT)      */}
      {/* Organise into:                                                            */}
      {/* RINGKASAN, MAKLUMAT PESAKIT, JADUAL DIALISIS, REKOD DIALISIS,             */}
      {/* VITAL SIGNS, UBAT, CATATAN, DOKUMEN                                       */}
      {/* The summary must immediately show:                                        */}
      {/* Name, Patient ID, Age, Schedule, Chair, Dry weight, Current status,        */}
      {/* Last dialysis, Latest weight, Latest BP.                                  */}
      {/* ========================================================================= */}
      {selectedPatientForDetail && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl max-w-3xl w-full p-6 sm:p-8 text-white space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">
                  PROFIL KLINIKAL PESAKIT
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">
                  {selectedPatientForDetail.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedPatientForDetail.patient_id_code} | IC: {selectedPatientForDetail.ic_number}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPatientForDetail(null)}
                className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            {/* The 8 Specific Sub-Tabs */}
            <div className="flex space-x-1 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-bold">
              {[
                { id: 'ringkasan', label: 'RINGKASAN' },
                { id: 'maklumat', label: 'MAKLUMAT PESAKIT' },
                { id: 'jadual', label: 'JADUAL DIALISIS' },
                { id: 'rekod', label: 'REKOD DIALISIS' },
                { id: 'vitals', label: 'VITAL SIGNS' },
                { id: 'ubat', label: 'UBAT' },
                { id: 'catatan', label: 'CATATAN' },
                { id: 'dokumen', label: 'DOKUMEN' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setPatientDetailTab(t.id as any)}
                  className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    patientDetailTab === t.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: RINGKASAN (Mandatory 10 Summary Metrics) */}
            {patientDetailTab === 'ringkasan' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-semibold">Nama Pesakit</span>
                    <strong className="text-white text-base block truncate">{selectedPatientForDetail.name}</strong>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-semibold">Patient ID</span>
                    <strong className="text-cyan-400 text-base font-mono block">{selectedPatientForDetail.patient_id_code}</strong>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-semibold">Umur (Tahun & Hari)</span>
                    {(() => {
                      const icData = parseMalaysianIC(selectedPatientForDetail.ic_number);
                      return (
                        <div>
                          <strong className="text-emerald-400 text-sm font-black block">{icData.ageDisplay || `${selectedPatientForDetail.age} Tahun`}</strong>
                          <span className="text-[10px] text-slate-400">({selectedPatientForDetail.gender}) • Lahir: {icData.birthDateFormatted || '-'}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-semibold">Schedule</span>
                    <strong className="text-white text-sm block">{selectedPatientForDetail.schedule_pattern.replace(/_/g, ' ')}</strong>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-semibold">Chair</span>
                    <strong className="text-2xl font-black text-cyan-400 block">{selectedPatientForDetail.assigned_chair}</strong>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-semibold">Dry Weight</span>
                    <strong className="text-2xl font-black text-emerald-400 block">{selectedPatientForDetail.dry_weight_kg} kg</strong>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-semibold">Current Status</span>
                    <span className="inline-block mt-0.5 text-xs font-bold px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800">
                      Aktif Rawatan
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-semibold">Last Dialysis</span>
                    <strong className="text-white text-sm block">23 Sep 2026</strong>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-semibold">Latest Weight</span>
                    <strong className="text-white text-base block">{selectedPatientForDetail.latest_weight_kg || selectedPatientForDetail.dry_weight_kg} kg</strong>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400 block font-semibold">Latest BP</span>
                    <strong className="text-cyan-400 text-lg font-bold block">{selectedPatientForDetail.latest_bp || '148/82'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MAKLUMAT PESAKIT */}
            {patientDetailTab === 'maklumat' && (
              <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">No Telefon:</span>
                    <span className="font-bold text-white">{selectedPatientForDetail.phone}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Kumpulan Darah:</span>
                    <span className="font-bold text-emerald-400">{selectedPatientForDetail.blood_group}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Jenis Akses:</span>
                    <span className="font-bold text-white">{selectedPatientForDetail.vascular_access} ({selectedPatientForDetail.access_location})</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Penaja:</span>
                    <span className="font-bold text-cyan-400">{selectedPatientForDetail.sponsor.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400 block">Alamat Rumah:</span>
                  <span className="text-slate-200">{selectedPatientForDetail.address}</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DOKUMEN */}
            {patientDetailTab === 'dokumen' && (
              <div className="space-y-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <strong className="text-white text-sm block font-bold">Surat Rujukan Pakar Nefrologi</strong>
                    <span className="text-xs text-slate-400">Hospital Serdang (Jabatan Nefrologi)</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded">Disahkan KKM</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <strong className="text-white text-sm block font-bold">Laporan Ujian Serologi Hepatitis & HIV</strong>
                    <span className="text-xs text-slate-400">Status: HBsAg Negatif, Anti-HCV Negatif</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded">Disahkan</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedPatientForDetail(null)}
              className="w-full min-h-[48px] bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer text-sm"
            >
              Tutup Profil
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KHAS: MASUKKAN & KEMASKINI BERAT PRA & AFTER DIALISIS OLEH JURURAWAT */}
      {/* ========================================================================= */}
      {weightModalSession && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl max-w-xl w-full p-6 sm:p-7 text-white space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950 border-2 border-cyan-500 flex items-center justify-center text-cyan-300">
                  <Scale className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">
                    Kemasukan Data Klinikal Jururawat
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    {weightModalSession.patient_name.toUpperCase()}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setWeightModalSession(null)}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            {/* Context Info */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">ID Pesakit</span>
                <strong className="text-sm font-bold text-white font-mono">{weightModalSession.patient_id_code}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Stesen Kerusi</span>
                <strong className="text-lg font-black text-cyan-400">{weightModalSession.chair_number}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Sasaran Kering</span>
                <strong className="text-sm font-bold text-emerald-400 font-mono">{weightModalSession.dry_weight_kg} kg</strong>
              </div>
            </div>

            {weightModalError && (
              <div className="p-3 bg-rose-950 border border-rose-600 rounded-xl text-xs font-bold text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{weightModalError}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* SECTION 1: BERAT PRA-DIALISIS */}
              <div className="bg-slate-950 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>1. Berat Badan Pra-Dialisis (Sebelum Rawatan)</span>
                  </h4>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full font-bold">
                    Pra
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-bold block">
                    Berat Pra (kg):
                  </label>
                  <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-700 p-2 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setWeightModalPreWeight(prev => Number((Math.max(30, prev - 0.1)).toFixed(1)))}
                      className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-xl rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={weightModalPreWeight}
                        onChange={(e) => setWeightModalPreWeight(parseFloat(e.target.value) || 0)}
                        className="w-28 text-center font-mono font-black text-2xl text-amber-300 bg-transparent border-b border-slate-700 focus:border-amber-400 outline-none"
                      />
                      <span className="text-xs text-slate-400 font-bold ml-1">kg</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWeightModalPreWeight(prev => Number((prev + 0.1).toFixed(1)))}
                      className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-xl rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                    <span>Anggaran Kelebihan Cecair:</span>
                    <strong className={`font-mono font-bold ${weightModalPreWeight - weightModalSession.dry_weight_kg > 2.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      +{Number((weightModalPreWeight - weightModalSession.dry_weight_kg).toFixed(1))} kg vs kering
                    </strong>
                  </div>
                </div>

                {/* Pre BP */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] text-slate-400 block font-semibold">Systolic Pra:</label>
                    <input
                      type="number"
                      value={weightModalPreSys}
                      onChange={(e) => setWeightModalPreSys(e.target.value)}
                      placeholder="138"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block font-semibold">Diastolic Pra:</label>
                    <input
                      type="number"
                      value={weightModalPreDia}
                      onChange={(e) => setWeightModalPreDia(e.target.value)}
                      placeholder="82"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: BERAT SELEPAS DIALISIS */}
              <div className="bg-slate-950 border-2 border-cyan-500/60 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>2. Berat Badan Selepas Dialisis (After Dialisis)</span>
                  </h4>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                    After
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-bold block">
                    Berat Selepas / After (kg):
                  </label>
                  <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-700 p-2 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = weightModalPostWeight ? parseFloat(weightModalPostWeight) : weightModalSession.dry_weight_kg;
                        setWeightModalPostWeight((Math.max(30, cur - 0.1)).toFixed(1));
                      }}
                      className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-xl rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Contoh: 73.5"
                        value={weightModalPostWeight}
                        onChange={(e) => setWeightModalPostWeight(e.target.value)}
                        className="w-28 text-center font-mono font-black text-2xl text-cyan-300 bg-transparent border-b border-slate-700 focus:border-cyan-400 outline-none"
                      />
                      <span className="text-xs text-slate-400 font-bold ml-1">kg</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = weightModalPostWeight ? parseFloat(weightModalPostWeight) : weightModalSession.dry_weight_kg;
                        setWeightModalPostWeight((cur + 0.1).toFixed(1));
                      }}
                      className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-xl rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                    >
                      +
                    </button>
                  </div>

                  {weightModalPostWeight && !isNaN(parseFloat(weightModalPostWeight)) && (
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Cecair Ditapis (UF = Pra - Selepas):</span>
                        <strong className="text-emerald-400 font-mono font-bold text-sm">
                          {Number((weightModalPreWeight - parseFloat(weightModalPostWeight)).toFixed(2))} kg (Liter)
                        </strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Beza vs Sasaran Kering:</span>
                        <strong className="text-cyan-300 font-mono font-bold">
                          {parseFloat(weightModalPostWeight) >= weightModalSession.dry_weight_kg ? `+${(parseFloat(weightModalPostWeight) - weightModalSession.dry_weight_kg).toFixed(1)}` : `${(parseFloat(weightModalPostWeight) - weightModalSession.dry_weight_kg).toFixed(1)}`} kg
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Post BP */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] text-slate-400 block font-semibold">Systolic Selepas:</label>
                    <input
                      type="number"
                      value={weightModalPostSys}
                      onChange={(e) => setWeightModalPostSys(e.target.value)}
                      placeholder="124"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block font-semibold">Diastolic Selepas:</label>
                    <input
                      type="number"
                      value={weightModalPostDia}
                      onChange={(e) => setWeightModalPostDia(e.target.value)}
                      placeholder="78"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-center text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Status Session Option */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Status Sesi Rawatan:</span>
                  <span className="text-[11px] text-slate-400">Tentukan status terkini pesakit</span>
                </div>
                <select
                  value={weightModalStatus}
                  onChange={(e) => setWeightModalStatus(e.target.value as SessionStatus)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold outline-none cursor-pointer"
                >
                  <option value="SUDAH_HADIR">SUDAH HADIR</option>
                  <option value="SEDANG_DIALISIS">SEDANG DIALISIS</option>
                  <option value="SUDAH_SELESAI">SUDAH SELESAI</option>
                  <option value="BELUM_HADIR">BELUM HADIR</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setWeightModalSession(null)}
                className="flex-1 min-h-[48px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl cursor-pointer border border-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNurseWeights}
                className="flex-1 min-h-[48px] bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>SIMPAN DATA BERAT (PRA & AFTER)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={!!whatsAppPatient}
        onClose={() => setWhatsAppPatient(null)}
        patient={whatsAppPatient}
        onLogAudit={onAuditLog}
        onNavigateToSettings={() => setActiveNav('tetapan')}
      />

      {/* ========================================================================= */}
      {/* MODAL PANTAS: TUKAR STATUS SESI & SEBAB / CATATAN JURURAWAT */}
      {/* ========================================================================= */}
      {quickStatusSession && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Zap className="w-6 h-6 fill-slate-950" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold text-amber-400">Tukar Status Sesi Pantas</span>
                  <h3 className="text-xl font-black text-white">{quickStatusSession.patient_name}</h3>
                </div>
              </div>
              <button
                onClick={() => setQuickStatusSession(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Pilih Status Sesi Rawatan:</label>
                <select
                  value={quickStatusValue}
                  onChange={(e) => setQuickStatusValue(e.target.value as SessionStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold text-sm focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="SEDANG_DIALISIS">🟢 SEDANG DIALISIS (Sesi Bermula - Timer 4 Jam)</option>
                  <option value="SUDAH_SELESAI">✓ SUDAH SELESAI (Discaj Sempurna / Standard 4 Jam)</option>
                  <option value="GAGAL_HABIS_DIALISIS">⚠️ GAGAL HABIS DIALISIS (Isu Akses / Hipotensi)</option>
                  <option value="TAMAT_AWAL">🛑 TAMAT AWAL (Permintaan Pesakit / Gejala Klinikal)</option>
                  <option value="SUDAH_HADIR">🔵 SUDAH HADIR (Check-in - Menunggu Kerusi)</option>
                  <option value="BELUM_HADIR">⚪ BELUM HADIR</option>
                  <option value="BATAL">❌ BATAL SESI</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Sebab / Catatan Jururawat (Pilihan):</label>
                <textarea
                  rows={3}
                  value={quickStatusReason}
                  onChange={(e) => setQuickStatusReason(e.target.value)}
                  placeholder="Contoh: Pesakit mengalami cramp teruk pada jam ke-3 dan sesi ditamatkan awal..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Stesen Kerusi:</span>
                  <strong className="text-cyan-400">{quickStatusSession.chair_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Berat Pra:</span>
                  <strong className="text-amber-300">{quickStatusSession.pre_weight_kg ? `${quickStatusSession.pre_weight_kg} kg` : '-'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Berat After:</span>
                  <strong className="text-cyan-300">{quickStatusSession.post_weight_kg ? `${quickStatusSession.post_weight_kg} kg` : '-'}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setQuickStatusSession(null)}
                className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveQuickStatus}
                className="flex-1 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                KEMASKINI STATUS SESI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PERINGATAN SYIF JURURAWAT: MULA DIALISIS PUKAL */}
      {/* ========================================================================= */}
      {showNurseStartWarningModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Peringatan Status 'Sedang Dialisis'</h3>
                  <p className="text-xs text-amber-300">Tukar status untuk mengaktifkan timer 4 jam & auto-discaj</p>
                </div>
              </div>
              <button
                onClick={() => setShowNurseStartWarningModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Terdapat <strong>{unstartedSessions.length} pesakit</strong> telah hadir / berada di kerusi stesen tetapi status belum ditukar kepada <strong>'Sedang Dialisis'</strong>:
            </p>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {unstartedSessions.map(s => (
                <div key={s.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-white block">{s.patient_name}</strong>
                    <span className="text-slate-400 font-mono">Stesen {s.chair_number} • {s.status.replace(/_/g, ' ')}</span>
                  </div>
                  <button
                    onClick={() => {
                      const updated: DialysisSession = {
                        ...s,
                        status: 'SEDANG_DIALISIS',
                        actual_start_time: new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true }),
                        start_timestamp: Date.now(),
                        updated_at: new Date().toISOString()
                      };
                      setSessions(prev => prev.map(item => item.id === s.id ? updated : item));
                      if (onUpdateSession) onUpdateSession(updated);
                      showToast(`✓ Pesakit ${s.patient_name} ditukar ke 'Sedang Dialisis'`);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Mula Dialisis
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNurseStartWarningModal(false)}
                className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleBatchStartDialysis}
                className="flex-1 min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center space-x-1"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>TUKAR SEMUA KE SEDANG DIALISIS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
