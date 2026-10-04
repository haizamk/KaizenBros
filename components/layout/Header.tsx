'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  PhoneCall, 
  User, 
  Clock, 
  ChevronRight, 
  Activity,
  Heart,
  Database,
  Globe,
  Stethoscope,
  ShieldAlert,
  UserPlus,
  Moon,
  Sun,
  Lock,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { VERIFIED_CENTRE_INFO } from '@/lib/mock-data';
import { useMalaysiaTime } from '@/hooks/useMalaysiaTime';
import { StaffAccount } from '@/lib/auth-service';
import { StaffLoginModal } from '@/components/auth/StaffLoginModal';

interface HeaderProps {
  currentView: 'public' | 'patient' | 'nurse' | 'admin' | 'database' | 'registration';
  onViewChange: (view: 'public' | 'patient' | 'nurse' | 'admin' | 'database' | 'registration') => void;
  activePatientName?: string;
  activeNurseName?: string;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  authenticatedStaff?: StaffAccount | null;
  onStaffLoginSuccess?: (staff: StaffAccount) => void;
  onStaffLogout?: () => void;
  onAuditLog?: (action: string, description: string) => void;
}

export function Header({
  currentView,
  onViewChange,
  activePatientName = 'Ahmad bin Ali',
  activeNurseName = 'Sister Siti Fatimah',
  theme = 'dark',
  onThemeToggle,
  authenticatedStaff,
  onStaffLoginSuccess,
  onStaffLogout,
  onAuditLog
}: HeaderProps) {
  const {
    formattedDate,
    formattedTime12,
    isAfter7pm,
    isMounted,
    isSimulating,
    toggleSimulation
  } = useMalaysiaTime();

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showStaffLoginModal, setShowStaffLoginModal] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md select-none">
      {/* Top Clinic Info Bar */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {VERIFIED_CENTRE_INFO.kkm_license}
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="hidden sm:inline text-slate-300">
              Semenyih, Selangor
            </span>
          </div>

          <div className="flex flex-wrap items-center space-x-2 sm:space-x-3">
            <a 
              href={`tel:${VERIFIED_CENTRE_INFO.hotline_24h.replace(/\s+/g, '')}`} 
              className="inline-flex items-center text-rose-400 hover:text-rose-300 font-semibold"
            >
              <PhoneCall className="w-3.5 h-3.5 mr-1 text-rose-500 animate-pulse" />
              <span>Kecemasan: {VERIFIED_CENTRE_INFO.hotline_24h}</span>
            </a>
            <span className="text-slate-600 hidden md:inline">|</span>

            {/* Malaysian Real-Time Clock & Status */}
            <div suppressHydrationWarning className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-0.5 text-slate-200">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span suppressHydrationWarning className="font-semibold text-white">
                🇲🇾 {isMounted ? formattedDate : 'Waktu Malaysia'}
                {' • '}
                <span suppressHydrationWarning className="text-cyan-300 font-mono">
                  {isMounted ? `${formattedTime12} MYT` : '--:--:-- MYT'}
                </span>
              </span>
              {isMounted && (
                isAfter7pm ? (
                  <span suppressHydrationWarning className="ml-1.5 inline-flex items-center bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                    <Moon className="w-2.5 h-2.5 mr-1 text-indigo-400" />
                    Lepas 7PM
                  </span>
                ) : (
                  <span suppressHydrationWarning className="ml-1.5 inline-flex items-center bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                    <Sun className="w-2.5 h-2.5 mr-1 text-emerald-400" />
                    Operasi
                  </span>
                )
              )}
            </div>

            {/* Quick Testing Controls (Allows instant verification before vs after 7pm) */}
            <div className="hidden lg:flex items-center space-x-1 text-[10px]">
              <span className="text-slate-500 font-mono">Uji Waktu:</span>
              <button
                onClick={() => toggleSimulation('live')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                  !isSimulating 
                    ? 'bg-cyan-700 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Gunakan Masa Nyata Malaysia Sekarang"
              >
                Asal
              </button>
              <button
                onClick={() => toggleSimulation('after7pm')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold flex items-center space-x-0.5 ${
                  isSimulating && isAfter7pm
                    ? 'bg-indigo-600 text-white ring-1 ring-indigo-400' 
                    : 'bg-slate-800 text-slate-400 hover:text-indigo-300'
                }`}
                title="Simulasi Jam 7:15 PM"
              >
                <Moon className="w-2.5 h-2.5" />
                <span>7PM</span>
              </button>
              <button
                onClick={() => toggleSimulation('morning')}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold flex items-center space-x-0.5 ${
                  isSimulating && !isAfter7pm
                    ? 'bg-emerald-600 text-white ring-1 ring-emerald-400' 
                    : 'bg-slate-800 text-slate-400 hover:text-emerald-300'
                }`}
                title="Simulasi Jam 9:15 AM"
              >
                <Sun className="w-2.5 h-2.5" />
                <span>9AM</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar with Branding & Discrete Staff Trigger */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => onViewChange('public')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-950/50 group-hover:scale-105 transition-transform">
            <Heart className="w-6 h-6 text-white fill-white/20" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                KAIZENBROS
              </span>
              <span className="bg-cyan-950 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-800">
                DIALYSIS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Pusat Hemodialisis Berdaftar KKM Semenyih
            </p>
          </div>
        </div>

        {/* High-visibility active badge for staff context */}
        <div className="flex items-center space-x-3">
          {Boolean(currentView && currentView !== 'public' && currentView !== 'patient') && (
            <span className="hidden md:inline-flex items-center bg-cyan-950 text-cyan-300 border border-cyan-800 px-3 py-1 rounded-full text-xs font-bold font-mono">
              ⚡ AKTIF: {String(currentView || '').toUpperCase()}
            </span>
          )}

          {/* Theme Toggle Button */}
          {onThemeToggle && (
            <button
              onClick={onThemeToggle}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-cyan-400 border border-slate-700 flex items-center justify-center cursor-pointer transition-all shadow-sm"
              title={theme === 'light' ? 'Tukar ke Mod Gelap (Dark Mode)' : 'Tukar ke Mod Terang (Light Mode)'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}

          {/* Staff Login / Active Staff Trigger */}
          {authenticatedStaff ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onViewChange(authenticatedStaff.role === 'admin' ? 'admin' : 'nurse')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Buka Portal Bertugas"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span suppressHydrationWarning className="hidden sm:inline">{(authenticatedStaff?.name || 'Staf').split(' ')[0]}</span>
                <span className="text-[10px] bg-cyan-800/80 px-1.5 py-0.2 rounded font-mono uppercase">{authenticatedStaff?.role || 'staf'}</span>
              </button>

              <button
                onClick={onStaffLogout}
                className="hidden sm:inline-flex px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Log keluar daripada sesi staf"
              >
                Log Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowStaffLoginModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Portal Staf</span>
            </button>
          )}
        </div>
      </div>

      {/* MAXIMUM SECURITY STAFF LOGIN MODAL */}
      <StaffLoginModal
        isOpen={showStaffLoginModal}
        onClose={() => setShowStaffLoginModal(false)}
        onLoginSuccess={(staff) => {
          onStaffLoginSuccess?.(staff);
          onViewChange(staff.role === 'admin' ? 'admin' : 'nurse');
        }}
        onAuditLog={onAuditLog}
      />

      {/* SECURE POPUP MODAL: CLINICAL STAFF PORTAL SELECTOR */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl max-w-md w-full p-6 text-white space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-800">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Akses Kakitangan Klinik</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Clinical Staff Only</p>
                </div>
              </div>
              <button 
                onClick={() => setShowStaffModal(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer text-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Nurse Portal */}
              <button
                onClick={() => {
                  onViewChange('nurse');
                  setShowStaffModal(false);
                }}
                className={`w-full p-4 text-left rounded-2xl border transition-all flex items-center space-x-4 cursor-pointer group ${
                  currentView === 'nurse'
                    ? 'bg-cyan-950/60 border-cyan-500 text-white'
                    : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-cyan-500/50 text-slate-300'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-900/50 border border-cyan-800 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">Portal Jururawat (Nurse)</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Sesi rawatan, penugasan kerusi & vitals.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 2: Admin Portal */}
              <button
                onClick={() => {
                  onViewChange('admin');
                  setShowStaffModal(false);
                }}
                className={`w-full p-4 text-left rounded-2xl border transition-all flex items-center space-x-4 cursor-pointer group ${
                  currentView === 'admin'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white'
                    : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-indigo-500/50 text-slate-300'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-900/50 border border-indigo-800 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">Portal Pentadbir (Admin)</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Pendaftaran pesakit, kewangan & log audit.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 3: New Patient Registration */}
              <button
                onClick={() => {
                  onViewChange('registration');
                  setShowStaffModal(false);
                }}
                className={`w-full p-4 text-left rounded-2xl border transition-all flex items-center space-x-4 cursor-pointer group ${
                  currentView === 'registration'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-emerald-500/50 text-slate-300'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-900/50 border border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">Kemasukan Borang Baru</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Pendaftaran masuk borang pesakit luar.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 4: Database Explorer */}
              <button
                onClick={() => {
                  onViewChange('database');
                  setShowStaffModal(false);
                }}
                className={`w-full p-4 text-left rounded-2xl border transition-all flex items-center space-x-4 cursor-pointer group ${
                  currentView === 'database'
                    ? 'bg-amber-950/60 border-amber-500 text-white'
                    : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-amber-500/50 text-slate-300'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-amber-900/50 border border-amber-800 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white group-hover:text-amber-450 transition-colors">Arkitektur DB (Firestore)</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Pantau dokumen pangkalan data.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <button
              onClick={() => setShowStaffModal(false)}
              className="w-full min-h-[48px] bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-white font-bold rounded-2xl cursor-pointer transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
