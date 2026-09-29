import React from 'react';
import { NurseWalkthroughGuide } from './NurseWalkthroughGuide';
import { 
  CentreInfo, 
  StaffMember 
} from '../types';
import { 
  Building, 
  Award, 
  Droplet, 
  Stethoscope, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  HeartHandshake, 
  MessageCircle,
  ClipboardList,
  UserCheck,
  KeyRound,
  Sparkles,
  Briefcase
} from 'lucide-react';
import { buildWhatsAppLink } from '../utils/whatsappHelper';
import { MarketingRotationBanner } from './MarketingRotationBanner';

interface CentreProfileViewProps {
  centreInfo: CentreInfo;
  staff: StaffMember[];
  onNavigateToRegister: () => void;
  onOpenPreRegister?: () => void;
  onOpenJobApplication?: () => void;
  onNavigateToCareer?: () => void;
  onNavigateToTouristDialysis?: () => void;
  onOpenPatientPortal?: () => void;
  onOpenAdminLogin?: () => void;
  isAdminAuthenticated?: boolean;
}

export const CentreProfileView: React.FC<CentreProfileViewProps> = ({
  centreInfo,
  staff,
  onNavigateToRegister,
  onOpenPreRegister,
  onOpenJobApplication = () => {},
  onNavigateToCareer,
  onNavigateToTouristDialysis,
  onOpenPatientPortal,
  onOpenAdminLogin,
  isAdminAuthenticated = false
}) => {
  const doctors = staff.filter((s) => s.kategori === 'DOKTOR');
  const nurses = staff.filter((s) => s.kategori === 'JURURAWAT');

  return (
    <div className="space-y-8 animate-fadeIn text-[#E2E8F0]">
      {/* Walkthrough Guide for Admin Mode */}
      {isAdminAuthenticated && (
        <NurseWalkthroughGuide tabId="pendaftaran" isAdminAuthenticated={isAdminAuthenticated} />
      )}

      {/* Small 10-second Rotating Marketing Banner (Hidden in Admin Portal) */}
      {!isAdminAuthenticated && (
        <MarketingRotationBanner
          onOpenJobApplication={onOpenJobApplication}
          onOpenPreRegister={onOpenPreRegister || (() => {})}
          onNavigateToCareer={onNavigateToCareer}
          onNavigateToTouristDialysis={onNavigateToTouristDialysis}
          onOpenWhatsAppInquiry={() => {
            window.open(buildWhatsAppLink(centreInfo.whatsappRasmi, 'Salam Pusat Dialisis KaizenBros, saya ingin membuat pertanyaan mengenai pendaftaran pesakit & jawatan kosong.'), '_blank');
          }}
        />
      )}

      {/* Hero Banner with Centre Highlights */}
      <div className="bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#0A0C10] rounded-2xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-[#1F2937]">

        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-2 bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Pusat Hemodialisis Berdaftar KKM</span>
            </div>
            <div className="inline-flex items-center space-x-1 bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Permohonan Kemasukan Pesakit Baru Kini Dibuka</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-white">
            {centreInfo.nama}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            {centreInfo.slogan}. Kami menyediakan perkhidmatan hemodialisis berkualiti tinggi, dipantau terus oleh Pakar Perunding Nefrologi dan disokong oleh sistem automasi pesakit moden berasaskan WhatsApp.
          </p>

          <div className="pt-2 flex flex-wrap gap-3 items-center">
            {onOpenPreRegister && (
              <button
                onClick={onOpenPreRegister}
                id="btn-hero-pre-register"
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-emerald-950/80 hover:scale-[1.02] flex items-center space-x-2 cursor-pointer border border-emerald-300/40"
              >
                <ClipboardList className="w-5 h-5 text-slate-950 shrink-0" />
                <span>Pra-Pendaftaran Pesakit Baru (Online)</span>
              </button>
            )}

            {onOpenPatientPortal && (
              <button
                onClick={onOpenPatientPortal}
                id="btn-hero-patient-portal"
                className="px-5 py-3.5 bg-[#1F2937] hover:bg-[#374151] text-cyan-300 border border-cyan-800/60 font-bold rounded-xl text-sm transition-all flex items-center space-x-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Portal Pesakit</span>
              </button>
            )}

            <a
              href={buildWhatsAppLink(centreInfo.whatsappRasmi, 'Salam Pusat Dialisis KaizenBros, saya ingin bertanyakan maklumat pendaftaran pesakit hemodialisis.')}
              target="_blank"
              rel="noopener noreferrer"
              id="btn-hero-whatsapp-inquiry"
              className="px-5 py-3.5 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 border border-[#374151] font-semibold rounded-xl text-sm transition-all flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Pusat</span>
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#1F2937] text-slate-300 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px] font-mono">Kapasiti Mesin</span>
              <span className="text-lg font-bold text-white font-mono">{centreInfo.kapasitiMesin} Stesen Aktif</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-mono">Sistem Air Rawatan</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">Double Pass RO</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-mono">Lawatan Pakar</span>
              <span className="text-lg font-bold text-teal-300 font-mono">Nefrologi Rutin</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-mono">Sistem Makluman</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">Auto-WhatsApp 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Facilities & Operational Standards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111827] rounded-xl p-6 border border-[#1F2937] shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">Teknologi Hemodialisis Terkini</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Dilengkapi {centreInfo.kapasitiMesin} unit mesin <strong>{centreInfo.jenamaMesin}</strong> dengan keupayaan Online Hemodiafiltration (HDF) dan dialyzer biokompatibel untuk kadar pembersihan toksin uremik optimum.
          </p>
          <div className="text-xs text-emerald-400 font-semibold pt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Kualiti Air Standard ISO 23500 & AAMI</span>
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl p-6 border border-[#1F2937] shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-teal-950/60 border border-teal-800/40 text-teal-400 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">Panel Penaja & Subsidi Diiktiraf</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Kami merupakan panel sah <strong>PERKESO / SOCSO</strong>, <strong>JPA / KWAP</strong>, <strong>Lembaga Zakat Selangor</strong>, dan <strong>Baitulmal MAIWP</strong> untuk kemudahan rawatan tanpa bebanan kos tunai.
          </p>
          <div className="text-xs text-teal-400 font-semibold pt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Bantuan Permohonan & Tuntutan Subsidi</span>
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl p-6 border border-[#1F2937] shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">Pemantauan Klinikal Komprehensif</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Ujian darah berjadual (Hb, Kalsium, Fosfat, Kalium, Kt/V), penilaian fistula berkala, serta rondaan berjadual oleh Pakar Perunding Nefrologi dan Doktor Perubatan berdaftar MMC.
          </p>
          <div className="text-xs text-cyan-400 font-semibold pt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Rekod Kesihatan Elektronik Selamat</span>
          </div>
        </div>
      </div>

      {/* Medical Doctors Team */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
              <span>Pasukan Doktor Perubatan & Pakar Nefrologi</span>
            </h2>
            <p className="text-sm text-slate-400">
              Doktor pakar bertauliah yang bertanggungjawab ke atas kualiti klinikal dan keselamatan pesakit
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doc) => (
            <div 
              key={doc.id} 
              id={`doctor-card-${doc.id}`}
              className="bg-[#111827] rounded-xl p-6 border border-[#1F2937] shadow-xl hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row gap-5"
            >
              <img
                src={(doc.avatarUrl && doc.avatarUrl.trim() !== '') ? doc.avatarUrl : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'}
                alt={doc.nama}
                className="w-24 h-28 sm:w-28 sm:h-32 object-cover rounded-xl bg-[#0F172A] border border-[#1F2937] shrink-0"
              />
              <div className="space-y-2 flex-1">
                <div className="inline-block px-2.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[11px] font-bold rounded-md">
                  {doc.jawatan}
                </div>
                <h3 className="text-lg font-bold text-white">{doc.nama}</h3>
                <p className="text-xs text-slate-300 leading-snug">{doc.kelayakan}</p>
                <div className="text-xs text-slate-400 font-mono">
                  No. Pendaftaran MMC: <span className="font-semibold text-emerald-400">{doc.noPendaftaran}</span>
                </div>
                <p className="text-xs text-slate-400 pt-1 italic">{doc.tentang}</p>
                <div className="pt-2 flex items-center justify-between border-t border-[#1F2937] text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{doc.jadualBertugas}</span>
                  </span>
                  <span className="font-semibold text-emerald-400 font-mono">{doc.pengalamanTahun}+ Tahun Pengalaman</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nursing Team */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Pasukan Jururawat Renal Terlatih (Renal Nursing Team)</span>
          </h2>
          <p className="text-sm text-slate-400">
            Jururawat berdaftar Lembaga Jururawat Malaysia (LJM) dengan kepakaran penjagaan fistula AVF, cannulation, dan pengurusan mesin dialisis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nurses.map((nurse) => (
            <div 
              key={nurse.id} 
              id={`nurse-card-${nurse.id}`}
              className="bg-[#111827] rounded-xl p-5 border border-[#1F2937] shadow-xl flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-start space-x-4">
                <img
                  src={(nurse.avatarUrl && nurse.avatarUrl.trim() !== '') ? nurse.avatarUrl : 'https://images.unsplash.com/photo-1594824813689-f54249a15a81?w=300&auto=format&fit=crop&q=80'}
                  alt={nurse.nama}
                  className="w-16 h-16 object-cover rounded-xl bg-[#0F172A] border border-[#1F2937] shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    {nurse.jawatan.includes('Sister') ? 'Ketua Jururawat' : 'Jururawat Renal'}
                  </span>
                  <h3 className="text-sm font-bold text-white leading-snug">{nurse.nama}</h3>
                  <div className="text-[11px] text-slate-400 font-mono">LJM: {nurse.noPendaftaran}</div>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{nurse.tentang}</p>

              <div className="pt-2 border-t border-[#1F2937] text-xs text-slate-400 flex items-center justify-between">
                <span>{nurse.pengalamanTahun} tahun pengalaman</span>
                <span className="text-emerald-400 font-semibold">{nurse.jadualBertugas}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Centre Contact & Operational Info */}
      <div className="bg-[#111827] rounded-2xl p-6 sm:p-8 border border-[#1F2937] shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Building className="w-5 h-5 text-emerald-400" />
              <span>Maklumat Lokasi & Hubungi KaizenBros</span>
            </h2>
            <p className="text-sm text-slate-400">
              Pusat kami terletak strategik di Bandar Rinching, Semenyih dengan kemudahan parkir khas pesakit dialisis dan laluan kerusi roda mesra OKU.
            </p>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{centreInfo.alamat}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Telefon Kaunter: <strong className="text-white">{centreInfo.telefonUtama}</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Emel Rasmi: <strong className="text-white">{centreInfo.emel}</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Talian WhatsApp: <strong className="text-emerald-400 font-mono">+{centreInfo.whatsappRasmi}</strong></span>
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-[#0F172A] p-5 rounded-xl border border-[#1F2937]">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Waktu Sesi Rawatan Harian</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#111827] rounded-lg border border-[#1F2937] flex justify-between items-center">
                <div>
                  <span className="font-bold text-emerald-400 block">Sesi 1 (Pagi)</span>
                  <span className="text-slate-400">Sesuai untuk pesakit warga emas & sarapan pagi</span>
                </div>
                <span className="font-bold text-emerald-300 text-sm font-mono">06:00 - 10:00</span>
              </div>

              <div className="p-3 bg-[#111827] rounded-lg border border-[#1F2937] flex justify-between items-center">
                <div>
                  <span className="font-bold text-teal-400 block">Sesi 2 (Tengahari)</span>
                  <span className="text-slate-400">Sesuai untuk pesakit dengan pengangkutan keluarga</span>
                </div>
                <span className="font-bold text-teal-300 text-sm font-mono">10:00 - 14:00</span>
              </div>

              <div className="p-3 bg-[#111827] rounded-lg border border-[#1F2937] flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-300 block">Sesi 3 (Petang / Malam)</span>
                  <span className="text-slate-400">Sesuai untuk pesakit yang masih bekerja</span>
                </div>
                <span className="font-bold text-slate-200 text-sm font-mono">14:00 - 18:00</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 italic font-mono">
              * Hari rawatan dibahagikan kepada giliran Isnin-Rabu-Jumaat (MWF) dan Selasa-Khamis-Sabtu (TTS).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
