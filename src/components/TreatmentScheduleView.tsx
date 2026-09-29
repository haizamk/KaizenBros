import React, { useState } from 'react';
import { NurseWalkthroughGuide } from './NurseWalkthroughGuide';
import { 
  TreatmentSession, 
  Patient, 
  SchedulePattern, 
  ShiftType,
  ShiftConfig 
} from '../types';
import { 
  Calendar, 
  Clock, 
  Layers, 
  UserCheck, 
  Send, 
  Plus, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  HeartPulse,
  Sliders,
  Shuffle,
  UserX,
  ArrowRightLeft,
  ShieldCheck,
  BellRing,
  Info,
  CheckCircle,
  GripVertical,
  Move,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  Server,
  Wrench
} from 'lucide-react';
import { 
  createSessionReminderMessage, 
  createOneHourReminderMessage, 
  buildWhatsAppLink 
} from '../utils/whatsappHelper';
import { ShiftManagementModal } from './ShiftManagementModal';
import { FCFSStationAssignModal } from './FCFSStationAssignModal';
import { PatientShiftReassignModal } from './PatientShiftReassignModal';

interface TreatmentScheduleViewProps {
  sessions: TreatmentSession[];
  patients: Patient[];
  shifts?: ShiftConfig[];
  onAddSession: (session: TreatmentSession) => void;
  onUpdateSession?: (session: TreatmentSession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onUpdatePatient?: (patient: Patient) => void;
  onSendNotification: (session: TreatmentSession, patient: Patient) => void;
  onAddShift?: (shift: ShiftConfig) => void;
  onUpdateShift?: (shift: ShiftConfig) => void;
  onDeleteShift?: (shiftId: string) => void;
}

export const TreatmentScheduleView: React.FC<TreatmentScheduleViewProps> = ({
  sessions = [],
  patients = [],
  shifts = [],
  onAddSession,
  onUpdateSession = (_s: TreatmentSession) => {},
  onDeleteSession = (_id: string) => {},
  onUpdatePatient = (_p: Patient) => {},
  onSendNotification,
  onAddShift,
  onUpdateShift,
  onDeleteShift
}) => {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeShifts = Array.isArray(shifts) ? shifts : [];
  const activeShifts = safeShifts.filter((s) => s.aktif);

  const [viewMode, setViewMode] = useState<'calendar' | 'roster'>('calendar');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Drag and Drop State for Visual Calendar
  const [draggedItem, setDraggedItem] = useState<{ patient: Patient; session: TreatmentSession } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const [selectedPattern, setSelectedPattern] = useState<SchedulePattern>('ISNIN_RABU_JUMAAT');
  const [selectedShift, setSelectedShift] = useState<ShiftType>('PAGI');

  const [showAddModal, setShowAddModal] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // FCFS Check-In Modal state
  const [isFCFSModalOpen, setIsFCFSModalOpen] = useState(false);
  const [selectedPatientForFCFS, setSelectedPatientForFCFS] = useState<Patient | null>(null);
  const [selectedSessionForFCFS, setSelectedSessionForFCFS] = useState<TreatmentSession | null>(null);

  // Reassign / Mark Absent Modal state
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedPatientForReassign, setSelectedPatientForReassign] = useState<Patient | null>(null);

  // Dialysis Machine Maintenance Status State (e.g. Stesen #4 under servicing)
  const [maintenanceStations, setMaintenanceStations] = useState<number[]>([4]);

  const toggleStationMaintenance = (stesenNo: number) => {
    if (maintenanceStations.includes(stesenNo)) {
      setMaintenanceStations(maintenanceStations.filter((s) => s !== stesenNo));
      setNotificationStatus(`✨ Stesen Mesin #${stesenNo} disahkan selesai diselenggara & kini TERSEDIA.`);
    } else {
      setMaintenanceStations([...maintenanceStations, stesenNo]);
      setNotificationStatus(`🔧 Stesen Mesin #${stesenNo} ditetapkan ke status PENYELENGGARAAN / SERVIS.`);
    }
    setTimeout(() => setNotificationStatus(null), 4000);
  };

  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Get dates for the selected week (Monday to Sunday)
  const getWeekDays = (offset = 0) => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMon + (offset * 7));

    const days = [];
    const dayNames = [
      { label: 'Isnin', pattern: 'ISNIN_RABU_JUMAAT' as SchedulePattern },
      { label: 'Selasa', pattern: 'SELASA_KHAMIS_SABTU' as SchedulePattern },
      { label: 'Rabu', pattern: 'ISNIN_RABU_JUMAAT' as SchedulePattern },
      { label: 'Khamis', pattern: 'SELASA_KHAMIS_SABTU' as SchedulePattern },
      { label: 'Jumaat', pattern: 'ISNIN_RABU_JUMAAT' as SchedulePattern },
      { label: 'Sabtu', pattern: 'SELASA_KHAMIS_SABTU' as SchedulePattern },
      { label: 'Ahad', pattern: 'SELASA_KHAMIS_SABTU' as SchedulePattern }
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dateObj: d,
        dayName: dayNames[i].label,
        pattern: dayNames[i].pattern,
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('ms-MY', { month: 'short' }),
        isToday: dateStr === todayStr
      });
    }
    return days;
  };

  const currentWeekDays = getWeekDays(weekOffset);

  // Helper to check if a session starts in less than 30 minutes (or is currently starting / pending start)
  const isSessionStartingSoon = (session: TreatmentSession, targetDateStr?: string): boolean => {
    if (
      session.status === 'SELESAI' || 
      session.status === 'BATAL' || 
      session.status === 'TIDAK_HADIR' || 
      session.status === 'SEDANG_BERJALAN' ||
      (session.stesenNo && session.stesenNo > 0)
    ) {
      return false;
    }

    const now = new Date();
    const dateStr = targetDateStr || session.tarikh || todayStr;

    // Check if session date is today
    if (dateStr !== todayStr) {
      return false;
    }

    const masaMula = session.masaMula;
    if (!masaMula) return false;

    // Extract hours and minutes (supports "06:00", "07:00", "07:00 AM", "14:00", "2:00 PM")
    const match = masaMula.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return false;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];

    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }

    const sessionStartInMins = hours * 60 + minutes;
    const currentInMins = now.getHours() * 60 + now.getMinutes();

    const diffInMins = sessionStartInMins - currentInMins;

    // Pulse animation if session is starting within 30 minutes or up to 60 mins past start time if not checked-in
    return diffInMins <= 30 && diffInMins >= -60;
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, patient: Patient, session: TreatmentSession) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ patientId: patient.id, sessionId: session.id }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ patient, session });
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDropOnCalendarSlot = (targetDay: { dateStr: string; dayName: string; pattern: SchedulePattern }, targetShift: ShiftType) => {
    setDragOverTarget(null);
    if (!draggedItem) return;

    const { patient, session } = draggedItem;

    const matchedShiftConfig = safeShifts.find(s => s.kod === targetShift);
    const updatedSession: TreatmentSession = {
      ...session,
      tarikh: targetDay.dateStr,
      corakHari: targetDay.pattern,
      shift: targetShift,
      masaMula: matchedShiftConfig?.masaMula || session.masaMula,
      masaTamat: matchedShiftConfig?.masaTamat || session.masaTamat,
      notaKlinikal: `Penukaran tarikh/shift via Drag-and-Drop: ${targetDay.dayName} (${targetDay.dateStr}), Shift ${targetShift}`
    };

    const updatedPatient: Patient = {
      ...patient,
      sesiJadual: {
        ...patient.sesiJadual,
        corakHari: targetDay.pattern,
        shift: targetShift
      }
    };

    onUpdateSession(updatedSession);
    onUpdatePatient(updatedPatient);

    setNotificationStatus(`✨ Drag & Drop Berjaya! ${patient.nama} dipindahkan ke ${targetDay.dayName} (${targetDay.dateStr}) - Shift ${targetShift}.`);
    setTimeout(() => setNotificationStatus(null), 5000);
    setDraggedItem(null);
  };

  const handleDropOnStationSlot = (stesenNo: number) => {
    setDragOverTarget(null);
    if (!draggedItem) return;

    const { patient, session } = draggedItem;

    const updatedSession: TreatmentSession = {
      ...session,
      stesenNo,
      status: 'SEDANG_BERJALAN',
      tarikh: todayStr,
      corakHari: selectedPattern,
      shift: selectedShift,
      notaKlinikal: `Ditugaskan ke Stesen #${stesenNo} via Drag-and-Drop`
    };

    onUpdateSession(updatedSession);

    setNotificationStatus(`🎯 Mesin Ditugaskan! ${patient.nama} dimasukkan ke Stesen Mesin #${stesenNo}.`);
    setTimeout(() => setNotificationStatus(null), 5000);
    setDraggedItem(null);
  };
  const currentShiftConfig = safeShifts.find((s) => s.kod === selectedShift);
  const masaMulaShift = currentShiftConfig?.masaMula || '07:00';
  const masaTamatShift = currentShiftConfig?.masaTamat || '11:00';

  // 1. MASTER FIXED SCHEDULED PATIENTS
  // Get all active patients whose master schedule matches current pattern & shift
  const masterAssignedPatients = safePatients.filter(
    (p) =>
      p.status === 'AKTIF' &&
      p.sesiJadual?.corakHari === selectedPattern &&
      p.sesiJadual?.shift === selectedShift
  );

  // 2. ACTIVE SESSIONS matching current pattern & shift
  const currentShiftSessions = safeSessions.filter(
    (s) => s.corakHari === selectedPattern && s.shift === selectedShift
  );

  // 3. MERGED ROSTER: Combine master assigned patients + actual session status
  const mergedRoster: Array<{ patient: Patient; session: TreatmentSession }> = masterAssignedPatients.map(
    (patient) => {
      const existing = currentShiftSessions.find((s) => s.patientId === patient.id);
      if (existing) {
        return { patient, session: existing };
      }
      // Virtual auto-populated session (FCFS Queue, stesenNo: 0)
      const autoSession: TreatmentSession = {
        id: `SES-AUTO-${patient.id}`,
        patientId: patient.id,
        patientName: patient.nama,
        tarikh: todayStr,
        corakHari: selectedPattern,
        shift: selectedShift,
        masaMula: masaMulaShift,
        masaTamat: masaTamatShift,
        stesenNo: 0, // 0 = FCFS Queue (Belum ditugaskan)
        status: 'AKAN_DATANG',
        jururawatBertugas: 'Sister Hanim binti Othman',
        ultrafiltrationGoal: 2.0,
        notaKlinikal: 'Auto-populasi dari Jadual Master Pesakit'
      };
      return { patient, session: autoSession };
    }
  );

  // Include ad-hoc replacement patients who are in currentShiftSessions but not in masterAssignedPatients
  currentShiftSessions.forEach((sess) => {
    if (!masterAssignedPatients.some((p) => p.id === sess.patientId)) {
      const p = safePatients.find((patient) => patient.id === sess.patientId);
      if (p) {
        mergedRoster.push({ patient: p, session: sess });
      }
    }
  });

  // Calculate occupied station numbers (1..12) in current shift
  const occupiedStationNumbers = currentShiftSessions
    .filter((s) => s.stesenNo > 0 && s.status !== 'BATAL' && s.status !== 'SELESAI')
    .map((s) => s.stesenNo);

  // Form data for adding a replacement / ad-hoc patient session
  const [newSessionData, setNewSessionData] = useState({
    patientId: safePatients[0]?.id || '',
    tarikh: todayStr,
    corakHari: 'ISNIN_RABU_JUMAAT' as SchedulePattern,
    shift: 'PAGI' as ShiftType,
    stesenNo: 0,
    jururawatBertugas: 'Sister Hanim binti Othman',
    ultrafiltrationGoal: 2.0,
    notaKlinikal: 'Pesakit ganti / sambilan'
  });

  // Handlers
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = safePatients.find((p) => p.id === newSessionData.patientId);
    if (!patient) return;

    const matchedShift = safeShifts.find((s) => s.kod === newSessionData.shift);
    const masaMula = matchedShift?.masaMula || '07:00';
    const masaTamat = matchedShift?.masaTamat || '11:00';

    const created: TreatmentSession = {
      id: `SES-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      tarikh: newSessionData.tarikh,
      corakHari: newSessionData.corakHari,
      shift: newSessionData.shift,
      masaMula,
      masaTamat,
      stesenNo: Number(newSessionData.stesenNo),
      status: 'AKAN_DATANG',
      jururawatBertugas: newSessionData.jururawatBertugas,
      ultrafiltrationGoal: Number(newSessionData.ultrafiltrationGoal),
      notaKlinikal: newSessionData.notaKlinikal
    };

    onAddSession(created);
    setShowAddModal(false);
  };

  // Trigger 1-Hour Pre-Arrival WhatsApp Reminder for single patient
  const handleTrigger1HourWhatsApp = (patient: Patient, session: TreatmentSession) => {
    onSendNotification(session, patient);
    const msg = createOneHourReminderMessage(patient, session);
    const waUrl = buildWhatsAppLink(patient.noTelefon, msg);
    window.open(waUrl, '_blank');

    setNotificationStatus(`Peringatan WhatsApp (1 Jam Sebelum) berjaya dihantar kepada ${patient.nama}!`);
    setTimeout(() => setNotificationStatus(null), 5000);
  };

  // Trigger Bulk 1-Hour Pre-Arrival Reminders for all scheduled patients in this shift
  const handleBulk1HourWhatsApp = () => {
    const validRoster = mergedRoster.filter(({ session }) => session.status !== 'BATAL' && session.status !== 'SELESAI');
    if (validRoster.length === 0) {
      setNotificationStatus('Tiada pesakit aktif berjadual dalam shift ini untuk dihantar peringatan.');
      setTimeout(() => setNotificationStatus(null), 4000);
      return;
    }

    validRoster.forEach(({ patient, session }) => {
      onSendNotification(session, patient);
    });

    // Open WhatsApp link for the first patient in roster to initiate
    const firstItem = validRoster[0];
    const msg = createOneHourReminderMessage(firstItem.patient, firstItem.session);
    const waUrl = buildWhatsAppLink(firstItem.patient.noTelefon, msg);
    window.open(waUrl, '_blank');

    setNotificationStatus(`Peringatan Pukal 1-Jam WhatsApp dijana untuk ${validRoster.length} pesakit dalam ${selectedShift}!`);
    setTimeout(() => setNotificationStatus(null), 6000);
  };

  // FCFS Station Check-In Callback
  const handleAssignFCFSStation = (
    patientId: string,
    stationNo: number,
    praTekananDarah: string,
    ufGoal: number,
    waktuKetibaan: string
  ) => {
    const targetPatient = safePatients.find((p) => p.id === patientId);
    if (!targetPatient) return;

    const existingSession = currentShiftSessions.find((s) => s.patientId === patientId);

    const updatedSession: TreatmentSession = {
      id: existingSession ? existingSession.id : `SES-${Date.now().toString().slice(-4)}`,
      patientId: targetPatient.id,
      patientName: targetPatient.nama,
      tarikh: todayStr,
      corakHari: selectedPattern,
      shift: selectedShift,
      masaMula: masaMulaShift,
      masaTamat: masaTamatShift,
      stesenNo: stationNo,
      status: 'SEDANG_BERJALAN',
      jururawatBertugas: 'Sister Hanim binti Othman',
      praTekananDarah,
      ultrafiltrationGoal: ufGoal,
      notaKlinikal: `Tiba pada jam ${waktuKetibaan}. Ditugaskan ke Stesen #${stationNo} (FCFS).`
    };

    onUpdateSession(updatedSession);
    setNotificationStatus(`Ketibaan disahkan! ${targetPatient.nama} ditugaskan ke Stesen Mesin #${stationNo} (FCFS).`);
    setTimeout(() => setNotificationStatus(null), 5000);
  };

  // Finish session / free up machine station
  const handleCompleteSession = (session: TreatmentSession) => {
    const updated: TreatmentSession = {
      ...session,
      status: 'SELESAI'
    };
    onUpdateSession(updated);
    setNotificationStatus(`Sesi rawatan Stesen #${session.stesenNo} untuk ${session.patientName} telah diselesaikan. Stesen mesin kini KOSONG.`);
    setTimeout(() => setNotificationStatus(null), 5000);
  };

  // Reassign / Move Patient to empty shift or change master schedule
  const handleReassignPatientShift = (
    patientId: string,
    newPattern: SchedulePattern,
    newShift: ShiftType,
    isMasterChange: boolean
  ) => {
    const targetPatient = safePatients.find((p) => p.id === patientId);
    if (!targetPatient) return;

    // Update patient master schedule if requested
    if (isMasterChange) {
      const updatedP: Patient = {
        ...targetPatient,
        sesiJadual: {
          ...targetPatient.sesiJadual,
          corakHari: newPattern,
          shift: newShift
        }
      };
      onUpdatePatient(updatedP);
    }

    // Move session record if exists
    const existing = currentShiftSessions.find((s) => s.patientId === patientId);
    if (existing) {
      const updatedS: TreatmentSession = {
        ...existing,
        corakHari: newPattern,
        shift: newShift,
        stesenNo: 0, // Reset station for new shift FCFS
        status: 'AKAN_DATANG',
        notaKlinikal: `Dipindahkan ke sesi ${newPattern} (${newShift})`
      };
      onUpdateSession(updatedS);
    }

    setNotificationStatus(`Pesakit ${targetPatient.nama} berjaya dipindahkan ke sesi ${newPattern === 'ISNIN_RABU_JUMAAT' ? 'MWF' : 'TTS'} (${newShift})!`);
    setTimeout(() => setNotificationStatus(null), 5000);
  };

  // Mark patient absent / remove for this session
  const handleMarkAbsent = (patientId: string, reason: string) => {
    const targetPatient = safePatients.find((p) => p.id === patientId);
    if (!targetPatient) return;

    const existing = currentShiftSessions.find((s) => s.patientId === patientId);
    const updatedS: TreatmentSession = {
      id: existing ? existing.id : `SES-BATAL-${patientId}`,
      patientId: targetPatient.id,
      patientName: targetPatient.nama,
      tarikh: todayStr,
      corakHari: selectedPattern,
      shift: selectedShift,
      masaMula: masaMulaShift,
      masaTamat: masaTamatShift,
      stesenNo: 0,
      status: 'BATAL',
      jururawatBertugas: 'Sister Hanim binti Othman',
      notaKlinikal: `Sesi dibatalkan / Pesakit tidak hadir: ${reason}`
    };

    onUpdateSession(updatedS);
    setNotificationStatus(`Slot sesi ${targetPatient.nama} dikosongkan (${reason}). Kapasiti kini sedia diisi pesakit ganti.`);
    setTimeout(() => setNotificationStatus(null), 5000);
  };

  return (
    <div className="space-y-6 text-[#E2E8F0]">
      {/* Walkthrough Guide for New Staff / Nurse */}
      <NurseWalkthroughGuide tabId="jadual" isAdminAuthenticated={true} />

      {/* Header Banner */}
      <div className="bg-[#111827] p-6 rounded-xl border border-[#1F2937] shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-emerald-400" />
            <span>Jadual Sesi Rawatan Hemodialisis</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sistem auto-masuk jadual master pesakit, agihan mesin secara First-Come First-Served (FCFS), dan peringatan WhatsApp 1 jam sebelum sesi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleBulk1HourWhatsApp}
            id="btn-bulk-wa-1hour"
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <BellRing className="w-4 h-4" />
            <span>Peringatan Pukal 1 Jam (WhatsApp)</span>
          </button>

          <button
            onClick={() => setIsShiftModalOpen(true)}
            id="btn-manage-shifts"
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-cyan-300 border border-cyan-800/60 font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Urus Waktu Shift</span>
          </button>

          <button
            onClick={() => {
              setNewSessionData({
                ...newSessionData,
                corakHari: selectedPattern,
                shift: selectedShift
              });
              setShowAddModal(true);
            }}
            id="btn-add-schedule-slot"
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Tambah Pesakit Ganti</span>
          </button>
        </div>
      </div>

      {/* Widget Status Mesin Dialisis Real-Time */}
      <div className="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>Status Mesin Dialisis Real-Time (Sesi {selectedShift})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemantauan pantas status 12 stesen mesin hemodialisis untuk jururawat bertugas.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-[#0F172A] px-3 py-1.5 rounded-xl border border-[#1F2937]">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Klik pada kad stesen untuk tukar status penyelenggaraan / servis</span>
          </div>
        </div>

        {/* Quick Stat Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0F172A] border border-[#1F2937] p-3.5 rounded-xl flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Jumlah Mesin</div>
              <div className="text-xl font-black text-white">12 <span className="text-xs font-normal text-slate-400">Stesen</span></div>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-emerald-900/50 p-3.5 rounded-xl flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 uppercase font-mono font-semibold">Tersedia (Sedia Rawat)</div>
              <div className="text-xl font-black text-emerald-400">
                {Math.max(0, 12 - occupiedStationNumbers.length - maintenanceStations.length)} <span className="text-xs font-normal text-emerald-500/80">Mesin</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-cyan-900/50 p-3.5 rounded-xl flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-cyan-400 uppercase font-mono font-semibold">Sedang Digunakan</div>
              <div className="text-xl font-black text-cyan-400">
                {occupiedStationNumbers.length} <span className="text-xs font-normal text-cyan-500/80">Mesin</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-amber-900/50 p-3.5 rounded-xl flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/40">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-amber-400 uppercase font-mono font-semibold">Servis / Diselenggara</div>
              <div className="text-xl font-black text-amber-400">
                {maintenanceStations.length} <span className="text-xs font-normal text-amber-500/80">Mesin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Machine Station Interactive Grid 1..12 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((stesenNo) => {
            const isMaint = maintenanceStations.includes(stesenNo);
            const activeSess = currentShiftSessions.find(
              (s) => s.stesenNo === stesenNo && s.status !== 'BATAL' && s.status !== 'SELESAI'
            );
            const isInUse = !!activeSess;

            return (
              <div
                key={stesenNo}
                onClick={() => toggleStationMaintenance(stesenNo)}
                title={isMaint ? "Klik untuk tandakan selesai penyelenggaraan" : "Klik untuk atur status penyelenggaraan"}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-1.5 ${
                  isMaint
                    ? 'bg-amber-950/40 border-amber-700/60 hover:bg-amber-900/60'
                    : isInUse
                    ? 'bg-cyan-950/40 border-cyan-700/60 hover:bg-cyan-900/60'
                    : 'bg-emerald-950/30 border-emerald-800/50 hover:bg-emerald-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-white">Stesen #{stesenNo}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    isMaint ? 'bg-amber-400 animate-ping' : isInUse ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
                  }`} />
                </div>

                <div className="text-[11px]">
                  {isMaint ? (
                    <span className="font-bold text-amber-300 flex items-center space-x-1">
                      <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Servis / Diselenggara</span>
                    </span>
                  ) : isInUse ? (
                    <div>
                      <div className="font-bold text-white truncate">{activeSess?.patientName}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">UF Goal: {activeSess?.ultrafiltrationGoal || 2.0} L</div>
                    </div>
                  ) : (
                    <span className="font-bold text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>TERSEDIA (Kosong)</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Policy Notice Bar */}
      <div className="p-3.5 bg-[#0F172A] border border-cyan-800/40 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800/40 font-mono font-bold text-[10px] shrink-0">
            POLISI FCFS
          </div>
          <div className="text-slate-300">
            <span className="font-bold text-white">Dasar Penugasan Mesin & Jadual Master Tetap:</span>{' '}
            <span className="text-slate-400">
              Pesakit dimasukkan secara automatik ke dalam jadual sesi mengikut pendaftaran master. Stesen mesin (1-12) di-agihkan secara rawak/saksama mengikut waktu ketibaan di kaunter (First Come First Served).
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-mono shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Auto-Populasi Master Aktif</span>
        </div>
      </div>

      {notificationStatus && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center space-x-3 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{notificationStatus}</span>
        </div>
      )}

      {/* View Mode Toggle Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] p-3.5 rounded-2xl border border-[#1F2937] shadow-lg">
        <div className="flex items-center space-x-1.5 bg-[#0F172A] p-1 rounded-xl border border-[#1F2937]">
          <button
            onClick={() => setViewMode('calendar')}
            id="btn-view-mode-calendar"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-gradient-to-r from-emerald-950 via-[#111827] to-teal-950 text-emerald-300 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <span>Paparan Kalendar Visual (Drag & Drop)</span>
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded font-extrabold">Interaktif</span>
          </button>

          <button
            onClick={() => setViewMode('roster')}
            id="btn-view-mode-roster"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'roster'
                ? 'bg-[#1F2937] text-white border border-[#374151] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-cyan-400" />
            <span>Paparan Matriks Roster & Stesen (FCFS)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-slate-300 flex items-center space-x-2 bg-[#0F172A]/80 px-3 py-1.5 rounded-xl border border-[#1F2937]">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="text-slate-300 text-[11px]">
              <strong className="text-emerald-400">Tukar Masa Pantas:</strong> Pegang & heret (drag) kad pesakit ke mana-mana kotak tarikh atau shift.
            </span>
          </div>

          <div className="text-xs text-amber-300 flex items-center space-x-2 bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-500/50 animate-pulse shadow-md">
            <BellRing className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span className="text-[11px] font-bold">
              Perhatian Jururawat: Kad Nadi Pulse Kuning = Sesi &lt;30 Minit
            </span>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: VISUAL DRAG & DROP CALENDAR */}
      {viewMode === 'calendar' && (
        <div className="space-y-6">
          {/* Week Navigation Header */}
          <div className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#0F172A] border border-[#1F2937] rounded-xl text-emerald-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Jadual Mingguan Visual & Sesi Pesakit</span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-800/60 font-semibold">
                    Minggu {weekOffset === 0 ? 'Semasa' : weekOffset > 0 ? `+${weekOffset}` : weekOffset}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Heret pesakit untuk menukar tarikh/shift. Drop ke Stesen Mesin di bawah untuk menetapkan mesin terus.
                </p>
              </div>
            </div>

            {/* Week Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                id="btn-prev-week"
                className="p-2 bg-[#0F172A] hover:bg-[#1F2937] border border-[#374151] text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Minggu Lepas</span>
              </button>

              <button
                onClick={() => setWeekOffset(0)}
                id="btn-current-week"
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  weekOffset === 0
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                    : 'bg-[#0F172A] text-slate-300 border-[#374151] hover:bg-[#1F2937]'
                }`}
              >
                📍 Minggu Ini
              </button>

              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                id="btn-next-week"
                className="p-2 bg-[#0F172A] hover:bg-[#1F2937] border border-[#374151] text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
              >
                <span className="hidden sm:inline">Minggu Depan</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drag & Drop Visual Weekly Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {currentWeekDays.map((day) => {
              return (
                <div
                  key={day.dateStr}
                  className={`rounded-2xl border p-3 flex flex-col space-y-3 transition ${
                    day.isToday
                      ? 'bg-[#0F172A] border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-xl'
                      : 'bg-[#111827] border-[#1F2937]'
                  }`}
                >
                  {/* Day Header */}
                  <div className="border-b border-[#1F2937] pb-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm font-extrabold text-white">{day.dayName}</span>
                        {day.isToday && (
                          <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-black rounded-full uppercase">
                            Hari Ini
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {day.dayNum} {day.monthName}
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      day.pattern === 'ISNIN_RABU_JUMAAT'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                        : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60'
                    }`}>
                      {day.pattern === 'ISNIN_RABU_JUMAAT' ? 'MWF' : 'TTS'}
                    </span>
                  </div>

                  {/* Shifts Drop Zones for this Day */}
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    {activeShifts.map((shift) => {
                      const dropTargetId = `day-${day.dateStr}-shift-${shift.kod}`;
                      const isOver = dragOverTarget === dropTargetId;
                      
                      // Calculate sessions for this day & shift
                      const explicitSessions = safeSessions.filter(
                        (s) => s.tarikh === day.dateStr && s.shift === shift.kod && s.status !== 'BATAL'
                      );

                      const masterPatients = safePatients.filter(
                        (p) =>
                          p.status === 'AKTIF' &&
                          p.sesiJadual?.corakHari === day.pattern &&
                          p.sesiJadual?.shift === shift.kod
                      );

                      const dayShiftRoster: Array<{ patient: Patient; session: TreatmentSession }> = [];

                      masterPatients.forEach((patient) => {
                        const existing = explicitSessions.find((s) => s.patientId === patient.id);
                        if (existing) {
                          dayShiftRoster.push({ patient, session: existing });
                        } else {
                          const autoSession: TreatmentSession = {
                            id: `SES-AUTO-${patient.id}-${day.dateStr}`,
                            patientId: patient.id,
                            patientName: patient.nama,
                            tarikh: day.dateStr,
                            corakHari: day.pattern,
                            shift: shift.kod,
                            masaMula: shift.masaMula,
                            masaTamat: shift.masaTamat,
                            stesenNo: 0,
                            status: 'AKAN_DATANG',
                            jururawatBertugas: 'Sister Hanim binti Othman',
                            ultrafiltrationGoal: 2.0,
                            notaKlinikal: 'Jadual Master Tetap'
                          };
                          dayShiftRoster.push({ patient, session: autoSession });
                        }
                      });

                      // Include ad-hoc replacements
                      explicitSessions.forEach((sess) => {
                        if (!dayShiftRoster.some((r) => r.patient.id === sess.patientId)) {
                          const p = safePatients.find((pt) => pt.id === sess.patientId);
                          if (p) dayShiftRoster.push({ patient: p, session: sess });
                        }
                      });

                      return (
                        <div
                          key={shift.id}
                          onDragOver={(e) => handleDragOver(e, dropTargetId)}
                          onDragLeave={handleDragLeave}
                          onDrop={() => handleDropOnCalendarSlot(day, shift.kod)}
                          className={`p-2.5 rounded-xl border transition-all min-h-[110px] flex flex-col justify-between ${
                            isOver
                              ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg scale-[1.02]'
                              : 'bg-[#0A0C10]/60 border-[#1F2937] hover:border-slate-700'
                          }`}
                        >
                          {/* Shift Label Header */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5 border-b border-[#1F2937]/60 pb-1">
                            <span className="font-bold text-slate-200">{shift.label}</span>
                            <span>{shift.masaMula}</span>
                          </div>

                          {/* Sessions List */}
                          <div className="space-y-2 flex-1">
                            {dayShiftRoster.length === 0 ? (
                              <div className="h-full flex items-center justify-center text-[10px] text-slate-600 italic py-3 text-center border border-dashed border-[#1F2937] rounded-lg">
                                {isOver ? '✨ Lepas di sini' : 'Tiada Pesakit (Kosong)'}
                              </div>
                            ) : (
                              dayShiftRoster.map(({ patient, session }) => {
                                const isCheckedIn = session.stesenNo > 0 && session.status === 'SEDANG_BERJALAN';
                                const isFinished = session.status === 'SELESAI';
                                const isStartingSoon = isSessionStartingSoon(session, day.dateStr);

                                return (
                                  <div
                                    key={`${patient.id}-${session.id}`}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, patient, session)}
                                    className={`group p-2 rounded-xl border text-xs space-y-1.5 transition cursor-grab active:cursor-grabbing hover:scale-[1.02] shadow-sm relative ${
                                      isCheckedIn
                                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
                                        : isFinished
                                        ? 'bg-slate-900 border-slate-800 text-slate-400'
                                        : isStartingSoon
                                        ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/20 text-white animate-pulse'
                                        : 'bg-[#111827] border-[#374151] hover:border-emerald-400/80 text-white'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center space-x-1 min-w-0">
                                        <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                                        <span className="font-bold truncate text-[11px] leading-tight">{patient.nama}</span>
                                      </div>
                                      {isCheckedIn ? (
                                        <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-black text-[9px] rounded font-mono shrink-0">
                                          #M{session.stesenNo}
                                        </span>
                                      ) : isStartingSoon ? (
                                        <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[9px] rounded font-mono shrink-0 animate-bounce flex items-center gap-0.5">
                                          ⚡ &lt;30m
                                        </span>
                                      ) : (
                                        <span className="px-1 py-0.2 bg-[#1F2937] text-slate-300 text-[9px] font-mono rounded shrink-0">
                                          FCFS
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                      <span>Akses: {patient.jenisAkses}</span>
                                      <span>UF: {session.ultrafiltrationGoal || 2.0}L</span>
                                    </div>

                                    {/* Action Buttons inside Card */}
                                    <div className="pt-1 border-t border-[#1F2937] flex items-center justify-between gap-1">
                                      {!isCheckedIn && !isFinished && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPatientForFCFS(patient);
                                            setSelectedSessionForFCFS(session);
                                            setIsFCFSModalOpen(true);
                                          }}
                                          className="flex-1 py-0.5 px-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 rounded text-[9px] font-bold transition text-center"
                                        >
                                          + Daftar Ketibaan
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTrigger1HourWhatsApp(patient, session);
                                        }}
                                        title="Peringatan WhatsApp"
                                        className="p-1 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 rounded text-[9px]"
                                      >
                                        <Send className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* LIVE MACHINE STATIONS DROP ZONE BAR (Direct Drag to Station) */}
          <div className="bg-[#111827] rounded-2xl p-5 border border-[#1F2937] shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2.5">
              <div className="flex items-center space-x-2">
                <Move className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Stesen Mesin Hemodialisis (Petak Drop Penugasan Direct)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Heret (drag) sebarang kad pesakit dari kalendar dan lepaskan (drop) ke atas stesen mesin di bawah.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2.5">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((stesenNum) => {
                const dropStationId = `station-drop-${stesenNum}`;
                const isOverStation = dragOverTarget === dropStationId;

                const activeSessionOnStation = safeSessions.find(
                  (s) => s.stesenNo === stesenNum && s.status === 'SEDANG_BERJALAN'
                );
                const patient = activeSessionOnStation
                  ? safePatients.find((p) => p.id === activeSessionOnStation.patientId)
                  : null;

                return (
                  <div
                    key={stesenNum}
                    onDragOver={(e) => handleDragOver(e, dropStationId)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDropOnStationSlot(stesenNum)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isOverStation
                        ? 'bg-emerald-950 border-emerald-400 ring-2 ring-emerald-400 shadow-xl scale-[1.05]'
                        : patient
                        ? 'bg-emerald-950/40 border-emerald-500/50'
                        : 'bg-[#0F172A] border-dashed border-[#1F2937] hover:border-slate-600'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-slate-400 mb-1">
                      Stesen #{stesenNum}
                    </div>

                    {patient ? (
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-emerald-300 truncate">{patient.nama}</div>
                        <div className="text-[9px] font-mono text-emerald-400">⚡ Online</div>
                      </div>
                    ) : (
                      <div className="py-1">
                        <div className="text-[10px] font-medium text-slate-500">
                          {isOverStation ? '✨ Drop Sini' : 'Kosong'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: ROSTER & STATIONS MATRIX VIEW */}
      {viewMode === 'roster' && (
        <div className="space-y-6">
          {/* Pattern & Shift Selector Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Pattern Selector */}
        <div className="flex p-1 bg-[#1F2937] rounded-xl border border-[#374151]">
          <button
            onClick={() => setSelectedPattern('ISNIN_RABU_JUMAAT')}
            id="tab-mwf"
            className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedPattern === 'ISNIN_RABU_JUMAAT'
                ? 'bg-[#111827] text-emerald-400 shadow-md border border-[#374151]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Kumpulan 1: Isnin, Rabu, Jumaat (MWF)
          </button>
          <button
            onClick={() => setSelectedPattern('SELASA_KHAMIS_SABTU')}
            id="tab-tts"
            className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedPattern === 'SELASA_KHAMIS_SABTU'
                ? 'bg-[#111827] text-emerald-400 shadow-md border border-[#374151]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Kumpulan 2: Selasa, Khamis, Sabtu (TTS)
          </button>
        </div>

        {/* Dynamic Shift selector */}
        <div className="flex flex-wrap gap-2">
          {activeShifts.map((sh) => {
            const isActive = selectedShift === sh.kod;
            const countInShift = mergedRoster.filter(
              (r) => r.session.status !== 'BATAL'
            ).length;

            return (
              <button
                key={sh.id}
                id={`btn-shift-${sh.kod}`}
                onClick={() => setSelectedShift(sh.kod)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer flex items-center space-x-2 ${
                  isActive
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-[#111827] border-[#1F2937] text-slate-400 hover:bg-[#1F2937] hover:text-white'
                }`}
              >
                <div>
                  <span className="block font-bold text-white">{sh.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{sh.masaMula} - {sh.masaTamat}</span>
                </div>
                {isActive && (
                  <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-300 rounded font-mono text-[10px] font-bold border border-emerald-700/50">
                    {countInShift} Pesakit
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: MASTER SCHEDULED PATIENT ROSTER (Auto-populated for this Shift) */}
      <div className="bg-[#111827] rounded-2xl p-5 border border-[#1F2937] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F2937] pb-3 gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>Senarai Pesakit Tetap Berjadual ({selectedShift} - {selectedPattern === 'ISNIN_RABU_JUMAAT' ? 'MWF' : 'TTS'})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pesakit auto-masuk mengikut rekod master. Klik 'Daftar Ketibaan' apabila pesakit tiba untuk menugaskan stesen mesin (FCFS).
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-2.5 py-1 bg-[#0F172A] border border-[#374151] rounded-lg text-slate-300 font-bold">
              Kapasiti Shift: {occupiedStationNumbers.length} / 12 Terisi
            </span>
          </div>
        </div>

        {mergedRoster.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-[#0F172A] rounded-xl border border-dashed border-[#1F2937]">
            Tiada pesakit berjadual tetap ditetapkan untuk shift {selectedShift} bagi kumpulan hari ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {mergedRoster.map(({ patient, session }) => {
              const isCheckedIn = session.stesenNo > 0 && session.status === 'SEDANG_BERJALAN';
              const isFinished = session.status === 'SELESAI';
              const isCancelled = session.status === 'BATAL' || session.status === 'TIDAK_HADIR';
              const isStartingSoon = isSessionStartingSoon(session, todayStr);

              return (
                <div
                  key={patient.id}
                  id={`roster-card-${patient.id}`}
                  className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 transition relative ${
                    isCancelled
                      ? 'bg-rose-950/20 border-rose-900/40 opacity-75'
                      : isFinished
                      ? 'bg-slate-900/60 border-slate-700/50'
                      : isCheckedIn
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md'
                      : isStartingSoon
                      ? 'bg-amber-950/70 border-amber-400 ring-2 ring-amber-400/90 shadow-xl shadow-amber-500/20 animate-pulse'
                      : 'bg-[#0F172A] border-[#1F2937] hover:border-slate-600'
                  }`}
                >
                  {/* Top info */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#1F2937] text-slate-300 rounded">
                        ID: {patient.id}
                      </span>
                      {isCheckedIn ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded-md flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Stesen #{session.stesenNo} (FCFS)</span>
                        </span>
                      ) : isFinished ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
                          SELESAI
                        </span>
                      ) : isCancelled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800/60 rounded-md">
                          CUTI / BATAL
                        </span>
                      ) : isStartingSoon ? (
                        <span className="text-[10px] font-black px-2 py-0.5 bg-amber-400 text-slate-950 border border-amber-300 rounded-md flex items-center space-x-1 animate-bounce">
                          <BellRing className="w-3 h-3 text-slate-950 shrink-0" />
                          <span>BERMULA &lt;30 MIN!</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800/50 rounded-md animate-pulse">
                          MENUNGGU KETIBAAN
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">{patient.nama}</h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Akses: <span className="text-slate-200 font-semibold">{patient.jenisAkses}</span> • Penaja: {patient.penaja}
                    </div>

                    {session.notaKlinikal && (
                      <p className="text-[11px] text-slate-400 italic mt-1.5 bg-[#0A0C10]/60 p-1.5 rounded border border-[#1F2937]/80 line-clamp-2">
                        "{session.notaKlinikal}"
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#1F2937] flex flex-wrap items-center gap-1.5">
                    {!isCheckedIn && !isFinished && !isCancelled && (
                      <button
                        onClick={() => {
                          setSelectedPatientForFCFS(patient);
                          setSelectedSessionForFCFS(session);
                          setIsFCFSModalOpen(true);
                        }}
                        id={`btn-checkin-fcfs-${patient.id}`}
                        className="flex-1 py-1.5 px-2 bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px] shadow-sm transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <HeartPulse className="w-3.5 h-3.5" />
                        <span>Daftar Ketibaan (FCFS)</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleTrigger1HourWhatsApp(patient, session)}
                      id={`btn-wa-1hr-${patient.id}`}
                      title="Hantar Peringatan WhatsApp (1 Jam Sebelum)"
                      className="p-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] hidden sm:inline">1-Jam WA</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPatientForReassign(patient);
                        setIsReassignModalOpen(true);
                      }}
                      id={`btn-reassign-${patient.id}`}
                      title="Tukar Sesi / Nyahaktifkan Slot"
                      className="p-1.5 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-cyan-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] hidden sm:inline">Tukar/Batal</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: LIVE MATRIX 12 STESEN MESIN DIALISIS */}
      <div className="bg-[#111827] rounded-2xl p-6 border border-[#1F2937] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Matriks Live 12 Stesen Mesin Hemodialisis (Penugasan FCFS)
            </h2>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
              <span className="text-slate-300">Aktif Digunakan ({occupiedStationNumbers.length})</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
              <span className="text-slate-400">Kosong / Bersedia ({12 - occupiedStationNumbers.length})</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((stesenNum) => {
            const activeSessionOnStation = currentShiftSessions.find(
              (s) => s.stesenNo === stesenNum && s.status === 'SEDANG_BERJALAN'
            );
            const patient = activeSessionOnStation
              ? safePatients.find((p) => p.id === activeSessionOnStation.patientId)
              : null;

            if (activeSessionOnStation && patient) {
              return (
                <div
                  key={stesenNum}
                  id={`station-card-${stesenNum}`}
                  className="rounded-xl border border-emerald-500/50 bg-[#0F172A] p-4 space-y-3 flex flex-col justify-between relative shadow-lg hover:border-emerald-400 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/50 rounded-md">
                      Stesen #{stesenNum}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <HeartPulse className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>Online HDF</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white leading-snug">{patient.nama}</h3>
                    <div className="text-[11px] text-slate-400 font-mono">
                      ID: {patient.id} • {patient.jenisAkses}
                    </div>
                    <div className="text-xs text-slate-300 pt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sasaran UF:</span>
                        <span className="font-semibold text-emerald-400 font-mono">{activeSessionOnStation.ultrafiltrationGoal || 2.0} L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tekanan Darah:</span>
                        <span className="font-mono text-slate-200">{activeSessionOnStation.praTekananDarah || '130/80'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Berat Kering:</span>
                        <span className="font-mono text-slate-300">{patient.beratKering} kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1F2937] flex items-center justify-between space-x-2">
                    <button
                      onClick={() => handleTrigger1HourWhatsApp(patient, activeSessionOnStation)}
                      title="Peringatan WhatsApp"
                      className="p-1.5 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 rounded-lg text-xs font-bold transition border border-[#374151]"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCompleteSession(activeSessionOnStation)}
                      id={`btn-complete-station-${stesenNum}`}
                      className="flex-1 py-1.5 px-2 bg-[#1F2937] hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition border border-slate-600 flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Selesai Sesi (Lepas Mesin)</span>
                    </button>
                  </div>
                </div>
              );
            }

            // Available empty station
            return (
              <div
                key={stesenNum}
                id={`station-empty-${stesenNum}`}
                className="rounded-xl border border-dashed border-[#1F2937] bg-[#0A0C10]/60 p-4 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#1F2937] text-slate-400 rounded-md">
                    Stesen #{stesenNum}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">Fresenius 4008S</span>
                </div>

                <div className="text-center py-3 space-y-1">
                  <UserCheck className="w-6 h-6 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">Stesen Kosong</p>
                  <p className="text-[10px] text-slate-500">Sedia untuk penugasan FCFS</p>
                </div>

                <button
                  onClick={() => {
                    const unassignedItem = mergedRoster.find(
                      (r) => r.session.stesenNo === 0 && r.session.status === 'AKAN_DATANG'
                    );
                    if (unassignedItem) {
                      setSelectedPatientForFCFS(unassignedItem.patient);
                      setSelectedSessionForFCFS(unassignedItem.session);
                      setIsFCFSModalOpen(true);
                    } else {
                      setNewSessionData({
                        ...newSessionData,
                        stesenNo: stesenNum,
                        corakHari: selectedPattern,
                        shift: selectedShift
                      });
                      setShowAddModal(true);
                    }
                  }}
                  className="w-full py-1.5 px-2 border border-[#374151] hover:bg-[#1F2937] text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  + Daftar Ketibaan FCFS Ke Mesin Ini
                </button>
              </div>
            );
          })}
        </div>
      </div>
      </div>
      )}

      {/* Add Replacement Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSession}
            className="bg-[#111827] rounded-2xl border border-[#1F2937] max-w-lg w-full p-6 space-y-4 shadow-2xl text-[#E2E8F0]"
          >
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <h2 className="text-lg font-bold text-white">Tambah Pesakit Ganti / Sambilan</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pilih Pesakit</label>
                <select
                  value={newSessionData.patientId}
                  onChange={(e) => setNewSessionData({ ...newSessionData, patientId: e.target.value })}
                  className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                >
                  {safePatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.id}) - IC: {p.noIC}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Corak Hari</label>
                  <select
                    value={newSessionData.corakHari}
                    onChange={(e) => setNewSessionData({ ...newSessionData, corakHari: e.target.value as any })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="ISNIN_RABU_JUMAAT">Isnin / Rabu / Jumaat</option>
                    <option value="SELASA_KHAMIS_SABTU">Selasa / Khamis / Sabtu</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Shift</label>
                  <select
                    value={newSessionData.shift}
                    onChange={(e) => setNewSessionData({ ...newSessionData, shift: e.target.value as any })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  >
                    {activeShifts.map((sh) => (
                      <option key={sh.id} value={sh.kod}>
                        {sh.label} ({sh.masaMula} - {sh.masaTamat})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Stesen Mesin (FCFS / Terus)</label>
                  <select
                    value={newSessionData.stesenNo}
                    onChange={(e) => setNewSessionData({ ...newSessionData, stesenNo: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value={0}>Belum ditugaskan (FCFS Queue)</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>Stesen #{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sasaran UF (Liter)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSessionData.ultrafiltrationGoal}
                    onChange={(e) => setNewSessionData({ ...newSessionData, ultrafiltrationGoal: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Jururawat Bertugas</label>
                <select
                  value={newSessionData.jururawatBertugas}
                  onChange={(e) => setNewSessionData({ ...newSessionData, jururawatBertugas: e.target.value })}
                  className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="Sister Hanim binti Othman">Sister Hanim binti Othman</option>
                  <option value="Jururawat Pravin Kumar">Jururawat Pravin Kumar</option>
                  <option value="Jururawat Siti Aisyah">Jururawat Siti Aisyah</option>
                  <option value="Jururawat Tan Wei Ling">Jururawat Tan Wei Ling</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nota / Sebab Ganti</label>
                <input
                  type="text"
                  value={newSessionData.notaKlinikal}
                  onChange={(e) => setNewSessionData({ ...newSessionData, notaKlinikal: e.target.value })}
                  placeholder="Pesakit ganti / gantian bagi slot kosong..."
                  className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#1F2937]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#10B981] hover:bg-emerald-400 text-[#0A0C10] rounded-lg text-xs font-bold transition shadow-md shadow-emerald-950 cursor-pointer"
              >
                Simpan Pesakit Ganti
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FCFS Check-In Modal */}
      <FCFSStationAssignModal
        isOpen={isFCFSModalOpen}
        onClose={() => {
          setIsFCFSModalOpen(false);
          setSelectedPatientForFCFS(null);
          setSelectedSessionForFCFS(null);
        }}
        patient={selectedPatientForFCFS}
        session={selectedSessionForFCFS}
        occupiedStations={occupiedStationNumbers}
        onAssignFCFS={handleAssignFCFSStation}
      />

      {/* Reassign / Remove Patient Modal */}
      <PatientShiftReassignModal
        isOpen={isReassignModalOpen}
        onClose={() => {
          setIsReassignModalOpen(false);
          setSelectedPatientForReassign(null);
        }}
        patient={selectedPatientForReassign}
        currentPattern={selectedPattern}
        currentShift={selectedShift}
        shifts={safeShifts}
        onReassign={handleReassignPatientShift}
        onMarkAbsent={handleMarkAbsent}
      />

      {/* Shift Management Modal */}
      <ShiftManagementModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        shifts={safeShifts}
        onAddShift={onAddShift || (() => {})}
        onUpdateShift={onUpdateShift || (() => {})}
        onDeleteShift={onDeleteShift || (() => {})}
      />
    </div>
  );
};
