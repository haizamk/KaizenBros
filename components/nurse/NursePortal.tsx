'use client';

import React, { useState, useMemo } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { 
  DialysisSession, 
  Patient, 
  ActionableAlert, 
  DailyReportSummary, 
  SessionStatus,
  Nurse 
} from '@/types';
import { INITIAL_TODAY_SESSIONS, INITIAL_PATIENTS, INITIAL_ACTIONABLE_ALERTS, INITIAL_DAILY_SUMMARY } from '@/lib/mock-data';

interface NursePortalProps {
  currentNurseName?: string;
  onAuditLog?: (action: string, details: string) => void;
}

export function NursePortal({
  currentNurseName = 'Sister Siti Fatimah',
  onAuditLog
}: NursePortalProps) {
  // Navigation tabs:
  // 🏠 Hari Ini, 👥 Pesakit, 🩺 Sesi Dialisis, 📋 Rekod, 📊 Laporan, ⚙️ Tetapan
  const [activeNav, setActiveNav] = useState<'hari_ini' | 'pesakit' | 'sesi' | 'rekod' | 'laporan' | 'tetapan'>('hari_ini');

  // Sessions state (24 patients today)
  const [sessions, setSessions] = useState<DialysisSession[]>(INITIAL_TODAY_SESSIONS);
  const [alerts, setAlerts] = useState<ActionableAlert[]>(INITIAL_ACTIONABLE_ALERTS);
  const [patientsList, setPatientsList] = useState<Patient[]>(INITIAL_PATIENTS);

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

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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
      alert('Sila masukkan bacaan Systolic dan Diastolic.');
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
      alert('Sila lengkapkan berat selepas dialisis dan tekanan darah akhir.');
      return;
    }

    const postBpStr = `${postSys}/${postDia}`;
    const actualUf = selectedSessionForActive.pre_weight_kg ? +(selectedSessionForActive.pre_weight_kg - postW).toFixed(2) : 1.5;
    const currentTimeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionForActive.id) {
        return {
          ...s,
          post_weight_kg: postW,
          post_bp: postBpStr,
          actual_uf_litres: actualUf,
          actual_end_time: currentTimeStr,
          status: 'SUDAH_SELESAI',
          nurse_in_charge: currentNurseName
        };
      }
      return s;
    }));

    // Update patient's latest record
    setPatientsList(prev => prev.map(p => {
      if (p.id === selectedSessionForActive.patient_id) {
        return {
          ...p,
          latest_weight_kg: postW,
          latest_bp: postBpStr
        };
      }
      return p;
    }));

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
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              SELAMAT DATANG, <span className="text-cyan-400">{currentNurseName.toUpperCase()}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              HARI INI: {new Date().toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | Syif Petang (2:00 PM - 6:00 PM)
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

            {/* ACTIONABLE ALERTS BOX (As specified in prompt) */}
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

                  return (
                    <div
                      key={s.id}
                      className={`bg-slate-950 border-2 rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between space-y-4 ${
                        isSedang 
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
                            <h3 className="text-lg font-black text-white leading-tight">
                              {s.patient_name.toUpperCase()}
                            </h3>
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

                          {s.pre_bp && (
                            <div className="bg-slate-900 p-2 rounded-lg">
                              <span className="text-slate-400 block">Tekanan Darah</span>
                              <span className="font-bold text-cyan-400 text-sm">{s.current_bp || s.pre_bp}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="mt-3">
                          {isSedang && (
                            <span className="inline-flex items-center text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700 px-3 py-1 rounded-full">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1.5" />
                              🟢 Sedang Dialisis (Mula {s.actual_start_time})
                            </span>
                          )}
                          {isSelesai && (
                            <span className="inline-flex items-center text-xs font-bold text-teal-300 bg-teal-950/80 border border-teal-700 px-3 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              ✓ Selesai ({s.actual_end_time})
                            </span>
                          )}
                          {isHadir && (
                            <span className="inline-flex items-center text-xs font-bold text-blue-300 bg-blue-950/80 border border-blue-700 px-3 py-1 rounded-full">
                              Sudah Hadir (Menunggu Kerusi)
                            </span>
                          )}
                          {isBelum && (
                            <span className="inline-flex items-center text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-700 px-3 py-1 rounded-full">
                              Belum Hadir
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Main Action Buttons: Minimum 48px Touch Target */}
                      <div className="pt-2 flex items-center space-x-2">
                        {isBelum && (
                          <button
                            onClick={() => {
                              setSelectedSessionForCheckIn(s);
                              setCheckInWeight(s.dry_weight_kg ? (s.dry_weight_kg + 1.4).toFixed(1) : '76.4');
                              setCheckInSystolic('148');
                              setCheckInDiastolic('82');
                            }}
                            className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>CHECK-IN</span>
                          </button>
                        )}

                        {isSedang && (
                          <button
                            onClick={() => setSelectedSessionForActive(s)}
                            className="flex-1 min-h-[48px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                          >
                            <Stethoscope className="w-4 h-4" />
                            <span>[ BUKA SESI ]</span>
                          </button>
                        )}

                        {isSelesai && (
                          <button
                            onClick={() => setSelectedSessionForActive(s)}
                            className="flex-1 min-h-[48px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer border border-slate-700"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Lihat Rekod</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const foundPatient = patientsList.find(p => p.id === s.patient_id) || INITIAL_PATIENTS[0];
                            setSelectedPatientForDetail(foundPatient);
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
                      <th className="px-5 py-3.5">No. Kad Pengenalan</th>
                      <th className="px-5 py-3.5">Corak Jadual</th>
                      <th className="px-5 py-3.5">Stesen & Akses</th>
                      <th className="px-5 py-3.5">Berat Kering</th>
                      <th className="px-5 py-3.5">Penaja</th>
                      <th className="px-5 py-3.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {patientsList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-5 py-4 font-medium">
                          <strong className="text-white block font-bold text-base">{p.name}</strong>
                          <span className="text-xs font-mono text-cyan-400">{p.patient_id_code}</span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs">{p.ic_number}</td>
                        <td className="px-5 py-4 text-xs">
                          <span className="font-semibold text-white block">{p.schedule_pattern.replace(/_/g, ' ')}</span>
                          <span className="text-slate-400">Syif {p.preferred_shift}</span>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <strong className="text-cyan-400 block font-bold">{p.assigned_chair}</strong>
                          <span>{p.vascular_access}</span>
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-400 text-base">{p.dry_weight_kg} kg</td>
                        <td className="px-5 py-4 text-xs">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">
                            {p.sponsor.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedPatientForDetail(p)}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Buka Profil
                          </button>
                        </td>
                      </tr>
                    ))}
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
                    <p className="text-xs text-slate-400 mt-1">Mula: {s.actual_start_time || s.scheduled_time}</p>
                    
                    {isActive && (
                      <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-xs">
                        <span className="text-slate-400">BP Semasa:</span>
                        <strong className="text-emerald-400 font-bold">{s.current_bp || s.pre_bp}</strong>
                      </div>
                    )}
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
                  <div key={s.id} className="py-3 flex justify-between items-center">
                    <div>
                      <strong className="text-white text-base block font-bold">{s.patient_name} ({s.patient_id_code})</strong>
                      <p className="text-xs text-slate-400">
                        {s.scheduled_date} | Stesen {s.chair_number} | {s.actual_start_time} - {s.actual_end_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Cecair Ditapis</span>
                      <strong className="text-cyan-400 text-sm font-bold">{s.actual_uf_litres} L</strong>
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

        {/* VIEW 6: TETAPAN KLINIKAL */}
        {activeNav === 'tetapan' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Tetapan Pusat Dialisis</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl">
              <div>
                <label className="text-xs font-semibold text-slate-400 block">Jururawat Bertugas Semasa</label>
                <input
                  type="text"
                  value={currentNurseName}
                  disabled
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white mt-1 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block">Syif Klinikal Aktif</label>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-700 mt-1 text-sm font-semibold text-cyan-400">
                  Syif 3 (Petang): 2:00 PM - 6:00 PM (12 Stesen Aktif)
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
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                BERAT
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Sebelum</span>
                  <strong className="text-xl font-bold text-white block mt-0.5">
                    {selectedSessionForActive.pre_weight_kg || '--'} kg
                  </strong>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Selepas</span>
                  <strong className="text-xl font-bold text-cyan-400 block mt-0.5">
                    {selectedSessionForActive.post_weight_kg ? `${selectedSessionForActive.post_weight_kg} kg` : '[ -- ]'}
                  </strong>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Berat Kering</span>
                  <strong className="text-xl font-bold text-emerald-400 block mt-0.5">
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
                    <span className="text-[11px] text-slate-400 block font-semibold">Umur & Jantina</span>
                    <strong className="text-white text-base block">{selectedPatientForDetail.age} Thn ({selectedPatientForDetail.gender})</strong>
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
    </div>
  );
}
