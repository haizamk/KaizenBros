import React, { useState } from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  Building2, 
  GraduationCap, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Award, 
  Heart, 
  ChevronRight, 
  Send,
  HelpCircle,
  PhoneCall,
  Mail,
  Home,
  BookOpen,
  Stethoscope,
  Filter,
  Search
} from 'lucide-react';
import { JobVacancy } from '../types';

interface PublicCareerVacanciesViewProps {
  jobVacancies: JobVacancy[];
  onOpenJobApplicationModal: (selectedVacancy?: JobVacancy) => void;
  onNavigateToHome?: () => void;
}

export const PublicCareerVacanciesView: React.FC<PublicCareerVacanciesViewProps> = ({
  jobVacancies,
  onOpenJobApplicationModal,
  onNavigateToHome
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedVacancyId, setExpandedVacancyId] = useState<string | null>(null);

  // Filter open vacancies
  const openVacancies = jobVacancies.filter(v => v.status === 'BUKA');

  const filteredVacancies = openVacancies.filter(v => {
    const matchesCategory = selectedCategory === 'SEMUA' || v.kategori === selectedCategory;
    const matchesSearch = v.tajukJawatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.kelayakanSingkat.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Comprehensive fallback detailed job scopes dictionary based on role title
  const getDetailedJobScope = (vacancy: JobVacancy): {
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
  } => {
    const titleLower = vacancy.tajukJawatan.toLowerCase();

    if (titleLower.includes('post-basic') || titleLower.includes('terlatih dialisis')) {
      return {
        responsibilities: [
          'Mengendalikan dan mengkalibrasi mesin hemodialisis Fresenius 5008S / 4008S serta menyemak kualiti air sistem Double Pass Reverse Osmosis (RO) sebelum sesi bermula.',
          'Melaksanakan prosedur AV Fistula (AVF) / AV Graft (AVG) cannulation berteknik aseptik steril tahap tinggi mengikut SOP Lembaga Jururawat Malaysia (LJM) & KKM.',
          'Memantau kadar Ultrafiltration Goal (UF Goal), Tekanan Darah (BP), Blood Flow Rate (BFR), Dialysate Flow Rate (DFR), dan Tanda Vital pesakit setiap 30 minit sepanjang 4 jam sesi.',
          'Mengenal pasti dan menguruskan komplikasi akut semasa dialisis seperti hypotension, kejang otot (cramps), dysequilibrium syndrome, atau tindak balas pyrogen dengan pantas.',
          'Pentadbiran ubat-ubatan preskripsi Pakar Nefrologi termasuk Erythropoietin (Eprex / Aranesp), Iron Sucrose, Calcitriol, dan dos Heparin / Clexane.',
          'Menyediakan dokumentasi laporan klinikal, Carta Dialisis Harian rasmi, dan mengemas kini Rekod Perubatan Elektronik (EMR) pesakit.'
        ],
        requirements: [
          'Diploma / Ijazah Sarjana Muda Kejururawatan daripada institusi diiktiraf MQA.',
          'Sijil Pos Basik Renal / Hemodialisis (Post-Basic Renal Nursing) yang diiktiraf KKM.',
          'Berdaftar dengan Lembaga Jururawat Malaysia (LJM) & mempunyai Perakuan Pengamalan Tahunan (APC) yang sah bagi tahun semasa.',
          'Sijil Basic Life Support (BLS) / ACLS yang masih berkuat kuasa.',
          'Pengalaman sekurang-kurangnya 1-3 tahun di pusat hemodialisis atau wad nephrology.'
        ],
        benefits: [
          'Gaji Pokok Khas (RM3,200 - RM4,800) mengikut pengalaman & kekananan.',
          'Elaun Syif Pagi/Petang/Malam + Elaun Khas Renal Dialisis.',
          'Caruman KWSP (13%), PERKESO & SIP.',
          'Insurans Kesihatan Keluar/Masuk Wad (Medical Card Staf).',
          'Tajaan kursus pendedahan CPE/CPD KKM dan persidangan Nephrology Kebangsaan.'
        ]
      };
    }

    if (titleLower.includes('masyarakat') || titleLower.includes('jururawat am') || titleLower.includes('srn')) {
      return {
        responsibilities: [
          'Membantu Jururawat Renal dalam persediaan stesen dialisis, pencucian/sanitasi kerusi reclining, dan pemasangan bloodlines & dialyzer.',
          'Mengambil dan merekodkan Tanda Vital (Tekanan Darah, Nadi, Suhu, Berat Badan Pra & Pasca Dialisis) pesakit dengan tepat.',
          'Memastikan kebersihan dan kesterilan ruang rawatan sebelum, semasa, dan selepas setiap syif rawatan.',
          'Membantu pesakit warga emas / uzur bergerak dari kenderaan ke stesen rawatan dan menyediakan refreshments berkhasiat mesra renal.',
          'Membantu pengurusan inventori perubatan dialisis, stok cecair dialisat, dan peralatan pelindungan diri (PPE).'
        ],
        requirements: [
          'Diploma Kejururawatan / Sijil Jururawat Masyarakat daripada institusi diiktiraf KKM.',
          'Berdaftar dengan Lembaga Jururawat Malaysia (LJM) & mempunyai APC tahun semasa yang sah.',
          'Berminat dan berdisiplin tinggi untuk dibimbing dalam kepakaran dialisis renal.',
          'Kemahiran komunikasi yang mesra dan penyayang terhadap pesakit kronik buah pinggang.'
        ],
        benefits: [
          'Gaji Pokok (RM2,400 - RM3,400) + Elaun Kehadiran & Elaun Syif.',
          'Program Latihan Dalam Perkhidmatan (In-House Dialysis Training) berserta laluan tajaan Pos Basik Renal KKM.',
          'Caruman KWSP, PERKESO, SIP & Insurans Klinik.',
          'Pakaian seragam (Uniform) disediakan percuma.'
        ]
      };
    }

    if (titleLower.includes('pegawai perubatan') || titleLower.includes('pembantu perubatan') || titleLower.includes('ma')) {
      return {
        responsibilities: [
          'Membuat penilaian vascular access pesakit termasuk pemeriksaan alir darah AVF, bunyi bruit/thrill, dan penjagaan dressing Permacath/Catheter steril.',
          'Mengendalikan penukaran dressing exit-site catheter menggunakan teknik pensterilan penuh.',
          'Memberikan respons kecemasan klinikal (CPR & Bantuan Pernafasan) sekiranya berlaku kes kritikal semasa sesi rawatan.',
          'Membantu Pakar Perunding Nefrologi dan Doktor Resident semasa sesi pemeriksaan bulanan (Doctor’s Round).',
          'Menyemak kelulusan sampel ujian darah bulanan dan mengesahkan keputusan makmal sebelum diserahkan kepada pakar.'
        ],
        requirements: [
          'Diploma Pembantu Perubatan daripada institusi pengajian tinggi tempatan.',
          'Berdaftar dengan Lembaga Pembantu Perubatan Malaysia (LPP) & mempunyai Lesen Perakuan Amalan Tahunan sah.',
          'Sijil BLS / ACLS yang sah.',
          'Pengalaman sekurang-kurangnya 1-2 tahun dalam perkhidmatan klinikal / kecemasan.'
        ],
        benefits: [
          'Gaji Pokok (RM2,800 - RM4,000) + Elaun Khas PPP Dialisis.',
          'Perlindungan Insurans Liabiliti Perubatan & Kad Perubatan Staf.',
          'Caruman KWSP (13%), PERKESO & SIP.',
          'Elaun Kerja Lebih Masa (OT) & Bonus Prestasi Tahunan.'
        ]
      };
    }

    // Default for Admin / Customer Service / Other
    return {
      responsibilities: [
        'Menguruskan urusan surat jaminan (Guarantee Letter - GL) & tuntutan subsidi penaja: PERKESO, JPA, Zakat Selangor, MAIWP, & Insurans.',
        'Mengendalikan kaunter pendaftaran pesakit baharu, mengumpul dokumen peribadi/surat rujukan doktor, dan pendaftaran sistem pusat.',
        'Menguruskan resit bayaran rasmi (Format A5/A4 KKM) dan penyata akaun rawatan pesakit.',
        'Mengendalikan sistem notifikasi peringatan WhatsApp automatik untuk jadual rawatan, ujian darah, dan lawatan pakar.',
        'Menyediakan perkhidmatan pelanggan yang mesra, menjawab pertanyaan waris pesakit, dan menyelaraskan jadual kenderaan pengangkutan percuma.'
      ],
      requirements: [
        'Diploma / SPM dengan pengalaman sekurang-kurangnya 1-2 tahun dalam pentadbiran klinik, hospital, atau pusat dialisis.',
        'Kemahiran berkomunikasi dengan baik dalam Bahasa Melayu & Bahasa Inggeris.',
        'Mahir menggunakan komputer, Microsoft Office / Google Workspace, dan sistem pangkalan data.',
        'Sikap amanah, teliti, berhemah tinggi, dan mesra pesakit.'
      ],
      benefits: [
        'Gaji Pokok (RM2,000 - RM2,800) + Bonus Prestasi.',
        'Caruman KWSP, PERKESO & SIP.',
        'Cuti Tahunan, Cuti Sakit, & Kemudahan Perubatan Rawatan Pesakit Luar.',
        'Waktu kerja pejabat/syif teratur (Ahad Cuti).'
      ]
    };
  };

  return (
    <div className="space-y-8 animate-fadeIn text-[#E2E8F0] pb-12">
      {/* Navigation Breadcrumb / Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] p-4 rounded-2xl border border-[#1F2937]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-serif">Peluang Kerjaya & Jawatan Kosong</h1>
            <p className="text-xs text-slate-400">Pusat Dialisis KaizenBros • Semenyih, Selangor</p>
          </div>
        </div>

        {onNavigateToHome && (
          <button
            onClick={onNavigateToHome}
            className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-200 text-xs font-semibold rounded-xl border border-[#374151] transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kembali ke Laman Utama</span>
          </button>
        )}
      </div>

      {/* Hero Banner Rekrutmen */}
      <div className="bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#0A0C10] rounded-2xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-[#1F2937]">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pengambilan Staf Kesihatan 2026</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Berlesen KKM</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold font-serif text-white leading-tight">
            Bina Kerjaya Kepakaran Renal Bersama <span className="text-[#10B981]">KaizenBros Dialysis</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            Sertai pasukan perubatan berkemahiran tinggi kami di Pusat Dialisis KaizenBros. Kami menyediakan persekitaran kerja yang kondusif, peralatan mesin Fresenius moden, tajaan latihan kepakaran berkelanjutan (CPE/CPD KKM), dan pakej ganjaran yang kompetitif.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenJobApplicationModal()}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-xl shadow-emerald-950/80 hover:scale-[1.02] flex items-center space-x-2 cursor-pointer border border-emerald-300/40"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>Hantar Permohonan Kerja Online</span>
            </button>

            <a
              href="tel:0387270791"
              className="px-4 py-3 bg-[#1F2937] hover:bg-[#374151] text-slate-200 font-semibold rounded-xl text-xs sm:text-sm border border-[#374151] transition flex items-center space-x-2"
            >
              <PhoneCall className="w-4 h-4 text-cyan-400" />
              <span>Pertanyaan HR: 03-87270791</span>
            </a>
          </div>

          {/* Highlights Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#1F2937] text-xs">
            <div className="bg-[#0F172A]/80 p-3 rounded-xl border border-[#1F2937]">
              <span className="text-slate-400 block text-[10px] font-mono uppercase">Kekosongan Aktif</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{openVacancies.length} Jawatan Dibuka</span>
            </div>
            <div className="bg-[#0F172A]/80 p-3 rounded-xl border border-[#1F2937]">
              <span className="text-slate-400 block text-[10px] font-mono uppercase">Latihan Terus</span>
              <span className="text-base font-bold text-cyan-400 font-mono">Pos Basik KKM</span>
            </div>
            <div className="bg-[#0F172A]/80 p-3 rounded-xl border border-[#1F2937]">
              <span className="text-slate-400 block text-[10px] font-mono uppercase">Ganjaran Staf</span>
              <span className="text-base font-bold text-amber-400 font-mono">Gaji + Elaun Syif</span>
            </div>
            <div className="bg-[#0F172A]/80 p-3 rounded-xl border border-[#1F2937]">
              <span className="text-slate-400 block text-[10px] font-mono uppercase">Lokasi Klinik</span>
              <span className="text-base font-bold text-white font-mono">Semenyih, Selangor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits & Perks Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white font-serif uppercase tracking-wider">
            Mengapa Menyertai Pasukan Kesihatan KaizenBros?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Gaji & Elaun Syif Menarik</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pakej gaji pokok kompetitif berdasar kelayakan LJM/LPP, elaun syif pagi/petang, elaun overtime (OT), dan bayaran bonus tahunan.
            </p>
          </div>

          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] space-y-2 relative overflow-hidden group hover:border-cyan-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-2">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Latihan & Sijil Pos Basik KKM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Program bimbingan berterusan daripada Jururawat Kanan (Sister/Matron) dan pakar nefrologi berserta tajaan melanjutkan Sijil Pos Basik Renal KKM.
            </p>
          </div>

          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Perlindungan Kesihatan & Asrama</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Caruman KWSP (13%), PERKESO, Kad Perubatan Staf, rawatan klinik percuma, serta kemudahan asrama selesa untuk staf dari luar daerah.
            </p>
          </div>
        </div>
      </div>

      {/* Job Filter and Search Controls */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111827] p-4 rounded-2xl border border-[#1F2937]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kategori:</span>
            </span>

            {[
              { id: 'SEMUA', label: 'Semua Jawatan' },
              { id: 'JURURAWAT', label: 'Kejururawatan' },
              { id: 'PEMBANTU_PERUBATAN', label: 'Pembantu Perubatan' },
              { id: 'PENTADBIR', label: 'Pentadbiran & Kaunter' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs transition cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white font-black shadow-md border-emerald-500'
                    : 'bg-[#1F2937] text-slate-200 hover:bg-[#374151] border-[#374151] font-bold'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari jawatan / skop kerja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#374151] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Vacancies List */}
        {filteredVacancies.length === 0 ? (
          <div className="p-12 text-center bg-[#111827] rounded-2xl border border-[#1F2937] space-y-3">
            <Briefcase className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">Tiada Jawatan Kosong Dijumpai</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Maaf, tiada kekosongan jawatan mengikut kriteria carian anda pada masa ini. Walau bagaimanapun, anda boleh menghantar borang permohonan umum untuk simpanan data HR kami.
            </p>
            <button
              onClick={() => onOpenJobApplicationModal()}
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition cursor-pointer"
            >
              Hantar Permohonan Umum (Permohonan Terbuka)
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredVacancies.map((vacancy) => {
              const scope = getDetailedJobScope(vacancy);
              const isExpanded = expandedVacancyId === vacancy.id || filteredVacancies.length <= 2;

              return (
                <div 
                  key={vacancy.id} 
                  id={`vacancy-card-${vacancy.id}`}
                  className="bg-[#111827] rounded-2xl border border-[#1F2937] hover:border-emerald-500/50 transition-all shadow-xl overflow-hidden"
                >
                  {/* Card Header Header Bar */}
                  <div className="p-6 border-b border-[#1F2937] bg-gradient-to-r from-[#0F172A] to-[#111827] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50 uppercase tracking-wider">
                          {vacancy.kategori.replace('_', ' ')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                          {vacancy.kekosongan} KEKOSONGAN AKTIF
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-slate-950">
                          STATUS: {vacancy.status}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white font-serif">
                        {vacancy.tajukJawatan}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{vacancy.gajiAtauFaedah}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{vacancy.lokasi}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Syif Berjadual (Ahad Cuti)</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => onOpenJobApplicationModal(vacancy)}
                        id={`btn-apply-job-${vacancy.id}`}
                        className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-950/80 hover:scale-[1.02] flex items-center space-x-2 cursor-pointer border border-emerald-300/40"
                      >
                        <Send className="w-4 h-4 text-slate-950" />
                        <span>Pohon Jawatan Ini</span>
                      </button>

                      <button
                        onClick={() => setExpandedVacancyId(isExpanded ? null : vacancy.id)}
                        className="px-3 py-3 bg-[#1F2937] hover:bg-[#374151] text-slate-300 text-xs font-semibold rounded-xl border border-[#374151] transition cursor-pointer lg:hidden"
                      >
                        {isExpanded ? 'Tutup Skop' : 'Lihat Skop Kerja'}
                      </button>
                    </div>
                  </div>

                  {/* Card Body - Detailed Scope, Requirements, and Perks */}
                  {isExpanded && (
                    <div className="p-6 space-y-6 bg-[#111827]">
                      {/* Short Overview */}
                      <div className="bg-[#0F172A] p-4 rounded-xl border border-[#1F2937] text-xs text-slate-300 leading-relaxed">
                        <strong className="text-white block mb-1 font-mono uppercase text-[11px] tracking-wider">Ringkasan Tugas:</strong>
                        {vacancy.keterangan}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 1. Skop Kerja & Tanggungjawab Utama */}
                        <div className="lg:col-span-2 space-y-3">
                          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
                            <BookOpen className="w-4 h-4" />
                            <span>Terperinci Skop Kerja & Tanggungjawab Utama:</span>
                          </div>

                          <div className="space-y-2 bg-[#0F172A]/60 p-4 rounded-xl border border-[#1F2937]">
                            {scope.responsibilities.map((resp, idx) => (
                              <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-200">
                                <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                                  {idx + 1}
                                </div>
                                <p className="leading-relaxed">{resp}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Syarat Kelayakan & Manfaat */}
                        <div className="space-y-4">
                          {/* Syarat Kelayakan */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
                              <GraduationCap className="w-4 h-4" />
                              <span>Syarat & Kelayakan Minima:</span>
                            </div>

                            <div className="bg-[#0F172A]/60 p-4 rounded-xl border border-[#1F2937] space-y-2 text-xs text-slate-300">
                              {scope.requirements.map((req, idx) => (
                                <div key={idx} className="flex items-start space-x-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                  <span>{req}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Manfaat & Pakej Staf */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                              <Award className="w-4 h-4" />
                              <span>Manfaat & Kemudahan Staf:</span>
                            </div>

                            <div className="bg-[#0F172A]/60 p-4 rounded-xl border border-[#1F2937] space-y-2 text-xs text-slate-300">
                              {scope.benefits.map((ben, idx) => (
                                <div key={idx} className="flex items-start space-x-2">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <span>{ben}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Apply CTA Bar */}
                      <div className="pt-4 border-t border-[#1F2937] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0F172A] p-4 rounded-xl">
                        <div className="text-xs text-slate-300 text-center sm:text-left">
                          <span className="font-bold text-white block">Berminat menyertai jawatan {vacancy.tajukJawatan}?</span>
                          <span className="text-slate-400">Sila sediakan salinan Resume (PDF) & maklumat pendaftaran LJM/LPP anda.</span>
                        </div>

                        <button
                          onClick={() => onOpenJobApplicationModal(vacancy)}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition shadow-md cursor-pointer flex items-center space-x-2 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5 text-slate-950" />
                          <span>Mohon Jawatan Ini Sekarang</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Workflow Process Cards */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] space-y-4">
        <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Proses Carta Alir Permohonan Kerjaya Dialisis:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#1F2937] space-y-1.5 relative">
            <span className="text-emerald-400 font-mono font-bold text-xs">Langkah 1</span>
            <h4 className="text-xs font-bold text-white">Semak Skop Kerja</h4>
            <p className="text-[11px] text-slate-400">Pilih jawatan yang sesuai dan fahami tanggungjawab serta syarat kelayakan di atas.</p>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#1F2937] space-y-1.5 relative">
            <span className="text-cyan-400 font-mono font-bold text-xs">Langkah 2</span>
            <h4 className="text-xs font-bold text-white">Isi Borang Permohonan</h4>
            <p className="text-[11px] text-slate-400">Tekan butang "Mohon" dan lengkapkan borang dalam talian berserta nombor pendaftaran LJM/LPP.</p>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#1F2937] space-y-1.5 relative">
            <span className="text-amber-400 font-mono font-bold text-xs">Langkah 3</span>
            <h4 className="text-xs font-bold text-white">Muat Naik Resume</h4>
            <p className="text-[11px] text-slate-400">Lampirkan fail resume PDF atau salinan sijil perubatan berkaitan.</p>
          </div>

          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#1F2937] space-y-1.5 relative">
            <span className="text-violet-400 font-mono font-bold text-xs">Langkah 4</span>
            <h4 className="text-xs font-bold text-white">Semakan HR & Temuduga</h4>
            <p className="text-[11px] text-slate-400">Pasukan HR akan menghubungi calon yang layak dalam tempoh 3-5 hari bekerja untuk sesi temuduga.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
