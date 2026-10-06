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
  Activity, 
  MessageCircle,
  Stethoscope,
  UserPlus,
  Navigation,
  Compass
} from 'lucide-react';
import { VERIFIED_CENTRE_INFO } from '@/lib/mock-data';
import { PatientLoginModal } from '@/components/auth/PatientLoginModal';
import { StaffLoginModal } from '@/components/auth/StaffLoginModal';
import { PatientAccount, StaffAccount } from '@/lib/auth-service';

interface PublicWebsiteProps {
  onLoginAsPatient: (patientAccount?: PatientAccount) => void;
  onLoginAsNurse: (staffAccount?: StaffAccount) => void;
  onLoginAsAdmin: (staffAccount?: StaffAccount) => void;
  onOpenRegistration?: () => void;
  onAuditLog?: (action: string, description: string) => void;
}

export function PublicWebsite({
  onLoginAsPatient,
  onLoginAsNurse,
  onLoginAsAdmin,
  onOpenRegistration,
  onAuditLog
}: PublicWebsiteProps) {
  const [showLoginModal, setShowLoginModal] = useState<'patient' | 'staff' | null>(null);

  // WhatsApp lead-gen query states
  const [showWhatsappQueryModal, setShowWhatsappQueryModal] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryPhone, setQueryPhone] = useState('');
  const [queryAge, setQueryAge] = useState('');
  const [queryNotes, setQueryNotes] = useState('');

  const handleSendWhatsappQuery = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedMsg = `*PERTANYAAN PESAKIT BARU - KAIZENBROS DIALYSIS*
--------------------------------------------------
*Nama Pesakit:* ${queryName}
*No. Telefon:* ${queryPhone}
*Umur:* ${queryAge} tahun
*Pertanyaan Tambahan:* ${queryNotes || 'Tiada'}
--------------------------------------------------
Hantar daripada Borang Pertanyaan Laman Web KaizenBros.`;

    const encodedText = encodeURIComponent(formattedMsg);
    const whatsappUrl = `https://wa.me/60193389922?text=${encodedText}`;
    
    // Redirect to WhatsApp in a new window/tab
    window.open(whatsappUrl, '_blank');
    
    // Reset states
    setShowWhatsappQueryModal(false);
    setQueryName('');
    setQueryPhone('');
    setQueryAge('');
    setQueryNotes('');
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#080E21] via-[#0B132B] to-[#0E1A30] py-16 sm:py-24 border-b border-[#1F385C]">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 bg-teal-950/80 border border-teal-600/80 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold text-teal-300 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Pusat Hemodialisis Berdaftar KKM ({VERIFIED_CENTRE_INFO.kkm_license})</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Pusat Dialisis <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">KaizenBros</span>
            </h1>

            <p className="text-lg sm:text-2xl text-slate-200 leading-relaxed font-normal">
              {VERIFIED_CENTRE_INFO.slogan}. Menyediakan rawatan hemodialisis moden berstandard antarabangsa di Semenyih, dipantau oleh Pakar Nefrologi dan jururawat terlatih.
            </p>

            {/* Focused Action CTA Buttons (Elderly-First: Large touch targets) */}
            <div className="pt-4 space-y-4 max-w-xl">
              {/* PRIMARY: WhatsApp Inquiry Button */}
              <button
                onClick={() => setShowWhatsappQueryModal(true)}
                className="w-full min-h-[62px] px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:from-emerald-600 text-slate-950 font-black text-lg rounded-2xl transition-all shadow-xl shadow-teal-950/50 flex items-center justify-center space-x-3 cursor-pointer ring-4 ring-teal-500/20"
              >
                <MessageCircle className="w-6 h-6 text-slate-950 fill-slate-950/20" />
                <span>WhatsApp Kami: Pertanyaan Pesakit Baru</span>
                <ChevronRight className="w-5 h-5 text-slate-950" />
              </button>

              {/* SECONDARY: KKM Pendaftaran Pesakit Baru Form */}
              {onOpenRegistration && (
                <button
                  onClick={onOpenRegistration}
                  className="w-full min-h-[58px] px-6 py-3.5 bg-[#132238] hover:bg-[#1E3352] text-cyan-300 hover:text-white font-black text-base rounded-2xl transition-all border-2 border-cyan-500/60 hover:border-cyan-400 flex items-center justify-center space-x-3 cursor-pointer shadow-lg"
                >
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                  <span>BORANG PENDAFTARAN PESAKIT BARU (KKM)</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
                💬 Sila hantar pertanyaan pantas untuk mengetahui slot kosong, pengangkutan percuma, & tajaan PERKESO/Zakat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-[#0E1A30] border-b border-[#1F385C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-white">Kemudahan Rawatan Berkualiti Tinggi</h2>
            <p className="text-slate-300 text-base sm:text-lg">Direka khas untuk keselesaan dan keselamatan optimum pesakit buah pinggang</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#132238] border border-[#1F385C] rounded-2xl p-6 space-y-3 hover:border-teal-500/60 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">12 Mesin Dialisis Fresenius</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Dilengkapi mesin berprestasi tinggi Fresenius 4008S NG dan 5008S CorDiax yang menyokong terapi Online HDF untuk penapisan toksin uremik yang lebih bersih.
              </p>
            </div>

            <div className="bg-[#132238] border border-[#1F385C] rounded-2xl p-6 space-y-3 hover:border-teal-500/60 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
                <Droplet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Air RO Double Pass AAMI/ISO</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Sistem rawatan air Reverse Osmosis (RO) berganda mematuhi standard piawaian ketat antarabangsa AAMI/ISO 23500 bagi memastikan ketulenan air ultra-murni.
              </p>
            </div>

            <div className="bg-[#132238] border border-[#1F385C] rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-teal-500/60 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Navigation className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700 inline-block">Percuma</span>
              <h3 className="text-xl font-bold text-white">Pengangkutan Percuma</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Menyediakan van pengangkutan perubatan khas pergi-balik secara <strong>percuma</strong> sekitar kawasan <strong>Beranang</strong> dan <strong>Semenyih</strong> bagi pesakit kami.
              </p>
            </div>

            <div className="bg-[#132238] border border-[#1F385C] rounded-2xl p-6 space-y-3 hover:border-teal-500/60 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Panel Penaja Diiktiraf</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Menerima penajaan penuh PERKESO / SOCSO, JPA/KWAP, Lembaga Zakat Selangor (LZS), Baitulmal MAIWP, Yayasan Buah Pinggang Kebangsaan (NKF) & Insurans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Centre Details Section */}
      <section className="py-16 bg-[#0B132B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">
              MAKLUMAT PUSAT DIALISIS KAIZENBROS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Lokasi & Waktu Operasi</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Address and Contact Card */}
            <div className="bg-[#132238] border border-[#1F385C] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-start space-x-4">
                <div className="w-11 h-11 rounded-xl bg-[#0B132B] border border-[#1F385C] flex items-center justify-center text-cyan-400 flex-shrink-0 mt-1">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Alamat Pusat:</h4>
                  <p className="text-slate-200 text-base mt-1">{VERIFIED_CENTRE_INFO.address}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-11 h-11 rounded-xl bg-[#0B132B] border border-[#1F385C] flex items-center justify-center text-cyan-400 flex-shrink-0 mt-1">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Waktu Operasi Sesi:</h4>
                  <p className="text-slate-200 text-base mt-1">Isnin - Sabtu: 5:30 Pagi - 8:00 Malam (2 Syif Klinikal: 5:30 AM - 3:00 PM & 12:00 PM - 8:00 PM)</p>
                  <p className="text-slate-400 text-sm mt-0.5">Ahad: Tutup (Kecemasan On-Call Sahaja)</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-11 h-11 rounded-xl bg-[#0B132B] border border-[#1F385C] flex items-center justify-center text-rose-400 flex-shrink-0 mt-1">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Perhubungan & Kecemasan:</h4>
                  <p className="text-slate-200 text-base mt-1">Telefon Pejabat: {VERIFIED_CENTRE_INFO.phone_main}</p>
                  <p className="text-rose-400 font-bold text-base mt-1">Talian Kecemasan 24 Jam: {VERIFIED_CENTRE_INFO.hotline_24h}</p>
                </div>
              </div>
            </div>

            {/* Panels List Card */}
            <div className="bg-[#132238] border border-[#1F385C] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h4 className="font-bold text-white text-xl flex items-center">
                <ShieldCheck className="w-6 h-6 mr-2 text-teal-400" />
                Senarai Panel Penajaan
              </h4>
              <p className="text-sm text-slate-300">
                Pusat Dialisis KaizenBros bekerjasama rapat dengan agensi kerajaan dan institusi penaja untuk meringankan kos rawatan pesakit.
              </p>
              <div className="space-y-2.5 pt-2">
                {VERIFIED_CENTRE_INFO.panels.map((p, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-[#0B132B] p-3.5 rounded-xl border border-[#1F385C]">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
                    <span className="text-base font-semibold text-slate-100">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Google Map Section */}
      <section className="py-16 bg-[#0E1A30] border-t border-b border-[#1F385C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-cyan-400" />
                PETA LOKASI PUSAT DIALISIS KAIZENBROS
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Panduan Arah & Peta Google</h2>
              <p className="text-slate-300 text-base max-w-xl">
                Lokasi strategik di Semenyih, Selangor. Dilengkapi tempat letak kereta khas OKU dan laluan mesra kerusi roda.
              </p>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://maps.google.com/?q=2.92592,101.86000"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl shadow-md flex items-center space-x-2 transition-all min-h-[48px]"
              >
                <Compass className="w-5 h-5 text-cyan-200" />
                <span>Buka di Google Maps</span>
              </a>

              <a
                href="https://waze.com/ul?ll=2.92592,101.86000&navigate=yes"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 bg-teal-800 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center space-x-2 transition-all border border-teal-600 min-h-[48px]"
              >
                <Navigation className="w-5 h-5 text-teal-300" />
                <span>Pandu Menggunakan Waze</span>
              </a>
            </div>
          </div>

          {/* Map Frame Card */}
          <div className="bg-[#0B132B] border border-[#1F385C] rounded-3xl overflow-hidden shadow-2xl relative h-[380px] sm:h-[450px]">
            <iframe
              title="Peta Lokasi Pusat Dialisis KaizenBros Semenyih"
              src="https://maps.google.com/maps?q=2.92592,101.86000+(Pusat+Dialisis+Kaizenbros)&z=19&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full filter saturate-[0.85] contrast-[1.05]"
            />

            {/* Interactive "Kami Disini" Marker Pin & Red Point (Covers kanda.my area) */}
            <div className="absolute top-[48%] left-[58%] sm:left-[55%] transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center">
              {/* Badge "Kami Disini" */}
              <div className="bg-rose-600 text-white font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-2xl border-2 border-white flex items-center space-x-1.5 animate-bounce mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>📍 Kami Disini</span>
              </div>
              {/* Red Point Circle Marker */}
              <div className="w-8 h-8 rounded-full bg-rose-500/50 border-2 border-rose-500 flex items-center justify-center animate-pulse shadow-lg">
                <div className="w-4 h-4 rounded-full bg-rose-600 border-2 border-white" />
              </div>
            </div>
            
            {/* Map Overlay Location Card */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-[#0B132B]/95 backdrop-blur-md border border-[#1F385C] p-5 rounded-2xl shadow-2xl space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-extrabold text-sm">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500/30" />
                <span>KAIZENBROS DIALYSIS CENTRE</span>
              </div>
              <p className="text-sm text-slate-100 font-medium leading-relaxed">
                {VERIFIED_CENTRE_INFO.address}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-[#1F385C]">
                <span>Waktu Sesi: 5:30 AM - 8:00 PM</span>
                <span className="text-emerald-400 font-bold">Kawasan Parkir Mesra OKU</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#070D1F] border-t border-[#1F385C] py-10 text-center text-xs sm:text-sm text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 Pusat Dialisis KaizenBros (KaizenBros Dialysis Centre). No. Pendaftaran KKM: {VERIFIED_CENTRE_INFO.kkm_license}</p>
          <p>Hakcipta Terpelihara. Pusat Rawatan Hemodialisis Berdaftar KKM Semenyih, Selangor.</p>
        </div>
      </footer>

      {/* AUTHENTICATION MODALS */}
      <PatientLoginModal
        isOpen={showLoginModal === 'patient'}
        onClose={() => setShowLoginModal(null)}
        onLoginSuccess={(patientAcc) => {
          setShowLoginModal(null);
          onLoginAsPatient(patientAcc);
        }}
      />

      <StaffLoginModal
        isOpen={showLoginModal === 'staff'}
        onClose={() => setShowLoginModal(null)}
        onLoginSuccess={(staffAcc) => {
          setShowLoginModal(null);
          if (staffAcc.role === 'admin') {
            onLoginAsAdmin(staffAcc);
          } else {
            onLoginAsNurse(staffAcc);
          }
        }}
        onAuditLog={onAuditLog}
      />

      {/* WHATSAPP PATIENT INQUIRY FORM MODAL */}
      {showWhatsappQueryModal && (
        <div className="fixed inset-0 bg-[#050B18]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E1A30] border-2 border-teal-500 rounded-3xl max-w-md w-full p-6 sm:p-7 text-white space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1F385C] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center border border-teal-700">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Pertanyaan Pesakit Baru</h3>
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Hantar terus ke WhatsApp Admin</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWhatsappQueryModal(false)}
                className="w-10 h-10 rounded-full bg-[#132238] text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-200 leading-normal">
              Sila isi maklumat asas di bawah. Sistem akan menjana mesej WhatsApp berformat dan menghubungkan anda terus dengan pegawai pendaftaran kami.
            </p>

            <form onSubmit={handleSendWhatsappQuery} className="space-y-4">
              {/* Nama Pesakit */}
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider block mb-1.5">
                  Nama Penuh Pesakit:
                </label>
                <input
                  type="text"
                  required
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  placeholder="e.g. Mohd Amin bin Ahmad"
                  className="w-full min-h-[50px] bg-[#0A1324] border border-[#23436B] focus:border-teal-400 rounded-xl px-4 text-base font-medium text-white"
                />
              </div>

              {/* No Telefon */}
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider block mb-1.5">
                  No. Telefon Hubungan:
                </label>
                <input
                  type="text"
                  required
                  value={queryPhone}
                  onChange={(e) => setQueryPhone(e.target.value)}
                  placeholder="e.g. 012-3456789"
                  className="w-full min-h-[50px] bg-[#0A1324] border border-[#23436B] focus:border-teal-400 rounded-xl px-4 text-base font-medium text-white"
                />
              </div>

              {/* Umur Pesakit */}
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider block mb-1.5">
                  Umur (Tahun):
                </label>
                <input
                  type="number"
                  required
                  value={queryAge}
                  onChange={(e) => setQueryAge(e.target.value)}
                  placeholder="e.g. 62"
                  className="w-full min-h-[50px] bg-[#0A1324] border border-[#23436B] focus:border-teal-400 rounded-xl px-4 text-base font-medium text-white"
                />
              </div>

              {/* Catatan / Pertanyaan */}
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider block mb-1.5">
                  Pertanyaan Tambahan / Catatan Ringkas:
                </label>
                <textarea
                  rows={2}
                  value={queryNotes}
                  onChange={(e) => setQueryNotes(e.target.value)}
                  placeholder="e.g. Ingin tanya slot syif pagi atau khidmat van pengantar percuma."
                  className="w-full bg-[#0A1324] border border-[#23436B] focus:border-teal-400 rounded-xl p-3.5 text-sm font-medium text-white resize-none"
                />
              </div>

              {/* Action Button: Submit to WhatsApp */}
              <button
                type="submit"
                className="w-full min-h-[56px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:from-emerald-600 text-slate-950 font-black text-base sm:text-lg rounded-2xl flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-teal-950/40 border border-teal-400 transition-colors"
              >
                <MessageCircle className="w-6 h-6 fill-slate-950/10" />
                <span>Hantar Pertanyaan via WhatsApp</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
