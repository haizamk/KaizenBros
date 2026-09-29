import React, { useState } from 'react';
import { StaffMember, AdminRoleLevel, CustomModulePermissions } from '../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Shield, 
  Crown, 
  Sliders, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X, 
  Save, 
  Search, 
  Phone, 
  Mail, 
  Briefcase, 
  Award, 
  Calendar, 
  User, 
  KeyRound, 
  Sparkles,
  Lock,
  Building2,
  FileText,
  BadgeCheck,
  Check
} from 'lucide-react';

interface StaffManagementViewProps {
  staffList: StaffMember[];
  currentAdminStaff: StaffMember | null;
  onUpdateStaffList: (updatedStaff: StaffMember[]) => void;
  onOpenSelfProfile: () => void;
  onOpenAdminRoleManagement?: (tab?: 'ROLES' | 'PAGES') => void;
}

const DEFAULT_CUSTOM_PERMISSIONS: CustomModulePermissions = {
  profilPusat: false,
  pendaftaranPesakit: true,
  jadualRawatan: true,
  ujianDarah: true,
  lawatanDoktor: true,
  ringkasanKlinikal: true,
  permohonanStaf: false,
  jawatanKosong: false,
  whatsapp: true,
  kewangan: false,
  analitik: false,
  sandaranSystem: false,
  pengurusanAkses: false
};

const MODULE_LABELS: { key: keyof CustomModulePermissions; label: string; desc: string }[] = [
  { key: 'profilPusat', label: 'Profil Pusat & Tetapan KKM', desc: 'Akses tetapan maklumat lesen & profil pusat' },
  { key: 'pendaftaranPesakit', label: 'Pendaftaran Pesakit', desc: 'Akses borang pendaftaran & senarai pesakit' },
  { key: 'jadualRawatan', label: 'Jadual & Sesi Rawatan', desc: 'Akses jadual shift & stesen dialisis harian' },
  { key: 'ujianDarah', label: 'Ujian Darah & PDF Imbasan', desc: 'Akses rekod keputusan lab & pengesyoran AI' },
  { key: 'lawatanDoktor', label: 'Lawatan Doktor & Nota Pakar', desc: 'Akses rekod perundingan & sejarah klinikal' },
  { key: 'ringkasanKlinikal', label: 'Ringkasan Klinikal Harian', desc: 'Akses borang pemantauan dialisis harian' },
  { key: 'permohonanStaf', label: 'Pengurusan Permohonan Staf', desc: 'Akses permohonan jawatan & borang kerjaya' },
  { key: 'jawatanKosong', label: 'Iklan Jawatan Kosong', desc: 'Akses senarai kekosongan & maklumat tugas' },
  { key: 'whatsapp', label: 'Notifikasi WhatsApp', desc: 'Akses penterjemah pautan & penghantaran pukal' },
  { key: 'kewangan', label: 'Kewangan & Resit A5', desc: 'Akses transaksi bayaran, subsidi & invois' },
  { key: 'analitik', label: 'Analitik KPI & Carta', desc: 'Akses statistik pesakit & prestasi pusat' },
  { key: 'sandaranSystem', label: 'Sandaran Data JSON (5-Tahun)', desc: 'Akses muat turun & pulih data sistem' },
  { key: 'pengurusanAkses', label: 'Pengurusan Level Akses Admin', desc: 'Akses tetapan peranan RBAC (Super Admin Sahaja)' }
];

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staffList,
  currentAdminStaff,
  onUpdateStaffList,
  onOpenSelfProfile,
  onOpenAdminRoleManagement
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'SEMUAM' | 'DOKTOR' | 'JURURAWAT' | 'PENTADBIR'>('SEMUAM');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // For Adding/Editing Staff Form
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    nama: '',
    jawatan: '',
    kategori: 'JURURAWAT',
    kelayakan: '',
    noPendaftaran: '',
    pengalamanTahun: 1,
    jadualBertugas: 'Isnin - Sabtu (Sesi Pagi & Tengahari)',
    emel: '',
    telefon: '',
    tentang: '',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    adminLevel: 'BIASA',
    customPermissions: DEFAULT_CUSTOM_PERMISSIONS
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const isSuperAdminOrWebmaster = currentAdminStaff?.adminLevel === 'SUPER_ADMIN' || currentAdminStaff?.adminLevel === 'WEBMASTER' || currentAdminStaff?.kategori === 'DOKTOR' || currentAdminStaff?.adminLevel === 'PENTADBIR';

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const filteredStaff = staffList.filter(s => {
    if (s.id === 'WEBMASTER-ROOT' || s.adminLevel === 'WEBMASTER') return false;
    const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.jawatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.noPendaftaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.emel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'SEMUAM' || s.kategori === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setFormData({
      nama: '',
      jawatan: 'Jururawat Dialisis Kanan (SRN)',
      kategori: 'JURURAWAT',
      kelayakan: 'Diploma dalam Kejururawatan (LJM) + Sijil Pos Basik Renal',
      noPendaftaran: `LJM ${Math.floor(10000 + Math.random() * 90000)}`,
      pengalamanTahun: 3,
      jadualBertugas: 'Isnin - Sabtu (Shift Bergilir)',
      emel: '',
      telefon: '012-',
      tentang: 'Jururawat berdedikasi menjaga kebajikan pesakit dialisis.',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
      adminLevel: 'BIASA',
      customPermissions: DEFAULT_CUSTOM_PERMISSIONS
    });
    setEditingStaff(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (s: StaffMember) => {
    setFormData(s);
    setEditingStaff(s);
    setIsAddModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.jawatan || !formData.emel) {
      alert('Sila isi semua maklumat mandatori (Nama, Jawatan, Emel).');
      return;
    }

    if (editingStaff) {
      // Update existing
      const updatedList = staffList.map(item => item.id === editingStaff.id ? { ...item, ...formData } as StaffMember : item);
      onUpdateStaffList(updatedList);
      showNotification(`Profil staf ${formData.nama} telah berjaya dikemaskini.`);
    } else {
      // Create new
      const newStaff: StaffMember = {
        id: `STAF-${Date.now()}`,
        nama: formData.nama || '',
        jawatan: formData.jawatan || '',
        kategori: formData.kategori || 'JURURAWAT',
        kelayakan: formData.kelayakan || 'Sijil Kejururawatan',
        noPendaftaran: formData.noPendaftaran || 'LJM-NEW',
        pengalamanTahun: formData.pengalamanTahun || 1,
        jadualBertugas: formData.jadualBertugas || 'Shift Normal',
        emel: formData.emel || '',
        telefon: formData.telefon || '012-0000000',
        tentang: formData.tentang || '',
        avatarUrl: formData.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
        adminLevel: formData.adminLevel || 'BIASA',
        customPermissions: formData.customPermissions || DEFAULT_CUSTOM_PERMISSIONS
      };
      onUpdateStaffList([newStaff, ...staffList]);
      showNotification(`Staf baharu ${formData.nama} telah berjaya ditambah ke direktori pusat.`);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteStaff = (staffId: string, staffNama: string) => {
    if (staffId === 'WEBMASTER-ROOT') {
      alert('Akaun Webmaster System Root tidak boleh dipadam.');
      return;
    }
    if (confirm(`Adakah anda pasti mahu memadam rekod staf "${staffNama}" dari sistem?`)) {
      const updated = staffList.filter(s => s.id !== staffId);
      onUpdateStaffList(updated);
      showNotification(`Rekod staf ${staffNama} telah dipadam.`);
    }
  };

  const getAdminBadge = (level?: AdminRoleLevel) => {
    switch (level) {
      case 'WEBMASTER':
        return <span className="bg-purple-950 text-purple-300 border border-purple-700/60 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1"><Crown className="w-3 h-3 text-amber-300" /> Webmaster</span>;
      case 'SUPER_ADMIN':
        return <span className="bg-amber-950 text-amber-300 border border-amber-700/60 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-amber-300" /> Super Admin</span>;
      case 'PENTADBIR':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /> Pentadbir</span>;
      case 'CUSTOM':
        return <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Sliders className="w-3 h-3 text-indigo-400" /> Akses Khusus</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md">Staf Biasa</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Action */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0F172A] to-emerald-950 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pengurusan Pasukan Klinikal KKM</span>
              </span>
              <span className="bg-amber-950 text-amber-300 border border-amber-700/60 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                Akses Pentadbir
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-serif">
              Direktori & Pengurusan Staf
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Urus peranan, nombor pendaftaran LJM/MMC, kelayakan, serta level akses pentadbiran bagi doktor, jururawat, dan pegawai perubatan pusat dialisis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenSelfProfile}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-600/50 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span>Profil Peribadi Saya</span>
            </button>

            {isSuperAdminOrWebmaster && (
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-950/80 transition-all flex items-center gap-2 cursor-pointer border border-emerald-300/40"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>Tambah Staf Baharu</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification toast */}
      {notificationMsg && (
        <div className="bg-emerald-950 border-2 border-emerald-400 text-emerald-200 px-4 py-3 rounded-xl text-xs font-bold shadow-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, jawatan, no LJM/MMC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0F172A] border border-[#374151] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
          {(['SEMUAM', 'DOKTOR', 'JURURAWAT', 'PENTADBIR'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-[#0F172A] text-slate-400 hover:text-slate-200 border border-[#1F2937]'
              }`}
            >
              {cat === 'SEMUAM' ? 'Semua Staf' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStaff.map((s) => (
          <div
            key={s.id}
            className="bg-[#111827] border-2 border-[#1F2937] hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between relative group"
          >
            <div>
              {/* Header card info */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={s.avatarUrl}
                    alt={s.nama}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500/50 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                        {s.kategori}
                      </span>
                      {getAdminBadge(s.adminLevel)}
                    </div>
                    <h3 className="text-sm font-extrabold text-white mt-1 group-hover:text-emerald-300 transition-colors">
                      {s.nama}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium line-clamp-1">
                      {s.jawatan}
                    </p>
                  </div>
                </div>
              </div>

              {/* Staff Credentials Details */}
              <div className="space-y-2 bg-[#0F172A] border border-[#1F2937] p-3 rounded-xl text-xs text-slate-300 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> No. Pendaftaran:
                  </span>
                  <span className="font-mono font-bold text-amber-300">{s.noPendaftaran}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-teal-400" /> Pengalaman:
                  </span>
                  <span className="font-bold text-slate-200">{s.pengalamanTahun} Tahun</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" /> Emel:
                  </span>
                  <span className="font-mono text-[11px] text-slate-300 truncate max-w-[150px]">{s.emel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Telefon:
                  </span>
                  <span className="font-mono text-slate-200">{s.telefon}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300 block mb-0.5">Kelayakan Klinikal:</strong>
                <p className="line-clamp-2">{s.kelayakan}</p>
              </div>
            </div>

            {/* Actions footer */}
            <div className="mt-5 pt-3 border-t border-[#1F2937] flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">ID: {s.id}</span>

              {isSuperAdminOrWebmaster && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(s)}
                    className="p-2 bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Kemaskini Profil & Akses Staf"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  {s.id !== 'WEBMASTER-ROOT' && (
                    <button
                      onClick={() => handleDeleteStaff(s.id, s.nama)}
                      className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-xs transition cursor-pointer"
                      title="Padam Staf"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border-2 border-emerald-500/60 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950 border border-emerald-700 rounded-xl text-emerald-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-serif">
                    {editingStaff ? `Kemaskini Profil: ${editingStaff.nama}` : 'Tambah Staf Klinikal Baharu'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Borang pendaftaran data peribadi, nombor pendaftaran lesen LJM/MMC, & level akses admin.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nama Penuh Staf <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="e.g. SRN Siti Nurhaliza binti Othman"
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kategori Staf <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.kategori || 'JURURAWAT'}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="JURURAWAT">Jururawat (SRN / JM)</option>
                    <option value="DOKTOR">Doktor / Pakar Nefrologi</option>
                    <option value="PENTADBIR">Pentadbir / Pegawai Klinik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Jawatan Rasmi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jawatan || ''}
                    onChange={(e) => setFormData({ ...formData, jawatan: e.target.value })}
                    placeholder="e.g. Ketu Jururawat Dialisis (Sister)"
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    No. Pendaftaran LJM / MMC <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.noPendaftaran || ''}
                    onChange={(e) => setFormData({ ...formData, noPendaftaran: e.target.value })}
                    placeholder="e.g. LJM 84920 / MMC 38291"
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Emel Rasmi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.emel || ''}
                    onChange={(e) => setFormData({ ...formData, emel: e.target.value })}
                    placeholder="e.g. hanim@kaizenbrosdialysis.com.my"
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    No. Telefon <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.telefon || ''}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    placeholder="e.g. 012-384 9201"
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Pengalaman (Tahun)
                  </label>
                  <input
                    type="number"
                    value={formData.pengalamanTahun || 1}
                    onChange={(e) => setFormData({ ...formData, pengalamanTahun: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    URL Gambar Avatar / Foto Staf
                  </label>
                  <input
                    type="text"
                    value={formData.avatarUrl || ''}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Kelayakan Akademik & Pos Basik
                </label>
                <input
                  type="text"
                  value={formData.kelayakan || ''}
                  onChange={(e) => setFormData({ ...formData, kelayakan: e.target.value })}
                  placeholder="e.g. Diploma Kejururawatan (USM), Sijil Pos Basik Renal Dialisis KKM"
                  className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Jadual Shift Utama / Waktu Tugas
                </label>
                <input
                  type="text"
                  value={formData.jadualBertugas || ''}
                  onChange={(e) => setFormData({ ...formData, jadualBertugas: e.target.value })}
                  placeholder="e.g. Isnin - Sabtu (Sesi Pagi & Tengahari)"
                  className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>Simpan Rekod Staf</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
