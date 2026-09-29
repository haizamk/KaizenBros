import React, { useState } from 'react';
import { NurseWalkthroughGuide } from './NurseWalkthroughGuide';
import { JobApplication, JobVacancy } from '../types';
import { 
  Users, 
  Briefcase, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MessageSquare, 
  FileText, 
  Plus, 
  Calendar, 
  Award, 
  Phone, 
  Mail, 
  UserCheck, 
  UserX,
  ExternalLink,
  Edit,
  Trash2,
  Building2,
  Sparkles
} from 'lucide-react';
import { buildWhatsAppLink } from '../utils/whatsappHelper';

interface NewStaffRecruitmentViewProps {
  jobApplications: JobApplication[];
  jobVacancies: JobVacancy[];
  onUpdateJobApplication: (app: JobApplication) => void;
  onAddJobVacancy: (vacancy: JobVacancy) => void;
  onUpdateJobVacancy: (vacancy: JobVacancy) => void;
  onDeleteJobVacancy?: (id: string) => void;
}

export const NewStaffRecruitmentView: React.FC<NewStaffRecruitmentViewProps> = ({
  jobApplications,
  jobVacancies,
  onUpdateJobApplication,
  onAddJobVacancy,
  onUpdateJobVacancy,
  onDeleteJobVacancy
}) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'vacancies'>('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  // New Vacancy Form Modal state
  const [isNewVacancyModalOpen, setIsNewVacancyModalOpen] = useState(false);
  const [newVacancy, setNewVacancy] = useState<Omit<JobVacancy, 'id'>>({
    tajukJawatan: 'Jururawat Terlatih Dialisis',
    kategori: 'JURURAWAT',
    kekosongan: 2,
    kelayakanSingkat: 'Diploma Kejururawatan (LJM) + Sijil Pos Basik Renal',
    gajiAtauFaedah: 'RM3,000 - RM4,500 + Elaun Syif',
    lokasi: 'Pusat Dialisis KaizenBros, Semenyih',
    status: 'BUKA',
    keterangan: 'Bertanggungjawab menguruskan rawatan hemodialisis pesakit, cannulation AVF, pemantauan mesin dialisis, dan kualiti penjagaan pesakit.'
  });

  const filteredApplications = jobApplications.filter((app) => {
    const matchesSearch = 
      app.namaPenuh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.noIC.includes(searchTerm) ||
      app.jawatanDipohon.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'SEMUA' || app.statusPermohonan === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countDalamSemakan = jobApplications.filter(a => a.statusPermohonan === 'DALAM_SEMAKAN').length;
  const countTemuduga = jobApplications.filter(a => a.statusPermohonan === 'PANGGIL_TEMUDUGA').length;
  const countDiterima = jobApplications.filter(a => a.statusPermohonan === 'DITERIMA').length;
  const countDitolak = jobApplications.filter(a => a.statusPermohonan === 'DITOLAK').length;

  const handleStatusChange = (app: JobApplication, newStatus: JobApplication['statusPermohonan']) => {
    const updated = { ...app, statusPermohonan: newStatus };
    onUpdateJobApplication(updated);
    if (selectedApp && selectedApp.id === app.id) {
      setSelectedApp(updated);
    }
  };

  const handleAdminNotesChange = (app: JobApplication, notes: string) => {
    const updated = { ...app, catatanAdmin: notes };
    onUpdateJobApplication(updated);
    if (selectedApp && selectedApp.id === app.id) {
      setSelectedApp(updated);
    }
  };

  const handleCreateVacancySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: JobVacancy = {
      id: `JV-${Date.now().toString().slice(-4)}`,
      ...newVacancy
    };
    onAddJobVacancy(created);
    setIsNewVacancyModalOpen(false);
  };

  const handleWhatsAppCandidate = (app: JobApplication) => {
    let msg = `Salam Tuan/Puan ${app.namaPenuh},\nKami dari *Pusat Dialisis KaizenBros* merujuk kepada permohonan jawatan *${app.jawatanDipohon}* (Ruj: ${app.id}).\n\n`;

    if (app.statusPermohonan === 'PANGGIL_TEMUDUGA') {
      msg += `Tahniah! Permohonan & resume anda telah disemak. Kami ingin menjemput anda untuk menghadiri *Sesi Temuduga Bersemuka* di klinik kami.\n\nSila maklumkan tarikh & masa terluang anda. Terima kasih.`;
    } else if (app.statusPermohonan === 'DITERIMA') {
      msg += `Tahniah! Anda telah *DITERIMA* untuk menyertai pasukan perubatan KaizenBros Dialysis sebagai ${app.jawatanDipohon}.\n\nSurat tawaran rasmi akan dihantar ke emel ${app.emel}. Terima kasih!`;
    } else {
      msg += `Permohonan anda kini dalam *Semakan Pentadbiran & Sumber Manusia*. Sila balas mesej ini jika anda ada sebarang pertanyaan. Terima kasih.`;
    }

    window.open(buildWhatsAppLink(app.noTelefon, msg), '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      {/* Walkthrough Guide for New Staff / Nurse */}
      <NurseWalkthroughGuide tabId="permohonan_kerjaya" isAdminAuthenticated={true} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#111827] via-[#0F172A] to-[#0A0C10] p-6 rounded-2xl border border-[#1F2937] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold">
              Modul Admin Sumber Manusia KKM
            </span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {jobApplications.length} Permohonan Terkini
            </span>
          </div>
          <h1 className="text-2xl font-black text-white font-serif flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Pengurusan Permohonan Pekerja Baru & Jururawat</span>
          </h1>
          <p className="text-xs text-slate-400">
            Semak borang calon permohonan kerja, kelayakan LJM, muat turun resume, tetapkan status temuduga, dan hubungi calon melalui WhatsApp.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsNewVacancyModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jawatan Kosong Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937]">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Dalam Semakan</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{countDalamSemakan}</div>
          <p className="text-[10px] text-slate-400">Borang baru belum temuduga</p>
        </div>

        <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937]">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Dipanggil Temuduga</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">{countTemuduga}</div>
          <p className="text-[10px] text-slate-400">Jemputan sesi bersemuka</p>
        </div>

        <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937]">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Diterima Bekerja</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{countDiterima}</div>
          <p className="text-[10px] text-slate-400">Sedia dilantik berkhidmat</p>
        </div>

        <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937]">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Jawatan Kosong Aktif</span>
            <Briefcase className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-teal-300 font-mono">
            {jobVacancies.filter(v => v.status === 'BUKA').length}
          </div>
          <p className="text-[10px] text-slate-400">Ditayangkan di frontpage</p>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center border-b border-[#1F2937] space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'applications'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Senarai Permohonan Calon ({filteredApplications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vacancies')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'vacancies'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Pengurusan Jawatan Kosong ({jobVacancies.length})</span>
        </button>
      </div>

      {/* Tab 1: Applicants List & Management */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111827] p-3.5 rounded-xl border border-[#1F2937]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama calon, No. IC, atau jawatan dipohon..."
                className="w-full pl-9 pr-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="SEMUA">Semua Status Permohonan</option>
                <option value="DALAM_SEMAKAN">Dalam Semakan</option>
                <option value="PANGGIL_TEMUDUGA">Panggil Temuduga</option>
                <option value="DITERIMA">Diterima</option>
                <option value="DITOLAK">Ditolak</option>
              </select>
            </div>
          </div>

          {/* Applications Table / Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List View */}
            <div className="lg:col-span-2 space-y-3">
              {filteredApplications.length === 0 ? (
                <div className="p-8 text-center bg-[#111827] rounded-xl border border-[#1F2937] text-slate-400 text-xs">
                  Tiada rekod permohonan calon ditemui mengikut carian.
                </div>
              ) : (
                filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      selectedApp?.id === app.id
                        ? 'bg-[#131F30] border-emerald-500 shadow-lg'
                        : 'bg-[#111827] border-[#1F2937] hover:border-[#374151]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F2937] text-emerald-400 font-bold border border-[#374151]">
                            {app.id}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Mohon: {app.tarikhMohon}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{app.namaPenuh}</span>
                          {app.noPendaftaranLJM && (
                            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                              {app.noPendaftaranLJM}
                            </span>
                          )}
                        </h3>

                        <p className="text-xs text-emerald-400 font-semibold">
                          Jawatan: {app.jawatanDipohon}
                        </p>

                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 pt-1">
                          <span>IC: {app.noIC}</span>
                          <span>•</span>
                          <span>Tel: {app.noTelefon}</span>
                          <span>•</span>
                          <span>Pengalaman: {app.pengalamanTahun} Tahun</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                        app.statusPermohonan === 'PANGGIL_TEMUDUGA'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                          : app.statusPermohonan === 'DITERIMA'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : app.statusPermohonan === 'DITOLAK'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}>
                        {app.statusPermohonan.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selected Applicant Details Drawer / Box */}
            <div className="space-y-4">
              {selectedApp ? (
                <div className="bg-[#111827] p-5 rounded-2xl border border-emerald-500/40 space-y-4 text-xs sticky top-24">
                  <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                        {selectedApp.id}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{selectedApp.namaPenuh}</h3>
                      <p className="text-[11px] text-slate-400">{selectedApp.jawatanDipohon}</p>
                    </div>

                    <button
                      onClick={() => handleWhatsAppCandidate(selectedApp)}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 text-slate-300">
                    <div>
                      <span className="text-slate-500 block">No. IC (MyKad):</span>
                      <span className="font-mono text-white font-bold">{selectedApp.noIC}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Hubungi & Emel:</span>
                      <span className="text-white font-semibold">{selectedApp.noTelefon}</span> • {selectedApp.emel}
                    </div>

                    <div>
                      <span className="text-slate-500 block">Kelayakan Akademik & Sijil:</span>
                      <span className="text-slate-100 font-medium">{selectedApp.kelayakanPendidikan}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#0F172A] p-2.5 rounded-lg border border-[#1F2937]">
                      <div>
                        <span className="text-slate-500 block">No. LJM:</span>
                        <span className="font-mono text-cyan-300">{selectedApp.noPendaftaranLJM || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Pengalaman:</span>
                        <span className="font-bold text-white">{selectedApp.pengalamanTahun} Tahun</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Tarikh Boleh Mula Work:</span>
                      <span className="font-mono text-amber-300 font-bold">{selectedApp.tarikhBolehMula}</span>
                    </div>

                    {selectedApp.notaCalon && (
                      <div className="p-2.5 bg-[#0F172A] rounded-lg border border-[#1F2937]">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Ringkasan Pengalaman Calon:</span>
                        <p className="text-slate-300 italic pt-0.5">{selectedApp.notaCalon}</p>
                      </div>
                    )}

                    {/* Resume attachment inspection */}
                    <div className="p-3 bg-[#0A0C10] rounded-xl border border-emerald-500/30 space-y-2">
                      <span className="font-bold text-emerald-400 block">📄 Fail Resume & Sijil</span>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 truncate">{selectedApp.failResume || 'Resume_Calon.pdf'}</span>
                        <button
                          onClick={() => {
                            if (selectedApp.fileDataUrl && selectedApp.fileDataUrl.trim() !== '') {
                              const w = window.open();
                              w?.document.write(`<iframe src="${selectedApp.fileDataUrl}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            } else {
                              alert(`Pratonton Resume: ${selectedApp.failResume}\nResume calon telah disimpan dengan selamat.`);
                            }
                          }}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-semibold shrink-0"
                        >
                          Buka Resume
                        </button>
                      </div>
                    </div>

                    {/* Status Changer */}
                    <div className="pt-2 space-y-1.5 border-t border-[#1F2937]">
                      <label className="block font-bold text-slate-200">Kemaskini Status Permohonan:</label>
                      <select
                        value={selectedApp.statusPermohonan}
                        onChange={(e) => handleStatusChange(selectedApp, e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-white font-bold focus:border-emerald-500 focus:outline-hidden"
                      >
                        <option value="DALAM_SEMAKAN">Dalam Semakan HR</option>
                        <option value="PANGGIL_TEMUDUGA">Panggil Temuduga Bersemuka</option>
                        <option value="DITERIMA">Diterima Bekerja (Tawaran Jawatan)</option>
                        <option value="DITOLAK">Ditolak / Tidak Memenuhi Syarat</option>
                      </select>
                    </div>

                    {/* Admin Notes */}
                    <div className="space-y-1">
                      <label className="block text-slate-400 text-[11px]">Catatan Temuduga / Ulasan HR Admin:</label>
                      <textarea
                        rows={2}
                        value={selectedApp.catatanAdmin || ''}
                        onChange={(e) => handleAdminNotesChange(selectedApp, e.target.value)}
                        placeholder="Contoh: Pengalaman AVF cannulation mantap, dipanggil temuduga 10 Sept jam 10 pagi..."
                        className="w-full px-3 py-1.5 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-[#111827] rounded-xl border border-[#1F2937] text-slate-400 text-xs">
                  Sila pilih satu borang permohonan calon daripada senarai di sebelah untuk melihat butiran & membuat penilaian.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vacancies Management */}
      {activeTab === 'vacancies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#111827] p-4 rounded-xl border border-[#1F2937]">
            <div>
              <h3 className="text-sm font-bold text-white">Senarai Jawatan Kosong Aktif ({jobVacancies.length})</h3>
              <p className="text-xs text-slate-400">Jawatan di bawah akan dipaparkan secara automatik dalam banner marketing frontpage.</p>
            </div>
            <button
              onClick={() => setIsNewVacancyModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Cipta Vacancy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobVacancies.map((v) => (
              <div key={v.id} className="p-5 bg-[#111827] rounded-xl border border-[#1F2937] space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                      {v.id} • {v.kategori}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">{v.tajukJawatan}</h4>
                    <span className="text-xs text-emerald-400 font-semibold font-mono">{v.gajiAtauFaedah}</span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    v.status === 'BUKA' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}>
                    {v.status === 'BUKA' ? 'PERMOHONAN DIBUKA' : 'DITUTUP'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300 border-t border-[#1F2937] pt-2">
                  <div><span className="text-slate-500">Kekosongan:</span> <strong className="text-white font-mono">{v.kekosongan} Orang</strong></div>
                  <div><span className="text-slate-500">Kelayakan:</span> {v.kelayakanSingkat}</div>
                  <div><span className="text-slate-500">Tugas:</span> {v.keterangan}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1F2937]">
                  <button
                    onClick={() => {
                      const updated = { ...v, status: v.status === 'BUKA' ? 'TUTUP' : 'BUKA' as any };
                      onUpdateJobVacancy(updated);
                    }}
                    className="px-3 py-1 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded text-xs font-semibold transition"
                  >
                    Tukar Status ({v.status === 'BUKA' ? 'Tutup' : 'Buka'})
                  </button>

                  {onDeleteJobVacancy && (
                    <button
                      onClick={() => onDeleteJobVacancy(v.id)}
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold p-1"
                    >
                      Padam
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create New Vacancy */}
      {isNewVacancyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span>Tambah Jawatan Kosong Baru</span>
              </h3>
              <button onClick={() => setIsNewVacancyModalOpen(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateVacancySubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tajuk Jawatan Kosong *</label>
                <input
                  type="text"
                  required
                  value={newVacancy.tajukJawatan}
                  onChange={(e) => setNewVacancy({ ...newVacancy, tajukJawatan: e.target.value })}
                  placeholder="e.g. Ketua Jururawat Dialisis (Sister)"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kategori Jawatan</label>
                  <select
                    value={newVacancy.kategori}
                    onChange={(e) => setNewVacancy({ ...newVacancy, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-white text-xs"
                  >
                    <option value="JURURAWAT">Jururawat</option>
                    <option value="PEMBANTU_PERUBATAN">Pembantu Perubatan (MA)</option>
                    <option value="DOKTOR">Doktor</option>
                    <option value="PENTADBIR">Pentadbir / Khidmat Pelanggan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Bilangan Kekosongan</label>
                  <input
                    type="number"
                    min={1}
                    value={newVacancy.kekosongan}
                    onChange={(e) => setNewVacancy({ ...newVacancy, kekosongan: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Syarat & Kelayakan Singkat</label>
                <input
                  type="text"
                  value={newVacancy.kelayakanSingkat}
                  onChange={(e) => setNewVacancy({ ...newVacancy, kelayakanSingkat: e.target.value })}
                  placeholder="Diploma Kejururawatan + LJM Berdaftar"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Gaji & Elaun Syif</label>
                <input
                  type="text"
                  value={newVacancy.gajiAtauFaedah}
                  onChange={(e) => setNewVacancy({ ...newVacancy, gajiAtauFaedah: e.target.value })}
                  placeholder="RM3,000 - RM4,500 + Elaun Syif"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Keterangan Tugas / Skop Kerja</label>
                <textarea
                  rows={2}
                  value={newVacancy.keterangan}
                  onChange={(e) => setNewVacancy({ ...newVacancy, keterangan: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setIsNewVacancyModalOpen(false)}
                  className="px-4 py-2 bg-[#1F2937] text-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 font-bold text-slate-950 rounded-lg"
                >
                  Simpan Vacancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
