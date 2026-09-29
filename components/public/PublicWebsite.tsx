'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  PhoneCall, 
  Clock, 
  MapPin, 
  Heart, 
  Droplet, 
  CheckCircle2, 
  ChevronRight, 
  User, 
  Lock, 
  Calendar, 
  Sparkles, 
  Activity, 
  Mail, 
  MessageCircle,
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import { UserPlus, Navigation, Compass } from 'lucide-react';
import { VERIFIED_CENTRE_INFO } from '@/lib/mock-data';

interface PublicWebsiteProps {
  onLoginAsPatient: () => void;
  onLoginAsNurse: () => void;
  onLoginAsAdmin: () => void;
  onOpenRegistration?: () => void;
}

export function PublicWebsite({
  onLoginAsPatient,
  onLoginAsNurse,
  onLoginAsAdmin,
  onOpenRegistration
}: PublicWebsiteProps) {
  const [activeSection, setActiveSection] = useState<'home' | 'about' | 'services' | 'info' | 'centre' | 'contact'>('home');
  const [showLoginModal, setShowLoginModal] = useState<'patient' | 'staff' | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-16 sm:py-24 border-b border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-700/60 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Pusat Hemodialisis Berdaftar KKM ({VERIFIED_CENTRE_INFO.kkm_license})</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Pusat Dialisis <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">KaizenBros</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
              {VERIFIED_CENTRE_INFO.slogan}. Menyediakan rawatan hemodialisis moden berstandard antarabangsa di Semenyih, dipantau oleh Pakar Nefrologi dan jururawat terlatih.
            </p>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              {onOpenRegistration && (
                <button
                  onClick={onOpenRegistration}
                  className="min-h-[52px] px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 active:from-cyan-600 text-slate-950 font-black text-base rounded-2xl transition-all shadow-xl shadow-cyan-950/60 flex items-center space-x-2.5 cursor-pointer ring-2 ring-cyan-400/40"
                >
                  <UserPlus className="w-5 h-5 text-slate-950" />
                  <span>PENDAFTARAN PESAKIT BARU</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setShowLoginModal('patient')}
                className="min-h-[52px] px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg flex items-center space-x-2 cursor-pointer border border-emerald-500/50"
              >
                <User className="w-5 h-5 text-emerald-200" />
                <span>LOG MASUK PESAKIT</span>
              </button>

              <button
                onClick={() => setShowLoginModal('staff')}
                className="min-h-[52px] px-5 py-3 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-white font-bold text-sm rounded-2xl transition-all border border-slate-700 flex items-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>PORTAL STAF</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-black text-white">Kemudahan Rawatan Berkualiti Tinggi</h2>
            <p className="text-slate-400 text-sm">Direka khas untuk keselesaan dan keselamatan optimum pesakit buah pinggang</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">12 Mesin Dialisis Fresenius</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Dilengkapi mesin berprestasi tinggi Fresenius 4008S NG dan 5008S CorDiax yang menyokong terapi Online HDF untuk penapisan toksin uremik yang lebih bersih.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
                <Droplet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Air RO Double Pass AAMI/ISO</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sistem rawatan air Reverse Osmosis (RO) berganda mematuhi standard piawaian ketat antarabangsa AAMI/ISO 23500 bagi memastikan ketulenan air ultra-murni.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Panel Penaja Diiktiraf</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Menerima penajaan penuh PERKESO / SOCSO, JPA/KWAP, Lembaga Zakat Selangor (LZS), Baitulmal MAIWP, Yayasan Buah Pinggang Kebangsaan (NKF) & Insurans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Centre Details Section */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">
              MAKLUMAT PUSAT DIALISIS KAIZENBROS
            </span>
            <h2 className="text-3xl font-black text-white">Lokasi & Waktu Operasi</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Address and Contact Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-1">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Alamat Pusat:</h4>
                  <p className="text-slate-300 text-sm mt-1">{VERIFIED_CENTRE_INFO.address}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-1">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Waktu Operasi Sesi:</h4>
                  <p className="text-slate-300 text-sm mt-1">Isnin - Sabtu: 6:00 Pagi - 6:00 Petang (3 Sesi: Pagi, Tengahari, Petang)</p>
                  <p className="text-slate-500 text-xs mt-0.5">Ahad: Tutup (Kecemasan On-Call Sahaja)</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400 flex-shrink-0 mt-1">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Perhubungan & Kecemasan:</h4>
                  <p className="text-slate-300 text-sm mt-1">Telefon Pejabat: {VERIFIED_CENTRE_INFO.phone_main}</p>
                  <p className="text-rose-400 font-bold text-sm">Talian Kecemasan 24 Jam: {VERIFIED_CENTRE_INFO.hotline_24h}</p>
                </div>
              </div>
            </div>

            {/* Panels List Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h4 className="font-bold text-white text-lg flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" />
                Senarai Panel Penajaan
              </h4>
              <p className="text-xs text-slate-400">
                Pusat Dialisis KaizenBros bekerjasama rapat dengan agensi kerajaan dan institusi penaja untuk meringankan kos rawatan pesakit.
              </p>
              <div className="space-y-2.5 pt-2">
                {VERIFIED_CENTRE_INFO.panels.map((p, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-200">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Google Map Section */}
      <section className="py-16 bg-slate-900 border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-cyan-400" />
                PETA LOKASI PUSAT DIALISIS KAIZENBROS
              </span>
              <h2 className="text-3xl font-black text-white">Panduan Arah & Peta Google</h2>
              <p className="text-slate-300 text-sm max-w-xl">
                Lokasi strategik di Semenyih, Selangor. Dilengkapi tempat letak kereta khas OKU dan laluan mesra kerusi roda.
              </p>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Pusat+Dialisis+KaizenBros+Semenyih+Selangor"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all"
              >
                <Compass className="w-4 h-4 text-cyan-200" />
                <span>Buka di Google Maps</span>
              </a>

              <a
                href="https://waze.com/ul?q=Pusat%20Dialisis%20KaizenBros%20Semenyih"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all border border-teal-600"
              >
                <Navigation className="w-4 h-4 text-teal-300" />
                <span>Pandu Menggunakan Waze</span>
              </a>
            </div>
          </div>

          {/* Map Frame Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[380px] sm:h-[450px]">
            <iframe
              title="Peta Lokasi Pusat Dialisis KaizenBros Semenyih"
              src="https://maps.google.com/maps?q=2.9463,101.8461&z=15&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full filter saturate-[0.85] contrast-[1.05]"
            />
            
            {/* Map Overlay Location Card */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-4 sm:p-5 rounded-2xl shadow-2xl space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-extrabold text-xs">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/30" />
                <span>KAIZENBROS DIALYSIS CENTRE</span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {VERIFIED_CENTRE_INFO.address}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Waktu Sesi: 6:00 AM - 6:00 PM</span>
                <span className="text-emerald-400 font-bold">Kawasan Parkir Mesra OKU</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 Pusat Dialisis KaizenBros (KaizenBros Dialysis Centre). No. Pendaftaran KKM: {VERIFIED_CENTRE_INFO.kkm_license}</p>
          <p>Hakcipta Terpelihara. Aplikasi Pengurusan Klinikal Berasaskan Laravel 13 & MySQL 8.x.</p>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-black text-white">
                {showLoginModal === 'patient' ? 'Log Masuk Portal Pesakit' : 'Log Masuk Portal Staf / Pentadbir'}
              </h3>
              <button 
                onClick={() => setShowLoginModal(null)}
                className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {showLoginModal === 'patient'
                ? 'Sila pilih mod pesakit untuk mencuba paparan mesra warga emas (Bahasa Melayu, fon besar, target sentuhan >48px).'
                : 'Pilih mod staf klinikal (Jururawat / Pentadbir) untuk meneruskan sesi pemantauan.'}
            </p>

            <div className="space-y-3 pt-2">
              {showLoginModal === 'patient' ? (
                <button
                  onClick={() => {
                    setShowLoginModal(null);
                    onLoginAsPatient();
                  }}
                  className="w-full min-h-[52px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <User className="w-5 h-5" />
                  <span>Masuk Sebagai Ahmad bin Ali (P00123)</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowLoginModal(null);
                      onLoginAsNurse();
                    }}
                    className="w-full min-h-[52px] bg-cyan-600 hover:bg-cyan-500 text-white font-black text-base rounded-2xl flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Stethoscope className="w-5 h-5" />
                    <span>Masuk Sebagai Sister Siti (Jururawat Klinikal)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowLoginModal(null);
                      onLoginAsAdmin();
                    }}
                    className="w-full min-h-[52px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base rounded-2xl flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>Masuk Sebagai Pentadbir (Dr. Azman)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
