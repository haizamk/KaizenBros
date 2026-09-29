'use client';

import React, { useState } from 'react';
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
  HeartHandshake
} from 'lucide-react';
import { Patient, DialysisSession, PatientMedication } from '@/types';
import { VERIFIED_CENTRE_INFO } from '@/lib/mock-data';

interface PatientPortalProps {
  patient: Patient;
  session: DialysisSession;
  medications: PatientMedication[];
  onOpenSOSModal?: () => void;
}

export function PatientPortal({
  patient,
  session,
  medications
}: PatientPortalProps) {
  const [activeTab, setActiveTab] = useState<'utama' | 'jadual' | 'rekod' | 'profil'>('utama');
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showWeightBpModal, setShowWeightBpModal] = useState(false);
  const [showMedsModal, setShowMedsModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-28">
      {/* Top Banner specifically designed with extreme clarity */}
      <div className="bg-slate-950 border-b-2 border-slate-800 px-4 py-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-sm font-bold tracking-wider text-cyan-400 uppercase">
              KAIZENBROS DIALYSIS CENTRE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              Selamat datang,
              <br className="sm:hidden" />
              <span className="text-emerald-400 sm:ml-2">{patient.name}</span>
            </h1>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-right">
            <span className="text-xs text-slate-400 block font-semibold">No. ID Pesakit</span>
            <span className="text-lg font-mono font-bold text-white tracking-wide">
              {patient.patient_id_code}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6">
        {activeTab === 'utama' && (
          <div className="space-y-6">
            {/* NEXT DIALYSIS CALLOUT - Massive, High-Contrast Hero Card */}
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 shadow-xl shadow-emerald-950/40 relative overflow-hidden">
              <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm sm:text-base tracking-wider uppercase mb-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping mr-1" />
                <span>DIALISIS SETERUSNYA</span>
              </div>

              <div className="space-y-2 mb-5">
                <div className="text-3xl sm:text-4xl font-extrabold text-white flex items-baseline gap-3">
                  <span>Hari ini</span>
                  <span className="text-emerald-300 font-black">2:00 PM</span>
                </div>
                <div className="flex items-center text-slate-300 text-base sm:text-lg font-medium">
                  <MapPin className="w-5 h-5 mr-2 text-emerald-400 flex-shrink-0" />
                  <span>KaizenBros Dialysis Centre (Stesen {patient.assigned_chair})</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 px-3.5 py-1.5 rounded-full text-sm font-semibold mb-6">
                <Clock className="w-4 h-4 mr-2 text-emerald-300" />
                <span>Status Semasa: {session.status === 'SEDANG_DIALISIS' ? 'Sedang Berjalan di Kerusi' : 'Sedia Untuk Hadir'}</span>
              </div>

              {/* Primary Touch Target > 48px */}
              <button
                onClick={() => setShowSessionDetail(true)}
                className="w-full min-h-[56px] py-4 px-6 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-lg sm:text-xl rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-3 cursor-pointer"
              >
                <span>LIHAT SESI DIALISIS</span>
                <ChevronRight className="w-6 h-6 stroke-[3]" />
              </button>
            </div>

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
                    Isnin, Rabu, Jumaat (2:00 PM)
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

              {/* Card 3: Ubat Saya */}
              <button
                onClick={() => setShowMedsModal(true)}
                className="min-h-[96px] bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border-2 border-slate-700 hover:border-amber-500 rounded-2xl p-5 text-left transition-all flex items-center space-x-4 cursor-pointer shadow-md"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-800 flex items-center justify-center flex-shrink-0 text-amber-400">
                  <Pill className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">💊 Ubat Saya</h3>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">
                    5 jenis ubat aktif
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

        {/* TAB 2: JADUAL SAYA */}
        {activeTab === 'jadual' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white flex items-center">
                <Calendar className="w-7 h-7 mr-2 text-cyan-400" />
                Jadual Rawatan Saya
              </h2>
              <button 
                onClick={() => setActiveTab('utama')}
                className="text-cyan-400 text-base font-bold underline"
              >
                Kembali
              </button>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="bg-cyan-950/60 border border-cyan-800 rounded-xl p-4">
                <span className="text-xs uppercase font-bold text-cyan-400">Corak Rutin Tetap</span>
                <p className="text-xl font-bold text-white mt-1">
                  Setiap Hari ISNIN, RABU & JUMAAT
                </p>
                <p className="text-slate-300 text-sm mt-1">
                  Sesi 3 (Petang): 2:00 PM hingga 6:00 PM (4 Jam Rawatan)
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Sesi Minggu Ini:
                </h4>

                <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="bg-emerald-900 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded">
                      HARI INI
                    </span>
                    <p className="text-lg font-bold text-white mt-1">Jumaat, 25 September 2026</p>
                    <p className="text-sm text-slate-400">Masa: 2:00 PM - 6:00 PM | Kerusi {patient.assigned_chair}</p>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-800">
                    Aktif
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between opacity-80">
                  <div>
                    <p className="text-base font-bold text-white">Isnin, 28 September 2026</p>
                    <p className="text-sm text-slate-400">Masa: 2:00 PM - 6:00 PM | Kerusi {patient.assigned_chair}</p>
                  </div>
                  <span className="text-slate-400 font-medium text-xs bg-slate-800 px-2.5 py-1 rounded">
                    Akan Datang
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between opacity-80">
                  <div>
                    <p className="text-base font-bold text-white">Rabu, 30 September 2026</p>
                    <p className="text-sm text-slate-400">Masa: 2:00 PM - 6:00 PM | Kerusi {patient.assigned_chair}</p>
                  </div>
                  <span className="text-slate-400 font-medium text-xs bg-slate-800 px-2.5 py-1 rounded">
                    Akan Datang
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/80 flex items-start space-x-3 text-sm text-slate-300">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  Sekiranya ingin menukar jadual atau ada temujanji doktor pakar di hospital luar, sila maklumkan kepada jururawat sekurang-kurangnya 24 jam awal.
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
                    <strong className="text-white text-lg font-bold">{session.pre_weight_kg} kg</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-400 text-xs block">Tekanan Darah (BP)</span>
                    <strong className="text-white text-lg font-bold">{session.pre_bp}</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-400 text-xs block">Target Cecair (UF)</span>
                    <strong className="text-cyan-400 text-lg font-bold">{session.target_uf_litres} L</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-400 text-xs block">Kerusi & Jururawat</span>
                    <strong className="text-white text-sm font-semibold">{session.chair_number} ({session.nurse_in_charge})</strong>
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
                <span className="text-2xl font-black text-white">{session.chair_number}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Jururawat Bertugas</span>
                <span className="font-bold text-white text-lg">{session.nurse_in_charge}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-xs block">Berat Sebelum</span>
                  <span className="text-xl font-bold text-white">{session.pre_weight_kg} kg</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-xs block">Berat Kering Sasaran</span>
                  <span className="text-xl font-bold text-emerald-400">{session.dry_weight_kg} kg</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Tekanan Darah Awal</span>
                <span className="text-xl font-bold text-white">{session.pre_bp}</span>
              </div>

              <div className="bg-emerald-950/60 border border-emerald-800 p-3 rounded-xl text-sm text-emerald-300">
                ✓ Mesin dan rawatan sedang berjalan lancar. Sila maklumkan segera kepada jururawat jika merasa loya atau kekejangan otot.
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
                <div className="text-4xl font-black text-white mt-1">{patient.dry_weight_kg} kg</div>
                <p className="text-xs text-teal-200 mt-1">Ditentukan oleh Pakar Nefrologi Dr. Azman</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-semibold">Berat Sebelum Hari Ini</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{session.pre_weight_kg} kg</span>
                  <span className="text-xs text-amber-400 font-medium">Lebihan: +1.4 kg</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-semibold">BP Sebelum Dialisis</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{session.pre_bp}</span>
                  <span className="text-xs text-emerald-400 font-medium">Dalam kawalan</span>
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

      {/* MODAL 3: UBAT-UBATAN SAYA */}
      {showMedsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-black text-amber-400 flex items-center">
                <Pill className="w-6 h-6 mr-2" />
                Senarai Ubat Saya
              </h3>
              <button 
                onClick={() => setShowMedsModal(false)}
                className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {medications.map((med) => (
                <div key={med.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg text-white">{med.medication_name}</h4>
                    <span className="text-xs bg-slate-800 text-amber-400 font-semibold px-2 py-0.5 rounded">
                      {med.route}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">Dos: {med.dosage}</p>
                  <p className="text-xs text-slate-300">Cara makan: {med.frequency}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowMedsModal(false)}
              className="w-full min-h-[50px] bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer text-lg"
            >
              Tutup
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
