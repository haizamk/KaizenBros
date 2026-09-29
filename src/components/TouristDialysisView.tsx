import React, { useState, useId } from 'react';
import { 
  TouristDialysisBooking, 
  TouristDialysisStatus, 
  PreRegisteredDocument, 
  VascularAccessType, 
  ShiftType, 
  CentreInfo, 
  StaffMember 
} from '../types';
import { 
  Palmtree, 
  Compass, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Phone, 
  Mail, 
  User, 
  Activity, 
  Building, 
  FileCheck, 
  Search, 
  Filter, 
  Plus, 
  Printer, 
  MessageSquare, 
  Eye, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Stethoscope, 
  Coffee, 
  Wifi, 
  Tv, 
  Car, 
  HelpCircle, 
  ChevronRight, 
  Download, 
  Info,
  BadgeAlert,
  ArrowRight,
  Send
} from 'lucide-react';
import { buildWhatsAppLink } from '../utils/whatsappHelper';

interface TouristDialysisViewProps {
  centreInfo: CentreInfo;
  bookings: TouristDialysisBooking[];
  staff: StaffMember[];
  initialSubTab?: 'tips' | 'form' | 'admin';
  onAddBooking: (booking: TouristDialysisBooking) => void;
  onUpdateBooking: (booking: TouristDialysisBooking) => void;
  onDeleteBooking: (bookingId: string) => void;
  isAdminAuthenticated: boolean;
  onOpenAdminLogin?: () => void;
}

export const TouristDialysisView: React.FC<TouristDialysisViewProps> = ({
  centreInfo,
  bookings,
  staff,
  initialSubTab = 'tips',
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking,
  isAdminAuthenticated,
  onOpenAdminLogin
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'admin' | 'tips'>(initialSubTab || 'tips');

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Search & filter for admin view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');

  // Modal for editing/updating status
  const [selectedBookingForUpdate, setSelectedBookingForUpdate] = useState<TouristDialysisBooking | null>(null);
  const [adminStatusForm, setAdminStatusForm] = useState<{
    status: TouristDialysisStatus;
    stesenDitetapkan: number;
    jururawatBertugas: string;
    statusBayaran: 'MENUNGGU_PENGESAHAN' | 'DEPOSIT_DITERIMA' | 'LUNAS' | 'PENAJA_GL';
    jumlahBayaran: number;
    notaKlinikalAdmin: string;
  }>({
    status: 'BARU_MENUNGGU_SEMAKAN',
    stesenDitetapkan: 1,
    jururawatBertugas: 'Sister Hanim binti Othman',
    statusBayaran: 'MENUNGGU_PENGESAHAN',
    jumlahBayaran: 500,
    notaKlinikalAdmin: ''
  });

  // Modal for manual admin creation
  const [isManualCreateModalOpen, setIsManualCreateModalOpen] = useState(false);

  // Success submitted state
  const [submittedBooking, setSubmittedBooking] = useState<TouristDialysisBooking | null>(null);

  // Patient Booking Form State
  const [formData, setFormData] = useState({
    nama: '',
    noICPasport: '',
    warganegara: 'Malaysia',
    noTelefon: '',
    emel: '',
    umur: '',
    jantina: 'LELAKI' as 'LELAKI' | 'PEREMPUAN',
    alamatAsal: '',
    tempatMenginap: '',
    pusatDialisisAsal: '',
    namaDoktorPakar: '',
    telefonPusatAsal: '',
    jenisAkses: 'AVF' as VascularAccessType,
    lokasiAkses: '',
    beratKering: '',
    tarikhDialisisTerakhir: '',
    tempohJam: '4.0',
    jenisDialyzer: 'High-Flux Dialyzer',
    antikoagulanHeparin: 'Standard Heparin',
    hbsAg: 'NEGATIF' as 'NEGATIF' | 'POSITIF' | 'BELUM_PASTI',
    antiHCV: 'NEGATIF' as 'NEGATIF' | 'POSITIF' | 'BELUM_PASTI',
    hiv: 'NEGATIF' as 'NEGATIF' | 'POSITIF' | 'BELUM_PASTI',
    tarikhUjianSerologi: '',
    tarikhMulaBercuti: '',
    tarikhTamatBercuti: '',
    tarikhSesi1: '',
    tarikhSesi2: '',
    tarikhSesi3: '',
    pilihanShift: 'PAGI' as ShiftType,
    keperluanKhas: ''
  });

  // Attached documents state
  const [attachedDocs, setAttachedDocs] = useState<PreRegisteredDocument[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Document upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, jenisDokumen: PreRegisteredDocument['jenisDokumen']) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const newDoc: PreRegisteredDocument = {
        id: `DOC-TOUR-${Date.now().toString().slice(-4)}`,
        namaDokumen: file.name,
        jenisDokumen: jenisDokumen,
        tarikhMuatNaik: new Date().toISOString().split('T')[0],
        saizFile: `${(file.size / 1024).toFixed(1)} KB`,
        fileDataUrl: reader.result as string,
        nota: `Dimuat naik oleh pemohon (${jenisDokumen})`
      };
      setAttachedDocs((prev) => [...prev, newDoc]);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveDoc = (id: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // Add sample demo documents
  const handleAddDemoDocuments = () => {
    const demoDocs: PreRegisteredDocument[] = [
      {
        id: `DOC-TOUR-DEMO-1`,
        namaDokumen: 'Surat_Rujukan_Pakar_Nefrologi_2026.pdf',
        jenisDokumen: 'SURAT_RUJUKAN',
        tarikhMuatNaik: new Date().toISOString().split('T')[0],
        saizFile: '890 KB',
        nota: 'Surat Pengesahan & Kondisi Klinikal Stabil'
      },
      {
        id: `DOC-TOUR-DEMO-2`,
        namaDokumen: 'Ujian_Serologi_HepB_HepC_HIV_Terkini.pdf',
        jenisDokumen: 'LAPORAN_DARAH',
        tarikhMuatNaik: new Date().toISOString().split('T')[0],
        saizFile: '640 KB',
        nota: 'Keputusan serologi < 3 bulan (Negatif)'
      }
    ];
    setAttachedDocs((prev) => [...prev, ...demoDocs]);
  };

  // Fill demo patient data for easy testing
  const handleFillDemoData = () => {
    setFormData({
      nama: 'Tuan Haji Azman bin Salleh',
      noICPasport: '610815-02-5431',
      warganegara: 'Malaysia',
      noTelefon: '019-445 8899',
      emel: 'azman.salleh61@gmail.com',
      umur: '65',
      jantina: 'LELAKI',
      alamatAsal: 'Alor Setar, Kedah',
      tempatMenginap: 'Homestay Lavender Semenyih (7 minit dari KaizenBros)',
      pusatDialisisAsal: 'Pusat Hemodialisis Hospital Sultanah Bahiyah, Alor Setar',
      namaDoktorPakar: 'Dr. Mohd Fauzi bin Ismail (Pakar Nefrologi)',
      telefonPusatAsal: '04-740 6000',
      jenisAkses: 'AVF',
      lokasiAkses: 'Radiocephalic Lengan Kiri',
      beratKering: '64.5',
      tarikhDialisisTerakhir: '2026-09-08',
      tempohJam: '4.0',
      jenisDialyzer: 'Fresenius FX80 High-Flux',
      antikoagulanHeparin: 'Standard Heparin (2000 IU bolus + 1000 IU/jam)',
      hbsAg: 'NEGATIF',
      antiHCV: 'NEGATIF',
      hiv: 'NEGATIF',
      tarikhUjianSerologi: '2026-08-15',
      tarikhMulaBercuti: '2026-09-22',
      tarikhTamatBercuti: '2026-09-28',
      tarikhSesi1: '2026-09-23',
      tarikhSesi2: '2026-09-25',
      tarikhSesi3: '2026-09-27',
      pilihanShift: 'PAGI',
      keperluanKhas: 'Bercuti bersama keluarga di Semenyih sempena konvokesyen anak di UKM Bangi. Perlu stesen berdekatan tandas.'
    });
    handleAddDemoDocuments();
  };

  // Validate form
  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.nama.trim()) errs.nama = 'Nama penuh pesakit diperlukan.';
    if (!formData.noICPasport.trim()) errs.noICPasport = 'No. Kad Pengenalan atau Pasport diperlukan.';
    if (!formData.noTelefon.trim()) errs.noTelefon = 'No. telefon untuk WhatsApp diperlukan.';
    if (!formData.pusatDialisisAsal.trim()) errs.pusatDialisisAsal = 'Nama pusat dialisis asal diperlukan.';
    if (!formData.tarikhMulaBercuti) errs.tarikhMulaBercuti = 'Tarikh mula bercuti diperlukan.';
    if (!formData.tarikhSesi1) errs.tarikhSesi1 = 'Sekurang-kurangnya 1 tarikh sesi dialisis diperlukan.';
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit handler
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const refNum = `KAIZEN-HOLIDAY-${Date.now().toString().slice(-4)}`;
    const sesiList = [formData.tarikhSesi1, formData.tarikhSesi2, formData.tarikhSesi3].filter(Boolean);

    const newBooking: TouristDialysisBooking = {
      id: `TOUR-${Date.now()}`,
      nama: formData.nama.trim(),
      noICPasport: formData.noICPasport.trim(),
      warganegara: formData.warganegara,
      noTelefon: formData.noTelefon.trim(),
      emel: formData.emel.trim() || `${formData.nama.toLowerCase().replace(/\s+/g, '')}@pelancong.dialisis`,
      umur: parseInt(formData.umur) || 60,
      jantina: formData.jantina,
      alamatAsal: formData.alamatAsal.trim() || 'Luar Kawasan / Negeri Lain',
      tempatMenginap: formData.tempatMenginap.trim() || 'Penginapan Sekitar Kajang/Semenyih',
      pusatDialisisAsal: formData.pusatDialisisAsal.trim(),
      namaDoktorPakar: formData.namaDoktorPakar.trim() || 'Pakar Nefrologi Rujukan',
      telefonPusatAsal: formData.telefonPusatAsal.trim(),
      jenisAkses: formData.jenisAkses,
      lokasiAkses: formData.lokasiAkses.trim() || 'Fistula / Catheter',
      beratKering: parseFloat(formData.beratKering) || 60,
      tarikhDialisisTerakhir: formData.tarikhDialisisTerakhir,
      tempohJam: parseFloat(formData.tempohJam) || 4.0,
      jenisDialyzer: formData.jenisDialyzer,
      antikoagulanHeparin: formData.antikoagulanHeparin,
      statusSerologi: {
        hbsAg: formData.hbsAg,
        antiHCV: formData.antiHCV,
        hiv: formData.hiv,
        tarikhUjianSerologi: formData.tarikhUjianSerologi
      },
      tarikhMulaBercuti: formData.tarikhMulaBercuti,
      tarikhTamatBercuti: formData.tarikhTamatBercuti || formData.tarikhMulaBercuti,
      tarikhSesiDiperlukan: sesiList,
      pilihanShift: formData.pilihanShift,
      keperluanKhas: formData.keperluanKhas.trim(),
      dokumenLampiran: attachedDocs,
      status: 'BARU_MENUNGGU_SEMAKAN',
      tarikhDaftar: new Date().toISOString().split('T')[0],
      nomborRujukan: refNum,
      notaKlinikalAdmin: 'Permohonan baru diterima melalui Portal Dialisis Pelancong.',
      statusBayaran: 'MENUNGGU_PENGESAHAN',
      jumlahBayaran: sesiList.length * 250 // Anggaran deposit/sesi
    };

    onAddBooking(newBooking);
    setSubmittedBooking(newBooking);
  };

  // Open update status modal
  const handleOpenUpdateModal = (booking: TouristDialysisBooking) => {
    setSelectedBookingForUpdate(booking);
    setAdminStatusForm({
      status: booking.status,
      stesenDitetapkan: booking.stesenDitetapkan || 1,
      jururawatBertugas: booking.jururawatBertugas || staff.find(s => s.kategori === 'JURURAWAT')?.nama || 'Sister Hanim binti Othman',
      statusBayaran: booking.statusBayaran || 'MENUNGGU_PENGESAHAN',
      jumlahBayaran: booking.jumlahBayaran || 500,
      notaKlinikalAdmin: booking.notaKlinikalAdmin || ''
    });
  };

  // Save admin updates
  const handleSaveAdminStatus = () => {
    if (!selectedBookingForUpdate) return;

    const updated: TouristDialysisBooking = {
      ...selectedBookingForUpdate,
      status: adminStatusForm.status,
      stesenDitetapkan: adminStatusForm.stesenDitetapkan,
      jururawatBertugas: adminStatusForm.jururawatBertugas,
      statusBayaran: adminStatusForm.statusBayaran,
      jumlahBayaran: adminStatusForm.jumlahBayaran,
      notaKlinikalAdmin: adminStatusForm.notaKlinikalAdmin
    };

    onUpdateBooking(updated);
    setSelectedBookingForUpdate(null);
  };

  // Build WhatsApp text for tourist coordination
  const getWhatsAppTouristMessage = (booking: TouristDialysisBooking) => {
    const sesiText = booking.tarikhSesiDiperlukan.join(', ');
    return `Salam Sejahtera Penyelaras Dialisis Pelancong Pusat KaizenBros Semenyih,

Saya ingin membuat pengesahan tempahan rawatan dialisis semasa bercuti:
• Nombor Rujukan: *${booking.nomborRujukan}*
• Nama Pesakit: *${booking.nama}* (IC/Pasport: ${booking.noICPasport})
• Pusat Asal: *${booking.pusatDialisisAsal}*
• Tarikh Percutian: ${booking.tarikhMulaBercuti} hingga ${booking.tarikhTamatBercuti}
• Tarikh Sesi Diperlukan: *${sesiText}* (Syif: ${booking.pilihanShift})
• Lokasi Menginap: ${booking.tempatMenginap}
• Dokumen Dilampirkan: ${booking.dokumenLampiran.length} fail (Surat rujukan & serologi)

Mohon semakan dan pengesahan slot mesin dialisis. Terima kasih!`;
  };

  // Filter bookings for admin
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      b.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.noICPasport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nomborRujukan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pusatDialisisAsal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tempatMenginap.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'SEMUA' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TouristDialysisStatus) => {
    switch (status) {
      case 'BARU_MENUNGGU_SEMAKAN':
        return {
          label: 'Menunggu Semakan',
          color: 'bg-amber-950/80 text-amber-300 border-amber-800/60'
        };
      case 'DOKUMEN_LENGKAP':
        return {
          label: 'Dokumen Lengkap',
          color: 'bg-blue-950/80 text-blue-300 border-blue-800/60'
        };
      case 'SLOT_DISAHKAN':
        return {
          label: 'Slot Disahkan',
          color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
        };
      case 'SEDANG_DIRAWAT':
        return {
          label: 'Sedang Dirawat',
          color: 'bg-purple-950/80 text-purple-300 border-purple-800/60'
        };
      case 'SELESAI':
        return {
          label: 'Rawatan Selesai',
          color: 'bg-slate-800 text-slate-300 border-slate-700'
        };
      case 'DIBATALKAN':
        return {
          label: 'Dibatalkan',
          color: 'bg-rose-950/80 text-rose-300 border-rose-800/60'
        };
      default:
        return {
          label: status,
          color: 'bg-slate-800 text-slate-300 border-slate-700'
        };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-[#E2E8F0] pb-12">
      {/* Hero Marketing Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#0A0C10] border border-teal-500/30 p-6 sm:p-10 shadow-2xl">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 max-w-5xl space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-950 to-emerald-950 text-teal-300 border border-teal-600/50 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Palmtree className="w-3.5 h-3.5 text-teal-400" />
              <span>Program Rawatan Dialisis Pelancong & Pesakit Luar</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Berlesen KKM & Piawaian ISO RO Air</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-serif tracking-tight leading-tight">
              Rawatan Dialisis Pelancong
            </h1>
            <p className="text-lg sm:text-xl font-bold text-teal-400 leading-snug">
              &ldquo;Anda kini boleh bercuti di mana sahaja Sekitar Kajang &amp; Semenyih — Kami sedia Membantu Ketika Anda Bercuti&rdquo;
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Pusat Dialisis KaizenBros membuka pintu seluas-luasnya kepada pesakit hemodialisis dari seluruh Malaysia dan luar negara yang sedang melancong, bercuti santai, menziarahi sanak-saudara atau menghadiri majlis keluarga di sekitar <strong className="text-white">Kajang, Semenyih, Bangi, Putrajaya &amp; Cheras</strong>. Nikmati percutian tanpa bimbang dengan perkhidmatan dialisis selesa, mesin canggih dan koordinasi pantas bersama pusat dialisis asal anda.
          </p>

          {/* Quick Highlight Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-slate-700/60 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Lokasi Strategik</p>
                <p className="text-[11px] text-slate-400">10-15 min ke Bukit Broga & Sate Kajang</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-slate-700/60 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Fasiliti VIP Santai</p>
                <p className="text-[11px] text-slate-400">Kerusi Recliner, Smart TV & WiFi</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-slate-700/60 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Urusan Rujukan Mudah</p>
                <p className="text-[11px] text-slate-400">Penyelaras berhubung terus dgn pakar asal</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-slate-700/60 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Pilihan Syif Fleksibel</p>
                <p className="text-[11px] text-slate-400">Pagi, Tengahari & Petang</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('tips')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition cursor-pointer ${
              activeSubTab === 'tips'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-lg shadow-teal-950'
                : 'bg-[#1E293B] text-slate-300 hover:bg-[#334155] hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>1. Maklumat &amp; Panduan Rawatan Dialisis</span>
          </button>

          <button
            onClick={() => setActiveSubTab('form')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition cursor-pointer ${
              activeSubTab === 'form'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-lg shadow-teal-950'
                : 'bg-[#1E293B] text-slate-300 hover:bg-[#334155] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Borang Pertanyaan &amp; Daftar Pelancong</span>
          </button>

          <button
            onClick={() => setActiveSubTab('admin')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition cursor-pointer ${
              activeSubTab === 'admin'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-lg shadow-teal-950'
                : 'bg-[#1E293B] text-slate-300 hover:bg-[#334155] hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Pengurusan Status (Admin)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/80 text-teal-300 border border-slate-700">
              {bookings.length}
            </span>
          </button>
        </div>

        {/* Coordination Helpline */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Phone className="w-3.5 h-3.5 text-teal-400" />
          <span>Penyelaras Percutian: </span>
          <a 
            href={`https://wa.me/${centreInfo.whatsappRasmi.replace(/\D/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline font-bold"
          >
            +{centreInfo.whatsappRasmi}
          </a>
        </div>
      </div>

      {/* TAB 1: FORM PENDAFTARAN & PERTANYAAN DIALISIS PELANCONG */}
      {activeSubTab === 'form' && (
        <div className="space-y-6">
          {submittedBooking ? (
            /* Successful Submission Confirmation Card */
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0F172A] border border-emerald-500/50 shadow-2xl space-y-6 text-center max-w-2xl mx-auto animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-950 border border-emerald-600/50 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {submittedBooking.nomborRujukan}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
                  Permohonan Dialisis Pelancong Diterima!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
                  Terima kasih, <strong>{submittedBooking.nama}</strong>. Maklumat rawatan dialisis dan dokumen anda telah direkodkan dalam sistem Pusat Dialisis KaizenBros. Penyelaras kami akan menyemak dokumen dan menghubungi pusat asal anda jika perlu.
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700/60 text-left space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Tarikh Percutian:</span>
                  <span className="font-bold text-white">{submittedBooking.tarikhMulaBercuti} - {submittedBooking.tarikhTamatBercuti}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Tarikh Sesi Diperlukan:</span>
                  <span className="font-bold text-teal-300">{submittedBooking.tarikhSesiDiperlukan.join(', ')} ({submittedBooking.pilihanShift})</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Pusat Dialisis Asal:</span>
                  <span className="font-medium text-white">{submittedBooking.pusatDialisisAsal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Penginapan Semasa Bercuti:</span>
                  <span className="font-medium text-white">{submittedBooking.tempatMenginap}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href={buildWhatsAppLink(centreInfo.whatsappRasmi, getWhatsAppTouristMessage(submittedBooking))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center space-x-2 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Hantar WhatsApp ke Penyelaras Sekarang</span>
                </a>

                <button
                  onClick={() => {
                    setSubmittedBooking(null);
                    setAttachedDocs([]);
                    setFormData({
                      nama: '',
                      noICPasport: '',
                      warganegara: 'Malaysia',
                      noTelefon: '',
                      emel: '',
                      umur: '',
                      jantina: 'LELAKI',
                      alamatAsal: '',
                      tempatMenginap: '',
                      pusatDialisisAsal: '',
                      namaDoktorPakar: '',
                      telefonPusatAsal: '',
                      jenisAkses: 'AVF',
                      lokasiAkses: '',
                      beratKering: '',
                      tarikhDialisisTerakhir: '',
                      tempohJam: '4.0',
                      jenisDialyzer: 'High-Flux Dialyzer',
                      antikoagulanHeparin: 'Standard Heparin',
                      hbsAg: 'NEGATIF',
                      antiHCV: 'NEGATIF',
                      hiv: 'NEGATIF',
                      tarikhUjianSerologi: '',
                      tarikhMulaBercuti: '',
                      tarikhTamatBercuti: '',
                      tarikhSesi1: '',
                      tarikhSesi2: '',
                      tarikhSesi3: '',
                      pilihanShift: 'PAGI',
                      keperluanKhas: ''
                    });
                  }}
                  className="px-5 py-3 bg-[#1E293B] hover:bg-[#334155] text-slate-300 font-semibold text-xs sm:text-sm rounded-xl transition"
                >
                  Isi Borang Baru
                </button>
              </div>
            </div>
          ) : (
            /* The Registration & Medical Inquiry Form */
            <form onSubmit={handleSubmitBooking} className="p-6 sm:p-8 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white font-serif flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-teal-400" />
                    <span>Borang Permohonan Sesi Dialisis Pelancong</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Sila isikan maklumat percutian dan data dialisis terkini anda untuk semakan pegawai penyelaras klinikal.
                  </p>
                </div>

                {/* Quick Auto-Fill Demo Button */}
                <button
                  type="button"
                  onClick={handleFillDemoData}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900/80 text-teal-300 border border-teal-700/60 text-xs font-semibold flex items-center space-x-1.5 transition self-start sm:self-auto cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Isi Data Contoh (Demo)</span>
                </button>
              </div>

              {/* BAHAGIAN 1: MAKLUMAT PERIBADI & PENGINAPAN */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-l-2 border-teal-500 pl-2">
                  1. Maklumat Peribadi &amp; Penginapan Semasa Bercuti
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Nama Penuh Pesakit <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Cth: Mohd Amirul bin Azhar"
                      className={`w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border ${
                        formErrors.nama ? 'border-rose-500' : 'border-slate-700'
                      } text-white focus:outline-none focus:border-teal-500`}
                    />
                    {formErrors.nama && <p className="text-[11px] text-rose-400 mt-1">{formErrors.nama}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      No. Kad Pengenalan / Pasport <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.noICPasport}
                      onChange={(e) => setFormData({ ...formData, noICPasport: e.target.value })}
                      placeholder="XXXXXX-XX-XXXX / No. Pasport"
                      className={`w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border ${
                        formErrors.noICPasport ? 'border-rose-500' : 'border-slate-700'
                      } text-white focus:outline-none focus:border-teal-500 font-mono`}
                    />
                    {formErrors.noICPasport && <p className="text-[11px] text-rose-400 mt-1">{formErrors.noICPasport}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Kewarganegaraan</label>
                    <select
                      value={formData.warganegara}
                      onChange={(e) => setFormData({ ...formData, warganegara: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="Malaysia">Warganegara Malaysia</option>
                      <option value="Singapura">Singapura</option>
                      <option value="Indonesia">Indonesia</option>
                      <option value="Brunei">Brunei Darussalam</option>
                      <option value="Antarabangsa">Pelancong Antarabangsa (Lain-lain)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      No. Telefon WhatsApp <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.noTelefon}
                      onChange={(e) => setFormData({ ...formData, noTelefon: e.target.value })}
                      placeholder="Cth: 019-338 9922"
                      className={`w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border ${
                        formErrors.noTelefon ? 'border-rose-500' : 'border-slate-700'
                      } text-white focus:outline-none focus:border-teal-500`}
                    />
                    {formErrors.noTelefon && <p className="text-[11px] text-rose-400 mt-1">{formErrors.noTelefon}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Alamat Emel</label>
                    <input
                      type="email"
                      value={formData.emel}
                      onChange={(e) => setFormData({ ...formData, emel: e.target.value })}
                      placeholder="pesakit@gmail.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Umur (Tahun)</label>
                      <input
                        type="number"
                        value={formData.umur}
                        onChange={(e) => setFormData({ ...formData, umur: e.target.value })}
                        placeholder="60"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Jantina</label>
                      <select
                        value={formData.jantina}
                        onChange={(e) => setFormData({ ...formData, jantina: e.target.value as 'LELAKI' | 'PEREMPUAN' })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="LELAKI">Lelaki</option>
                        <option value="PEREMPUAN">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">
                      Bandar &amp; Negeri Asal Pesakit
                    </label>
                    <input
                      type="text"
                      value={formData.alamatAsal}
                      onChange={(e) => setFormData({ ...formData, alamatAsal: e.target.value })}
                      placeholder="Cth: Georgetown, Pulau Pinang / Kota Bharu, Kelantan"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Lokasi Hotel / Homestay Di Sekitar Kajang &amp; Semenyih
                    </label>
                    <input
                      type="text"
                      value={formData.tempatMenginap}
                      onChange={(e) => setFormData({ ...formData, tempatMenginap: e.target.value })}
                      placeholder="Cth: Bangi Resort Hotel / Homestay Bandar Rinching Semenyih"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* BAHAGIAN 2: MAKLUMAT DIALISIS TERKINI */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-l-2 border-teal-500 pl-2">
                  2. Data Klinikal Dialisis Individu Terkini
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">
                      Pusat Hemodialisis Asal / Hospital Merawat <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.pusatDialisisAsal}
                      onChange={(e) => setFormData({ ...formData, pusatDialisisAsal: e.target.value })}
                      placeholder="Cth: Pusat Hemodialisis Hospital Pulau Pinang"
                      className={`w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border ${
                        formErrors.pusatDialisisAsal ? 'border-rose-500' : 'border-slate-700'
                      } text-white focus:outline-none focus:border-teal-500`}
                    />
                    {formErrors.pusatDialisisAsal && <p className="text-[11px] text-rose-400 mt-1">{formErrors.pusatDialisisAsal}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Doktor Pakar Nefrologi yang Merawat
                    </label>
                    <input
                      type="text"
                      value={formData.namaDoktorPakar}
                      onChange={(e) => setFormData({ ...formData, namaDoktorPakar: e.target.value })}
                      placeholder="Cth: Dr. Tan Choon Kiat"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Jenis Akses Vaskular (Vascular Access)
                    </label>
                    <select
                      value={formData.jenisAkses}
                      onChange={(e) => setFormData({ ...formData, jenisAkses: e.target.value as VascularAccessType })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="AVF">Arteriovenous Fistula (AVF)</option>
                      <option value="AVG">Arteriovenous Graft (AVG)</option>
                      <option value="PERMACATH">Permcath / Tunneled CVC</option>
                      <option value="CVC_TEMPORARY">CVC Sementara (Temporary)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Lokasi Akses Vaskular
                    </label>
                    <input
                      type="text"
                      value={formData.lokasiAkses}
                      onChange={(e) => setFormData({ ...formData, lokasiAkses: e.target.value })}
                      placeholder="Cth: Lengan Kiri Atas (Left Brachiocephalic)"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Berat Kering Sasaran (Target Dry Weight - kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.beratKering}
                      onChange={(e) => setFormData({ ...formData, beratKering: e.target.value })}
                      placeholder="Cth: 65.0"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Tarikh Sesi Dialisis Terakhir
                    </label>
                    <input
                      type="date"
                      value={formData.tarikhDialisisTerakhir}
                      onChange={(e) => setFormData({ ...formData, tarikhDialisisTerakhir: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Tempoh Preskripsi Rawatan (Jam)
                    </label>
                    <select
                      value={formData.tempohJam}
                      onChange={(e) => setFormData({ ...formData, tempohJam: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="4.0">4.0 Jam (Piawai)</option>
                      <option value="3.5">3.5 Jam</option>
                      <option value="4.5">4.5 Jam</option>
                      <option value="3.0">3.0 Jam</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Jenis Dialyzer &amp; Heparin
                    </label>
                    <input
                      type="text"
                      value={formData.jenisDialyzer}
                      onChange={(e) => setFormData({ ...formData, jenisDialyzer: e.target.value })}
                      placeholder="Cth: High-Flux FX80 / LMWH Clexane"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Status Ujian Serologi */}
                <div className="p-4 rounded-xl bg-[#162032] border border-teal-900/50 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-teal-300">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>Status Ujian Serologi Terkini (&lt; 3 Bulan):</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mengikut garis panduan KKM, pesakit luar perlu mengemukakan keputusan ujian serologi yang sah.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="block text-slate-300 mb-1">Hepatitis B (HBsAg):</span>
                      <select
                        value={formData.hbsAg}
                        onChange={(e) => setFormData({ ...formData, hbsAg: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#1E293B] border border-slate-700 text-white"
                      >
                        <option value="NEGATIF">NEGATIF</option>
                        <option value="POSITIF">POSITIF</option>
                        <option value="BELUM_PASTI">Belum Ada Keputusan</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-slate-300 mb-1">Hepatitis C (Anti-HCV):</span>
                      <select
                        value={formData.antiHCV}
                        onChange={(e) => setFormData({ ...formData, antiHCV: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#1E293B] border border-slate-700 text-white"
                      >
                        <option value="NEGATIF">NEGATIF</option>
                        <option value="POSITIF">POSITIF</option>
                        <option value="BELUM_PASTI">Belum Ada Keputusan</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-slate-300 mb-1">HIV 1 &amp; 2:</span>
                      <select
                        value={formData.hiv}
                        onChange={(e) => setFormData({ ...formData, hiv: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#1E293B] border border-slate-700 text-white"
                      >
                        <option value="NEGATIF">NEGATIF</option>
                        <option value="POSITIF">POSITIF</option>
                        <option value="BELUM_PASTI">Belum Ada Keputusan</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-slate-300 mb-1">Tarikh Ujian Serologi:</span>
                      <input
                        type="date"
                        value={formData.tarikhUjianSerologi}
                        onChange={(e) => setFormData({ ...formData, tarikhUjianSerologi: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#1E293B] border border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BAHAGIAN 3: TEMPOH PERCUTIAN & TARIKH SESI DIPERLUKAN */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-l-2 border-teal-500 pl-2">
                  3. Tarikh Percutian &amp; Sesi Rawatan Diperlukan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Tarikh Mula Tiba / Bercuti <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.tarikhMulaBercuti}
                      onChange={(e) => setFormData({ ...formData, tarikhMulaBercuti: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border ${
                        formErrors.tarikhMulaBercuti ? 'border-rose-500' : 'border-slate-700'
                      } text-white focus:outline-none focus:border-teal-500`}
                    />
                    {formErrors.tarikhMulaBercuti && <p className="text-[11px] text-rose-400 mt-1">{formErrors.tarikhMulaBercuti}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Tarikh Balik / Tamat Percutian</label>
                    <input
                      type="date"
                      value={formData.tarikhTamatBercuti}
                      onChange={(e) => setFormData({ ...formData, tarikhTamatBercuti: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Pilihan Waktu Syif</label>
                    <select
                      value={formData.pilihanShift}
                      onChange={(e) => setFormData({ ...formData, pilihanShift: e.target.value as ShiftType })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="PAGI">Sesi 1 (Pagi: 06:00 - 10:00)</option>
                      <option value="TENGAHARI">Sesi 2 (Tengahari: 10:00 - 14:00)</option>
                      <option value="PETANG">Sesi 3 (Petang: 14:00 - 18:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Tarikh Sesi 1 Diperlukan <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.tarikhSesi1}
                      onChange={(e) => setFormData({ ...formData, tarikhSesi1: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border ${
                        formErrors.tarikhSesi1 ? 'border-rose-500' : 'border-slate-700'
                      } text-white focus:outline-none focus:border-teal-500`}
                    />
                    {formErrors.tarikhSesi1 && <p className="text-[11px] text-rose-400 mt-1">{formErrors.tarikhSesi1}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Tarikh Sesi 2 (Jika Berkenaan)</label>
                    <input
                      type="date"
                      value={formData.tarikhSesi2}
                      onChange={(e) => setFormData({ ...formData, tarikhSesi2: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Tarikh Sesi 3 (Jika Berkenaan)</label>
                    <input
                      type="date"
                      value={formData.tarikhSesi3}
                      onChange={(e) => setFormData({ ...formData, tarikhSesi3: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-300 font-medium mb-1">
                      Keperluan Khas / Alahan / Bantuan Tambahan
                    </label>
                    <textarea
                      rows={2}
                      value={formData.keperluanKhas}
                      onChange={(e) => setFormData({ ...formData, keperluanKhas: e.target.value })}
                      placeholder="Cth: Menggunakan kerusi roda, memerlukan bantuan pengangkutan van homestay, alahan ubat atau plester perekat..."
                      className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* BAHAGIAN 4: MUAT NAIK SURAT / DOKUMEN BERKAITAN */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-l-2 border-teal-500 pl-2">
                    4. Muat Naik Surat &amp; Dokumen Berkaitan
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddDemoDocuments}
                    className="text-[11px] text-teal-300 hover:text-teal-200 underline font-medium"
                  >
                    + Lampir Fail Contoh (Demo)
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Untuk mempercepatkan pengesahan slot, anda digalakkan memuat naik: Surat Rujukan Pakar Nefrologi, Ringkasan Preskripsi Dialisis terkini (Flowsheet), dan Keputusan Ujian Darah Serologi.
                </p>

                {/* Upload Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="p-4 rounded-xl border border-dashed border-teal-600/60 hover:border-teal-400 bg-[#162032] hover:bg-[#1E293B] text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2">
                    <Upload className="w-5 h-5 text-teal-400" />
                    <span className="text-xs font-bold text-white">Surat Rujukan Doktor</span>
                    <span className="text-[10px] text-slate-400">PDF, JPG atau PNG</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileUpload(e, 'SURAT_RUJUKAN')}
                      className="hidden"
                    />
                  </label>

                  <label className="p-4 rounded-xl border border-dashed border-teal-600/60 hover:border-teal-400 bg-[#162032] hover:bg-[#1E293B] text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Ujian Darah / Serologi</span>
                    <span className="text-[10px] text-slate-400">Keputusan &lt; 3 bulan</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileUpload(e, 'LAPORAN_DARAH')}
                      className="hidden"
                    />
                  </label>

                  <label className="p-4 rounded-xl border border-dashed border-teal-600/60 hover:border-teal-400 bg-[#162032] hover:bg-[#1E293B] text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2">
                    <FileCheck className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Salinan IC / Pasport</span>
                    <span className="text-[10px] text-slate-400">Dokumen pengenalan</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileUpload(e, 'SALINAN_IC')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* List of Attached Documents */}
                {attachedDocs.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-300">
                      Dokumen Dilampirkan ({attachedDocs.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-2.5 rounded-lg bg-[#1E293B] border border-slate-700 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold text-white truncate">{doc.namaDokumen}</p>
                              <p className="text-[10px] text-slate-400">{doc.jenisDokumen} • {doc.saizFile || 'Dimuat naik'}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(doc.id)}
                            className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded transition shrink-0"
                            title="Padam Dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button & Help Notice */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    Sebarang pertanyaan segera boleh terus WhatsApp Penyelaras kami di <strong>+{centreInfo.whatsappRasmi}</strong>.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-teal-950/80 transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Hantar Permohonan Dialisis Pelancong</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: PENGURUSAN STATUS & REKOD PELANCONG (ADMIN) */}
      {activeSubTab === 'admin' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Admin Header Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Jumlah Rekod Pelancong</p>
              <p className="text-2xl font-bold text-white mt-1">{bookings.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0F172A] border border-amber-900/40">
              <p className="text-xs text-amber-400 font-medium">Menunggu Semakan</p>
              <p className="text-2xl font-bold text-amber-300 mt-1">
                {bookings.filter(b => b.status === 'BARU_MENUNGGU_SEMAKAN').length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0F172A] border border-emerald-900/40">
              <p className="text-xs text-emerald-400 font-medium">Slot Telah Disahkan</p>
              <p className="text-2xl font-bold text-emerald-300 mt-1">
                {bookings.filter(b => b.status === 'SLOT_DISAHKAN').length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#0F172A] border border-purple-900/40">
              <p className="text-xs text-purple-400 font-medium">Rawatan Selesai</p>
              <p className="text-2xl font-bold text-purple-300 mt-1">
                {bookings.filter(b => b.status === 'SELESAI').length}
              </p>
            </div>
          </div>

          {/* Search, Filter & Action Toolbar */}
          <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, IC, pusat asal, penginapan..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1E293B] border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#1E293B] border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="SEMUA">Semua Status</option>
                <option value="BARU_MENUNGGU_SEMAKAN">Menunggu Semakan</option>
                <option value="DOKUMEN_LENGKAP">Dokumen Lengkap</option>
                <option value="SLOT_DISAHKAN">Slot Disahkan</option>
                <option value="SEDANG_DIRAWAT">Sedang Dirawat</option>
                <option value="SELESAI">Selesai</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </select>
            </div>

            {/* Admin Manual Entry & Notice */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  handleFillDemoData();
                  setActiveSubTab('form');
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-lg shadow transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Rekod Pelancong Masuk</span>
              </button>
            </div>
          </div>

          {/* Bookings Table / Card List */}
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
              <Compass className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Tiada rekod dialisis pelancong ditemui.</p>
              <p className="text-xs text-slate-500">
                Gunakan carian lain atau klik &quot;+ Rekod Pelancong Masuk&quot; untuk menambah rekod baru.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => {
                const badge = getStatusBadge(booking.status);
                return (
                  <div
                    key={booking.id}
                    className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition space-y-3.5 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-400 bg-teal-950/70 border border-teal-800/50 px-2.5 py-0.5 rounded-full">
                          {booking.nomborRujukan}
                        </span>
                        <h4 className="text-base font-bold text-white font-serif">{booking.nama}</h4>
                        <span className="text-xs text-slate-400">({booking.umur} thn • {booking.jantina})</span>
                        <span className="text-xs font-mono text-slate-500">IC: {booking.noICPasport}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {booking.stesenDitetapkan && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                            Stesen #{booking.stesenDitetapkan}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                      <div className="space-y-1">
                        <p className="text-slate-500 text-[11px]">Tarikh Percutian &amp; Sesi:</p>
                        <p className="font-semibold text-white">
                          📅 {booking.tarikhMulaBercuti} hingga {booking.tarikhTamatBercuti}
                        </p>
                        <p className="text-teal-300 font-medium">
                          Sesi: {booking.tarikhSesiDiperlukan.join(', ')} ({booking.pilihanShift})
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-slate-500 text-[11px]">Pusat Asal &amp; Penginapan:</p>
                        <p className="text-white truncate">🏥 {booking.pusatDialisisAsal}</p>
                        <p className="text-slate-400 truncate">🏨 {booking.tempatMenginap}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-slate-500 text-[11px]">Data Klinikal &amp; Dokumen:</p>
                        <p className="text-slate-300">
                          Akses: <strong className="text-white">{booking.jenisAkses}</strong> • Berat: <strong className="text-white">{booking.beratKering} kg</strong>
                        </p>
                        <p className="text-teal-400">
                          📎 {booking.dokumenLampiran.length} Dokumen dilampirkan
                        </p>
                      </div>
                    </div>

                    {/* Admin Clinical Note & Action Bar */}
                    {booking.notaKlinikalAdmin && (
                      <div className="p-2.5 rounded-lg bg-[#1E293B]/70 border border-slate-700/60 text-[11px] text-slate-300 flex items-start space-x-2">
                        <Info className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white">Catatan Penyelaras:</strong> {booking.notaKlinikalAdmin}
                          {booking.jururawatBertugas && (
                            <span className="text-slate-400"> (Jururawat: {booking.jururawatBertugas})</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <Phone className="w-3 h-3 text-teal-400" />
                        <span>{booking.noTelefon}</span>
                        <span>•</span>
                        <span>Didaftar: {booking.tarikhDaftar}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* WhatsApp Communication */}
                        <a
                          href={buildWhatsAppLink(booking.noTelefon, `Salam Sejahtera ${booking.nama}, ini adalah mesej dari Pusat Dialisis KaizenBros Semenyih mengenai tempahan dialisis pelancong (${booking.nomborRujukan}). Status semasa: ${badge.label}.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-semibold flex items-center space-x-1.5 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp Pesakit</span>
                        </a>

                        {/* Edit & Update Status */}
                        <button
                          onClick={() => handleOpenUpdateModal(booking)}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Kemaskini Status &amp; Slot</span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Adakah anda pasti ingin memadam rekod pelancong ${booking.nama}?`)) {
                              onDeleteBooking(booking.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                          title="Padam Rekod"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: TIP & MAKLUMAT UNTUK PESAKIT DIALISIS PELANCONG */}
      {activeSubTab === 'tips' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Quick Action Callout: Read info first, then proceed to form */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-teal-950 via-[#0F172A] to-emerald-950 border-2 border-teal-500/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/60 border border-teal-600/50 text-teal-300 text-xs font-bold">
                <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Langkah 1: Teliti Maklumat &amp; Senarai Semak Rawatan Dahulu</span>
              </div>
              <h4 className="text-lg sm:text-xl font-black text-white">
                Sedia Untuk Menempah Slot Selepas Membaca Panduan?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Pastikan dokumen klinikal anda (surat rujukan pakar &amp; keputusan ujian serologi &lt; 3 bulan) telah disediakan. Kemudian, klik butang di sebelah untuk terus mengisi borang tempahan slot.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveSubTab('form');
                window.scrollTo({ top: 450, behavior: 'smooth' });
              }}
              className="px-6 py-3.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-950/80 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center space-x-2 shrink-0 cursor-pointer border border-teal-300/40"
            >
              <span>Terus Ke Borang Permohonan Slot</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Section 1: Checklist Sebelum Bercuti */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-6">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-950 text-teal-300 border border-teal-700/50">
                Panduan Penting Pesakit
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
                Senarai Semak Pra-Percutian (Holiday Dialysis Checklist)
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Langkah teratur untuk memastikan sesi dialisis anda di Semenyih &amp; Kajang berjalan lancar tanpa gangguan jadual bercuti.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 space-y-2">
                <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>2 hingga 4 Minggu Sebelum Bercuti</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Maklumkan kepada Pakar Nefrologi atau Ketua Jururawat di pusat asal anda tentang tarikh perjalanan.</li>
                  <li>Minta <strong>Surat Rujukan Rasmi</strong> dan <strong>Ringkasan Preskripsi Dialisis (Flowsheet)</strong> 3 sesi terakhir.</li>
                  <li>Pastikan status ujian serologi (HBsAg, Anti-HCV, HIV) sah dalam tempoh 3 bulan sebelum tarikh rawatan.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <Activity className="w-4 h-4" />
                  <span>1 Minggu Sebelum Bercuti</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Sahkan tempahan slot dengan Penyelaras KaizenBros melalui WhatsApp atau borang web ini.</li>
                  <li>Kira dan asingkan bekalan ubat rutin mencukupi untuk tempoh percutian + 3 hari ekstra kecemasan.</li>
                  <li>Jika menggunakan suntikan Erythropoietin (EPO), sediakan beg penebat sejuk (cooler bag dengan pek ais).</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 space-y-2">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                  <Compass className="w-4 h-4" />
                  <span>Semasa Hari Perjalanan &amp; Sesi Dialisis</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Simpan surat rujukan dan rekod ubat dalam beg tangan atau beg galas (jangan letak di bonet jauh).</li>
                  <li>Pakai pakaian longgar yang memudahkan akses fistula (AVF/AVG) atau catheter leher/dada.</li>
                  <li>Hadir 15-20 minit awal sebelum waktu syif untuk pendaftaran dan timbangan berat badan pra-dialisis.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 space-y-2">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
                  <FileCheck className="w-4 h-4" />
                  <span>Selepas Sesi Selesai</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Pihak KaizenBros akan menyediakan <strong>Ringkasan Rawatan Pelancong (Treatment Log Summary)</strong>.</li>
                  <li>Bawa lembaran ringkasan ini pulang untuk diserahkan kembali kepada pusat asal anda.</li>
                  <li>Rehat sekurang-kurangnya 30-45 minit sebelum memulakan aktiviti lawatan atau berjalan-jalan.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Panduan Pemakanan & Kawalan Cecair Semasa Melancong */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-5">
            <h3 className="text-lg sm:text-xl font-bold text-white font-serif flex items-center space-x-2">
              <Coffee className="w-5 h-5 text-teal-400" />
              <span>Panduan Nutrisi &amp; Cecair Semasa Melancong di Kajang/Semenyih</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#162032] border border-slate-700 space-y-2">
                <h4 className="font-bold text-teal-300">Kawalan Cecair &amp; Dahaga</h4>
                <p className="text-slate-300 leading-relaxed">
                  Semasa berjalan-jalan di tempat panas, hadkan pengambilan minuman manis dan bersoda. Bawa botol air berukuran 500ml untuk mengira had cecair harian. Anda boleh menghisap kiub ais kecil untuk melegakan tekak kering tanpa menambah cecair berlebihan.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#162032] border border-slate-700 space-y-2">
                <h4 className="font-bold text-amber-300">Petua Menikmati Makanan Tempatan</h4>
                <p className="text-slate-300 leading-relaxed">
                  Bercuti di Kajang sinonim dengan sate. Pilih sate daging/ayam tanpa bahagian lemak berlebihan, dan <strong>hadkan kuah kacang</strong> kerana kacang mengandungi kadar fosfat dan kalium yang tinggi. Elakkan sup berkuah banyak atau masakan terlalu masin.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#162032] border border-slate-700 space-y-2">
                <h4 className="font-bold text-emerald-300">Buah-Buahan &amp; Kalium</h4>
                <p className="text-slate-300 leading-relaxed">
                  Jika melawat dusun atau pasar tempatan di Semenyih, elakkan buah tinggi kalium seperti pisang, durian, nangka, dan air kelapa muda. Pilih buah rendah kalium seperti epal, pir, atau anggur dalam kuantiti sederhana.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Tempat Tarikan & Penginapan Sekitar Semenyih & Kajang */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-5">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                Penerokaan Santai
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white font-serif">
                Tempat Tarikan &amp; Lokasi Penginapan Berdekatan KaizenBros
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Bukit Broga Semenyih</span>
                  <span className="text-[10px] text-teal-400 font-mono">15 Minit</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Pemandangan alam bukit lalang dan udara segar waktu pagi. Sangat sesuai untuk bersantai bersama keluarga dan mengambil foto landskap yang memukau.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Bandar Warisan &amp; Sate Kajang</span>
                  <span className="text-[10px] text-teal-400 font-mono">12 Minit</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Pusat tumpuan kulinari Sate Kajang Hj Samuri, Medan Selera Stadium Kajang, serta deretan kedai warisan dan stesen MRT Kajang.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Ostrich Wonderland Semenyih</span>
                  <span className="text-[10px] text-teal-400 font-mono">10 Minit</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Ladang burung unta dan haiwan ternakan mesra kanak-kanak. Suasana santai tanpa perlu aktiviti fizikal berat.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Taman Eko Rimba Sungai Tekala</span>
                  <span className="text-[10px] text-teal-400 font-mono">18 Minit</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Hutan rekreasi air terjun yang tenang, laluan pejalan kaki berturap yang teduh dan tempat perkelahan santai.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Bangi Resort Hotel &amp; Golf</span>
                  <span className="text-[10px] text-teal-400 font-mono">15 Minit</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Hotel bertaraf 5 bintang dengan suasana hijau tropika, spa santai dan kolam renang yang luas untuk percutian mewah.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">IOI City Mall Putrajaya</span>
                  <span className="text-[10px] text-teal-400 font-mono">20 Minit</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Pusat membeli-belah terbesar Malaysia dengan pendingin hawa penuh, pawagam, dan kemudahan kerusi roda lengkap.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: FAQ Dialisis Pelancong */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-5">
            <h3 className="text-lg sm:text-xl font-bold text-white font-serif flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-teal-400" />
              <span>Soalan Lazim (FAQ) Dialisis Pelancong</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700/80 space-y-1">
                <p className="font-bold text-white">S: Berapa awal saya perlu membuat tempahan sebelum tarikh percutian?</p>
                <p className="text-slate-300 leading-relaxed">
                  J: Sebaiknya sekurang-kurangnya <strong>1 hingga 2 minggu awal</strong> agar kami dapat menyelaraskan surat rujukan dan mengesahkan stesen mesin serta syif yang anda inginkan. Walau bagaimanapun, untuk kes kecemasan atau percutian saat akhir, sila hubungi terus talian WhatsApp kami untuk semakan kekosongan hari yang sama.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700/80 space-y-1">
                <p className="font-bold text-white">S: Bolehkah saya menggunakan Surat Jaminan (GL) Penaja (PERKESO / JPA / Zakat)?</p>
                <p className="text-slate-300 leading-relaxed">
                  J: Ya. Bagi pesakit warganegara yang mempunyai tajaan sedia ada, anda boleh meminta Surat Jaminan (GL) Sementara dari pihak penaja yang dialamatkan kepada Pusat Dialisis KaizenBros Semenyih. Pihak pentadbir kami bersedia membantu menyediakan invois atau resit rasmi untuk tuntutan balik.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700/80 space-y-1">
                <p className="font-bold text-white">S: Bagaimana jika jadual perjalanan saya tertunda atau penerbangan lewat?</p>
                <p className="text-slate-300 leading-relaxed">
                  J: Jangan risau. Sila maklumkan kepada Penyelaras KaizenBros secepat mungkin. Kami mempunyai 3 syif harian (Pagi, Tengahari, dan Petang) dan kami akan berusaha menyesuaikan masa rawatan anda dengan jadual perjalanan terkini.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700/80 space-y-1">
                <p className="font-bold text-white">S: Apakah kelayakan keselamatan dan standard kebersihan mesin dialisis?</p>
                <p className="text-slate-300 leading-relaxed">
                  J: KaizenBros berdaftar penuh dengan KKM di bawah Akta 586. Setiap mesin dialisis melalui proses disinfeksi haba/kimia automatik selepas setiap pesakit, menggunakan dialyzer biokompatibel sekali guna (*single-use high flux*), dan bekalan air ultrapure Double Pass RO yang diuji mikrobiologi secara berkala.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Prompt: Proceed to Form */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#0A0C10] border-2 border-teal-500/40 text-center space-y-4 shadow-xl">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-950 text-teal-300 border border-teal-700/60">
              Langkah Seterusnya
            </span>
            <h4 className="text-xl sm:text-2xl font-bold text-white font-serif">
              Sudah Sedia Mengisi Borang Tempahan Slot Rawatan?
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Pasukan klinikal KaizenBros sedia menyelaraskan masa, stesen mesin Fresenius, dan pemindahan maklumat perubatan anda. Sila isi borang permohonan sekarang.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setActiveSubTab('form');
                  window.scrollTo({ top: 450, behavior: 'smooth' });
                }}
                className="px-8 py-3.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-teal-950/80 transition-all transform hover:scale-[1.02] cursor-pointer inline-flex items-center space-x-2"
              >
                <span>Buka Borang Permohonan &amp; Tempahan Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KEMASKINI STATUS & SLOT (ADMIN) */}
      {selectedBookingForUpdate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-teal-500/50 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-fadeIn text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-teal-400 font-bold">{selectedBookingForUpdate.nomborRujukan}</span>
                <h3 className="text-base font-bold text-white font-serif">Kemaskini Status Dialisis Pelancong</h3>
                <p className="text-slate-400">{selectedBookingForUpdate.nama} ({selectedBookingForUpdate.noICPasport})</p>
              </div>
              <button
                onClick={() => setSelectedBookingForUpdate(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status Permohonan</label>
                <select
                  value={adminStatusForm.status}
                  onChange={(e) => setAdminStatusForm({ ...adminStatusForm, status: e.target.value as TouristDialysisStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-slate-700 text-white font-semibold focus:outline-none focus:border-teal-500"
                >
                  <option value="BARU_MENUNGGU_SEMAKAN">BARU: Menunggu Semakan</option>
                  <option value="DOKUMEN_LENGKAP">DOKUMEN LENGKAP: Disahkan Pakar</option>
                  <option value="SLOT_DISAHKAN">SLOT DISAHKAN: Stesen Ditetapkan</option>
                  <option value="SEDANG_DIRAWAT">SEDANG DIRAWAT: Pesakit Hadir</option>
                  <option value="SELESAI">SELESAI: Rawatan Tamat &amp; Ringkasan Dikeluarkan</option>
                  <option value="DIBATALKAN">DIBATALKAN / DITOLAK</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stesen Mesin Dialisis</label>
                  <select
                    value={adminStatusForm.stesenDitetapkan}
                    onChange={(e) => setAdminStatusForm({ ...adminStatusForm, stesenDitetapkan: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>Stesen #{n} (Fresenius)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jururawat Bertugas</label>
                  <select
                    value={adminStatusForm.jururawatBertugas}
                    onChange={(e) => setAdminStatusForm({ ...adminStatusForm, jururawatBertugas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  >
                    {staff.filter(s => s.kategori === 'JURURAWAT').map((nurse) => (
                      <option key={nurse.id} value={nurse.nama}>{nurse.nama}</option>
                    ))}
                    <option value="Sister Hanim binti Othman">Sister Hanim binti Othman</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Bayaran / Penaja</label>
                  <select
                    value={adminStatusForm.statusBayaran}
                    onChange={(e) => setAdminStatusForm({ ...adminStatusForm, statusBayaran: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="MENUNGGU_PENGESAHAN">Menunggu Pengesahan</option>
                    <option value="DEPOSIT_DITERIMA">Deposit Diterima</option>
                    <option value="LUNAS">Bayaran Penuh Lunas</option>
                    <option value="PENAJA_GL">Tajaan Surat Jaminan GL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Anggaran Yuran (RM)</label>
                  <input
                    type="number"
                    value={adminStatusForm.jumlahBayaran}
                    onChange={(e) => setAdminStatusForm({ ...adminStatusForm, jumlahBayaran: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catatan Klinikal Penyelaras</label>
                <textarea
                  rows={3}
                  value={adminStatusForm.notaKlinikalAdmin}
                  onChange={(e) => setAdminStatusForm({ ...adminStatusForm, notaKlinikalAdmin: e.target.value })}
                  placeholder="Catatan mengenai semakan surat rujukan, pengesahan ujian serologi, keperluan cannulation atau ubat..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedBookingForUpdate(null)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-slate-300 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAdminStatus}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-lg shadow transition"
              >
                Simpan &amp; Kemaskini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
