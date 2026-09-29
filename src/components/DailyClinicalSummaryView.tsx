import React, { useState } from 'react';
import { NurseWalkthroughGuide } from './NurseWalkthroughGuide';
import { Patient, TreatmentSession, DoctorVisit, BloodTestRecord, CentreInfo } from '../types';
import { 
  ClipboardList, 
  Calendar, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Search, 
  Filter, 
  FileText, 
  MessageSquare, 
  Printer, 
  Stethoscope, 
  Plus, 
  Save, 
  User, 
  Activity, 
  Droplet,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Ambulance
} from 'lucide-react';
import { MedicalReportPdfModal } from './MedicalReportPdfModal';
import { buildWhatsAppLink, createSessionReminderMessage } from '../utils/whatsappHelper';

interface DailyClinicalSummaryViewProps {
  patients: Patient[];
  sessions: TreatmentSession[];
  setSessions: React.Dispatch<React.SetStateAction<TreatmentSession[]>>;
  doctorVisits: DoctorVisit[];
  setDoctorVisits: React.Dispatch<React.SetStateAction<DoctorVisit[]>>;
  bloodTests: BloodTestRecord[];
  centreInfo: CentreInfo;
  onOpenHospitalReferral?: (patient?: Patient) => void;
}

export const DailyClinicalSummaryView: React.FC<DailyClinicalSummaryViewProps> = ({
  patients = [],
  sessions = [],
  setSessions,
  doctorVisits = [],
  setDoctorVisits,
  bloodTests = [],
  centreInfo,
  onOpenHospitalReferral
}) => {
  // Default to today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal for Medical Report PDF
  const [selectedPatientForReport, setSelectedPatientForReport] = useState<Patient | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Modal/Drawer for Quick Doctor Note editing
  const [activeEditingPatientId, setActiveEditingPatientId] = useState<string | null>(null);
  const [quickNoteText, setQuickNoteText] = useState<string>('');

  // 1. Filter existing sessions for selected date
  const dateSessions = sessions.filter(s => s.tarikh === selectedDate);

  // 2. Derive full appointment list for the day: match explicitly recorded sessions OR scheduled patients
  const currentDayOfWeek = new Date(selectedDate).getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const isMWF = currentDayOfWeek === 1 || currentDayOfWeek === 3 || currentDayOfWeek === 5; // Mon, Wed, Fri
  const isTTS = currentDayOfWeek === 2 || currentDayOfWeek === 4 || currentDayOfWeek === 6; // Tue, Thu, Sat

  const scheduledPatients = patients.filter(p => {
    if (isMWF && p.sesiJadual.corakHari === 'ISNIN_RABU_JUMAAT') return true;
    if (isTTS && p.sesiJadual.corakHari === 'SELASA_KHAMIS_SABTU') return true;
    // Also include if patient has an explicit session on selectedDate
    return dateSessions.some(s => s.patientId === p.id);
  });

  // Combine patient roster with session status
  const dailyRoster = scheduledPatients.map(patient => {
    const existingSession = dateSessions.find(s => s.patientId === patient.id);
    const patientDoctorVisit = doctorVisits.find(v => v.patientId === patient.id && v.tarikhLawatan === selectedDate);
    const latestBloodTest = bloodTests
      .filter(b => b.patientId === patient.id)
      .sort((a, b) => new Date(b.tarikhUjian).getTime() - new Date(a.tarikhUjian).getTime())[0];

    return {
      patient,
      session: existingSession || {
        id: `sess_auto_${patient.id}_${selectedDate}`,
        patientId: patient.id,
        patientName: patient.nama,
        tarikh: selectedDate,
        corakHari: patient.sesiJadual.corakHari,
        shift: patient.sesiJadual.shift,
        masaMula: patient.sesiJadual.shift === 'PAGI' ? '06:00' : patient.sesiJadual.shift === 'TENGAHARI' ? '10:00' : '14:00',
        masaTamat: patient.sesiJadual.shift === 'PAGI' ? '10:00' : patient.sesiJadual.shift === 'TENGAHARI' ? '14:00' : '18:00',
        stesenNo: patient.sesiJadual.stesenNo || 1,
        status: 'AKAN_DATANG',
        jururawatBertugas: 'Sister Hanim',
        notaKlinikal: ''
      } as TreatmentSession,
      doctorVisit: patientDoctorVisit,
      latestBloodTest
    };
  });

  // Filter daily roster by search, shift, and status
  const filteredRoster = dailyRoster.filter(item => {
    if (!item || !item.patient) return false;
    const pName = (item.patient.nama || '').toLowerCase();
    const pIC = item.patient.noIC || '';
    const stesen = String(item.session?.stesenNo || '');
    const query = (searchQuery || '').toLowerCase();

    const matchesSearch = 
      pName.includes(query) ||
      pIC.includes(searchQuery) ||
      stesen.includes(searchQuery);

    const matchesShift = filterShift === 'ALL' || item.session?.shift === filterShift;
    const matchesStatus = filterStatus === 'ALL' || item.session?.status === filterStatus;

    return matchesSearch && matchesShift && matchesStatus;
  });

  // KPI Calculations
  const totalAppointments = dailyRoster.length;
  const hadirCount = dailyRoster.filter(r => r.session.status === 'SEDANG_BERJALAN' || r.session.status === 'SELESAI').length;
  const selesaiCount = dailyRoster.filter(r => r.session.status === 'SELESAI').length;
  const menungguCount = dailyRoster.filter(r => r.session.status === 'AKAN_DATANG').length;
  const tidakHadirCount = dailyRoster.filter(r => r.session.status === 'TIDAK_HADIR' || r.session.status === 'BATAL').length;

  // Handle Attendance Status Change
  const handleUpdateStatus = (patientId: string, newStatus: TreatmentSession['status']) => {
    setSessions(prev => {
      const existingIndex = prev.findIndex(s => s.patientId === patientId && s.tarikh === selectedDate);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], status: newStatus };
        localStorage.setItem('kaizenbros_sessions', JSON.stringify(updated));
        return updated;
      } else {
        const targetPatient = patients.find(p => p.id === patientId);
        const newSess: TreatmentSession = {
          id: `sess_${patientId}_${Date.now()}`,
          patientId,
          patientName: targetPatient?.nama || 'Pesakit',
          tarikh: selectedDate,
          corakHari: targetPatient?.sesiJadual.corakHari || 'ISNIN_RABU_JUMAAT',
          shift: targetPatient?.sesiJadual.shift || 'PAGI',
          masaMula: '06:00',
          masaTamat: '10:00',
          stesenNo: targetPatient?.sesiJadual.stesenNo || 1,
          status: newStatus,
          jururawatBertugas: 'Sister Hanim',
          notaKlinikal: ''
        };
        const updated = [newSess, ...prev];
        localStorage.setItem('kaizenbros_sessions', JSON.stringify(updated));
        return updated;
      }
    });
  };

  // Handle Quick Doctor Note Save
  const handleSaveQuickNote = (patientId: string) => {
    if (!quickNoteText.trim()) return;

    // Update Session Clinical Note
    setSessions(prev => {
      const existingIndex = prev.findIndex(s => s.patientId === patientId && s.tarikh === selectedDate);
      let updated: TreatmentSession[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], notaKlinikal: quickNoteText };
      } else {
        const targetPatient = patients.find(p => p.id === patientId);
        const newSess: TreatmentSession = {
          id: `sess_${patientId}_${Date.now()}`,
          patientId,
          patientName: targetPatient?.nama || 'Pesakit',
          tarikh: selectedDate,
          corakHari: targetPatient?.sesiJadual.corakHari || 'ISNIN_RABU_JUMAAT',
          shift: targetPatient?.sesiJadual.shift || 'PAGI',
          masaMula: '06:00',
          masaTamat: '10:00',
          stesenNo: targetPatient?.sesiJadual.stesenNo || 1,
          status: 'AKAN_DATANG',
          jururawatBertugas: 'Sister Hanim',
          notaKlinikal: quickNoteText
        };
        updated = [newSess, ...prev];
      }
      localStorage.setItem('kaizenbros_sessions', JSON.stringify(updated));
      return updated;
    });

    // Also record into DoctorVisit entry if present or create new visit record
    setDoctorVisits(prev => {
      const existingVisitIndex = prev.findIndex(v => v.patientId === patientId && v.tarikhLawatan === selectedDate);
      let updatedVisits: DoctorVisit[];
      if (existingVisitIndex >= 0) {
        updatedVisits = [...prev];
        updatedVisits[existingVisitIndex] = {
          ...updatedVisits[existingVisitIndex],
          catatanPakar: quickNoteText
        };
      } else {
        const targetPatient = patients.find(p => p.id === patientId);
        const newVisit: DoctorVisit = {
          id: `doc_${patientId}_${Date.now()}`,
          patientId,
          patientName: targetPatient?.nama || 'Pesakit',
          namaDoktor: 'Dr. Sarah binti Mohamad Noor',
          jawatanDoktor: 'Pakar Perubatan Nephrologi',
          tarikhLawatan: selectedDate,
          masa: '10:00 AM',
          status: 'SELESAI',
          tujuan: 'Rounds Bulanan',
          catatanPakar: quickNoteText,
          notifikasiDihantar: false
        };
        updatedVisits = [newVisit, ...prev];
      }
      localStorage.setItem('kaizenbros_doctor_visits', JSON.stringify(updatedVisits));
      return updatedVisits;
    });

    setActiveEditingPatientId(null);
    setQuickNoteText('');
  };

  const handleOpenReportModal = (patient: Patient) => {
    setSelectedPatientForReport(patient);
    setIsReportModalOpen(true);
  };

  const handlePrintDailySummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Walkthrough Guide for New Staff / Nurse */}
      <NurseWalkthroughGuide tabId="ringkasan_klinikal" isAdminAuthenticated={true} />

      {/* Top Banner / Header Controls (Hidden in Print) */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-xl print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-xs">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">Ringkasan Klinikal Harian</h1>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[11px] rounded-full border border-emerald-500/30">
                  Daily Roster & Notes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Senarai kehadiran janji temu pesakit, stesen dialisis, dan nota pantas doktor bagi tarikh pilihan.
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Picker */}
            <div className="flex items-center space-x-2 bg-[#0F172A] border border-[#374151] px-3 py-2 rounded-xl text-xs">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-semibold hidden sm:inline">Tarikh:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-emerald-400 font-bold focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrintDailySummary}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Ringkasan Harian</span>
            </button>
          </div>
        </div>

        {/* Quick Date Shortcuts */}
        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-[#1F2937] text-xs">
          <span className="text-slate-400 font-medium">Pintas Tarikh:</span>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              selectedDate === todayStr ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-[#1E293B] text-slate-300 hover:bg-slate-800'
            }`}
          >
            Hari Ini ({todayStr})
          </button>
        </div>
      </div>

      {/* Printable Header Banner (Only visible during print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-black uppercase text-slate-900">{centreInfo.nama || 'Pusat Dialisis KaizenBros'}</h1>
            <p className="text-xs text-slate-700 font-bold">RINGKASAN KLINIKAL HARIAN PESAKIT & ARAHAN DOKTOR</p>
            <p className="text-[10px] text-slate-600">Tarikh Roster: <strong>{selectedDate}</strong> • Lesen KKM: {centreInfo.noPendaftaranKKM}</p>
          </div>
          <div className="text-right text-[10px] font-mono text-slate-600">
            <div>Jumlah Pesakit: {filteredRoster.length}</div>
            <div>Tarikh Cetak: {new Date().toLocaleDateString('ms-MY')}</div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards (Hidden during print) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 print:hidden">
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium block">Janji Temu Hari Ini</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">{totalAppointments}</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium block">Hadir / Selesai</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">{hadirCount} <span className="text-xs text-slate-500 font-normal">({selesaiCount} selesai)</span></span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium block">Menunggu / Akan Datang</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">{menungguCount}</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium block">Tidak Hadir / Batal</span>
            <span className="text-2xl font-black text-rose-400 font-mono mt-0.5 block">{tidakHadirCount}</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar (Hidden during print) */}
      <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari pesakit, IC, atau stesen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-[#374151] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Shift Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Shift:</span>
          {['ALL', 'PAGI', 'TENGAHARI', 'PETANG', 'MALAM'].map(shift => (
            <button
              key={shift}
              onClick={() => setFilterShift(shift)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                filterShift === shift ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-[#0F172A] text-slate-400 hover:text-white border border-[#374151]'
              }`}
            >
              {shift === 'ALL' ? 'Semua Shift' : `Sesi ${shift}`}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0F172A] border border-[#374151] text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="AKAN_DATANG">Menunggu / Akan Datang</option>
            <option value="SEDANG_BERJALAN">Sedang Dalam Sesi</option>
            <option value="SELESAI">Selesai Rawatan</option>
            <option value="TIDAK_HADIR">Tidak Hadir / Batal</option>
          </select>
        </div>
      </div>

      {/* Patient Roster List */}
      <div className="space-y-4">
        {filteredRoster.length === 0 ? (
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <ClipboardList className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Tiada Janji Temu Ditemui</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tiada rekod pesakit bagi tarikh <strong>{selectedDate}</strong> mengikut tetapan carian atau penapis semasa.
            </p>
          </div>
        ) : (
          filteredRoster.map(({ patient, session, doctorVisit, latestBloodTest }) => {
            const isEditingThis = activeEditingPatientId === patient.id;
            const hasDoctorNote = Boolean(session.notaKlinikal || doctorVisit?.catatanPakar);

            return (
              <div 
                key={patient.id} 
                className="bg-[#111827] border border-[#1F2937] hover:border-[#374151] rounded-2xl p-5 shadow-xl transition space-y-4 print:bg-white print:border-2 print:border-slate-800 print:text-slate-900 print:p-3 print:rounded-xl print:space-y-2 page-break-inside-avoid"
              >
                
                {/* Row Header: Patient Demographics & Session Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2937] print:border-slate-300 pb-3">
                  
                  {/* Left: Patient Info */}
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black font-mono text-sm shrink-0 print:bg-slate-100 print:text-slate-900 print:border-slate-400">
                      S#{session.stesenNo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-black text-white text-base print:text-slate-900">{patient.nama}</h2>
                        <span className="font-mono text-xs text-slate-400 print:text-slate-600">({patient.noIC})</span>
                        <span className="px-2 py-0.5 bg-[#1E293B] text-slate-300 font-mono text-[10px] rounded border border-[#374151] print:border-slate-400 print:bg-slate-100 print:text-slate-800">
                          {patient.penaja}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 print:text-slate-700 mt-0.5">
                        <span>Akses: <strong>{patient.jenisAkses} ({patient.lokasiAkses})</strong></span>
                        <span>•</span>
                        <span>Berat Kering: <strong>{patient.beratKering} kg</strong></span>
                        <span>•</span>
                        <span>Telefon: <strong className="font-mono">{patient.noTelefon}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Station & Shift Badge */}
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-[#0F172A] border border-[#374151] rounded-xl font-mono text-xs text-cyan-300 font-bold print:bg-slate-100 print:text-slate-900">
                      Sesi {session.shift} ({session.masaMula} - {session.masaTamat})
                    </span>

                    {/* Interactive Attendance Status Selector */}
                    <div className="print:hidden">
                      <select
                        value={session.status}
                        onChange={(e) => handleUpdateStatus(patient.id, e.target.value as TreatmentSession['status'])}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs focus:outline-hidden cursor-pointer border ${
                          session.status === 'SELESAI' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : session.status === 'SEDANG_BERJALAN'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : session.status === 'TIDAK_HADIR'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        <option value="AKAN_DATANG" className="bg-[#111827] text-white">⏳ Menunggu / Akan Datang</option>
                        <option value="SEDANG_BERJALAN" className="bg-[#111827] text-white">🔄 Sedang Dalam Sesi</option>
                        <option value="SELESAI" className="bg-[#111827] text-white">✅ Selesai Rawatan</option>
                        <option value="TIDAK_HADIR" className="bg-[#111827] text-white">❌ Tidak Hadir / Batal</option>
                      </select>
                    </div>

                    {/* Print Status Badge */}
                    <span className="hidden print:inline-block font-mono font-bold text-xs uppercase px-2 py-0.5 border rounded">
                      Status: {session.status}
                    </span>
                  </div>

                </div>

                {/* Patient Key Bio-Markers & Doctor Note Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Left Column: Recent Lab Parameters Summary */}
                  <div className="bg-[#0F172A] border border-[#1F2937] p-3 rounded-xl text-xs space-y-2 print:bg-slate-50 print:border-slate-300">
                    <div className="font-bold text-slate-300 print:text-slate-900 flex items-center justify-between border-b border-[#1F2937] print:border-slate-300 pb-1">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Parameter Biokimia Terkini</span>
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400">
                        {latestBloodTest ? latestBloodTest.tarikhUjian : 'Tiada Lab'}
                      </span>
                    </div>

                    {latestBloodTest ? (
                      <div className="grid grid-cols-3 gap-2 text-center font-mono">
                        <div className="bg-[#1E293B] p-1.5 rounded border border-[#374151] print:bg-white print:border-slate-300">
                          <span className="text-[9px] text-slate-400 block font-semibold">Hb</span>
                          <span className="font-bold text-white print:text-slate-900">{latestBloodTest.hb} g/dL</span>
                        </div>
                        <div className="bg-[#1E293B] p-1.5 rounded border border-[#374151] print:bg-white print:border-slate-300">
                          <span className="text-[9px] text-slate-400 block font-semibold">K+ (Kalium)</span>
                          <span className="font-bold text-rose-400 print:text-rose-800">{latestBloodTest.potassium} mmol/L</span>
                        </div>
                        <div className="bg-[#1E293B] p-1.5 rounded border border-[#374151] print:bg-white print:border-slate-300">
                          <span className="text-[9px] text-slate-400 block font-semibold">Kt/V</span>
                          <span className="font-bold text-emerald-400 print:text-emerald-800">{latestBloodTest.ktV}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic text-[11px]">Tiada rekod ujian darah dimuat naik.</p>
                    )}
                  </div>

                  {/* Middle Column: Doctor's Quick Note & Clinical Instructions */}
                  <div className="lg:col-span-2 bg-[#0F172A] border border-[#1F2937] p-3 rounded-xl text-xs space-y-2 print:bg-slate-50 print:border-slate-300">
                    <div className="flex items-center justify-between border-b border-[#1F2937] print:border-slate-300 pb-1">
                      <span className="font-bold text-amber-400 print:text-slate-900 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-amber-400" />
                        <span>Nota Pantas Doktor & Arahan Klinikal Sesi:</span>
                      </span>

                      {/* Add/Edit Note Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveEditingPatientId(patient.id);
                          setQuickNoteText(session.notaKlinikal || doctorVisit?.catatanPakar || '');
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 print:hidden cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{hasDoctorNote ? 'Kemaskini Nota' : 'Tambah Nota Doktor'}</span>
                      </button>
                    </div>

                    {/* Inline Editor or Displayed Note */}
                    {isEditingThis ? (
                      <div className="space-y-2 pt-1 print:hidden">
                        <textarea
                          value={quickNoteText}
                          onChange={(e) => setQuickNoteText(e.target.value)}
                          rows={2}
                          className="w-full p-2 bg-[#1E293B] border border-[#374151] rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                          placeholder="Masukkan nota klinikal / arahan khas doktor untuk sesi ini..."
                        />

                        {/* Quick Tag Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400">Tag Pantas:</span>
                          {[
                            'Kawal UF Goal < 2.5L',
                            'Pantau BP Pre-HD Drop',
                            'Suntikan EPO 4000 IU Pasca-Dialisis',
                            'Nasihat Kurangkan Pengambilan Kalium',
                            'Fistula Thrill Baiki'
                          ].map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setQuickNoteText(prev => prev ? `${prev} • ${tag}` : tag)}
                              className="px-2 py-0.5 bg-[#1E293B] hover:bg-slate-800 text-emerald-300 rounded border border-[#374151] transition"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveEditingPatientId(null)}
                            className="px-3 py-1 bg-[#1E293B] text-slate-300 rounded-lg text-xs"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveQuickNote(patient.id)}
                            className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Simpan Nota</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-300 print:text-slate-900 italic text-xs leading-relaxed">
                        {hasDoctorNote ? (
                          <p>"{session.notaKlinikal || doctorVisit?.catatanPakar}"</p>
                        ) : (
                          <p className="text-slate-500 italic">Tiada arahan khas daripada doktor untuk sesi ini.</p>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer Action Bar for Patient Card (Hidden during print) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1F2937] text-xs print:hidden">
                  <div className="text-slate-400 text-[11px]">
                    Jururawat Bertugas: <strong className="text-white">{session.jururawatBertugas || 'Sister Hanim'}</strong>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* One-Click Hospital Referral Letter */}
                    {onOpenHospitalReferral && (
                      <button
                        type="button"
                        onClick={() => onOpenHospitalReferral(patient)}
                        className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-semibold rounded-xl border border-rose-800/80 transition flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <Ambulance className="w-3.5 h-3.5 text-rose-400" />
                        <span>Surat Rujukan Hospital</span>
                      </button>
                    )}

                    {/* View/Print Patient Medical Report Modal */}
                    <button
                      type="button"
                      onClick={() => handleOpenReportModal(patient)}
                      className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-800 text-emerald-400 font-semibold rounded-xl border border-[#374151] transition flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Cetak Laporan Perubatan PDF</span>
                    </button>

                    {/* Send WhatsApp Reminder */}
                    <a
                      href={buildWhatsAppLink(
                        patient.noTelefon,
                        createSessionReminderMessage(patient, session)
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl border border-emerald-500/20 transition flex items-center gap-1.5 text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Pesakit / Waris</span>
                    </a>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Patient Medical Report PDF Modal */}
      {selectedPatientForReport && (
        <MedicalReportPdfModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          patient={selectedPatientForReport}
          bloodTests={bloodTests}
          doctorVisits={doctorVisits}
          centreInfo={centreInfo}
          defaultViewMode="VERTICAL_3_TESTS"
        />
      )}

    </div>
  );
};
