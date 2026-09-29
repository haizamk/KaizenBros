'use client';

import React from 'react';
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
  UserPlus
} from 'lucide-react';
import { VERIFIED_CENTRE_INFO } from '@/lib/mock-data';

interface HeaderProps {
  currentView: 'public' | 'patient' | 'nurse' | 'admin' | 'database' | 'registration';
  onViewChange: (view: 'public' | 'patient' | 'nurse' | 'admin' | 'database' | 'registration') => void;
  activePatientName?: string;
  activeNurseName?: string;
}

export function Header({
  currentView,
  onViewChange,
  activePatientName = 'Ahmad bin Ali',
  activeNurseName = 'Sister Siti Fatimah'
}: HeaderProps) {
  const currentDate = new Date().toLocaleDateString('ms-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      {/* Top Clinic Info Bar */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {VERIFIED_CENTRE_INFO.kkm_license}
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-300">
              Semenyih, Selangor
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a 
              href={`tel:${VERIFIED_CENTRE_INFO.hotline_24h.replace(/\s+/g, '')}`} 
              className="inline-flex items-center text-rose-400 hover:text-rose-300 font-semibold"
            >
              <PhoneCall className="w-3.5 h-3.5 mr-1 text-rose-500 animate-pulse" />
              <span>Kecemasan 24 Jam: {VERIFIED_CENTRE_INFO.hotline_24h}</span>
            </a>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="hidden md:inline text-slate-400 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {currentDate}
            </span>
          </div>
        </div>
      </div>

      {/* Main Bar with Branding & Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-4">
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
              Pusat Hemodialisis Berdaftar KKM
            </p>
          </div>
        </div>

        {/* Global Portal Switcher (Quick Access for Reviewers & Testing) */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs sm:text-sm overflow-x-auto max-w-full">
          <button
            onClick={() => onViewChange('public')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              currentView === 'public'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Laman Web</span>
          </button>

          <button
            onClick={() => onViewChange('registration')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              currentView === 'registration'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md shadow-teal-950'
                : 'text-cyan-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
            <span>Pendaftaran Baru</span>
          </button>

          <button
            onClick={() => onViewChange('patient')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              currentView === 'patient'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 text-emerald-300" />
            <span>Portal Pesakit</span>
          </button>

          <button
            onClick={() => onViewChange('nurse')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              currentView === 'nurse'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-cyan-300" />
            <span>Portal Jururawat</span>
          </button>

          <button
            onClick={() => onViewChange('admin')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              currentView === 'admin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-300" />
            <span>Pentadbir (Admin)</span>
          </button>

          <button
            onClick={() => onViewChange('database')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              currentView === 'database'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Pangkalan Data & Arkitektur</span>
          </button>
        </div>

        {/* Current Active Persona Tag */}
        <div className="hidden lg:flex items-center space-x-3 text-xs">
          <div className="text-right">
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Aktif Sekarang</p>
            <p className="font-semibold text-white">
              {currentView === 'patient' && `Pesakit: ${activePatientName}`}
              {currentView === 'nurse' && `Jururawat: ${activeNurseName}`}
              {currentView === 'admin' && 'Dr. Azman (Pentadbir Utama)'}
              {currentView === 'public' && 'Pelawat Laman Web'}
              {currentView === 'database' && 'Firebase Firestore + Next.js 15'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400">
            {currentView === 'patient' ? 'P' : currentView === 'nurse' ? 'J' : currentView === 'admin' ? 'A' : 'K'}
          </div>
        </div>
      </div>
    </header>
  );
}
