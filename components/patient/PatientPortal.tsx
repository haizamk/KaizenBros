'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Droplets, 
  Pill, 
  FileText, 
  AlertTriangle, 
  AlertCircle,
  Home, 
  User, 
  BarChart2, 
  Clock, 
  PhoneCall, 
  MessageCircle, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft,
  ChevronRight,
  Info,
  HeartHandshake,
  Users,
  Search,
  Sparkles,
  X,
  Check,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Moon,
  Sun,
  Plus,
  Minus,
  Type,
  Scale,
  Stethoscope,
  Activity,
  Volume2,
  ExternalLink,
  Download,
  TrendingUp,
  RotateCcw,
  Zap
} from 'lucide-react';
import { Patient, DialysisSession, PatientMedication, PatientCheckIn, MedicalRecord, SessionStatus } from '@/types';
import { VERIFIED_CENTRE_INFO } from '@/lib/mock-data';
import { parseMalaysianIC, getAgeDisplayFromIC } from '@/lib/ic-utils';
import { calculateNextDialysis, getMalaysiaDate } from '@/lib/malaysia-time';
import { useMalaysiaTime } from '@/hooks/useMalaysiaTime';

interface PatientPortalProps {
  patient?: Patient | null;
  patients?: Patient[];
  session?: DialysisSession | null;
  sessions?: DialysisSession[];
  medications?: PatientMedication[];
  medicalRecords?: MedicalRecord[];
  checkInRecord?: PatientCheckIn;
  onCheckInArrival?: (preWeight: number, preBp?: string) => void;
  onResetCheckIn?: () => void;
  onAssignStationDemo?: () => void;
  onStartDialysisDemo?: () => void;
  onUpdateWeights?: (preWeight?: number, postWeight?: number, preBp?: string, postBp?: string) => void;
  onSelectPatient?: (patient: Patient) => void;
  onOpenSOSModal?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToRegistration?: () => void;
  onPatientLogout?: () => void;
  onOpenLogin?: () => void;
  isLoggedIn?: boolean;
}

export function PatientPortal({
  patient,
  patients = [],
  session,
  sessions = [],
  medications = [],
  medicalRecords = [],
  checkInRecord,
  onCheckInArrival,
  onResetCheckIn,
  onAssignStationDemo,
  onStartDialysisDemo,
  onUpdateWeights,
  onSelectPatient,
  onNavigateToAdmin,
  onNavigateToRegistration,
  onPatientLogout,
  onOpenLogin,
  isLoggedIn = true
}: PatientPortalProps) {
  // Navigation tabs: 'utama' | 'jadual' | 'timbang' | 'ubat' | 'rekod' | 'profil' | 'darah'
  const [activeTab, setActiveTab] = useState<'utama' | 'jadual' | 'timbang' | 'ubat' | 'rekod' | 'profil' | 'darah'>('utama');
  
  // Drill-down medical record state
  const [selectedRecordId, setSelectedRecordId] = useState<string | number | null>(null);

  // Trend duration and active parameter states
  const [trendDuration, setTrendDuration] = useState<'3_bulan' | '6_bulan' | '9_bulan' | '12_bulan' | '2_tahun' | '3_tahun' | '5_tahun' | 'semua'>('12_bulan');
  const [activeChartParam, setActiveChartParam] = useState<'potassium' | 'phosphate' | 'hemoglobin' | 'urea' | 'creatinine' | 'glucose'>('potassium');

  // Accessibility state
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Modals
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const { effectiveDate } = useMalaysiaTime();

  // Dynamic Next Dialysis calculation for this patient based on Malaysia Real Time
  const nextDialysis = useMemo(() => {
    if (!patient) return null;
    return calculateNextDialysis(patient, effectiveDate);
  }, [patient, effectiveDate]);

  // Effective clinical status prioritization:
  // session is the authoritative record when created or synced by nurse/system.
  // checkInRecord represents front-counter reception.
  const effectiveStatus: SessionStatus | string = 
    session?.status || 
    (checkInRecord?.status === 'SEDANG_DIALISIS' ? 'SEDANG_DIALISIS' : checkInRecord ? (checkInRecord.assigned_chair ? 'SUDAH_HADIR' : 'MENUNGGU_GILIRAN') : 'BELUM_HADIR');

  // 1. Patient has arrived & registered at registration counter on dialysis day:
  // Must have an active checkInRecord OR session with active arrival status on this day.
  const hasArrivedAndRegistered = Boolean(
    (checkInRecord && checkInRecord.status !== 'BELUM_HADIR') || 
    (session && session.status !== 'BELUM_HADIR' && session.status !== 'BATAL')
  );

  // 2. Chair is assigned by nurse ONLY when arrived/registered AND chair number is present:
  const hasAssignedChair = Boolean(
    hasArrivedAndRegistered && 
    (session?.chair_number || checkInRecord?.assigned_chair)
  );

  const assignedChairNumber = hasAssignedChair ? (session?.chair_number || checkInRecord?.assigned_chair) : null;
  const assignedMachineModel = hasAssignedChair ? (session?.machine_model || checkInRecord?.assigned_machine_model || 'Fresenius 4008S NG') : null;

  // Live mutually exclusive state helpers:
  const isCheckedIn = hasArrivedAndRegistered;
  const isSessionCompleted = Boolean(
    effectiveStatus === 'SUDAH_SELESAI' || effectiveStatus === 'SELESAI'
  );
  // Dialysis is running ONLY when chair is assigned AND nurse explicitly changed status to SEDANG_DIALISIS
  const isOnDialysis = Boolean(
    hasAssignedChair && effectiveStatus === 'SEDANG_DIALISIS'
  );
  // Chair assigned but nurse has NOT started dialysis yet (fixes premature 'SEDANG DIALISIS' error)
  const isChairAssignedWaitingStart = Boolean(
    hasArrivedAndRegistered && hasAssignedChair && !isOnDialysis && !isSessionCompleted
  );
  // Arrived & registered but chair not yet assigned by nurse
  const isWaitingQueue = Boolean(
    hasArrivedAndRegistered && !hasAssignedChair && !isOnDialysis && !isSessionCompleted
  );
  
  // Safely extract pre-dialysis and post-dialysis clinical measurements
  const rawWeight = session?.pre_weight_kg ?? checkInRecord?.pre_weight_kg ?? null;
  const activePreWeight = rawWeight !== null && !isNaN(Number(rawWeight)) ? Number(rawWeight) : null;
  const rawPostWeight = session?.post_weight_kg ?? checkInRecord?.post_weight_kg ?? null;
  const activePostWeight = rawPostWeight !== null && !isNaN(Number(rawPostWeight)) ? Number(rawPostWeight) : null;
  const activePreBp = session?.pre_bp ?? checkInRecord?.pre_bp ?? null;
  const activePostBp = session?.post_bp ?? checkInRecord?.post_bp ?? null;
  const patientDryWeight = typeof patient?.dry_weight_kg === 'number' && !isNaN(patient.dry_weight_kg) ? patient.dry_weight_kg : 65.0;
  const fluidExcessKg = activePreWeight !== null ? Number((activePreWeight - patientDryWeight).toFixed(1)) : null;
  const fluidRemovedKg = (activePreWeight !== null && activePostWeight !== null) ? Number((activePreWeight - activePostWeight).toFixed(1)) : null;

  // Weight & BP self recording state (Pre & Post)
  const [inputPreWeight, setInputPreWeight] = useState<number>(activePreWeight !== null ? activePreWeight : Number((patientDryWeight + 1.8).toFixed(1)));
  const [inputPreSystolic, setInputPreSystolic] = useState<string>(activePreBp ? activePreBp.split('/')[0] : '138');
  const [inputPreDiastolic, setInputPreDiastolic] = useState<string>(activePreBp && activePreBp.includes('/') ? activePreBp.split('/')[1] : '82');

  const [inputPostWeight, setInputPostWeight] = useState<number>(activePostWeight !== null ? activePostWeight : Number(patientDryWeight.toFixed(1)));
  const [inputPostSystolic, setInputPostSystolic] = useState<string>(activePostBp ? activePostBp.split('/')[0] : '124');
  const [inputPostDiastolic, setInputPostDiastolic] = useState<string>(activePostBp && activePostBp.includes('/') ? activePostBp.split('/')[1] : '78');

  const [saveWeightSuccess, setSaveSuccessMsg] = useState<string | null>(null);

  // Synchronize inputs when live session changes
  useEffect(() => {
    if (activePreWeight !== null) setInputPreWeight(activePreWeight);
    if (activePostWeight !== null) setInputPostWeight(activePostWeight);
    if (activePreBp && activePreBp.includes('/')) {
      const parts = activePreBp.split('/');
      setInputPreSystolic(parts[0]);
      setInputPreDiastolic(parts[1]);
    }
    if (activePostBp && activePostBp.includes('/')) {
      const parts = activePostBp.split('/');
      setInputPostSystolic(parts[0]);
      setInputPostDiastolic(parts[1]);
    }
  }, [activePreWeight, activePostWeight, activePreBp, activePostBp]);

  const handleSaveSelfWeight = (saveType: 'ALL' | 'PRE' | 'POST' = 'ALL') => {
    const preBpStr = `${inputPreSystolic}/${inputPreDiastolic}`;
    const postBpStr = `${inputPostSystolic}/${inputPostDiastolic}`;

    if (onUpdateWeights) {
      onUpdateWeights(
        saveType === 'POST' ? undefined : inputPreWeight,
        saveType === 'PRE' ? undefined : inputPostWeight,
        saveType === 'POST' ? undefined : preBpStr,
        saveType === 'PRE' ? undefined : postBpStr
      );
    } else if (onCheckInArrival) {
      onCheckInArrival(inputPreWeight, preBpStr);
    }

    if (saveType === 'PRE') {
      setSaveSuccessMsg(`✓ Berat Pra-Dialisis (${inputPreWeight.toFixed(1)} kg) dan BP (${preBpStr}) berjaya direkodkan.`);
    } else if (saveType === 'POST') {
      setSaveSuccessMsg(`✓ Berat Selepas Dialisis (${inputPostWeight.toFixed(1)} kg) dan BP (${postBpStr}) berjaya direkodkan.`);
    } else {
      setSaveSuccessMsg(`✓ Rekod Berat Pra (${inputPreWeight.toFixed(1)} kg) & Selepas (${inputPostWeight.toFixed(1)} kg) berjaya dikemaskini.`);
    }
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // Dynamic Shift Mapping
  const patientShiftInfo = useMemo(() => {
    if (!patient) {
      return {
        id: 'SYIF_1',
        title: 'Syif 1: Sesi Pagi',
        timeRange: '6:00 AM - 10:00 AM',
        shortTime: '6:00 AM'
      };
    }
    const s = patient.preferred_shift || '';
    if (s === 'SYIF_1' || s === 'PAGI' || s.includes('6.00') || s.includes('6:00')) {
      return {
        id: 'SYIF_1',
        title: 'Syif 1: Sesi Pagi',
        timeRange: '6:00 AM - 10:00 AM',
        shortTime: '6:00 AM'
      };
    }
    if (s === 'SYIF_2' || s === 'TENGAH_HARI' || s.includes('10.30') || s.includes('10:30')) {
      return {
        id: 'SYIF_2',
        title: 'Syif 2: Sesi Tengah Hari',
        timeRange: '10:30 AM - 2:30 PM',
        shortTime: '10:30 AM'
      };
    }
    return {
      id: 'SYIF_3',
      title: 'Syif 3: Sesi Petang',
      timeRange: '3:00 PM - 7:00 PM',
      shortTime: '3:00 PM'
    };
  }, [patient]);

  const schedulePatternLabel = patient?.schedule_pattern === 'SELASA_KHAMIS_SABTU'
    ? 'Selasa, Khamis & Sabtu'
    : 'Isnin, Rabu & Jumaat';

  // Active Patient Medications
  const activePatientMedications = useMemo(() => {
    if (!patient) return [];
    return medications.filter(m => m.patient_id === patient.id || m.patient_id === 1);
  }, [patient, medications]);

  // Dynamic Upcoming Treatment Schedule
  const upcomingSchedule = useMemo(() => {
    if (!patient) return [];
    const isTuesday = patient.schedule_pattern === 'SELASA_KHAMIS_SABTU';
    const targetDayNumbers = isTuesday ? [2, 4, 6] : [1, 3, 5];

    const list: {
      dateStr: string;
      formattedDate: string;
      dayName: string;
      isToday: boolean;
      session?: DialysisSession;
      statusLabel: string;
      statusColor: string;
    }[] = [];

    const mytNow = getMalaysiaDate(effectiveDate);
    const todayStr = mytNow.dateIso;

    for (let i = 0; i < 28 && list.length < 6; i++) {
      const d = new Date(effectiveDate);
      d.setDate(effectiveDate.getDate() + i);
      const dMyt = getMalaysiaDate(d);
      const dayOfWeek = dMyt.dayOfWeek;
      if (targetDayNumbers.includes(dayOfWeek)) {
        const dateIso = dMyt.dateIso;
        const isToday = dateIso === todayStr;
        const formatted = dMyt.formattedDate;
        const dayName = dMyt.dayName;

        const scheduledSession = sessions.find(s => s.patient_id === patient.id && s.scheduled_date === dateIso);

        let statusLabel = 'Akan Datang';
        let statusColor = 'text-slate-300 bg-slate-800 border-slate-700';

        if (scheduledSession) {
          if (scheduledSession.status === 'SEDANG_DIALISIS') {
            statusLabel = 'Sedang Dialisis';
            statusColor = 'text-emerald-300 bg-emerald-950 border-emerald-700';
          } else if (scheduledSession.status === 'SUDAH_HADIR' || scheduledSession.status === 'MENUNGGU_GILIRAN') {
            statusLabel = 'Menunggu Giliran';
            statusColor = 'text-amber-300 bg-amber-950 border-amber-700';
          } else if (scheduledSession.status === 'SUDAH_SELESAI') {
            statusLabel = 'Selesai';
            statusColor = 'text-cyan-300 bg-cyan-950 border-cyan-800';
          }
        }

        list.push({
          dateStr: dateIso,
          formattedDate: formatted,
          dayName,
          isToday,
          session: scheduledSession,
          statusLabel,
          statusColor
        });
      }
    }
    return list;
  }, [patient, effectiveDate, sessions]);

  // Accessibility Font Scaling Helper
  const fontTitleClass = fontSize === 'xlarge' ? 'text-3xl sm:text-4xl' : fontSize === 'large' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl';
  const fontBodyClass = fontSize === 'xlarge' ? 'text-lg' : fontSize === 'large' ? 'text-base' : 'text-sm';
  const fontSubClass = fontSize === 'xlarge' ? 'text-base' : fontSize === 'large' ? 'text-sm' : 'text-xs';

  // Card Container Helper
  const themeCardClass = 'bg-[#132238] border border-[#1F385C] text-slate-100 shadow-xl rounded-2xl';

  if (!patient || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col items-center justify-center p-6 font-sans my-auto py-12">
        <div className="max-w-md w-full bg-[#132238] border-2 border-[#1F385C] rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-teal-950/90 border-2 border-teal-500 text-teal-300 flex items-center justify-center mx-auto shadow-inner">
            <User className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-700 px-3.5 py-1 rounded-full uppercase tracking-wider inline-block">
              PORTAL PESAKIT DIALISIS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Sila Log Masuk Akaun Pesakit</h2>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              Log masuk dengan No. ID Pesakit, Emel, atau No. Telefon anda untuk melihat jadual rawatan, status giliran ketibaan, dan preskripsi ubat.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {onOpenLogin && (
              <button
                onClick={onOpenLogin}
                className="w-full min-h-[58px] py-4 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:from-emerald-600 text-slate-950 font-black text-lg rounded-2xl transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer border-2 border-teal-300"
              >
                <User className="w-6 h-6 stroke-[2.5]" />
                <span>LOG MASUK SEKARANG</span>
              </button>
            )}

            {/* QUICK PATIENT SELECTOR FROM REGISTERED CLINIC LIST */}
            {patients && patients.length > 0 && onSelectPatient && (
              <div className="pt-4 border-t border-[#1F385C] space-y-2 text-left">
                <label className="text-xs sm:text-sm font-extrabold text-cyan-300 uppercase tracking-wider block text-center">
                  Atau Pilih Pesakit Berdaftar di Klinik:
                </label>
                <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1 pt-1">
                  {patients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onSelectPatient(p)}
                      className="w-full p-4 bg-[#0B132B] hover:bg-[#0E1A30] border-2 border-[#1F385C] hover:border-teal-500 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group min-h-[56px]"
                    >
                      <div>
                        <strong className="text-white text-base font-black block group-hover:text-cyan-300 transition-colors">
                          {p.name}
                        </strong>
                        <span className="text-xs sm:text-sm text-slate-300 font-mono block mt-0.5">
                          ID: <span className="text-cyan-300 font-bold">{p.patient_id_code}</span> • {p.schedule_pattern ? p.schedule_pattern.replace(/_/g, ' ') : 'Jadual Rutin'}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-cyan-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {onNavigateToRegistration && (
                <button
                  onClick={onNavigateToRegistration}
                  className="flex-1 min-h-[50px] py-3 px-3 bg-[#0B132B] hover:bg-[#0E1A30] text-slate-100 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-[#1F385C]"
                >
                  <span>Daftar Pesakit Baru</span>
                </button>
              )}

              {onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  className="flex-1 min-h-[50px] py-3 px-3 bg-[#0B132B] hover:bg-[#0E1A30] text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-[#1F385C]"
                >
                  <span>Portal Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col font-sans pb-32 transition-colors">
      
      {/* 1. ACCESSIBILITY TOOLBAR (FONT SIZE ADJUSTER) */}
      <div className="bg-[#0E1A30] text-slate-200 border-b border-[#1F385C] px-4 py-2.5 transition-colors sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2.5 text-xs sm:text-sm">
          {/* Font Size Adjuster */}
          <div className="flex items-center space-x-2.5">
            <span className="font-bold flex items-center gap-1.5 text-teal-300">
              <Type className="w-4 h-4 text-teal-400" />
              <span>Saiz Tulisan:</span>
            </span>
            <div className="flex items-center p-1 rounded-xl border bg-[#0B132B] border-[#1F385C]">
              <button
                onClick={() => setFontSize('normal')}
                className={`min-h-[38px] px-3.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                  fontSize === 'normal'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Saiz Tulisan Standard"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`min-h-[38px] px-3.5 py-1 rounded-lg font-black text-sm transition-all cursor-pointer ${
                  fontSize === 'large'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Saiz Tulisan Besar"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`min-h-[38px] px-3.5 py-1 rounded-lg font-black text-base transition-all cursor-pointer ${
                  fontSize === 'xlarge'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Saiz Tulisan Sangat Besar"
              >
                A++
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP CLINIC BANNER */}
      <div className="bg-[#0E1A30] border-b-2 border-[#1F385C] px-4 py-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-cyan-400">
                KAIZENBROS DIALYSIS CENTRE
              </span>
            </div>
            <h1 suppressHydrationWarning className={`${fontTitleClass} font-black text-white mt-0.5`}>
              Selamat datang,
              <span className="text-teal-300 ml-2">{patient.name}</span>
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-[#0B132B] border border-[#1F385C] rounded-xl px-3.5 py-1.5 text-right">
              <span className="text-[10px] sm:text-xs text-slate-300 block font-semibold">No. ID Pesakit</span>
              <span className="text-base sm:text-lg font-mono font-black text-cyan-300 tracking-wide">
                {patient.patient_id_code}
              </span>
            </div>

            {onPatientLogout && (
              <button
                onClick={onPatientLogout}
                className="min-h-[48px] bg-[#132238] hover:bg-rose-950 active:bg-rose-900 text-rose-300 hover:text-rose-100 border border-rose-700/80 rounded-xl px-4 py-2 text-xs sm:text-sm font-black transition-all cursor-pointer shadow-sm flex items-center space-x-1.5"
                title="Log Keluar Akaun Pesakit"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Log Keluar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6">
        
        {/* ==================== TAB 1: UTAMA (HOME) ==================== */}
        {activeTab === 'utama' && (
          <div className="space-y-6">
            
            {/* Status Kawalan Ketibaan & Rawatan (Maklumat Status Klinikal Rasmi) */}
            <div className="p-3.5 sm:p-4 bg-[#0A1324] border-2 border-[#1F385C] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm shadow-md">
              <div className="flex items-center space-x-2.5">
                <span className="text-slate-400 font-bold">Status Rawatan Hari Ini:</span>
                <span className={`px-3 py-1 rounded-full font-black text-xs ${
                  !hasArrivedAndRegistered 
                    ? 'bg-amber-950 text-amber-300 border border-amber-700' 
                    : isWaitingQueue 
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' 
                    : isChairAssignedWaitingStart
                    ? 'bg-blue-950 text-blue-300 border border-blue-600'
                    : isOnDialysis
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : isSessionCompleted
                    ? 'bg-teal-950 text-teal-300 border border-teal-700'
                    : 'bg-slate-900 text-slate-300 border border-slate-700'
                }`}>
                  {!hasArrivedAndRegistered 
                    ? '🟡 Belum Tiba di Klinik (Menunggu Pendaftaran Kaunter)' 
                    : isWaitingQueue 
                    ? '🔵 Sudah Daftar Kaunter (Menunggu Kerusi)' 
                    : isChairAssignedWaitingStart
                    ? `🔵 Kerusi Ditugaskan (${assignedChairNumber}) • Menunggu Mula`
                    : isOnDialysis
                    ? `🟢 Sedang Dialisis (Kerusi ${assignedChairNumber})`
                    : isSessionCompleted
                    ? `✓ Rawatan Selesai (Kerusi ${assignedChairNumber})`
                    : `Kerusi ${assignedChairNumber}`}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium italic">
                *Status dikemaskini oleh jururawat &amp; admin di kaunter klinik
              </div>
            </div>

            {/* A. CASE 1: MENUNGGU GILIRAN (FCFS QUEUE TICKET PASS) */}
            {isWaitingQueue && (
              <div className="bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 border-3 border-amber-500 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden patient-dark-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-sm sm:text-base tracking-wider uppercase">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping mr-1" />
                    <span>TIKET GILIRAN KETIBAAN (FCFS)</span>
                  </div>
                  <span className="bg-amber-950/90 text-amber-300 border border-amber-600 text-xs font-mono font-bold px-3 py-1 rounded-full">
                    Masa Tiba: {checkInRecord?.check_in_time || '01:30 PM'}
                  </span>
                </div>

                <div className="text-center py-4 bg-slate-950/80 border-2 border-amber-600/80 rounded-2xl space-y-1">
                  <span className="text-xs text-amber-300 uppercase font-bold tracking-widest block">NO. GILIRAN ANDA</span>
                  <div className="text-5xl sm:text-6xl font-black text-amber-400 font-mono tracking-tight">
                    {checkInRecord?.queue_number || 'Q-01'}
                  </div>
                  <span className="text-xs text-slate-300 font-semibold block pt-1">
                    Sila tunggu panggilan jururawat di ruang menunggu
                  </span>
                </div>

                {/* Section Lokasi & Stesen Kerusi / Mesin semasa Menunggu */}
                <div className="p-4 bg-slate-950/90 rounded-2xl border-2 border-cyan-600/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm uppercase font-black text-cyan-300 tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      Lokasi & Stesen Kerusi / Mesin Dialisis
                    </span>
                    <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono font-bold px-2.5 py-0.5 rounded-full">
                      Menunggu Panggilan
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white">
                    Pendaftaran di kaunter berjaya. Kerusi sedang dipilih oleh jururawat bertugas.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Setiap kerusi tidak tetap, bergantung masa ketibaan dan dipilih oleh jururawat sahaja mengikut susunan giliran ketibaan anda.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-bold">Berat Disukat:</span>
                    <strong className="text-white text-lg font-black">{activePreWeight !== null ? `${activePreWeight} kg` : 'Belum Disukat'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-bold">BP Disukat:</span>
                    <strong className="text-cyan-300 text-lg font-black">{activePreBp || 'Belum Diperiksa'}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setShowSessionDetail(true)}
                  className="w-full min-h-[56px] py-4 px-6 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-lg sm:text-xl rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-3 cursor-pointer border-2 border-amber-300"
                >
                  <span>LIHAT STATUS GILIRAN SAYA</span>
                  <ChevronRight className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            )}

            {/* B1. CASE 2A: KERUSI TELAH DITUGASKAN - MENUNGGU JURURAWAT MEMULAKAN DIALISIS */}
            {isChairAssignedWaitingStart && hasAssignedChair && (
              <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 border-3 border-blue-500 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden patient-dark-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-400 font-extrabold text-sm sm:text-base tracking-wider uppercase">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-400 animate-ping mr-1" />
                    <span>KERUSI DITUGASKAN • MENUNGGU RAWATAN DIMULAKAN</span>
                  </div>
                  <span className="bg-blue-950/90 text-blue-300 border border-blue-600 text-xs font-mono font-bold px-3 py-1 rounded-full">
                    Status: Menunggu Mula
                  </span>
                </div>

                <div className="space-y-2 mb-2">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white flex items-baseline gap-3">
                    <span>Stesen Kerusi</span>
                    <span className="text-blue-300 font-black font-mono">
                      Kerusi {assignedChairNumber}
                    </span>
                  </div>
                  <div className="flex items-center text-slate-200 text-base font-bold">
                    <MapPin className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
                    <span>Mesin: {assignedMachineModel || 'Fresenius 4008S NG'}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/90 rounded-2xl border-2 border-blue-600/80 space-y-2">
                  <p className="text-sm sm:text-base font-bold text-white">
                    Sila duduk di Kerusi {assignedChairNumber}. Pendaftaran & penugasan kerusi telah selesai.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Jururawat bertugas sedang menyediakan mesin dialisis dan akan memasang talian darah (AVF / Catheter) anda sebentar lagi. Kotak ini akan bertukar ke <strong className="text-emerald-300">RAWATAN DIALISIS SEDANG BERJALAN</strong> sebaik sahaja jururawat menukar status ke Sedang Dialisis di sistem.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-bold">Berat Disukat:</span>
                    <strong className="text-white text-lg font-black">{activePreWeight !== null ? `${activePreWeight} kg` : 'Belum Disukat'}</strong>
                  </div>
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-bold">BP Disukat:</span>
                    <strong className="text-cyan-300 text-lg font-black">{activePreBp || 'Belum Diperiksa'}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setShowSessionDetail(true)}
                  className="w-full min-h-[56px] py-4 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-lg sm:text-xl rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-3 cursor-pointer border-2 border-blue-400"
                >
                  <span>LIHAT BUTIRAN SESI SAYA</span>
                  <ChevronRight className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            )}

            {/* B2. CASE 2B: SEDANG DIALISIS (HANYA PAPAR BILA KERUSI TELAH DITUGASKAN DAN STATUS AKTIF SEDANG DIALISIS) */}
            {isOnDialysis && hasAssignedChair && (
              <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-3 border-emerald-500 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden patient-dark-card">
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm sm:text-base tracking-wider uppercase mb-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                  <span>RAWATAN DIALISIS SEDANG BERJALAN</span>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white flex items-baseline gap-3">
                    <span>Stesen Kerusi</span>
                    <span className="text-emerald-300 font-black font-mono">
                      Kerusi {assignedChairNumber}
                    </span>
                  </div>
                  <div className="flex items-center text-slate-200 text-base font-bold">
                    <MapPin className="w-5 h-5 mr-2 text-emerald-400 flex-shrink-0" />
                    <span>Mesin: {assignedMachineModel || 'Fresenius 4008S NG'}</span>
                  </div>
                </div>

                <div className="inline-flex items-center bg-emerald-950 text-emerald-200 border border-emerald-700 px-4 py-2 rounded-full text-base font-bold mb-6">
                  <Clock className="w-5 h-5 mr-2 text-emerald-300" />
                  <span>Baki Rawatan: ~3 Jam 15 Minit</span>
                </div>

                <button
                  onClick={() => setShowSessionDetail(true)}
                  className="w-full min-h-[56px] py-4 px-6 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-lg sm:text-xl rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-3 cursor-pointer border-2 border-emerald-300"
                >
                  <span>LIHAT PEMANTAUAN DIALISIS SAYA</span>
                  <ChevronRight className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            )}

            {/* B3. CASE 2C: RAWATAN DIALISIS HARI INI TELAH SELESAI */}
            {isSessionCompleted && (
              <div className="bg-gradient-to-br from-teal-950 via-slate-900 to-slate-900 border-3 border-teal-500 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden patient-dark-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-teal-400 font-extrabold text-sm sm:text-base tracking-wider uppercase">
                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                    <span>RAWATAN DIALISIS HARI INI TELAH SELESAI</span>
                  </div>
                  <span className="bg-teal-950/90 text-teal-300 border border-teal-600 text-xs font-mono font-bold px-3 py-1 rounded-full">
                    Selesai & Discaj
                  </span>
                </div>

                <div className="space-y-2 mb-2">
                  <p className="text-white text-base sm:text-lg font-bold">
                    Alhamdulillah, sesi rawatan dialisis anda untuk hari ini telah selesai disempurnakan.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Terima kasih atas disiplin dan kerjasama anda. Sila patuhi nasihat diet dan ubat-ubatan sehingga temujanji seterusnya.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-bold">Berat Akhir:</span>
                    <strong className="text-teal-300 text-lg font-black">{activePostWeight !== null ? `${activePostWeight} kg` : (activePreWeight ? `${activePreWeight} kg` : '--')}</strong>
                  </div>
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-bold">BP Akhir:</span>
                    <strong className="text-cyan-300 text-lg font-black">{activePostBp || activePreBp || '--'}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setShowSessionDetail(true)}
                  className="w-full min-h-[52px] py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-base rounded-2xl transition-all flex items-center justify-center space-x-2 cursor-pointer border border-teal-700"
                >
                  <span>Lihat Ringkasan Sesi Dialisis</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* C. CASE 3: PROMINENT UPCOMING APPOINTMENT CARD (SESI RAWATAN DIALISIS SETERUSNYA) */}
            {!hasArrivedAndRegistered && nextDialysis && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border-3 border-cyan-500 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden patient-dark-card">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2 text-cyan-400 font-black text-sm sm:text-base tracking-wider uppercase">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      <span>SESI RAWATAN DIALISIS SETERUSNYA</span>
                    </div>
                    <span className={`text-xs font-black px-3.5 py-1 rounded-full border ${nextDialysis.badgeColor}`}>
                      {nextDialysis.relativeText} ({nextDialysis.dayName})
                    </span>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="text-3xl sm:text-4xl font-black text-white flex flex-wrap items-baseline gap-2">
                      <span>{nextDialysis.dayName},</span>
                      <span className="text-cyan-300 font-black text-2xl sm:text-3xl">
                        {nextDialysis.formattedDate.replace(/^[^,]+,\s*/, '')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-slate-200 text-base font-bold">
                      <span className="bg-slate-950 border border-cyan-700/80 px-3.5 py-1.5 rounded-xl text-cyan-300 font-black">
                        Seterusnya {nextDialysis.dayName} {nextDialysis.shortTime} ({nextDialysis.shiftTitle})
                      </span>
                      <span className="text-slate-300">• Waktu Rawatan: <strong className="text-white">{nextDialysis.timeRange}</strong></span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/90 border-2 border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 space-y-1.5">
                    <p className="font-bold text-cyan-300 flex items-center space-x-1.5">
                      <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span>Panduan Ketibaan Pesakit:</span>
                    </p>
                    <p>• Sila tiba <strong>15 minit lebih awal</strong> di Kaunter Jururawat.</p>
                    <p>• Rutin tetap anda: <strong className="text-emerald-300">{schedulePatternLabel}</strong>.</p>
                  </div>
                </div>

                {/* DEDICATED LOKASI & STESEN KERUSI / MESIN DIALISIS SECTION */}
                <div className="p-5 sm:p-6 bg-[#0A1324] border-2 border-amber-500 rounded-3xl space-y-3.5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm uppercase font-black text-amber-300 tracking-wider flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      Lokasi & Stesen Kerusi / Mesin Dialisis
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700">
                      Belum Daftar Kaunter
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 bg-slate-950/95 border-2 border-amber-600/70 rounded-2xl space-y-2.5">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="text-lg sm:text-xl font-black text-amber-300 leading-snug">
                          kerusi dan mesin dialisis akan di papar selepas daftar di kaunter pada hari dialisis
                        </p>
                        <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                          sebab setiap kerusi tidak tetap, bergantung masa ketibaan dan di pilih oleh nurse sahaja (sistem giliran FCFS).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* D. 5 CORE QUICK-ACCESS ACTION CARDS (Minimum 48px touch targets, large text) */}
            <div className="space-y-2">
              <h2 className={`${fontBodyClass} font-black text-slate-300 uppercase tracking-wider px-1 flex items-center gap-2`}>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Fungsi Utama Portal Pesakit:</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Sesi & Pemantauan Dialisis */}
                <button
                  onClick={() => setShowSessionDetail(true)}
                  className="min-h-[96px] bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border-2 border-slate-800 hover:border-emerald-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-lg"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0 text-emerald-300 shadow-inner">
                    <Stethoscope className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className={`${fontTitleClass} font-black text-white portal-light-black`}>🩺 Sesi Dialisis Saya</h3>
                    <p className={`${fontSubClass} text-slate-300 font-medium mt-0.5 portal-light-black`}>
                      {isOnDialysis && assignedChairNumber ? `🟢 Sedang rawatan (Kerusi ${assignedChairNumber})` : isChairAssignedWaitingStart ? `🔵 Kerusi ${assignedChairNumber} ditugaskan (Menunggu mula)` : isWaitingQueue ? '🟡 Menunggu pemilihan kerusi jururawat' : 'Kerusi dipapar selepas daftar di kaunter'}
                    </p>
                  </div>
                </button>

                {/* 2. Jadual Temujanji Dialisis */}
                <button
                  onClick={() => setActiveTab('jadual')}
                  className="min-h-[96px] bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border-2 border-slate-800 hover:border-cyan-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-lg"
                >
                  <div className="w-14 h-14 rounded-2xl bg-cyan-950 border-2 border-cyan-500 flex items-center justify-center flex-shrink-0 text-cyan-300 shadow-inner">
                    <Calendar className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className={`${fontTitleClass} font-black text-white portal-light-black`}>📅 Jadual Temujanji</h3>
                    <p className={`${fontSubClass} text-slate-300 font-medium mt-0.5 portal-light-black`}>
                      {schedulePatternLabel} ({patientShiftInfo.shortTime})
                    </p>
                  </div>
                </button>

                {/* 3. Rekod Timbang & BP */}
                <button
                  onClick={() => setActiveTab('timbang')}
                  className="min-h-[96px] bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border-2 border-slate-800 hover:border-teal-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-lg"
                >
                  <div className="w-14 h-14 rounded-2xl bg-teal-950 border-2 border-teal-500 flex items-center justify-center flex-shrink-0 text-teal-300 shadow-inner">
                    <Scale className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`${fontTitleClass} font-black text-white portal-light-black`}>⚖️ Timbang & BP (Pra & After)</h3>
                      <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-700 px-2 py-0.5 rounded-full font-bold">
                        Boleh Masuk Data
                      </span>
                    </div>
                    <p className={`${fontSubClass} text-slate-300 font-medium mt-0.5 portal-light-black`}>
                      Pra: <strong className="text-amber-300">{activePreWeight !== null ? `${activePreWeight}kg` : '--'}</strong> • Selepas: <strong className="text-cyan-300">{activePostWeight !== null ? `${activePostWeight}kg` : '--'}</strong> (Kering: <strong className="text-emerald-300">{patientDryWeight}kg</strong>)
                    </p>
                  </div>
                </button>

                {/* 4. Senarai Ubat-Ubatan */}
                <button
                  onClick={() => setActiveTab('ubat')}
                  className="min-h-[96px] bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border-2 border-slate-800 hover:border-amber-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-lg"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-950 border-2 border-amber-500 flex items-center justify-center flex-shrink-0 text-amber-300 shadow-inner">
                    <Pill className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className={`${fontTitleClass} font-black text-white portal-light-black`}>💊 Senarai Ubat</h3>
                    <p className={`${fontSubClass} text-slate-300 font-medium mt-0.5 portal-light-black`}>
                      {activePatientMedications.length} jenis ubat aktif
                    </p>
                  </div>
                </button>

                {/* 5. Rekod Kesihatan Saya */}
                <button
                  onClick={() => setActiveTab('rekod')}
                  className="min-h-[96px] bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border-2 border-slate-800 hover:border-indigo-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-lg"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-950 border-2 border-indigo-500 flex items-center justify-center flex-shrink-0 text-indigo-300 shadow-inner">
                    <FileText className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className={`${fontTitleClass} font-black text-white portal-light-black`}>📋 Rekod Kesihatan Saya</h3>
                    <p className={`${fontSubClass} text-slate-300 font-medium mt-0.5 portal-light-black`}>
                      Sejarah rawatan, bacaan pra/pos dialisis & laporan klinikal
                    </p>
                  </div>
                </button>

                {/* 6. Rekod Perubatan & Darah */}
                <button
                  onClick={() => setActiveTab('darah')}
                  className="min-h-[96px] bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border-2 border-slate-800 hover:border-rose-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-lg"
                >
                  <div className="w-14 h-14 rounded-2xl bg-rose-950 border-2 border-rose-500 flex items-center justify-center flex-shrink-0 text-rose-300 shadow-inner">
                    <Activity className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className={`${fontTitleClass} font-black text-white portal-light-black`}>🩺 Rekod Perubatan & Darah</h3>
                    <p className={`${fontSubClass} text-slate-300 font-medium mt-0.5 portal-light-black`}>
                      Keputusan pemeriksaan berkala dan rekod perubatan anda
                    </p>
                  </div>
                </button>

              </div>
            </div>

            {/* E. PROMINENT SOS EMERGENCY CALL BUTTON */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => setShowHelpModal(true)}
                className="w-full min-h-[64px] bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xl sm:text-2xl rounded-2xl shadow-2xl p-4 flex items-center justify-center space-x-3 cursor-pointer border-3 border-rose-300"
              >
                <AlertTriangle className="w-8 h-8 text-rose-200 animate-bounce" />
                <span>🚨 PANGGIL PUSAT DIALISIS (24/7)</span>
              </button>
              <p className="text-center text-xs sm:text-sm text-slate-300 font-bold portal-light-black">
                Hubungi jika mengalami pening teruk, sesak nafas, atau kecemasan di rumah.
              </p>
            </div>

          </div>
        )}

        {/* ==================== TAB 2: JADUAL TEMUJANJI ==================== */}
        {activeTab === 'jadual' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`${fontTitleClass} font-black text-white flex items-center`}>
                <Calendar className="w-7 h-7 mr-2 text-cyan-400" />
                Jadual Rawatan Saya
              </h2>
              <button 
                onClick={() => setActiveTab('utama')}
                className="min-h-[44px] text-cyan-300 text-base font-bold underline cursor-pointer px-3"
              >
                Kembali
              </button>
            </div>

            <div className={`${themeCardClass} rounded-2xl p-6 space-y-5`}>
              {/* Rutin Tetap Header */}
              <div className="bg-cyan-950/80 border-2 border-cyan-800 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-extrabold text-cyan-300 tracking-wider">
                    Rutin Tetap Rawatan
                  </span>
                  <span className="text-xs bg-cyan-900 text-cyan-200 border border-cyan-700 px-3 py-1 rounded-full font-bold">
                    ✓ Diselaraskan
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  Setiap Hari {patient.schedule_pattern === 'SELASA_KHAMIS_SABTU' ? 'SELASA, KHAMIS & SABTU' : 'ISNIN, RABU & JUMAAT'}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-slate-200">
                  <span className="bg-slate-950 border border-slate-700 px-3.5 py-1.5 rounded-xl font-black text-amber-300 text-base">
                    {patientShiftInfo.title}: {patientShiftInfo.timeRange}
                  </span>
                </div>
              </div>

              {/* Sesi Rawatan Akan Datang */}
              <div className="space-y-3 pt-1">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>6 Sesi Rawatan Seterusnya:</span>
                </h4>

                <div className="space-y-3">
                  {upcomingSchedule.map((item, index) => (
                    <div
                      key={item.dateStr + index}
                      className={`rounded-2xl p-4 border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        item.isToday
                          ? 'bg-slate-950 border-emerald-500 shadow-md'
                          : 'bg-slate-950/90 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {item.isToday && (
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-black px-2.5 py-0.5 rounded">
                              HARI INI
                            </span>
                          )}
                          <p suppressHydrationWarning className="text-lg font-bold text-white">
                            {item.formattedDate}
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 font-medium">
                          Waktu Rawatan: <strong className="text-cyan-300">{patientShiftInfo.timeRange}</strong>
                          {item.session?.chair_number && (
                            <>
                              {' • '}Kerusi: <span className="font-mono text-emerald-300 font-bold">{item.session.chair_number}</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <span className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border ${item.statusColor}`}>
                          {item.statusLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  Jadual ini dikemaskini secara automatik mengikut penetapan Doktor Pakar Nefrologi dan Pentadbir Klinikal di Portal Pentadbir. Sekiranya ingin menukar syif atau ada temujanji hospital luar, sila maklumkan kepada jururawat sekurang-kurangnya 24 jam awal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: TIMBANG & TEKANAN DARAH ==================== */}
        {activeTab === 'timbang' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`${fontTitleClass} font-black text-white flex items-center`}>
                <Scale className="w-7 h-7 mr-2 text-teal-400" />
                Rekod Berat & Tekanan Darah (Pra & Selepas)
              </h2>
              <button 
                onClick={() => setActiveTab('utama')}
                className="min-h-[44px] text-cyan-300 text-base font-bold underline cursor-pointer px-3"
              >
                Kembali
              </button>
            </div>

            <div className={`${themeCardClass} rounded-2xl p-6 space-y-6`}>
              
              {/* Ringkasan Parameter Berat Pesakit */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-teal-950/90 border-2 border-teal-600 rounded-2xl p-4 space-y-0.5">
                  <span className="text-[10px] uppercase text-teal-300 font-extrabold tracking-wider block">BERAT KERING SASARAN</span>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono">{patientDryWeight} kg</div>
                  <span className="text-[10px] text-teal-200">Sasaran Pakar</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-0.5">
                  <span className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider block">BERAT PRA-DIALISIS</span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                    {activePreWeight !== null ? `${activePreWeight} kg` : '--'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">BP: {activePreBp || '--'}</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-0.5">
                  <span className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider block">BERAT SELEPAS DIALISIS</span>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
                    {activePostWeight !== null ? `${activePostWeight} kg` : '--'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">BP: {activePostBp || '--'}</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-0.5">
                  <span className="text-[10px] uppercase text-emerald-400 font-extrabold tracking-wider block">CECAIR DITAPIS (UF)</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                    {fluidRemovedKg !== null ? `-${fluidRemovedKg} kg` : '--'}
                  </div>
                  <span className="text-[10px] text-emerald-400">Ultrafiltration</span>
                </div>
              </div>

              {saveWeightSuccess && (
                <div className="p-3.5 bg-emerald-950 border-2 border-emerald-500 text-emerald-200 text-xs font-bold rounded-xl flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>{saveWeightSuccess}</span>
                </div>
              )}

              {/* 1. SECTION: BERAT BADAN PRA-DIALISIS (SEBELUM RAWATAN) */}
              <div className="bg-slate-950 border-2 border-amber-500/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span>1. Berat Badan Pra-Dialisis (Sebelum Rawatan)</span>
                  </h3>
                  <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-700 px-2.5 py-0.5 rounded-full font-bold">
                    Pra-Rawatan
                  </span>
                </div>

                {/* Pre Weight Stepper */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-300 uppercase block">
                    Berat Pra-Dialisis (kg):
                  </label>
                  <div className="flex items-center justify-between gap-3 bg-slate-900 border-2 border-slate-800 p-2 rounded-2xl">
                    <button
                      onClick={() => setInputPreWeight(prev => Number((Math.max(30, prev - 0.1)).toFixed(1)))}
                      className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl rounded-xl cursor-pointer flex items-center justify-center border border-slate-700 shrink-0"
                      title="Tolak 0.1kg"
                    >
                      <Minus className="w-5 h-5 stroke-[3]" />
                    </button>
                    
                    <div className="text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={inputPreWeight}
                        onChange={(e) => setInputPreWeight(Number(e.target.value))}
                        className="w-28 text-center font-mono font-black text-3xl text-amber-300 bg-transparent border-b border-slate-700 focus:border-amber-400 outline-none"
                      />
                      <span className="text-sm font-sans text-slate-400 font-bold ml-1">kg</span>
                    </div>

                    <button
                      onClick={() => setInputPreWeight(prev => Number((prev + 0.1).toFixed(1)))}
                      className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl rounded-xl cursor-pointer flex items-center justify-center border border-slate-700 shrink-0"
                      title="Tambah 0.1kg"
                    >
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </button>
                  </div>

                  {/* Pre Overload Calculation */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Anggaran Kelebihan Cecair (vs Berat Kering):</span>
                    <strong className={`text-sm font-black ${inputPreWeight - patientDryWeight > 2.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      +{(inputPreWeight - patientDryWeight).toFixed(1)} kg
                    </strong>
                  </div>
                </div>

                {/* Pre Blood Pressure Input */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-300 uppercase block">
                    Tekanan Darah Pra-Dialisis (Sys / Dia):
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Systolic (Pra):</span>
                      <input
                        type="number"
                        value={inputPreSystolic}
                        onChange={(e) => setInputPreSystolic(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-lg text-center mt-1 focus:border-amber-400 outline-none"
                        placeholder="138"
                      />
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Diastolic (Pra):</span>
                      <input
                        type="number"
                        value={inputPreDiastolic}
                        onChange={(e) => setInputPreDiastolic(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-lg text-center mt-1 focus:border-amber-400 outline-none"
                        placeholder="82"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSelfWeight('PRE')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Berat Pra Sahaja</span>
                  </button>
                </div>
              </div>

              {/* 2. SECTION: BERAT BADAN SELEPAS DIALISIS (AFTER DIALISIS) */}
              <div className="bg-slate-950 border-2 border-cyan-500/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400" />
                    <span>2. Berat Badan Selepas Dialisis (After Dialisis)</span>
                  </h3>
                  <span className="text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-2.5 py-0.5 rounded-full font-bold">
                    Post-Rawatan
                  </span>
                </div>

                {/* Post Weight Stepper */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-300 uppercase block">
                    Berat Selepas / After Dialisis (kg):
                  </label>
                  <div className="flex items-center justify-between gap-3 bg-slate-900 border-2 border-slate-800 p-2 rounded-2xl">
                    <button
                      onClick={() => setInputPostWeight(prev => Number((Math.max(30, prev - 0.1)).toFixed(1)))}
                      className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl rounded-xl cursor-pointer flex items-center justify-center border border-slate-700 shrink-0"
                      title="Tolak 0.1kg"
                    >
                      <Minus className="w-5 h-5 stroke-[3]" />
                    </button>
                    
                    <div className="text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={inputPostWeight}
                        onChange={(e) => setInputPostWeight(Number(e.target.value))}
                        className="w-28 text-center font-mono font-black text-3xl text-cyan-300 bg-transparent border-b border-slate-700 focus:border-cyan-400 outline-none"
                      />
                      <span className="text-sm font-sans text-slate-400 font-bold ml-1">kg</span>
                    </div>

                    <button
                      onClick={() => setInputPostWeight(prev => Number((prev + 0.1).toFixed(1)))}
                      className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl rounded-xl cursor-pointer flex items-center justify-center border border-slate-700 shrink-0"
                      title="Tambah 0.1kg"
                    >
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </button>
                  </div>

                  {/* Post UF Calculation */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Jumlah Cecair Dikeluarkan (Pra - Selepas):</span>
                    <strong className="text-sm font-black text-emerald-400 font-mono">
                      {(inputPreWeight - inputPostWeight).toFixed(1)} kg (Liter)
                    </strong>
                  </div>

                  {/* Comparison with Dry Weight */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Beza vs Sasaran Berat Kering ({patientDryWeight} kg):</span>
                    <strong className={`text-sm font-black font-mono ${
                      Math.abs(inputPostWeight - patientDryWeight) <= 0.3 
                        ? 'text-emerald-400' 
                        : inputPostWeight > patientDryWeight 
                        ? 'text-amber-400' 
                        : 'text-rose-400'
                    }`}>
                      {inputPostWeight >= patientDryWeight ? `+${(inputPostWeight - patientDryWeight).toFixed(1)}` : `${(inputPostWeight - patientDryWeight).toFixed(1)}`} kg
                      {Math.abs(inputPostWeight - patientDryWeight) <= 0.3 && ' (Sasaran Tercapai! ✓)'}
                    </strong>
                  </div>
                </div>

                {/* Post Blood Pressure Input */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-300 uppercase block">
                    Tekanan Darah Selepas Dialisis (Sys / Dia):
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Systolic (Selepas):</span>
                      <input
                        type="number"
                        value={inputPostSystolic}
                        onChange={(e) => setInputPostSystolic(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-lg text-center mt-1 focus:border-cyan-400 outline-none"
                        placeholder="124"
                      />
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Diastolic (Selepas):</span>
                      <input
                        type="number"
                        value={inputPostDiastolic}
                        onChange={(e) => setInputPostDiastolic(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-lg text-center mt-1 focus:border-cyan-400 outline-none"
                        placeholder="78"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSelfWeight('POST')}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Berat Selepas Sahaja</span>
                  </button>
                </div>
              </div>

              {/* UNIFIED ACTION BUTTON */}
              <button
                onClick={() => handleSaveSelfWeight('ALL')}
                className="w-full min-h-[56px] bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-lg rounded-2xl transition-all shadow-xl flex items-center justify-center space-x-2 cursor-pointer border-2 border-teal-200"
              >
                <Check className="w-6 h-6 stroke-[3]" />
                <span>SIMPAN SEMUA REKOD BERAT (PRA & SELEPAS DIALISIS)</span>
              </button>

              {/* Fluid Management Guide */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-2">
                <h4 className="font-black text-white text-base">📌 Nasihat Penjagaan Cecair & Berat:</h4>
                <p>• <strong>Pra-Dialisis:</strong> Timbang berat sebaik sahaja tiba di pusat dialisis sebelum jarum dipasang.</p>
                <p>• <strong>Selepas Dialisis:</strong> Timbang berat sekali lagi setelah rawatan selesai dan jarum dicabut untuk mengesahkan jumlah cecair yang berjaya disingkirkan.</p>
                <p>• Data yang anda masukkan di sini akan disegerakkan terus ke Portal Jururawat.</p>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 4: SENARAI UBAT-UBATAN ==================== */}
        {activeTab === 'ubat' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`${fontTitleClass} font-black text-white flex items-center`}>
                <Pill className="w-7 h-7 mr-2 text-amber-400" />
                Senarai & Panduan Ubat
              </h2>
              <button 
                onClick={() => setActiveTab('utama')}
                className="min-h-[44px] text-cyan-300 text-base font-bold underline cursor-pointer px-3"
              >
                Kembali
              </button>
            </div>

            <div className={`${themeCardClass} rounded-2xl p-6 space-y-5`}>
              <div className="bg-amber-950/80 border-2 border-amber-600 rounded-2xl p-4 text-xs text-amber-200 space-y-1.5">
                <div className="flex items-center space-x-2 font-bold text-amber-300 text-sm">
                  <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Preskripsi Klinikal Rasmi Doktor</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Preskripsi ubat di bawah disahkan oleh <strong>Dr. Azman bin Khairuddin (Pakar Nefrologi)</strong>. Sila makan ubat mengikut masa yang ditetapkan.
                </p>
              </div>

              <div className="space-y-3">
                {activePatientMedications.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Tiada rekod ubat aktif. Sila rujuk doktor semasa sesi rawatan.
                  </div>
                ) : (
                  activePatientMedications.map((med) => (
                    <div key={med.id} className="bg-slate-950 p-5 rounded-2xl border-2 border-slate-800 space-y-2 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-black text-lg text-white">{med.medication_name}</h4>
                        <span className="text-xs font-mono bg-amber-950 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-800 shrink-0">
                          {med.route}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-emerald-300 font-extrabold bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-800">
                          Dos: {med.dosage}
                        </span>
                        <span className="text-xs text-cyan-300 font-extrabold bg-cyan-950 px-3 py-1 rounded-lg border border-cyan-800">
                          Kekerapan: {med.frequency}
                        </span>
                      </div>

                      {med.notes && (
                        <p className="text-xs text-slate-300 pt-1 border-t border-slate-800 mt-2">
                          <strong>Catatan Doktor:</strong> {med.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: REKOD DIALISIS ==================== */}
        {activeTab === 'rekod' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`${fontTitleClass} font-black text-white flex items-center`}>
                <FileText className="w-7 h-7 mr-2 text-indigo-400" />
                Rekod Rawatan Dialisis
              </h2>
              <button 
                onClick={() => setActiveTab('utama')}
                className="min-h-[44px] text-cyan-300 text-base font-bold underline cursor-pointer px-3"
              >
                Kembali
              </button>
            </div>

            <div className="space-y-4">
              {/* Record 1 (Today) */}
              <div className={`${themeCardClass} rounded-2xl p-5 space-y-3`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-emerald-400 font-black text-xs uppercase">Sesi Terkini (Hari Ini)</span>
                    <h3 className="text-lg font-bold text-white">Rabu, 30 Sep 2026</h3>
                  </div>
                  <span className="bg-emerald-950 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-800">
                    Selesai
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Berat Pra / Pos Dialisis:</span>
                    <p className="text-white font-bold text-sm mt-0.5">
                      {activePreWeight !== null ? `${activePreWeight} kg` : '66.8 kg'} → {patientDryWeight} kg
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Tekanan Darah (BP):</span>
                    <p className="text-cyan-300 font-bold text-sm mt-0.5">
                      {activePreBp || '138/82'} → 126/78
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <strong>Stesen Kerusi / Mesin:</strong> {assignedChairNumber ? `Kerusi ${assignedChairNumber} (${assignedMachineModel || 'Fresenius 4008S NG'}) | Dialyzer FX80 Cordiax` : 'Dipaparkan selepas pendaftaran di kaunter pada hari dialisis'}
                </div>
              </div>

              {/* Record 2 (Past) */}
              <div className={`${themeCardClass} rounded-2xl p-5 space-y-3 opacity-90`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-slate-400 font-bold text-xs uppercase">Sesi Lepas</span>
                    <h3 className="text-lg font-bold text-white">Isnin, 28 Sep 2026</h3>
                  </div>
                  <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                    Selesai
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Berat Pra / Pos Dialisis:</span>
                    <p className="text-white font-bold text-sm mt-0.5">67.2 kg → 65.0 kg</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Tekanan Darah (BP):</span>
                    <p className="text-cyan-300 font-bold text-sm mt-0.5">142/85 → 128/76</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: REKOD PERUBATAN & DARAH (ELDERLY FRIENDLY) ==================== */}
        {activeTab === 'darah' && (() => {
          // Filter records specifically for the logged-in patient
          const myRecords = [...medicalRecords]
            .filter(r => r.patient_id === patient?.id || String(r.patient_id) === String(patient?.id) || (!!r.patient_id_code && !!patient?.patient_id_code && r.patient_id_code === patient.patient_id_code))
            .sort((a, b) => new Date(b.examination_date).getTime() - new Date(a.examination_date).getTime());

          const selectedRecord = myRecords.find(r => r.id === selectedRecordId);

          return (
            <div className="space-y-6">
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-rose-950 text-rose-400 rounded-2xl flex items-center justify-center border-2 border-rose-500">
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">Rekod Perubatan & Darah</h2>
                    <p className="text-xs sm:text-sm text-slate-300">Laporan makmal dan keputusan pemeriksaan berkala anda</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (selectedRecordId) {
                      setSelectedRecordId(null);
                    } else {
                      setActiveTab('utama');
                    }
                  }}
                  className="min-h-[48px] px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 rounded-xl text-sm font-bold text-cyan-300 border border-slate-700 cursor-pointer transition-colors"
                >
                  {selectedRecordId ? '← Senarai' : 'Kembali'}
                </button>
              </div>

              {selectedRecord ? (
                /* DETAIL DRILL-DOWN VIEW */
                <div className="space-y-6">
                  {/* Record Info Card */}
                  <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider">Jenis Pemeriksaan</span>
                        <h3 className="text-lg sm:text-xl font-black text-white">{selectedRecord.examination_type}</h3>
                        <span className="text-xs sm:text-sm font-bold text-slate-400 mt-1 block">
                          Tarikh Pemeriksaan: {new Date(selectedRecord.examination_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center space-x-2">
                        <span className="bg-emerald-950 text-emerald-300 text-xs font-black px-3.5 py-1.5 rounded-full border border-emerald-800 uppercase tracking-wider">
                          ✓ Keputusan Tersedia
                        </span>
                      </div>
                    </div>

                    {/* Original Lab Document Link (Section 6) */}
                    {selectedRecord.report_document && (
                      <div className="bg-[#122238] border-2 border-[#203E5F] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center space-x-3 text-left w-full sm:w-auto">
                          <div className="p-2.5 bg-slate-900 text-cyan-400 rounded-lg">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Fail Laporan Makmal Rasmi</span>
                            <span className="text-sm font-bold text-white block truncate max-w-[200px]">{selectedRecord.report_document.name}</span>
                          </div>
                        </div>
                        <a
                          href={selectedRecord.report_document.dataUrl || selectedRecord.report_document.data_url}
                          download={selectedRecord.report_document.name}
                          className="w-full sm:w-auto px-5 py-2.5 min-h-[48px] bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-black text-xs sm:text-sm rounded-xl hover:from-cyan-500 hover:to-teal-500 transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer border border-cyan-400"
                          title="Muat Turun Laporan Asal Makmal"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="w-4 h-4" />
                          <span>📄 LIHAT LAPORAN ASAL</span>
                        </a>
                      </div>
                    )}

                    {/* Clinical Notes (Section 7: patient-visible) */}
                    {selectedRecord.clinical_notes && (
                      <div className="bg-[#131C1A] border-2 border-[#1E3330] rounded-xl p-4 space-y-1">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block font-mono">Nota Klinikal Jururawat / Kakitangan</span>
                        <p className="text-slate-100 font-medium text-sm leading-relaxed whitespace-pre-wrap">{selectedRecord.clinical_notes}</p>
                      </div>
                    )}

                    {/* Doctor Comments */}
                    {selectedRecord.doctor_comments && (
                      <div className="bg-[#0D1C2E] border-2 border-[#1B365D] rounded-xl p-4 space-y-1">
                        <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block font-mono flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-cyan-500" />
                          <span>💬 KOMEN & ULASAN KLINIKAL DOKTOR</span>
                        </span>
                        <p className="text-slate-100 font-medium text-sm leading-relaxed whitespace-pre-wrap">{selectedRecord.doctor_comments}</p>
                      </div>
                    )}

                    {/* AI Analysis Notes */}
                    {selectedRecord.ai_analysis_notes && (
                      <div className="bg-[#1C162E] border-2 border-[#33225C] rounded-xl p-4 space-y-1.5 shadow-md">
                        <span className="text-[10px] text-fuchsia-400 uppercase font-black tracking-wider block font-mono flex items-center gap-1.5 animate-pulse">
                          <Activity className="w-3.5 h-3.5" />
                          <span>🤖 ANALISIS KESIHATAN AI (RUMUSAN AUTOMATIK)</span>
                        </span>
                        <p className="text-slate-200 font-medium text-sm leading-relaxed whitespace-pre-wrap">{selectedRecord.ai_analysis_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* BLOOD / LABORATORY RESULTS GROUPING */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-white px-1">📊 Keputusan Analisis Darah Terperinci</h3>

                    {/* HELPER FOR LAB CARD */}
                    {(() => {
                      const renderLabCard = (
                        label: string, 
                        val: string | number | undefined, 
                        unit: string, 
                        range: string, 
                        status: 'NORMAL' | 'HIGH' | 'LOW' | 'NEEDS_REVIEW' | string
                      ) => {
                        if (val === undefined || val === '') return null;

                        const isHigh = status === 'HIGH';
                        const isLow = status === 'LOW';
                        const isReview = status === 'NEEDS_REVIEW';

                        // Get Bahasa Melayu simplified explanations for elderly patients
                        let descriptionBM = '';
                        const nameLower = label.toLowerCase();
                        if (nameLower.includes('hemoglobin') || nameLower.includes('hb')) {
                          descriptionBM = 'Penting untuk tenaga dan sel darah merah. Jika rendah, anda boleh merasa cepat letih atau pening.';
                        } else if (nameLower.includes('urea')) {
                          descriptionBM = 'Bahan buangan makanan dalam darah. Kadar tinggi menunjukkan buah pinggang tidak dapat menapis dengan baik.';
                        } else if (nameLower.includes('creatinine') || nameLower.includes('kreatinin')) {
                          descriptionBM = 'Penunjuk utama penapisan toksin buah pinggang. Nilai yang tinggi adalah biasa bagi pesakit dialisis.';
                        } else if (nameLower.includes('glucose') || nameLower.includes('gula')) {
                          descriptionBM = 'Tahap gula dalam darah. Sentiasa pantau pemakanan manis anda untuk mengelak kencing manis kronik.';
                        } else if (nameLower.includes('potassium') || nameLower.includes('kalium')) {
                          descriptionBM = 'Garam mineral otot. Terlalu tinggi (kalium tinggi) sangat berbahaya kepada jantung anda.';
                        } else if (nameLower.includes('phosphate') || nameLower.includes('fosfat')) {
                          descriptionBM = 'Penting untuk tulang. Terlalu tinggi boleh menyebabkan kulit gatal-gatal dan tulang menjadi rapuh.';
                        } else if (nameLower.includes('egfr')) {
                          descriptionBM = 'Peratus fungsi buah pinggang yang tinggal. Untuk pesakit dialisis, peratusan ini biasanya sangat rendah.';
                        } else if (nameLower.includes('cholesterol') || nameLower.includes('kolesterol')) {
                          descriptionBM = 'Kadar lemak dalam darah. Perlu dijaga supaya saluran darah tidak tersumbat.';
                        }

                        return (
                          <div className="bg-slate-900 border-2 border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between space-y-4 transition-all shadow-md">
                            {/* Title & Status Badge */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                              <span className="text-slate-200 font-extrabold text-lg tracking-wide block">{label}</span>
                              {status && (
                                <span className={`inline-flex items-center text-xs font-black px-3.5 py-1.5 rounded-xl border tracking-wider uppercase ${
                                  isHigh
                                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                                    : isLow
                                    ? 'bg-blue-950 text-blue-300 border-blue-600'
                                    : isReview
                                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                                    : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                                }`}>
                                  {isHigh ? '▲ TINGGI' : isLow ? '▼ RENDAH' : isReview ? '⚠️ SEMAKAN' : '● BAIK (NORMAL)'}
                                </span>
                              )}
                            </div>

                            {/* Elderly-friendly big status highlight bar */}
                            <div className={`p-3.5 rounded-2xl border text-xs font-extrabold flex items-center space-x-2 ${
                              isHigh
                                ? 'bg-rose-950/40 text-rose-300 border-rose-900/60'
                                : isLow
                                ? 'bg-blue-950/40 text-blue-300 border-blue-900/60'
                                : isReview
                                ? 'bg-amber-950/40 text-amber-300 border-amber-900/60'
                                : 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60'
                            }`}>
                              <span className="text-base">
                                {isHigh ? '🚨' : isLow ? '❄️' : isReview ? '%20' : '✅'}
                              </span>
                              <span>
                                {isHigh 
                                  ? 'BACAAN MELEBIHI HAD STANDARD' 
                                  : isLow 
                                  ? 'BACAAN DI BAWAH HAD STANDARD' 
                                  : isReview 
                                  ? 'MEMERLUKAN TINDAKAN/SEMAKAN' 
                                  : 'BACAAN BERADA DALAM HAD SELAMAT'}
                              </span>
                            </div>

                            {/* Huge numeric value */}
                            <div className="py-2">
                              <div className="flex items-baseline space-x-2">
                                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">{val}</span>
                                <span className="text-base font-extrabold text-slate-400 uppercase">{unit}</span>
                              </div>
                              <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 inline-block mt-3 text-xs">
                                <span className="text-slate-400 font-bold">Julat Sasaran Standard:</span>{' '}
                                <strong className="text-cyan-300 font-mono text-sm font-black">{range}</strong>
                              </div>
                            </div>

                            {/* Plain language explanation */}
                            {descriptionBM && (
                              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-2xl border border-slate-800/50">
                                <span className="font-bold text-slate-400 block mb-0.5 text-[10px] uppercase font-mono tracking-wider">💡 Info Kesihatan Ringkas:</span>
                                {descriptionBM}
                              </p>
                            )}
                          </div>
                        );
                      };

                      return (
                        <div className="space-y-8">
                          {/* 1. HEMATOLOGY CATEGORY */}
                          {selectedRecord.blood_results?.hematology && (
                            <div className="space-y-3">
                              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block px-1">🩸 Hematologi / Profil Sel Darah</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderLabCard('Hemoglobin (Hb)', selectedRecord.blood_results.hematology.hemoglobin, 'g/dL', patient?.gender === 'PEREMPUAN' ? '12.0 - 15.0' : '13.0 - 17.0', Number(selectedRecord.blood_results.hematology.hemoglobin) < 11.5 ? 'LOW' : 'NORMAL')}
                                {renderLabCard('White Blood Cell (WBC)', selectedRecord.blood_results.hematology.wbc, '10^3/uL', '4.0 - 11.0', 'NORMAL')}
                                {renderLabCard('Platelet', selectedRecord.blood_results.hematology.platelet, '10^3/uL', '150 - 400', 'NORMAL')}
                              </div>
                            </div>
                          )}

                          {/* 2. RENAL / DIALYSIS-RELATED CATEGORY */}
                          {selectedRecord.blood_results?.renal && (
                            <div className="space-y-3">
                              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block px-1">⚙️ Profil Ginjal / Elektrolit Dialisis</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderLabCard('Urea', selectedRecord.blood_results.renal.urea, 'mmol/L', '2.5 - 7.8', 'HIGH')}
                                {renderLabCard('Creatinine', selectedRecord.blood_results.renal.creatinine, 'umol/L', '60 - 110', 'HIGH')}
                                {renderLabCard('eGFR (Fungsi Buah Pinggang)', selectedRecord.blood_results.renal.egfr, 'mL/min/1.73m2', '> 90', 'LOW')}
                                {renderLabCard('Potassium (Kalium)', selectedRecord.blood_results.renal.potassium, 'mmol/L', '3.5 - 5.1', Number(selectedRecord.blood_results.renal.potassium) > 5.1 ? 'HIGH' : 'NORMAL')}
                                {renderLabCard('Phosphate (Fosfat)', selectedRecord.blood_results.renal.phosphate, 'mmol/L', '0.8 - 1.4', Number(selectedRecord.blood_results.renal.phosphate) > 1.4 ? 'HIGH' : 'NORMAL')}
                                {renderLabCard('Calcium (Kalsium)', selectedRecord.blood_results.renal.calcium, 'mmol/L', '2.1 - 2.6', 'NORMAL')}
                                {renderLabCard('Sodium (Natrium)', selectedRecord.blood_results.renal.sodium, 'mmol/L', '135 - 145', 'NORMAL')}
                              </div>
                            </div>
                          )}

                          {/* 3. DIABETES CATEGORY */}
                          {selectedRecord.blood_results?.diabetes && (
                            <div className="space-y-3">
                              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block px-1">🍬 Tahap Gula / Diabetes</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderLabCard('Glucose (Gula Darah)', selectedRecord.blood_results.diabetes.glucose, 'mmol/L', '4.0 - 6.1', Number(selectedRecord.blood_results.diabetes.glucose) > 6.1 ? 'HIGH' : 'NORMAL')}
                                {renderLabCard('HbA1c', selectedRecord.blood_results.diabetes.hba1c, '%', '< 6.0%', Number(selectedRecord.blood_results.diabetes.hba1c) >= 6.0 ? 'HIGH' : 'NORMAL')}
                              </div>
                            </div>
                          )}

                          {/* 4. LIPID CATEGORY */}
                          {selectedRecord.blood_results?.lipid && (
                            <div className="space-y-3">
                              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block px-1">🍔 Profil Lipid / Kolesterol</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderLabCard('Total Cholesterol', selectedRecord.blood_results.lipid.cholesterol, 'mmol/L', '< 5.2', Number(selectedRecord.blood_results.lipid.cholesterol) > 5.2 ? 'HIGH' : 'NORMAL')}
                                {renderLabCard('LDL (Kolesterol Jahat)', selectedRecord.blood_results.lipid.ldl, 'mmol/L', '< 2.6', Number(selectedRecord.blood_results.lipid.ldl) > 2.6 ? 'HIGH' : 'NORMAL')}
                                {renderLabCard('HDL (Kolesterol Baik)', selectedRecord.blood_results.lipid.hdl, 'mmol/L', patient?.gender === 'PEREMPUAN' ? '> 1.2' : '> 1.0', 'NORMAL')}
                                {renderLabCard('Triglycerides', selectedRecord.blood_results.lipid.triglycerides, 'mmol/L', '< 1.7', Number(selectedRecord.blood_results.lipid.triglycerides) > 1.7 ? 'HIGH' : 'NORMAL')}
                              </div>
                            </div>
                          )}

                          {/* 5. OTHER TESTS */}
                          {selectedRecord.blood_results?.other_tests && selectedRecord.blood_results.other_tests.length > 0 && (
                            <div className="space-y-3">
                              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block px-1">🧪 Ujian / Analisis Makmal Lain</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedRecord.blood_results.other_tests.map((ot, tIdx) => (
                                  <React.Fragment key={tIdx}>
                                    {renderLabCard(ot.test_name, ot.result, ot.unit, ot.range || 'N/A', ot.status || 'NORMAL')}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                /* CHRONOLOGICAL SENARAI (LIST) VIEW */
                <div className="space-y-6">
                  {/* Option 11: Trend view display */}
                  {myRecords.length >= 2 && (() => {
                    const trendOptions = [
                      { id: '3_bulan', label: '3 Bulan' },
                      { id: '6_bulan', label: '6 Bulan' },
                      { id: '9_bulan', label: '9 Bulan' },
                      { id: '12_bulan', label: '12 Bulan' },
                      { id: '2_tahun', label: '2 Tahun' },
                      { id: '3_tahun', label: '3 Tahun' },
                      { id: '5_tahun', label: '5 Tahun' },
                      { id: 'semua', label: 'Semua' }
                    ];

                    const paramOptions = [
                      { id: 'potassium', label: 'Kalium (Potassium)', unit: 'mmol/L', target: '3.5 - 5.1' },
                      { id: 'phosphate', label: 'Fosfat (Phosphate)', unit: 'mmol/L', target: '0.8 - 1.4' },
                      { id: 'hemoglobin', label: 'Hemoglobin (Hb)', unit: 'g/dL', target: '10.0 - 15.0' },
                      { id: 'urea', label: 'Urea', unit: 'mmol/L', target: '2.5 - 7.8' },
                      { id: 'creatinine', label: 'Kreatinin (Creatinine)', unit: 'umol/L', target: '60 - 110' },
                      { id: 'glucose', label: 'Gula (Glucose)', unit: 'mmol/L', target: '4.0 - 6.1' }
                    ];

                    const getParamValue = (rec: MedicalRecord) => {
                      const br = rec.blood_results;
                      if (activeChartParam === 'potassium') return br?.renal?.potassium !== undefined ? Number(br.renal.potassium) : null;
                      if (activeChartParam === 'phosphate') return br?.renal?.phosphate !== undefined ? Number(br.renal.phosphate) : null;
                      if (activeChartParam === 'hemoglobin') return br?.hematology?.hemoglobin !== undefined ? Number(br.hematology.hemoglobin) : null;
                      if (activeChartParam === 'urea') return br?.renal?.urea !== undefined ? Number(br.renal.urea) : null;
                      if (activeChartParam === 'creatinine') return br?.renal?.creatinine !== undefined ? Number(br.renal.creatinine) : null;
                      if (activeChartParam === 'glucose') return br?.diabetes?.glucose !== undefined ? Number(br.diabetes.glucose) : null;
                      return null;
                    };

                    const now = new Date();
                    const filteredTrendRecords = myRecords.filter(r => {
                      const rDate = new Date(r.examination_date);
                      const diffTime = Math.abs(now.getTime() - rDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (trendDuration === '3_bulan') return diffDays <= 90;
                      if (trendDuration === '6_bulan') return diffDays <= 180;
                      if (trendDuration === '9_bulan') return diffDays <= 270;
                      if (trendDuration === '12_bulan') return diffDays <= 365;
                      if (trendDuration === '2_tahun') return diffDays <= 730;
                      if (trendDuration === '3_tahun') return diffDays <= 1095;
                      if (trendDuration === '5_tahun') return diffDays <= 1825;
                      return true; // semua
                    }).sort((a, b) => new Date(a.examination_date).getTime() - new Date(b.examination_date).getTime()); // oldest first for the chart

                    const pointsData = filteredTrendRecords
                      .map(r => ({
                        dateStr: new Date(r.examination_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' }),
                        value: getParamValue(r),
                        id: r.id
                      }))
                      .filter(p => p.value !== null && !isNaN(p.value)) as Array<{ dateStr: string; value: number; id: string | number }>;

                    const activeParamObj = paramOptions.find(o => o.id === activeChartParam)!;

                    // Chart calculations
                    const width = 500;
                    const height = 220;
                    const paddingLeft = 50;
                    const paddingRight = 30;
                    const paddingTop = 30;
                    const paddingBottom = 40;

                    const values = pointsData.map(p => p.value);
                    const maxVal = values.length > 0 ? Math.max(...values) * 1.15 : 10;
                    const minVal = values.length > 0 ? Math.max(0, Math.min(...values) * 0.8) : 0;
                    const valRange = maxVal - minVal || 1;

                    // Generate coordinates
                    const coords = pointsData.map((p, idx) => {
                      const x = paddingLeft + (idx / (pointsData.length - 1 || 1)) * (width - paddingLeft - paddingRight);
                      const y = height - paddingBottom - ((p.value - minVal) / valRange) * (height - paddingTop - paddingBottom);
                      return { x, y, value: p.value, dateStr: p.dateStr };
                    });

                    const pathD = coords.length > 0 
                      ? coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
                      : '';

                    return (
                      <div className="bg-[#0B1528] border-2 border-[#1E3B60] rounded-3xl p-5 sm:p-6 space-y-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                          <div className="flex items-center space-x-2.5 text-[#46A2FF]">
                            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
                            <div>
                              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">📈 Grafik Trend Analisis Darah</h3>
                              <p className="text-xs text-slate-300">Pantau perkembangan kesihatan darah anda dari masa ke masa</p>
                            </div>
                          </div>

                          {/* Time duration filters */}
                          <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {trendOptions.map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => setTrendDuration(opt.id as any)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  trendDuration === opt.id
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Parameter Selector Buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                          {paramOptions.map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setActiveChartParam(opt.id as any)}
                              className={`p-2 rounded-xl text-xs font-black transition-all border text-center cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                                activeChartParam === opt.id
                                  ? 'bg-[#122c4d] border-cyan-500 text-cyan-300 shadow-inner'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              <span className="block truncate max-w-full">{opt.label}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">({opt.unit})</span>
                            </button>
                          ))}
                        </div>

                        {/* SVG Chart display */}
                        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-850 relative">
                          <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2 mb-2 font-black">
                            <span className="text-slate-300 uppercase tracking-wide">
                              Graf: {activeParamObj.label} ({activeParamObj.unit})
                            </span>
                            <span className="text-cyan-400 font-bold bg-[#11243b] px-2.5 py-0.5 rounded border border-[#1d3d5e]">
                              Julat Sasaran: {activeParamObj.target}
                            </span>
                          </div>

                          {pointsData.length < 2 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-center space-y-2">
                              <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
                              <p className="text-xs text-slate-400 font-bold">Data tidak mencukupi untuk melukis graf trend ({pointsData.length}/2 data diperoleh)</p>
                              <p className="text-[10px] text-slate-500">Sila masukkan sekurang-kurangnya 2 keputusan pemeriksaan darah makmal.</p>
                            </div>
                          ) : (
                            <div className="relative w-full overflow-x-auto">
                              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[400px]">
                                {/* Grid lines & Y-axis labels */}
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                  const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
                                  const labelVal = (maxVal - ratio * valRange).toFixed(1);
                                  return (
                                    <g key={index}>
                                      <line 
                                        x1={paddingLeft} 
                                        y1={y} 
                                        x2={width - paddingRight} 
                                        y2={y} 
                                        stroke="#1e293b" 
                                        strokeWidth="1" 
                                        strokeDasharray="3 3" 
                                      />
                                      <text 
                                        x={paddingLeft - 8} 
                                        y={y + 4} 
                                        fill="#64748b" 
                                        fontSize="9" 
                                        fontWeight="bold"
                                        fontFamily="monospace"
                                        textAnchor="end"
                                      >
                                        {labelVal}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Connection Line path */}
                                {pathD && (
                                  <path 
                                    d={pathD} 
                                    fill="none" 
                                    stroke="#06b6d4" 
                                    strokeWidth="3.5" 
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                )}

                                {/* Coordinates Points circles & values */}
                                {coords.map((c, idx) => (
                                  <g key={idx} className="group">
                                    <circle 
                                      cx={c.x} 
                                      cy={c.y} 
                                      r="6" 
                                      fill="#0f172a" 
                                      stroke="#22d3ee" 
                                      strokeWidth="3.5" 
                                      className="transition-all hover:scale-125 cursor-pointer"
                                    />
                                    {/* Value text above the point */}
                                    <text 
                                      x={c.x} 
                                      y={c.y - 12} 
                                      fill="#ffffff" 
                                      fontSize="11" 
                                      fontWeight="black" 
                                      textAnchor="middle"
                                      className="font-mono"
                                    >
                                      {c.value}
                                    </text>
                                    {/* Date labels on X-axis */}
                                    <text 
                                      x={c.x} 
                                      y={height - 12} 
                                      fill="#94a3b8" 
                                      fontSize="9" 
                                      fontWeight="bold" 
                                      textAnchor="middle"
                                    >
                                      {c.dateStr}
                                    </text>
                                  </g>
                                ))}
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* RECORDS HISTORY CHRONOLOGICAL senarai */}
                  <div className="space-y-4">
                    {myRecords.length === 0 ? (
                      <div className="bg-slate-950/40 border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-900 text-slate-500 rounded-2xl flex items-center justify-center mx-auto border border-slate-800">
                          <FileText className="w-6 h-6" />
                        </div>
                        <h4 className="text-white font-bold text-base">Tiada Rekod Dijumpai</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Buat masa ini, tiada rekod keputusan darah berkala 3 bulanan yang dimasukkan dalam profil anda lagi. Sila rujuk kakitangan jururawat untuk kemasukan laporan.
                        </p>
                      </div>
                    ) : (
                      myRecords.map((r) => {
                        const hasDocument = Boolean(r.report_document);
                        return (
                          <div key={r.id} className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            <div className="space-y-2 text-left">
                              <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-max">
                                {r.examination_type}
                              </span>
                              <h3 className="text-xl font-extrabold text-white">
                                Tarikh: {new Date(r.examination_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </h3>
                              <p className="text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-1.5 mt-1">
                                <span>Status:</span> <strong className="text-emerald-400">✓ Keputusan Tersedia</strong>
                                {hasDocument && <span className="text-cyan-400 text-xs font-bold">• 📄 Fail Laporan Asal Diperoleh</span>}
                              </p>
                              {r.clinical_notes && (
                                <p className="text-xs text-slate-300 line-clamp-2 italic max-w-lg mt-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                                  <strong>Kakitangan:</strong> "{r.clinical_notes}"
                                </p>
                              )}
                              {r.doctor_comments && (
                                <p className="text-xs text-cyan-300 line-clamp-2 italic max-w-lg mt-1 bg-cyan-950/20 p-2 rounded-lg border border-[#1b365d]/50">
                                  <strong>Doktor:</strong> "{r.doctor_comments}"
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedRecordId(r.id);
                              }}
                              className="px-6 py-4 min-h-[52px] bg-gradient-to-r from-rose-600 to-rose-500 text-white font-black text-sm rounded-xl shadow-lg hover:from-rose-500 hover:to-rose-400 active:scale-95 transition-all flex items-center justify-center space-x-2 border-2 border-rose-400 cursor-pointer shrink-0"
                            >
                              <FileText className="w-5 h-5" />
                              <span>LIHAT REKOD &amp; KEPUTUSAN DARAH</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ==================== TAB 6: PROFIL AKAN DATANG ==================== */}
        {activeTab === 'profil' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`${fontTitleClass} font-black text-white flex items-center`}>
                <User className="w-7 h-7 mr-2 text-emerald-400" />
                Profil Pesakit Saya
              </h2>
              <button 
                onClick={() => setActiveTab('utama')}
                className="min-h-[44px] text-cyan-300 text-base font-bold underline cursor-pointer px-3"
              >
                Kembali
              </button>
            </div>

            <div className={`${themeCardClass} rounded-2xl p-6 space-y-5 text-base`}>
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs text-slate-400 uppercase font-extrabold">Nama Penuh Pesakit</span>
                <p className="text-2xl font-black text-white mt-0.5">{patient.name}</p>
                <p className="text-sm text-cyan-300 font-mono mt-1 font-bold">No. IC: {patient.ic_number}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Umur / Jantina</span>
                  <p className="font-bold text-emerald-300 text-base mt-0.5">{getAgeDisplayFromIC(patient.ic_number, patient.age)} ({patient.gender})</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Kumpulan Darah</span>
                  <p className="font-bold text-emerald-300 text-base mt-0.5">{patient.blood_group}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Jenis Akses Vascular</span>
                  <p className="font-bold text-white text-base mt-0.5">{patient.vascular_access} ({patient.access_location})</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Penaja Rawatan</span>
                  <p className="font-bold text-cyan-300 text-base mt-0.5">{patient.sponsor.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold block">Waris Kecemasan</span>
                <p className="font-black text-white text-base mt-0.5">{patient.next_of_kin_name}</p>
                <p className="text-sm text-slate-200 mt-0.5">Hubungan: {patient.next_of_kin_relation} | Tel: {patient.next_of_kin_phone}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold block">Alamat Rumah</span>
                <p className="text-sm text-slate-200 mt-1">{patient.address}</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 4. ACCESSIBLE SIMPLE BOTTOM NAVIGATION BAR (> 58px Touch Targets, Clear Malay Labels) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0B132B]/95 backdrop-blur-md border-t border-[#1F385C] z-40 px-2 py-2.5 shadow-2xl transition-colors">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1.5 sm:gap-2">
          
          {/* Item 1: UTAMA */}
          <button
            onClick={() => setActiveTab('utama')}
            className={`min-h-[60px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'utama'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-black shadow-lg shadow-teal-950/50 border-2 border-cyan-300'
                : 'text-slate-300 hover:text-white hover:bg-[#132238]'
            }`}
          >
            <Home className="w-6 h-6 stroke-[2.5]" />
            <span className="text-xs font-black uppercase mt-1">Utama</span>
          </button>

          {/* Item 2: JADUAL */}
          <button
            onClick={() => setActiveTab('jadual')}
            className={`min-h-[60px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'jadual'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-black shadow-lg shadow-teal-950/50 border-2 border-cyan-300'
                : 'text-slate-300 hover:text-white hover:bg-[#132238]'
            }`}
          >
            <Calendar className="w-6 h-6 stroke-[2.5]" />
            <span className="text-xs font-black uppercase mt-1">Jadual</span>
          </button>

          {/* Item 3: REKOD */}
          <button
            onClick={() => setActiveTab('rekod')}
            className={`min-h-[60px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'rekod'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-black shadow-lg shadow-teal-950/50 border-2 border-cyan-300'
                : 'text-slate-300 hover:text-white hover:bg-[#132238]'
            }`}
          >
            <FileText className="w-6 h-6 stroke-[2.5]" />
            <span className="text-xs font-black uppercase mt-1">Rekod</span>
          </button>

          {/* Item 4: TIMBANG */}
          <button
            onClick={() => setActiveTab('timbang')}
            className={`min-h-[60px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'timbang'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-black shadow-lg shadow-teal-950/50 border-2 border-cyan-300'
                : 'text-slate-300 hover:text-white hover:bg-[#132238]'
            }`}
          >
            <Scale className="w-6 h-6 stroke-[2.5]" />
            <span className="text-xs font-black uppercase mt-1">Timbang</span>
          </button>

          {/* Item 5: PROFIL */}
          <button
            onClick={() => setActiveTab('profil')}
            className={`min-h-[60px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'profil'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-black shadow-lg shadow-teal-950/50 border-2 border-cyan-300'
                : 'text-slate-300 hover:text-white hover:bg-[#132238]'
            }`}
          >
            <User className="w-6 h-6 stroke-[2.5]" />
            <span className="text-xs font-black uppercase mt-1">Profil</span>
          </button>

        </div>
      </nav>

      {/* 5. MODAL: SESI DIALISIS DETAIL */}
      {showSessionDetail && (
        <div className="fixed inset-0 bg-[#050B18]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E1A30] border-2 border-teal-500 rounded-3xl max-w-lg w-full p-6 sm:p-7 text-white space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1F385C] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-950 text-teal-400 flex items-center justify-center border border-teal-700">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-teal-300">Pemantauan Dialisis Saya</h3>
                  <span className="text-xs sm:text-sm text-slate-300 font-mono">Status Klinikal Sesi Terkini</span>
                </div>
              </div>
              <button 
                onClick={() => setShowSessionDetail(false)}
                className="w-11 h-11 rounded-full bg-[#132238] hover:bg-[#1E3352] text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* LOKASI & STESEN KERUSI / MESIN DIALISIS SECTION */}
              {!hasArrivedAndRegistered ? (
                // 1. KEADAAN BELUM SAMPAI / BELUM DAFTAR DI KAUNTER
                <div className="p-5 bg-[#0A1324] rounded-2xl border-2 border-amber-500/90 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm uppercase font-black text-amber-300 tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      Lokasi & Stesen Kerusi / Mesin
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700">
                      Belum Daftar Kaunter
                    </span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-amber-600/70 space-y-2">
                    <div className="flex items-start space-x-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-base sm:text-lg font-black text-amber-300 leading-snug">
                          kerusi dan mesin dialisis akan di papar selepas daftar di kaunter pada hari dialisis
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                          sebab setiap kerusi tidak tetap, bergantung masa ketibaan dan di pilih oleh nurse sahaja (sistem giliran FCFS).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !hasAssignedChair ? (
                // 2. SUDAH DAFTAR DI KAUNTER, MENUNGGU JURURAWAT MEMILIH KERUSI
                <div className="p-5 bg-[#0A1324] rounded-2xl border-2 border-cyan-500/90 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm uppercase font-black text-cyan-300 tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      Lokasi & Stesen Kerusi / Mesin
                    </span>
                    <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono font-bold px-2.5 py-0.5 rounded-full">
                      Giliran: {checkInRecord?.queue_number || 'Q-01'}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-cyan-700/70 space-y-2">
                    <p className="text-base sm:text-lg font-black text-cyan-200">
                      Pendaftaran di Kaunter Selesai. Menunggu Panggilan Jururawat.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Stesen kerusi dan mesin dialisis sedang dipilih oleh jururawat bertugas mengikut kekosongan stesen dan susunan giliran ketibaan anda.
                    </p>
                  </div>
                </div>
              ) : (
                // 3. SUDAH DAFTAR DI KAUNTER & KERUSI TELAH DITUGASKAN OLEH JURURAWAT
                <div className="p-5 bg-teal-950/80 rounded-2xl border-2 border-teal-500 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-black text-teal-300 tracking-wider block flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      Lokasi & Stesen Kerusi Disahkan
                    </span>
                    <span className="text-xs bg-teal-900 text-teal-200 border border-teal-600 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
                      Dipilih oleh Jururawat
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                    Kerusi {assignedChairNumber}
                  </div>
                  <p className="text-xs sm:text-sm text-teal-200">
                    Mesin: {assignedMachineModel || 'Fresenius 4008S NG'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-4 bg-[#0A1324] rounded-2xl border border-[#1F385C]">
                  <span className="text-slate-400 block font-semibold">Berat Pra-Dialisis:</span>
                  <strong className="text-amber-300 text-lg sm:text-xl font-bold">
                    {activePreWeight !== null ? `${activePreWeight} kg` : '--'}
                  </strong>
                  <span className="text-xs text-slate-400 block mt-1">BP: {activePreBp || '--'}</span>
                </div>
                <div className="p-4 bg-[#0A1324] rounded-2xl border border-[#1F385C]">
                  <span className="text-slate-400 block font-semibold">Berat Selepas (After):</span>
                  <strong className="text-cyan-300 text-lg sm:text-xl font-bold">
                    {activePostWeight !== null ? `${activePostWeight} kg` : '--'}
                  </strong>
                  <span className="text-xs text-slate-400 block mt-1">BP: {activePostBp || '--'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSessionDetail(false);
                  setActiveTab('timbang');
                }}
                className="w-full min-h-[54px] bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black rounded-2xl cursor-pointer text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg"
              >
                <Scale className="w-5 h-5 stroke-[2.5]" />
                <span>MASUKKAN / KEMASKINI BERAT (PRA & SELEPAS)</span>
              </button>

              <div className="p-4 bg-[#0A1324] rounded-2xl border border-[#1F385C] space-y-2 text-xs sm:text-sm">
                <h4 className="font-bold text-white text-sm sm:text-base">Pesanan Jururawat Bertugas:</h4>
                <p className="text-slate-200">
                  Sila maklumkan kepada jururawat segera jika anda berasa pening, kejang kaki, atau sejuk semasa proses dialisis dijalankan.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSessionDetail(false)}
              className="w-full min-h-[50px] bg-[#132238] hover:bg-[#1E3352] text-white font-bold rounded-2xl cursor-pointer text-base border border-[#1F385C]"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL: SOS PERLU BANTUAN */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-3 border-rose-500 rounded-3xl max-w-md w-full p-6 text-white space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-rose-600/30 text-rose-500 mx-auto flex items-center justify-center border-2 border-rose-500 animate-pulse">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-rose-400">
                Bantuan & Kecemasan 24/7
              </h3>
              <p className="text-slate-200 text-sm">
                Hubungi KaizenBros Dialysis Centre segera jika anda memerlukan bantuan rawatan atau kecemasan.
              </p>
            </div>

            <div className="space-y-3">
              {/* Call Hotline */}
              <a
                href={`tel:${VERIFIED_CENTRE_INFO.hotline_24h.replace(/\s+/g, '')}`}
                className="w-full min-h-[58px] bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-lg rounded-2xl flex items-center justify-center space-x-3 shadow-lg border-2 border-rose-300"
              >
                <PhoneCall className="w-6 h-6" />
                <span>PANGGIL HOTLINE: {VERIFIED_CENTRE_INFO.hotline_24h}</span>
              </a>

              {/* WhatsApp Centre */}
              <a
                href={`https://wa.me/${VERIFIED_CENTRE_INFO.whatsapp_number}?text=Salam%20KaizenBros,%20saya%20pesakit%20${encodeURIComponent(patient.name)}%20(${patient.patient_id_code})%20memerlukan%20bantuan.`}
                target="_blank"
                rel="noreferrer"
                className="w-full min-h-[58px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-2xl flex items-center justify-center space-x-3 shadow-lg border-2 border-emerald-300"
              >
                <MessageCircle className="w-6 h-6" />
                <span>WhatsApp Jururawat Bertugas</span>
              </a>

              {/* Clinic Landline */}
              <a
                href={`tel:${VERIFIED_CENTRE_INFO.phone_main}`}
                className="w-full min-h-[52px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base rounded-2xl flex items-center justify-center space-x-2 border border-slate-700"
              >
                <PhoneCall className="w-5 h-5 text-slate-400" />
                <span>Telefon Klinik: {VERIFIED_CENTRE_INFO.phone_main}</span>
              </a>
            </div>

            <div className="p-4 bg-rose-950 border border-rose-800 rounded-2xl text-xs text-rose-200 space-y-1">
              <strong>🚨 Tanda-tanda Kecemasan Utama:</strong>
              <p>• Sesak nafas teruk ketika baring atau rehat.</p>
              <p>• Pendarahan tidak berhentikan pada AV Fistula.</p>
              <p>• Sakit dada mencucuk atau pengsan.</p>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full min-h-[50px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer text-base border border-slate-700 portal-light-black"
            >
              Kembali ke Aplikasi
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
