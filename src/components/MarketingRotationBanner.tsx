import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Truck, 
  Award, 
  Stethoscope, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  CheckCircle2, 
  Sparkles,
  Heart,
  ShieldCheck,
  UserPlus,
  Clock,
  Coffee,
  Wifi,
  Tv,
  Palmtree,
  Compass,
  MapPin
} from 'lucide-react';

interface MarketingRotationBannerProps {
  onOpenJobApplication: () => void;
  onOpenPreRegister: () => void;
  onOpenWhatsAppInquiry?: () => void;
  onNavigateToCareer?: () => void;
  onNavigateToTouristDialysis?: () => void;
}

export const MarketingRotationBanner: React.FC<MarketingRotationBannerProps> = ({
  onOpenJobApplication,
  onOpenPreRegister,
  onOpenWhatsAppInquiry,
  onNavigateToCareer,
  onNavigateToTouristDialysis
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const banners = [
    {
      id: 'banner-tourist-dialysis',
      category: 'DIALISIS PELANCONG & PESAKIT LUAR',
      badgeColor: 'bg-gradient-to-r from-teal-950 to-emerald-950 text-teal-300 border-teal-500/60',
      icon: Palmtree,
      iconBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      title: 'Menerima Pesakit Luar & Rawatan Dialisis Pelancong',
      highlightText: 'Anda kini boleh bercuti di mana sahaja Sekitar Kajang & Semenyih — Kami sedia Membantu Ketika Anda Bercuti',
      description: 'Ketahui panduan rawatan, senarai semak dokumen, kemudahan klinik di Kajang & Semenyih serta info pesakit luar sebelum mengisi borang permohonan slot rawatan anda.',
      features: [
        'Semak Panduan & Maklumat Rawatan Dahulu Sebelum Isi Borang',
        'Mesin Fresenius & Air Double-Pass RO Gred KKM',
        'Kerusi Recliner VIP, Smart TV, WiFi Laju & Snek Percuma'
      ],
      actionLabel: 'Maklumat Rawatan Dialisis Dahulu',
      actionHandler: onNavigateToTouristDialysis || onOpenPreRegister,
      accentGlow: 'from-teal-500/30 via-emerald-500/15 to-transparent',
      borderColor: 'border-teal-500/60'
    },
    {
      id: 'banner-jobs',
      category: 'REKRUTMEN & KERJAYA',
      badgeColor: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/50',
      icon: Briefcase,
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      title: 'Jawatan Kosong Jururawat Dialisis & Staf Perubatan',
      highlightText: 'Sertai Pasukan Renal KaizenBros',
      description: 'Kami mencari Jururawat Terlatih (SRN / Post-Basic Renal), Jururawat Masyarakat, Penolong Pegawai Perubatan (MA), dan Staf Pentadbiran Klinik.',
      features: [
        'Gaji kompetitif + Elaun Syif & Perubatan',
        'Latihan kepakaran renal berterusan KKM',
        'Suasana kerja kondusif & fasiliti moden'
      ],
      actionLabel: 'Lihat Skop Kerja & Mohon Jawatan',
      actionHandler: onNavigateToCareer || onOpenJobApplication,
      accentGlow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/40'
    },
    {
      id: 'banner-promo-transport',
      category: 'PROMOSI PESAKIT BARU',
      badgeColor: 'bg-cyan-950/90 text-cyan-300 border-cyan-700/50',
      icon: Truck,
      iconBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      title: 'Rawatan Dialisis Moden + Pengangkutan PERCUMA',
      highlightText: 'Selesa Pergi & Balik Rumah Pesakit',
      description: 'Pusat Dialisis KaizenBros menyediakan kenderaan khas perkhidmatan pengangkutan percuma dari kediaman anda, disokong tempat rehat & menunggu yang selesa.',
      features: [
        'Kenderaan selesa berhawa dingin (Pergi & Balik)',
        'Ruang menunggu eksklusif: Kerusi Recliner, TV & Wifi',
        'Lounge minuman berkhasiat mesra pesakit'
      ],
      actionLabel: 'Pohon Slot & Transport Percuma',
      actionHandler: onOpenPreRegister,
      accentGlow: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      borderColor: 'border-cyan-500/40'
    },
    {
      id: 'banner-sponsorship',
      category: 'PENAJAAN 100% DIALISIS',
      badgeColor: 'bg-amber-950/90 text-amber-300 border-amber-700/50',
      icon: Award,
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      title: 'Subsidi Rawatan PERKESO, JPA, Zakat & Insurans',
      highlightText: 'Pengurusan Surat Jaminan (GL) Percuma',
      description: 'Nikmati rawatan hemodialisis mesin Fresenius & sistem Double Pass RO tanpa bebanan kewangan. Pihak klinik menguruskan permohonan penaja anda 100%.',
      features: [
        'Panel Rasmi PERKESO / SOCSO Skim Keilatan',
        'JPA / KWAP Pesara Kerajaan & Zakat Selangor / MAIWP',
        'Sistem bil automatik tanpa sebarang cas tersembunyi'
      ],
      actionLabel: 'Semak Kelayakan Penaja Percuma',
      actionHandler: onOpenPreRegister,
      accentGlow: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-500/40'
    },
    {
      id: 'banner-doctor-rounds',
      category: 'MUTU RAWATAN KLINIKAL',
      badgeColor: 'bg-teal-950/90 text-teal-300 border-teal-700/50',
      icon: Stethoscope,
      iconBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      title: 'Pemantauan Pakar Nefrologi Bulanan & Rekod Digital',
      highlightText: '3 Sesi Rawatan Harian (Pagi, Tengahari, Petang)',
      description: 'Pesakit dipantau secara berkala oleh Pakar Perunding Nefrologi dengan ujian darah rutin 3 bulan & notifikasi WhatsApp auto untuk keluarga.',
      features: [
        'Lawatan Pakar Nefrologi & Konsultasi Perpustakaan Rekod',
        'Dialyzer biokompatibel & teknik cannulation tanpa rasa sakit',
        'Slot Sesi Pagi & Petang masih mempunyai kekosongan'
      ],
      actionLabel: 'Tempah Temujanji Saringan Klinik',
      actionHandler: onOpenPreRegister,
      accentGlow: 'from-teal-500/20 via-emerald-500/10 to-transparent',
      borderColor: 'border-teal-500/40'
    }
  ];

  const totalSlides = banners.length;

  // Slide timer (15 seconds per slide = 15000ms)
  useEffect(() => {
    if (isPaused) return;

    const intervalStep = 100; // update progress every 100ms
    const totalDuration = 15000;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((slide) => (slide + 1) % totalSlides);
          return 0;
        }
        return prev + (intervalStep / totalDuration) * 100;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [isPaused, totalSlides, currentSlide]);

  const handleGoToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
  };

  const activeBanner = banners[currentSlide];
  const IconComp = activeBanner.icon;

  return (
    <div 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative overflow-hidden rounded-2xl bg-[#0F172A] border ${activeBanner.borderColor} shadow-2xl transition-all duration-500 group my-4`}
    >
      {/* Dynamic Background Accent Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${activeBanner.accentGlow} pointer-events-none transition-all duration-700`} />

      {/* Top 10-Second Animated Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/80 z-20">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Banner Content Container */}
      <div className="relative z-10 p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Icon + Category + Text */}
          <div className="space-y-3.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border ${activeBanner.badgeColor} flex items-center gap-1.5`}>
                <Sparkles className="w-3 h-3" />
                <span>{activeBanner.category}</span>
              </span>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className={`p-3 rounded-xl border ${activeBanner.iconBg} shrink-0 mt-1 shadow-lg`}>
                <IconComp className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-white font-serif leading-tight">
                  {activeBanner.title}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-emerald-400">
                  {activeBanner.highlightText}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                  {activeBanner.description}
                </p>
              </div>
            </div>

            {/* Bullets feature list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#1E293B] text-[11px] text-slate-300">
              {activeBanner.features.map((feat, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Action Button & Quick Links */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-center gap-3 shrink-0 pt-2 lg:pt-0">
            <button
              onClick={activeBanner.actionHandler}
              id={`btn-banner-action-${activeBanner.id}`}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/80 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2 cursor-pointer border border-emerald-300/40"
            >
              <span>{activeBanner.actionLabel}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {/* Extra quick trigger for Jawatan Kosong vs Transport Promo vs Dialisis Pelancong */}
            <div className="flex flex-wrap items-center gap-2 justify-center">
              {onNavigateToTouristDialysis && (
                <>
                  <button
                    onClick={onNavigateToTouristDialysis}
                    className="text-[11px] text-teal-300 hover:text-teal-200 underline font-bold flex items-center gap-1"
                  >
                    <span>🌴 Dialisis Pelancong</span>
                  </button>
                  <span className="text-slate-600">•</span>
                </>
              )}
              <button
                onClick={onOpenJobApplication}
                className="text-[11px] text-slate-300 hover:text-emerald-300 underline font-medium"
              >
                Jawatan Kosong
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={onOpenPreRegister}
                className="text-[11px] text-slate-300 hover:text-cyan-300 underline font-medium"
              >
                Transport Percuma
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Bar: Prev/Next, Dots, Play/Pause Indicator */}
      <div className="bg-[#0B1120] px-5 py-2.5 border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:bg-[#1E293B] rounded text-slate-300 hover:text-white transition"
            title={isPaused ? 'Sambung auto-play' : 'Jeda (Pause) slider'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[10px] font-mono">
            {isPaused ? 'SLAIDER DIJEDA' : `BANNER ${currentSlide + 1} DARIPADA ${totalSlides}`}
          </span>
        </div>

        {/* Slide Dots Indicator */}
        <div className="flex items-center space-x-1.5">
          {banners.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => handleGoToSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Slaid ${idx + 1}: ${b.category}`}
            />
          ))}
        </div>

        {/* Prev / Next Arrows */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrev}
            className="p-1 hover:bg-[#1E293B] rounded-lg text-slate-300 hover:text-white transition"
            title="Slaid Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 hover:bg-[#1E293B] rounded-lg text-slate-300 hover:text-white transition"
            title="Slaid Seterusnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
