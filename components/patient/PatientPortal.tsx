'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Droplets, 
  Pill, 
  FileText, 
  AlertTriangle, 
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
  Sun
} from 'lucide-react';
import { Patient, DialysisSession, PatientMedication, PatientCheckIn } from '@/types';
import { VERIFIED_CENTRE_INFO } from '@/lib/mock-data';
import { parseMalaysianIC } from '@/lib/ic-utils';
import { calculateNextDialysis, getMalaysiaDate } from '@/lib/malaysia-time';
import { useMalaysiaTime } from '@/hooks/useMalaysiaTime';

interface PatientPortalProps {
  patient?: Patient | null;
  patients?: Patient[];
  session?: DialysisSession | null;
  sessions?: DialysisSession[];
  medications?: PatientMedication[];
  checkInRecord?: PatientCheckIn;
  onCheckInArrival?: (preWeight: number, preBp?: string) => void;
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
  checkInRecord,
  onSelectPatient,
  onNavigateToAdmin,
  onNavigateToRegistration,
  onPatientLogout,
  onOpenLogin,
  isLoggedIn = true
}: PatientPortalProps) {
  const [activeTab, setActiveTab] = useState<'utama' | 'jadual' | 'rekod' | 'profil'>('utama');
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showWeightBpModal, setShowWeightBpModal] = useState(false);
  const [showMedsModal, setShowMedsModal] = useState(false);

  const { effectiveDate, isAfter7pm } = useMalaysiaTime();

  // Dynamic Next Dialysis calculation for this patient based on Malaysia Real Time
  // Automatically rolls over to the next scheduled date if past 7:00 PM (19:00 MYT)
  const nextDialysis = useMemo(() => {
    if (!patient) return null;
    return calculateNextDialysis(patient, effectiveDate);
  }, [patient, effectiveDate]);

  // Determine current live patient status:
  const isCheckedIn = !!checkInRecord || session?.status === 'SEDANG_DIALISIS' || session?.status === 'SUDAH_HADIR' || session?.status === 'MENUNGGU_GILIRAN';
  const isWaitingQueue = checkInRecord?.status === 'MENUNGGU_GILIRAN' || (isCheckedIn && session?.status === 'MENUNGGU_GILIRAN') || (isCheckedIn && session?.status === 'SUDAH_HADIR' && !checkInRecord?.assigned_chair);
  const isOnDialysis = session?.status === 'SEDANG_DIALISIS' || checkInRecord?.status === 'SEDANG_DIALISIS';
  const isCompleted = session?.status === 'SUDAH_SELESAI' || checkInRecord?.status === 'SUDAH_SELESAI';

  // Safely extract pre-dialysis clinical measurements without null pointer exceptions
  const rawWeight = session?.pre_weight_kg ?? checkInRecord?.pre_weight_kg ?? null;
  const activePreWeight = rawWeight !== null && !isNaN(Number(rawWeight)) ? Number(rawWeight) : null;
  const activePreBp = session?.pre_bp ?? checkInRecord?.pre_bp ?? null;
  const patientDryWeight = typeof patient?.dry_weight_kg === 'number' && !isNaN(patient.dry_weight_kg) ? patient.dry_weight_kg : 65.0;
  const fluidExcessKg = activePreWeight !== null ? Number((activePreWeight - patientDryWeight).toFixed(1)) : null;

  // Dynamic Shift Mapping & Sync with Admin settings
  const patientShiftInfo = useMemo(() => {
    if (!patient) {
      return {
        id: 'SYIF_1',
        title: 'Syif 1: Sesi Pagi',
        timeRange: '6:00 AM - 10:00 AM',
        timeDetails: '6:00 AM hingga 10:00 AM',
        shortTime: '6:00 AM'
      };
    }
    const s = patient.preferred_shift;
    if (s === 'SYIF_1' || s === 'PAGI' || s.includes('6.00') || s.includes('6:00')) {
      return {
        id: 'SYIF_1',
        title: 'Syif 1: Sesi Pagi',
        timeRange: '6:00 AM - 10:00 AM',
        timeDetails: '6:00 AM hingga 10:00 AM',
        shortTime: '6:00 AM'
      };
    }
    if (s === 'SYIF_2' || s === 'TENGAH_HARI' || s.includes('10.30') || s.includes('10:30')) {
      return {
        id: 'SYIF_2',
        title: 'Syif 2: Sesi Tengah Hari',
        timeRange: '10:30 AM - 2:30 PM',
        timeDetails: '10:30 AM hingga 2:30 PM',
        shortTime: '10:30 AM'
      };
    }
    return {
      id: 'SYIF_3',
      title: 'Syif 3: Sesi Petang',
      timeRange: '3:00 PM - 7:00 PM',
      timeDetails: '3:00 PM hingga 7:00 PM',
      shortTime: '3:00 PM'
    };
  }, [patient]);

  const schedulePatternLabel = patient?.schedule_pattern === 'SELASA_KHAMIS_SABTU'
    ? 'Selasa, Khamis & Sabtu'
    : 'Isnin, Rabu & Jumaat';

  // Dynamic Upcoming Treatment Schedule (Syncs with Malaysia Real Time, Admin sessions and >7pm rule)
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
        let statusColor = 'text-slate-400 bg-slate-800 border-slate-700';

        if (scheduledSession) {
          if (scheduledSession.status === 'SEDANG_DIALISIS') {
            statusLabel = 'Sedang Dialisis';
            statusColor = 'text-emerald-300 bg-emerald-950 border-emerald-700';
          } else if (scheduledSession.status === 'SUDAH_HADIR' || scheduledSession.status === 'MENUNGGU_GILIRAN') {
            statusLabel = 'Sudah Tiba';
            statusColor = 'text-amber-300 bg-amber-950 border-amber-700';
          } else if (scheduledSession.status === 'SUDAH_SELESAI') {
            statusLabel = 'Selesai';
            statusColor = 'text-teal-300 bg-teal-950 border-teal-700';
          }
        } else if (isToday) {
          if (isAfter7pm) {
            statusLabel = 'Selesai (Tamat 7:00 PM)';
            statusColor = 'text-slate-400 bg-slate-800/80 border-slate-700';
          } else {
            statusLabel = isCheckedIn ? (isOnDialysis ? 'Sedang Dialisis' : 'Sudah Tiba') : 'Sesi Hari Ini';
            statusColor = isCheckedIn ? 'text-emerald-300 bg-emerald-950 border-emerald-700' : 'text-cyan-300 bg-cyan-950 border-cyan-700';
          }
        }

        // Highlight the next upcoming session if today has concluded (past 7pm) or today is not a treatment day
        if (nextDialysis && dateIso === nextDialysis.nextDateIso && (isAfter7pm || !targetDayNumbers.includes(mytNow.dayOfWeek))) {
          statusLabel = 'SESI SETERUSNYA';
          statusColor = 'text-emerald-300 bg-emerald-950 border-emerald-500 ring-1 ring-emerald-500/50';
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
  }, [patient, sessions, isCheckedIn, isOnDialysis, effectiveDate, isAfter7pm, nextDialysis]);

  // Filtered medications for this active patient (or fallback to general prescribed meds)
  const activePatientMedications = useMemo(() => {
    if (!patient) return [];
    const patientMeds = medications.filter(m => m.patient_id === patient.id && m.is_active !== false);
    if (patientMeds.length > 0) return patientMeds;
    return medications.filter(m => m.is_active !== false);
  }, [patient, medications]);

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 font-sans my-auto py-12">
        <div className="max-w-md w-full bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-indigo-950/80 border border-indigo-700/80 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <User className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 px-3.5 py-1 rounded-full uppercase tracking-wider">
              PORTAL PESAKIT DIALISIS
            </span>
            <h2 className="text-2xl font-black text-white">Sila Log Masuk Akaun Pesakit</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Log masuk dengan No. ID Pesakit, Emel, atau No. Telefon anda untuk melihat jadual rawatan, status giliran ketibaan, dan preskripsi ubat.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {onOpenLogin && (
              <button
                onClick={onOpenLogin}
                className="w-full min-h-[52px] py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-base rounded-2xl transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
              >
                <User className="w-5 h-5 stroke-[2.5]" />
                <span>LOG MASUK SEKARANG</span>
              </button>
            )}

            {/* QUICK PATIENT SELECTOR FROM REGISTERED CLINIC LIST */}
            {patients && patients.length > 0 && onSelectPatient && (
              <div className="pt-4 border-t border-slate-800 space-y-2 text-left">
                <label className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider block text-center">
                  Atau Pilih Pesakit Berdaftar di Klinik:
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1 pt-1">
                  {patients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onSelectPatient(p)}
                      className="w-full p-3 bg-slate-900 hover:bg-indigo-950/90 border border-slate-800 hover:border-indigo-600 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                    >
                      <div>
                        <strong className="text-white text-xs font-bold block group-hover:text-cyan-300 transition-colors">
                          {p.name}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          ID: <span className="text-cyan-400 font-bold">{p.patient_id_code}</span> • {p.schedule_pattern ? p.schedule_pattern.replace(/_/g, ' ') : 'Jadual Rutin'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-cyan-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {onNavigateToRegistration && (
                <button
                  onClick={onNavigateToRegistration}
                  className="flex-1 py-3 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Daftar Pesakit Baru</span>
                </button>
              )}

              {onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  className="flex-1 py-3 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
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
    <div suppressHydrationWarning className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-28">
      {/* Top Banner specifically designed with extreme clarity */}
      <div className="bg-slate-950 border-b-2 border-slate-800 px-4 py-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-wider text-cyan-400 uppercase">
                KAIZENBROS DIALYSIS CENTRE
              </span>
            </div>
            <h1 suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              Selamat datang,
              <span className="text-emerald-400 ml-2">{patient.name}</span>
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">No. ID</span>
              <span className="text-base font-mono font-bold text-white tracking-wide">
                {patient.patient_id_code}
              </span>
            </div>

            {onPatientLogout && (
              <button
                onClick={onPatientLogout}
                className="bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 border border-slate-700 hover:border-rose-700/80 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Log Keluar Akaun Pesakit"
              >
                Log Keluar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6">
        {activeTab === 'utama' && (
          <div className="space-y-6">
            {/* 1. CASE A: MENUNGGU GILIRAN (DIGITAL FCFS QUEUE PASS) */}
            {isWaitingQueue && (
              <div className="bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-950/40 relative overflow-hidden patient-dark-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-sm sm:text-base tracking-wider uppercase">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping mr-1" />
                    <span>TIKET GILIRAN KETIBAAN (FCFS)</span>
                  </div>
                  <span className="bg-amber-950/80 text-amber-300 border border-amber-700/80 text-xs font-mono font-bold px-3 py-1 rounded-full">
                    Masa Tiba: {checkInRecord?.check_in_time || '01:30 PM'}
                  </span>
                </div>

                <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-5 text-center my-4 space-y-2">
                  <span className="text-xs uppercase font-mono tracking-widest text-slate-400 block">
                    NOMBOR GILIRAN ANDA
                  </span>
                  <div className="text-5xl sm:text-6xl font-black text-amber-300 font-mono tracking-tight">
                    {checkInRecord?.queue_number || 'Q-01'}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Pendaftaran Ketibaan Disahkan
                  </p>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5">
                    <div className="flex justify-between items-center text-slate-200">
                      <span>Status Stesen:</span>
                      <strong className="text-amber-400">🟡 Menunggu Penugasan Kerusi / Mesin</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-200">
                      <span>Penetapan Mesin:</span>
                      <span className="text-cyan-300 font-semibold">Fleksibel (Ditugaskan Manual oleh Jururawat)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      ℹ️ Sistem KaizenBros mengikut turutan siapa sampai dulu (First Come, First Served). Sila tunggu panggilan jururawat di ruang menunggu.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSessionDetail(true)}
                  className="w-full min-h-[52px] py-3.5 px-6 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>SEMAK MAKLUMAT PRA-DIALISIS</span>
                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            )}

            {/* 2. CASE B: SEDANG DIALISIS */}
            {isOnDialysis && (
              <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 shadow-xl shadow-emerald-950/40 relative overflow-hidden patient-dark-card">
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm sm:text-base tracking-wider uppercase mb-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping mr-1" />
                  <span>RAWATAN SEDANG BERJALAN</span>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white flex items-baseline gap-3">
                    <span>Stesen Kerusi</span>
                    <span className="text-emerald-300 font-black font-mono">
                      {session?.chair_number || checkInRecord?.assigned_chair || 'B-08'}
                    </span>
                  </div>
                  <div className="flex items-center text-slate-300 text-base font-medium">
                    <MapPin className="w-5 h-5 mr-2 text-emerald-400 flex-shrink-0" />
                    <span>Mesin: {session?.machine_model || checkInRecord?.assigned_machine_model || 'Fresenius 4008S NG'}</span>
                  </div>
                </div>

                <div className="inline-flex items-center bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 px-3.5 py-1.5 rounded-full text-sm font-semibold mb-6">
                  <Clock className="w-4 h-4 mr-2 text-emerald-300" />
                  <span>Baki Rawatan: ~3 Jam 15 Minit</span>
                </div>

                <button
                  onClick={() => setShowSessionDetail(true)}
                  className="w-full min-h-[56px] py-4 px-6 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-lg sm:text-xl rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-3 cursor-pointer"
                >
                  <span>LIHAT PEMANTAUAN DIALISIS SAYA</span>
                  <ChevronRight className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            )}

            {/* 3. CASE C-1: SESI DIALISIS SETERUSNYA (SELEPAS JAM 7:00 PM ATAU HARI TIADA RAWATAN) */}
            {!isWaitingQueue && !isOnDialysis && nextDialysis && !nextDialysis.isToday && (
              <div className="bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-900 border-2 border-cyan-500 rounded-3xl p-6 sm:p-7 shadow-xl shadow-cyan-950/40 relative overflow-hidden patient-dark-card">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2 text-cyan-400 font-extrabold text-sm sm:text-base tracking-wider uppercase">
                    <Calendar className="w-4 h-4 mr-1 text-cyan-400" />
                    <span>SESI RAWATAN DIALISIS SETERUSNYA</span>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${nextDialysis.badgeColor}`}>
                    {nextDialysis.relativeText} ({nextDialysis.dayName})
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white flex flex-wrap items-baseline gap-2">
                    <span>{nextDialysis.dayName},</span>
                    <span className="text-cyan-300 font-black text-2xl sm:text-3xl">
                      {nextDialysis.formattedDate.replace(/^[^,]+,\s*/, '')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-slate-300 text-sm sm:text-base font-medium">
                    <span className="bg-slate-900 border border-cyan-700/60 px-3 py-1 rounded-xl text-cyan-300 font-bold">
                      {nextDialysis.shortTime} ({nextDialysis.shiftTitle})
                    </span>
                    <span className="text-slate-400">• Waktu Rawatan: <strong className="text-white">{nextDialysis.timeRange}</strong></span>
                  </div>
                </div>

                {nextDialysis.isAfter7pmRollover ? (
                  <div className="p-4 bg-indigo-950/80 border-2 border-indigo-600 rounded-2xl text-xs text-indigo-200 mb-4 space-y-2">
                    <div className="flex items-center space-x-2 font-black text-cyan-300 text-xs sm:text-sm">
                      <Moon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span>🌙 SESI RAWATAN HARI INI TELAH SELESAI (LEPAS JAM 7:00 PM)</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-xs">
                      Waktu operasi rawatan pusat dialisis bagi syif hari ini telah tamat pada jam 7:00 PM. Masa sesi rawatan anda telah <strong>dikemaskini secara automatik ke sesi rawatan seterusnya</strong> mengikut jadual tetap anda ({schedulePatternLabel}).
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-slate-300 mb-4 space-y-1">
                    <p className="text-xs text-slate-300">
                      ℹ️ Tiada sesi dialisis dijadualkan untuk anda hari ini mengikut rutin <strong>{schedulePatternLabel}</strong>. Sesi rawatan seterusnya adalah pada <strong>{nextDialysis.dayName}</strong>.
                    </p>
                  </div>
                )}

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status Temujanji Seterusnya:</span>
                  <span className="text-cyan-400 font-bold px-3 py-1 bg-cyan-950/80 rounded-lg border border-cyan-800">
                    ✓ Dijadualkan ({nextDialysis.relativeText})
                  </span>
                </div>
              </div>
            )}

            {/* 3. CASE C-2: SESI RAWATAN HARI INI (SEBELUM JAM 7:00 PM) */}
            {!isWaitingQueue && !isOnDialysis && (!nextDialysis || nextDialysis.isToday) && (
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border-2 border-indigo-500 rounded-3xl p-6 sm:p-7 shadow-xl shadow-indigo-950/40 relative overflow-hidden patient-dark-card">
                <div className="flex items-center space-x-2 text-indigo-400 font-extrabold text-sm sm:text-base tracking-wider uppercase mb-2">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>SESI RAWATAN HARI INI</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white flex items-baseline gap-3">
                    <span>{patientShiftInfo.shortTime}</span>
                    <span className="text-cyan-300 font-black text-xl sm:text-2xl">({patientShiftInfo.title})</span>
                  </div>
                  <div className="text-slate-300 text-sm sm:text-base font-medium">
                    KaizenBros Dialysis Centre • Waktu Rawatan: <strong className="text-white">{patientShiftInfo.timeRange}</strong>
                  </div>
                </div>

                {/* NOTIS JURURAWAT SAHAJA (CHECK-IN TIDAK BOLEH DIBUAT OLEH PESAKIT) */}
                <div className="p-4 bg-amber-950/50 border-2 border-amber-600/80 rounded-2xl text-xs text-amber-200 mb-4 space-y-2.5">
                  <div className="flex items-center space-x-2 font-black text-amber-300 text-sm">
                    <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <span>PENDAFTARAN KETIBAAN (CHECK-IN) HANYA OLEH JURURAWAT</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed text-xs">
                    Bagi mematuhi SOP keselamatan klinikal, <strong>pesakit tidak dibenarkan mendaftar masuk (check-in) sendiri</strong>.
                  </p>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-800/60 text-slate-300 space-y-1 text-[11px]">
                    <p className="font-bold text-white">📌 Prosedur Ketibaan Pesakit di Pusat Dialisis:</p>
                    <p>1. Sila terus ke <strong>Kaunter Jururawat</strong> semasa tiba di klinik.</p>
                    <p>2. Jururawat bertugas akan menyukat <strong>berat badan pra-dialisis</strong> dan memeriksa <strong>tekanan darah (BP)</strong>.</p>
                    <p>3. Jururawat akan mendaftarkan giliran anda (FCFS) dan menetapkan mesin serta kerusi dialisis.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status Ketibaan Kaunter:</span>
                  <span className="text-amber-400 font-bold px-3 py-1 bg-amber-950/80 rounded-lg border border-amber-800">
                    🟡 Belum Didaftar Masuk di Kaunter
                  </span>
                </div>
              </div>
            )}

            {/* 4 Large Action Cards (> 48px touch targets, big icons, clear text) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Jadual Saya */}
              <button
                onClick={() => setActiveTab('jadual')}
                className="min-h-[96px] bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border-2 border-slate-700 hover:border-cyan-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-md"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center flex-shrink-0 text-cyan-400">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">📅 Jadual Saya</h3>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">
                    {schedulePatternLabel} ({patientShiftInfo.shortTime})
                  </p>
                </div>
              </button>

              {/* Card 2: Berat & Tekanan Darah */}
              <button
                onClick={() => setShowWeightBpModal(true)}
                className="min-h-[96px] bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border-2 border-slate-700 hover:border-teal-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-md"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-950/80 border border-teal-800 flex items-center justify-center flex-shrink-0 text-teal-400">
                  <Droplets className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">💧 Berat & BP</h3>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">
                    Berat Kering: <strong className="text-white">{patient.dry_weight_kg} kg</strong>
                  </p>
                </div>
              </button>

              {/* Card 3: Ubat Saya (Read-Only notice) */}
              <button
                onClick={() => setShowMedsModal(true)}
                className="min-h-[96px] bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border-2 border-slate-700 hover:border-amber-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-md"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-800 flex items-center justify-center flex-shrink-0 text-amber-400">
                  <Pill className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-xl font-bold text-white">💊 Ubat Saya</h3>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">
                    {activePatientMedications.length} jenis ubat aktif (Paparan Sahaja)
                  </p>
                </div>
              </button>

              {/* Card 4: Rekod Dialisis */}
              <button
                onClick={() => setActiveTab('rekod')}
                className="min-h-[96px] bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border-2 border-slate-700 hover:border-indigo-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-md"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800 flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">📋 Rekod Dialisis</h3>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">
                    Sejarah rawatan & bacaan
                  </p>
                </div>
              </button>
            </div>

            {/* MASSIVE PROMINENT SOS HELP BUTTON */}
            <div className="pt-2">
              <button
                onClick={() => setShowHelpModal(true)}
                className="w-full min-h-[64px] bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xl sm:text-2xl rounded-2xl shadow-xl shadow-rose-950/50 p-4 flex items-center justify-center space-x-3 cursor-pointer border-2 border-rose-400"
              >
                <AlertTriangle className="w-8 h-8 text-rose-200 fill-white/20 animate-bounce" />
                <span>🚨 PERLU BANTUAN?</span>
              </button>
              <p className="text-center text-xs sm:text-sm text-slate-400 font-medium mt-2">
                Tekan jika sesak nafas, pening teruk, atau perlu pengangkutan kecemasan.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: JADUAL SAYA - FULLY SYNCED WITH ADMIN & SESSIONS */}
        {activeTab === 'jadual' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white flex items-center">
                <Calendar className="w-7 h-7 mr-2 text-cyan-400" />
                Jadual Rawatan Saya
              </h2>
              <button 
                onClick={() => setActiveTab('utama')}
                className="text-cyan-400 text-base font-bold underline cursor-pointer"
              >
                Kembali
              </button>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
              {/* Rutin Tetap Header */}
              <div className="bg-cyan-950/60 border border-cyan-800 rounded-2xl p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">
                    Corak Rutin Tetap (Ditetapkan oleh Pentadbir)
                  </span>
                  <span className="text-[11px] bg-cyan-900/80 text-cyan-200 border border-cyan-700 px-2.5 py-0.5 rounded-full font-bold">
                    ✓ Diselaraskan
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-white">
                  Setiap Hari {patient.schedule_pattern === 'SELASA_KHAMIS_SABTU' ? 'SELASA, KHAMIS & SABTU' : 'ISNIN, RABU & JUMAAT'}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-slate-300">
                  <span className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-xl font-bold text-amber-300">
                    {patientShiftInfo.title}: {patientShiftInfo.timeRange}
                  </span>
                </div>
              </div>

              {/* Sesi Rawatan Akan Datang */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Sesi Rawatan Anda (Diselaraskan dengan Sistem Pentadbir):</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {upcomingSchedule.length} Sesi Terdekat
                  </span>
                </div>

                <div className="space-y-2.5">
                  {upcomingSchedule.map((item, index) => {
                    return (
                      <div
                        key={item.dateStr + index}
                        className={`rounded-xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.isToday
                            ? 'bg-slate-900 border-2 border-emerald-500 shadow-md shadow-emerald-950/20'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {item.isToday && (
                              <span className="bg-emerald-900 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded">
                                HARI INI
                              </span>
                            )}
                            <p suppressHydrationWarning className="text-base font-bold text-white">
                              {item.formattedDate}
                            </p>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-400">
                            Waktu Rawatan: <strong className="text-cyan-300">{patientShiftInfo.timeRange}</strong>
                            {item.session?.chair_number && (
                              <>
                                {' • '}Kerusi Ditugaskan: <span className="font-mono text-emerald-400 font-semibold">{item.session.chair_number}</span>
                              </>
                            )}
                            {item.session?.nurse_in_charge && (
                              <span className="text-slate-400 ml-1">({item.session.nurse_in_charge})</span>
                            )}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center space-x-2">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${item.statusColor}`}>
                            {item.statusLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/80 flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  Jadual ini dikemaskini secara automatik mengikut penetapan Doktor Pakar Nefrologi dan Pentadbir Klinikal di Portal Pentadbir. Sekiranya ingin menukar syif atau ada temujanji hospital luar, sila maklumkan kepada jururawat sekurang-kurangnya 24 jam awal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REKOD DIALISIS */}
        {activeTab === 'rekod' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white flex items-center">
                <FileText className="w-7 h-7 mr-2 text-indigo-400" />
                Rekod Rawatan
              </h2>
              <button 
                onClick={() => setActiveTab('utama')}
                className="text-cyan-400 text-base font-bold underline"
              >
                Kembali
              </button>
            </div>

            <div className="space-y-4">
              {/* Record 1 (Today) */}
              <div className="bg-slate-800 border-2 border-emerald-600 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                  <div>
                    <span className="text-emerald-400 font-bold text-xs uppercase">Sesi Terkini (Hari Ini)</span>
                    <h3 className="text-lg font-bold text-white">Jumaat, 25 Sep 2026</h3>
                  </div>
                  <span className="bg-emerald-950 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-800">
                    Sedang Dialisis
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-400 text-xs block">Berat Sebelum</span>
                    <strong className="text-white text-lg font-bold">
                      {activePreWeight !== null ? `${activePreWeight} kg` : `${patientDryWeight} kg`}
                    </strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-400 text-xs block">Tekanan Darah (BP)</span>
                    <strong className="text-white text-lg font-bold">{activePreBp || '128/82'}</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-400 text-xs block">Target Cecair (UF)</span>
                    <strong className="text-cyan-400 text-lg font-bold">{session?.target_uf_litres ? `${session.target_uf_litres} L` : '2.0 L'}</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-400 text-xs block">Kerusi & Jururawat</span>
                    <strong className="text-white text-sm font-semibold">{session?.chair_number ? `${session.chair_number} (${session.nurse_in_charge || 'Jururawat'})` : 'Ditugaskan Semasa Tiba'}</strong>
                  </div>
                </div>
              </div>

              {/* Record 2 (Past) */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                  <div>
                    <span className="text-slate-400 font-semibold text-xs uppercase">Sesi Sebelumnya</span>
                    <h3 className="text-lg font-bold text-white">Rabu, 23 Sep 2026</h3>
                  </div>
                  <span className="bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                    Selesai
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg">
                    <span className="text-slate-400 block">Berat Sebelum</span>
                    <span className="text-white font-bold text-sm">76.2 kg</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg">
                    <span className="text-slate-400 block">Berat Selepas</span>
                    <span className="text-emerald-400 font-bold text-sm">75.0 kg</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg">
                    <span className="text-slate-400 block">BP Akhir</span>
                    <span className="text-white font-bold text-sm">130/78</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFIL PESAKIT */}
        {activeTab === 'profil' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white flex items-center">
                <User className="w-7 h-7 mr-2 text-emerald-400" />
                Profil Pesakit
              </h2>
              <button 
                onClick={() => setActiveTab('utama')}
                className="text-cyan-400 text-base font-bold underline"
              >
                Kembali
              </button>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4 text-base">
              <div className="border-b border-slate-700 pb-4">
                <span className="text-xs text-slate-400 uppercase font-semibold">Nama Penuh</span>
                <p className="text-xl font-bold text-white">{patient.name}</p>
                <p className="text-sm text-slate-400 font-mono mt-0.5">No. IC: {patient.ic_number}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-700 pb-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Umur / Jantina</span>
                  <p className="font-bold text-white">{patient.age} Tahun ({patient.gender})</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Kumpulan Darah</span>
                  <p className="font-bold text-emerald-400">{patient.blood_group}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Jenis Akses</span>
                  <p className="font-bold text-white">{patient.vascular_access} ({patient.access_location})</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Penaja Rawatan</span>
                  <p className="font-bold text-cyan-400">{patient.sponsor.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Waris Kecemasan</span>
                <p className="font-bold text-white">{patient.next_of_kin_name}</p>
                <p className="text-sm text-slate-300">Hubungan: {patient.next_of_kin_relation} | Tel: {patient.next_of_kin_phone}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Alamat Rumah</span>
                <p className="text-sm text-slate-300 mt-1">{patient.address}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FIXED SIMPLE BOTTOM NAVIGATION FOR PATIENT (> 48px Touch Targets) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t-2 border-slate-800 z-40 px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('utama')}
            className={`min-h-[52px] rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'utama'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Utama</span>
          </button>

          <button
            onClick={() => setActiveTab('jadual')}
            className={`min-h-[52px] rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'jadual'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs mt-1">Jadual</span>
          </button>

          <button
            onClick={() => setActiveTab('rekod')}
            className={`min-h-[52px] rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'rekod'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-6 h-6" />
            <span className="text-xs mt-1">Rekod</span>
          </button>

          <button
            onClick={() => setActiveTab('profil')}
            className={`min-h-[52px] rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'profil'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Profil</span>
          </button>
        </div>
      </nav>

      {/* MODAL 1: SESI DIALISIS DETAIL */}
      {showSessionDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-black text-emerald-400 flex items-center">
                <Clock className="w-6 h-6 mr-2" />
                Maklumat Sesi Hari Ini
              </h3>
              <button 
                onClick={() => setShowSessionDetail(false)}
                className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-base">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Kerusi Dialisis</span>
                <span className="text-2xl font-black text-white">{session?.chair_number || checkInRecord?.assigned_chair || 'Ditugaskan Semasa Tiba (FCFS)'}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Jururawat Bertugas</span>
                <span className="font-bold text-white text-lg">{session?.nurse_in_charge || 'Sister Siti Fatimah'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-xs block">Berat Sebelum</span>
                  <span className="text-xl font-bold text-white">{activePreWeight !== null ? `${activePreWeight} kg` : `${patientDryWeight} kg`}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-xs block">Berat Kering Sasaran</span>
                  <span className="text-xl font-bold text-emerald-400">{patientDryWeight} kg</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Tekanan Darah Awal</span>
                <span className="text-xl font-bold text-white">{activePreBp || 'Dalam Rekod (Pra-Rawatan)'}</span>
              </div>

              <div className="bg-emerald-950/60 border border-emerald-800 p-3 rounded-xl text-sm text-emerald-300">
                {isOnDialysis ? '✓ Mesin dan rawatan sedang berjalan lancar. Sila maklumkan segera kepada jururawat jika merasa loya atau kekejangan otot.' : 'ℹ️ Maklumat pra-rawatan diselaraskan secara langsung dengan kaunter jururawat bertugas.'}
              </div>
            </div>

            <button
              onClick={() => setShowSessionDetail(false)}
              className="w-full min-h-[50px] bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer text-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: BERAT & TEKANAN DARAH */}
      {showWeightBpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-teal-500 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-black text-teal-400 flex items-center">
                <Droplets className="w-6 h-6 mr-2" />
                Berat & Tekanan Darah (BP)
              </h3>
              <button 
                onClick={() => setShowWeightBpModal(false)}
                className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-teal-950/80 border border-teal-800 rounded-2xl p-5 text-center">
                <span className="text-xs uppercase text-teal-300 font-bold tracking-wider">Berat Kering Sasaran</span>
                <div className="text-4xl font-black text-white mt-1">{patientDryWeight} kg</div>
                <p className="text-xs text-teal-200 mt-1">Ditentukan oleh Pakar Nefrologi Dr. Azman</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-semibold">Berat Sebelum Hari Ini</span>
                  {activePreWeight !== null ? (
                    <>
                      <span className="text-2xl font-bold text-white mt-1 block">{activePreWeight} kg</span>
                      <span className={`text-xs font-medium ${fluidExcessKg !== null && !isNaN(fluidExcessKg) && fluidExcessKg > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {fluidExcessKg !== null && !isNaN(fluidExcessKg) && fluidExcessKg > 0 ? `Lebihan: +${fluidExcessKg.toFixed(1)} kg` : 'Tepat Sasaran'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-slate-300 mt-1 block">Belum Disukat</span>
                      <span className="text-[10px] text-amber-400 font-medium">Disukat di kaunter jururawat</span>
                    </>
                  )}
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-semibold">BP Sebelum Dialisis</span>
                  {activePreBp ? (
                    <>
                      <span className="text-2xl font-bold text-white mt-1 block">{activePreBp}</span>
                      <span className="text-xs text-emerald-400 font-medium">Direkodkan</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-slate-300 mt-1 block">Belum Diperiksa</span>
                      <span className="text-[10px] text-slate-400 font-medium">Pemeriksaan pra-rawatan</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-300 space-y-2">
                <h4 className="font-bold text-white">Nasihat Penjagaan Cecair:</h4>
                <p>• Hadkan pengambilan air kepada tidak melebihi 500ml sehari ditambah jumlah air kencing.</p>
                <p>• Kurangkan garam dan makanan berkuah bagi mengelakkan sesak nafas dan tekanan darah naik.</p>
              </div>
            </div>

            <button
              onClick={() => setShowWeightBpModal(false)}
              className="w-full min-h-[50px] bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer text-lg"
            >
              Faham & Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: UBAT-UBATAN SAYA (READ-ONLY UNTUK PESAKIT, HANYA BOLEH DIEDIT OLEH ADMIN / DOKTOR) */}
      {showMedsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-800">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-amber-400">Senarai Ubat Saya</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Preskripsi Klinikal Rasmi</span>
                </div>
              </div>
              <button 
                onClick={() => setShowMedsModal(false)}
                className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            {/* NOTIS SEKATAN EDIT: HANYA BOLEH DIEDIT OLEH ADMIN / DOKTOR */}
            <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 text-xs text-amber-200 space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-amber-300">
                <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Paparan Sahaja (Hanya Boleh Diedit oleh Admin / Doktor)</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Preskripsi ubat di bawah disahkan oleh <strong>Dr. Azman bin Khairuddin (Pakar Nefrologi)</strong>. Pesakit tidak dibenarkan mengubah suai atau meminda dos ubat tanpa rujukan doktor. Sebarang pindaan ubat hanya dilakukan di Portal Pentadbir.
              </p>
            </div>

            {/* Senarai Ubat Pesakit */}
            <div className="space-y-3">
              {activePatientMedications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Tiada rekod ubat aktif buat masa ini. Sila rujuk doktor semasa sesi rawatan.
                </div>
              ) : (
                activePatientMedications.map((med) => (
                  <div key={med.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-base text-white">{med.medication_name}</h4>
                      <span className="text-[10px] font-mono bg-slate-800 text-amber-400 font-semibold px-2 py-0.5 rounded border border-slate-700 shrink-0">
                        {med.route}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Dos: {med.dosage}
                      </span>
                      <span className="text-xs text-slate-400">
                        Status: <strong className="text-white">{med.is_active ? 'Aktif' : 'Tidak Aktif'}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 pt-1">
                      <strong>Cara makan / kekerapan:</strong> {med.frequency}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowMedsModal(false)}
              className="w-full min-h-[50px] bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer text-base"
            >
              Faham & Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: SOS PERLU BANTUAN */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-3 border-rose-500 rounded-3xl max-w-md w-full p-6 text-white space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-rose-600/30 text-rose-500 mx-auto flex items-center justify-center border-2 border-rose-500 animate-pulse">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-rose-400">
                Bantuan & Kecemasan
              </h3>
              <p className="text-slate-300 text-sm">
                Hubungi KaizenBros Dialysis Centre segera jika anda memerlukan bantuan rawatan atau kecemasan.
              </p>
            </div>

            <div className="space-y-3">
              {/* Call Hotline */}
              <a
                href={`tel:${VERIFIED_CENTRE_INFO.hotline_24h.replace(/\s+/g, '')}`}
                className="w-full min-h-[56px] bg-rose-600 hover:bg-rose-500 text-white font-black text-lg rounded-2xl flex items-center justify-center space-x-3 shadow-lg"
              >
                <PhoneCall className="w-6 h-6" />
                <span>PANGGIL HOTLINE: {VERIFIED_CENTRE_INFO.hotline_24h}</span>
              </a>

              {/* WhatsApp Centre */}
              <a
                href={`https://wa.me/${VERIFIED_CENTRE_INFO.whatsapp_number}?text=Salam%20KaizenBros,%20saya%20pesakit%20${encodeURIComponent(patient.name)}%20(${patient.patient_id_code})%20memerlukan%20bantuan.`}
                target="_blank"
                rel="noreferrer"
                className="w-full min-h-[56px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-2xl flex items-center justify-center space-x-3 shadow-lg"
              >
                <MessageCircle className="w-6 h-6" />
                <span>WhatsApp Jururawat Bertugas</span>
              </a>

              {/* Clinic Landline */}
              <a
                href={`tel:${VERIFIED_CENTRE_INFO.phone_main}`}
                className="w-full min-h-[50px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base rounded-2xl flex items-center justify-center space-x-2 border border-slate-700"
              >
                <PhoneCall className="w-5 h-5 text-slate-400" />
                <span>Telefon Klinik: {VERIFIED_CENTRE_INFO.phone_main}</span>
              </a>
            </div>

            <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              <strong>Tanda Bahaya:</strong> Jika mengalami sesak nafas ketika baring, pendarahan tidak henti pada fistula, atau sakit dada mencucuk, sila segera hubungi 999 atau ke Jabatan Kecemasan hospital terdekat.
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full min-h-[48px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer text-base"
            >
              Kembali ke Aplikasi
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
