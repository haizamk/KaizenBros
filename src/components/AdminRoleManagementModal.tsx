import React, { useState, useEffect } from 'react';
import { StaffMember, AdminRoleLevel, CustomModulePermissions, AdminPageVisibility, DEFAULT_ADMIN_PAGE_VISIBILITY } from '../types';
import { 
  ShieldCheck, 
  Crown, 
  Shield, 
  Sliders, 
  UserCheck, 
  Check, 
  X, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  KeyRound, 
  Building2, 
  Users, 
  Settings, 
  Sparkles,
  Info,
  ChevronRight,
  Eye,
  EyeOff,
  UserPlus,
  CalendarDays,
  Activity,
  Stethoscope,
  CreditCard,
  MessageSquareShare,
  BarChart3,
  Briefcase,
  ClipboardList,
  Search,
  RotateCcw,
  Palmtree
} from 'lucide-react';

interface AdminRoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  currentAdminStaff: StaffMember | null;
  onUpdateStaffList: (updatedStaff: StaffMember[]) => void;
  adminPageVisibility?: AdminPageVisibility;
  onUpdatePageVisibility?: (visibility: AdminPageVisibility) => void;
  initialActiveTab?: 'ROLES' | 'PAGES';
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

interface PageVisibilityConfig {
  id: keyof AdminPageVisibility;
  name: string;
  category: 'Klinikal' | 'Pesakit' | 'Makmal' | 'Kewangan' | 'Sumber Manusia' | 'Komunikasi' | 'Laporan' | 'Awam';
  desc: string;
  icon: any;
  badgeColor: string;
  glowColor: string;
}

const ADMIN_PAGES_CONFIG: PageVisibilityConfig[] = [
  {
    id: 'ringkasan_klinikal',
    name: 'Ringkasan Klinikal Harian',
    category: 'Klinikal',
    desc: 'Borang pemantauan rawatan dialisis harian, hemodialysis flow sheet & parameter klinikal pesakit',
    icon: ClipboardList,
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
    glowColor: 'from-emerald-500/10 to-teal-500/5'
  },
  {
    id: 'pendaftaran',
    name: 'Direktori & Pendaftaran Pesakit',
    category: 'Pesakit',
    desc: 'Pendaftaran pesakit baharu, senarai pesakit rasmi, pra-pendaftaran & penilaian saringan klinikal',
    icon: UserPlus,
    badgeColor: 'bg-teal-950 text-teal-300 border-teal-700/60',
    glowColor: 'from-teal-500/10 to-cyan-500/5'
  },
  {
    id: 'jadual',
    name: 'Jadual Rawatan',
    category: 'Klinikal',
    desc: 'Jadual shift harian (Pagi/Tengahari/Petang), agihan stesen mesin dialisis FCFS & penetapan jururawat bertugas',
    icon: CalendarDays,
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-700/60',
    glowColor: 'from-blue-500/10 to-indigo-500/5'
  },
  {
    id: 'perubatan',
    name: 'Rekod & Ujian Darah',
    category: 'Makmal',
    desc: 'Keputusan makmal 5-tahun, parameter serologi, imbasan PDF AI, graf pemantauan & carta trend klinikal',
    icon: Activity,
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-700/60',
    glowColor: 'from-rose-500/10 to-pink-500/5'
  },
  {
    id: 'doktor',
    name: 'Lawatan Doktor',
    category: 'Klinikal',
    desc: 'Rekod perundingan pakar nefrologi, nota klinikal, preskripsi ubat & tarikh lawatan seterusnya',
    icon: Stethoscope,
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-700/60',
    glowColor: 'from-indigo-500/10 to-violet-500/5'
  },
  {
    id: 'kewangan',
    name: 'Kewangan & Resit A5',
    category: 'Kewangan',
    desc: 'Transaksi pembayaran sesi dialisis, subsidi penaja (SOCSO/JPA/Zakat/Yayasan) & jana resit rasmi A5',
    icon: CreditCard,
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
    glowColor: 'from-emerald-500/10 to-emerald-900/10'
  },
  {
    id: 'pengurusan_staf',
    name: 'Pengurusan Pasukan Staf',
    category: 'Sumber Manusia',
    desc: 'Direktori staf, jururawat dialisis, doktor pakar nefrologi & jadual giliran tugas kakitangan',
    icon: Users,
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-700/60',
    glowColor: 'from-purple-500/10 to-fuchsia-500/5'
  },
  {
    id: 'permohonan_kerjaya',
    name: 'Pengurusan Permohonan Staf',
    category: 'Sumber Manusia',
    desc: 'Semakan resume & permohonan jawatan jururawat/staf baharu, status temuduga & pengesahan tawaran kerja',
    icon: Briefcase,
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-700/60',
    glowColor: 'from-amber-500/10 to-orange-500/5'
  },
  {
    id: 'whatsapp',
    name: 'Notifikasi WhatsApp',
    category: 'Komunikasi',
    desc: 'Pusat peringatan automatik jadual sesi dialisis, notifikasi keputusan darah & pautan WhatsApp rasmi',
    icon: MessageSquareShare,
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
    glowColor: 'from-emerald-500/10 to-green-500/5'
  },
  {
    id: 'analitik',
    name: 'Analitik & KPI',
    category: 'Laporan',
    desc: 'Statistik pesakit aktif, kadar kecukupan dialisis (Kt/V), kapasiti mesin & carta prestasi pusat dialisis',
    icon: BarChart3,
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-700/60',
    glowColor: 'from-cyan-500/10 to-sky-500/5'
  },
  {
    id: 'profil',
    name: 'Profil Pusat & Tetapan KKM',
    category: 'Awam',
    desc: 'Maklumat pendaftaran KKM, nombor lesen pusat dialisis, waktu operasi & pasukan pengurusan pusat',
    icon: Building2,
    badgeColor: 'bg-slate-900 text-slate-300 border-slate-700/60',
    glowColor: 'from-slate-500/10 to-slate-800/10'
  },
  {
    id: 'portal_pesakit',
    name: 'Portal Pesakit',
    category: 'Awam',
    desc: 'Pautan antaramuka semakan kendiri rekod rawatan & keputusan ujian darah untuk pesakit dan waris',
    icon: UserCheck,
    badgeColor: 'bg-sky-950 text-sky-300 border-sky-700/60',
    glowColor: 'from-sky-500/10 to-blue-500/5'
  },
  {
    id: 'dialisis_pelancong',
    name: 'Rawatan Dialisis Pelancong',
    category: 'Awam',
    desc: 'Maklumat rawatan pelancong/pesakit luar, borang pertanyaan & semakan status tempahan slot dialisis bercuti',
    icon: Palmtree,
    badgeColor: 'bg-teal-950 text-teal-300 border-teal-700/60',
    glowColor: 'from-teal-500/10 to-emerald-500/5'
  },
  {
    id: 'kerjaya',
    name: 'Jawatan Kosong & Kerjaya',
    category: 'Awam',
    desc: 'Laman awam iklan jawatan kosong jururawat dialisis, permohonan staf & peluang kerjaya KaizenBros',
    icon: Briefcase,
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
    glowColor: 'from-emerald-500/10 to-teal-500/5'
  }
];

export const AdminRoleManagementModal: React.FC<AdminRoleManagementModalProps> = ({
  isOpen,
  onClose,
  staffList,
  currentAdminStaff,
  onUpdateStaffList,
  adminPageVisibility = DEFAULT_ADMIN_PAGE_VISIBILITY,
  onUpdatePageVisibility,
  initialActiveTab = 'ROLES'
}) => {
  const [modalTab, setModalTab] = useState<'ROLES' | 'PAGES'>(initialActiveTab);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<AdminRoleLevel>('BIASA');
  const [customPerms, setCustomPerms] = useState<CustomModulePermissions>(DEFAULT_CUSTOM_PERMISSIONS);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Page visibility state and search/filter
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('SEMUA');

  // Staff RBAC search & filter state
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'SEMUA' | AdminRoleLevel>('SEMUA');

  // Sync tab whenever modal opens or initialActiveTab changes
  useEffect(() => {
    if (isOpen) {
      setModalTab(initialActiveTab || 'ROLES');
    }
  }, [isOpen, initialActiveTab]);

  if (!isOpen) return null;

  // Trigger feedback banner
  const triggerSuccessAlert = (msg: string) => {
    setSuccessMessage(msg);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Toggle visibility of a specific page
  const handleTogglePageVisibility = (pageId: keyof AdminPageVisibility) => {
    if (!onUpdatePageVisibility) return;
    const currentStatus = adminPageVisibility[pageId] !== false;
    const updated: AdminPageVisibility = {
      ...adminPageVisibility,
      [pageId]: !currentStatus
    };
    onUpdatePageVisibility(updated);
    const pageItem = ADMIN_PAGES_CONFIG.find(p => p.id === pageId);
    triggerSuccessAlert(`Halaman "${pageItem?.name || pageId}" kini ${!currentStatus ? 'DIPAPARKAN' : 'DISEMBUNYIKAN'}!`);
  };

  // Show all pages
  const handleShowAllPages = () => {
    if (!onUpdatePageVisibility) return;
    const updated: AdminPageVisibility = { ...DEFAULT_ADMIN_PAGE_VISIBILITY };
    onUpdatePageVisibility(updated);
    triggerSuccessAlert('Semua halaman dalam Portal Admin kini DIPAPARKAN sepenuhnya!');
  };

  // Reset to default
  const handleResetDefaultPages = () => {
    if (!onUpdatePageVisibility) return;
    onUpdatePageVisibility({ ...DEFAULT_ADMIN_PAGE_VISIBILITY });
    triggerSuccessAlert('Tetapan paparan halaman telah dikembalikan kepada LALAI!');
  };

  // Hide all optional pages except essential clinical dashboard
  const handleHideNonEssentialPages = () => {
    if (!onUpdatePageVisibility) return;
    const updated: AdminPageVisibility = {
      ringkasan_klinikal: true,
      pendaftaran: true,
      jadual: true,
      perubatan: true,
      doktor: false,
      kewangan: false,
      pengurusan_staf: false,
      permohonan_kerjaya: false,
      whatsapp: false,
      analitik: false,
      profil: true,
      portal_pesakit: false
    };
    onUpdatePageVisibility(updated);
    triggerSuccessAlert('Halaman telah diringkaskan kepada modul klinikal teras sahaja!');
  };

  const handleStartEditing = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setSelectedLevel(staff.adminLevel || 'BIASA');
    setCustomPerms({
      ...DEFAULT_CUSTOM_PERMISSIONS,
      ...(staff.customPermissions || {})
    });
  };

  const handleToggleModulePerm = (key: keyof CustomModulePermissions) => {
    setCustomPerms(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveStaffRole = (staffId: string) => {
    const updated = staffList.map(s => {
      if (s.id === staffId) {
        return {
          ...s,
          adminLevel: selectedLevel,
          customPermissions: customPerms
        };
      }
      return s;
    });

    onUpdateStaffList(updated);
    setEditingStaffId(null);
    triggerSuccessAlert('Tetapan Level Akses Staf Berjaya Dikemaskini!');
  };

  const getLevelBadge = (level?: AdminRoleLevel) => {
    switch (level) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-950/90 text-amber-300 border border-amber-500/50 px-2.5 py-1 rounded-lg text-xs font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Super Admin (Owner)</span>
          </span>
        );
      case 'PENTADBIR':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-2.5 py-1 rounded-lg text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Pentadbir (Supervisor)</span>
          </span>
        );
      case 'CUSTOM':
        return (
          <span className="inline-flex items-center space-x-1 bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 px-2.5 py-1 rounded-lg text-xs font-bold">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>3. Custom (Staff Nurse)</span>
          </span>
        );
      case 'BIASA':
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-slate-800 text-slate-300 border border-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>4. Biasa (Nurse)</span>
          </span>
        );
    }
  };

  // Filtered pages for search & category
  const filteredPages = ADMIN_PAGES_CONFIG.filter((page) => {
    const matchesSearch = 
      page.name.toLowerCase().includes(pageSearchQuery.toLowerCase()) ||
      page.desc.toLowerCase().includes(pageSearchQuery.toLowerCase()) ||
      page.category.toLowerCase().includes(pageSearchQuery.toLowerCase());
    
    const matchesCat = 
      selectedCategoryFilter === 'SEMUA' || 
      page.category.toUpperCase() === selectedCategoryFilter.toUpperCase();

    return matchesSearch && matchesCat;
  });

  const totalVisibleCount = ADMIN_PAGES_CONFIG.filter(
    (p) => adminPageVisibility[p.id] !== false
  ).length;

  const totalHiddenCount = ADMIN_PAGES_CONFIG.length - totalVisibleCount;

  const filteredStaffList = staffList
    .filter((staff) => staff.id !== 'WEBMASTER-ROOT' && staff.adminLevel !== 'WEBMASTER')
    .filter((staff) => {
      if (staffRoleFilter !== 'SEMUA') {
        const level = staff.adminLevel || 'BIASA';
        if (level !== staffRoleFilter) return false;
      }
      if (!staffSearchQuery.trim()) return true;
      const q = staffSearchQuery.toLowerCase();
      return (
        staff.nama.toLowerCase().includes(q) ||
        (staff.jawatan && staff.jawatan.toLowerCase().includes(q)) ||
        (staff.noPendaftaran && staff.noPendaftaran.toLowerCase().includes(q))
      );
    });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-[#0F172A] border border-[#1F2937] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded uppercase tracking-wider">
                  Tetapan Akses & Halaman
                </span>
                <span className="text-xs text-slate-400 font-mono">Modul Kawalan Admin</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white font-serif">
                Tetapan Akses Admin & Keterlihatan Halaman (Hide / Show Pages)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Top Tabs - High Visibility Segmented Switch */}
        <div className="bg-[#0B1120] border-b border-[#1F2937] p-3 sm:p-4 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#0F172A] p-1.5 rounded-2xl border border-[#1F2937]">
            <button
              type="button"
              id="modal-tab-btn-roles"
              onClick={() => setModalTab('ROLES')}
              className={`py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition flex items-center justify-center space-x-2.5 cursor-pointer border ${
                modalTab === 'ROLES'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-950/80 scale-[1.01]'
                  : 'bg-[#111827] text-slate-300 hover:text-white border-[#1F2937] hover:border-slate-600'
              }`}
            >
              <Crown className={`w-4 h-4 shrink-0 ${modalTab === 'ROLES' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="font-bold">1. Level Akses Staf (RBAC)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                modalTab === 'ROLES' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-amber-300'
              }`}>
                {staffList.length} Staf
              </span>
            </button>

            <button
              type="button"
              id="modal-tab-btn-pages"
              onClick={() => setModalTab('PAGES')}
              className={`py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition flex items-center justify-center space-x-2.5 cursor-pointer border ${
                modalTab === 'PAGES'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-950/80 scale-[1.01]'
                  : 'bg-[#111827] text-slate-300 hover:text-white border-[#1F2937] hover:border-slate-600'
              }`}
            >
              <Eye className={`w-4 h-4 shrink-0 ${modalTab === 'PAGES' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span className="font-bold">2. Kawalan Paparan Halaman</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                modalTab === 'PAGES' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-emerald-300'
              }`}>
                {totalVisibleCount} Papar / {totalHiddenCount} Disorok
              </span>
            </button>
          </div>
        </div>

        {/* Notification Alert if Saved */}
        {savedSuccess && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-emerald-950/90 border border-emerald-500/70 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn shrink-0">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage || 'Tetapan Berjaya Dikemaskini!'}</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
              Disimpan Serta-merta
            </span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ================= TAB 1: KAWALAN PAPARAN HALAMAN (HIDE / SHOW PAGES) ================= */}
          {modalTab === 'PAGES' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Quick Tab Switcher Banner to RBAC */}
              <div className="p-3 bg-gradient-to-r from-amber-950/40 via-[#111827] to-[#0F172A] border border-amber-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-md">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Ingin kawal tahap kuasa & peranan staf (Super Admin, Pentadbir, Custom, Biasa)?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalTab('ROLES')}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer flex items-center space-x-1.5 shrink-0 shadow-md hover:scale-[1.02]"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Buka Tab Level Akses Staf (RBAC)</span>
                </button>
              </div>

              {/* Introduction Banner */}
              <div className="bg-gradient-to-r from-[#111827] via-[#0F172A] to-[#1E293B] p-4 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">
                      Kawalan Dinamik Navigasi
                    </span>
                    <span className="text-xs text-slate-400">Boleh Hide atau Papar bila-bila masa</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Tentukan Halaman Yang Ingin Dipaparkan atau Disembunyikan
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Pilih mana-mana halaman di bawah (seperti <strong>Rekod & Ujian Darah</strong>, <strong>Jadual Rawatan</strong>, <strong>Kewangan</strong> dll) untuk disembunyikan daripada menu portal jika tidak diperlukan.
                  </p>
                </div>

                {/* Quick action buttons */}
                <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleShowAllPages}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Papar Semua Halaman</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaultPages}
                    className="px-3 py-1.5 bg-[#1F2937] hover:bg-[#374151] text-slate-200 font-semibold text-xs rounded-xl border border-[#374151] transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reset Lalai (Default)</span>
                  </button>
                </div>
              </div>

              {/* Status Counters & Filter Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pageSearchQuery}
                    onChange={(e) => setPageSearchQuery(e.target.value)}
                    placeholder="Cari halaman (cth: ujian darah, jadual, permohonan)..."
                    className="w-full bg-[#111827] border border-[#1F2937] text-white placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:border-emerald-500 focus:outline-none transition"
                  />
                  {pageSearchQuery && (
                    <button
                      onClick={() => setPageSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                  {['SEMUA', 'Klinikal', 'Pesakit', 'Makmal', 'Kewangan', 'Sumber Manusia', 'Komunikasi', 'Laporan', 'Awam'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer text-[11px] ${
                        selectedCategoryFilter.toUpperCase() === cat.toUpperCase()
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-[#111827] text-slate-400 hover:text-white border border-[#1F2937]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Configurable Pages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredPages.map((page) => {
                  const isVisible = adminPageVisibility[page.id] !== false;
                  const IconComp = page.icon;

                  return (
                    <div
                      key={page.id}
                      className={`relative overflow-hidden rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                        isVisible
                          ? 'bg-gradient-to-br from-[#111827] to-[#0F172A] border-emerald-500/40 shadow-md shadow-emerald-950/20'
                          : 'bg-gradient-to-br from-[#0B0F19] to-[#0A0D14] border-slate-800 opacity-80'
                      }`}
                    >
                      {/* Ambient corner glow */}
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${page.glowColor} rounded-full blur-2xl pointer-events-none`} />

                      <div>
                        {/* Top Meta Line: Category Badge + Status Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${page.badgeColor}`}>
                            {page.category}
                          </span>

                          <div className="flex items-center space-x-1.5">
                            {isVisible ? (
                              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 px-2 py-0.5 rounded-full">
                                <Eye className="w-3 h-3 text-emerald-400" />
                                <span>Dipaparkan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-rose-300 bg-rose-950/90 border border-rose-500/50 px-2 py-0.5 rounded-full">
                                <EyeOff className="w-3 h-3 text-rose-400" />
                                <span>Disembunyikan</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Page Header: Icon + Title */}
                        <div className="flex items-start space-x-3 mb-2">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isVisible
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            <IconComp className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className={`text-sm font-bold truncate ${
                              isVisible ? 'text-white' : 'text-slate-300'
                            }`}>
                              {page.name}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              Tab ID: {page.id}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 leading-relaxed mb-4">
                          {page.desc}
                        </p>
                      </div>

                      {/* Interactive Toggle Bar */}
                      <div className="pt-3 border-t border-[#1F2937] flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-300 font-medium">
                          Status Menu: <strong className={isVisible ? 'text-emerald-400' : 'text-rose-400'}>
                            {isVisible ? 'Aktif dalam Navigasi' : 'Disorokkan dari Menu'}
                          </strong>
                        </span>

                        {/* Clickable Switch & Action Button */}
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePageVisibility(page.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                              isVisible
                                ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60'
                                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/60'
                            }`}
                          >
                            {isVisible ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Sorok Page</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Papar Page</span>
                              </>
                            )}
                          </button>

                          {/* Toggle Switch Slider Indicator */}
                          <div 
                            onClick={() => handleTogglePageVisibility(page.id)}
                            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                              isVisible ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                              isVisible ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Help Card */}
              <div className="p-3.5 bg-[#111827] border border-cyan-500/30 rounded-xl text-xs text-slate-300 flex items-start space-x-3">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">Petua Penggunaan Sistem:</span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Halaman yang disorokkan tidak akan kelihatan dalam bar navigasi atas mahupun menu telefon pintar. Data klinikal dan transaksi di sebalik tab tersebut kekal selamat dalam pangkalan data dan boleh dihidupkan semula pada bila-bila masa.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: LEVEL AKSES STAF (RBAC & PERANAN) ================= */}
          {modalTab === 'ROLES' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Quick Tab Switcher Banner to Pages */}
              <div className="p-3 bg-gradient-to-r from-emerald-950/40 via-[#111827] to-[#0F172A] border border-emerald-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-md">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ingin menyembunyi (hide) atau memaparkan halaman admin pada menu sistem?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalTab('PAGES')}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer flex items-center space-x-1.5 shrink-0 shadow-md hover:scale-[1.02]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Buka Tab Paparan Halaman</span>
                </button>
              </div>

              {/* Level Access Overview Explanation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#111827] border border-amber-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-amber-400 font-bold">
                    <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> Super Admin</span>
                    <span className="text-[10px] bg-amber-950 px-1.5 py-0.5 rounded">Owner</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Akses 100% penuh termasuk pengurusan staf, sandaran JSON 5-tahun, kewangan & penetapan level admin.
                  </p>
                </div>

                <div className="p-3 bg-[#111827] border border-emerald-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Pentadbir</span>
                    <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded">Supervisor</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Akses penyelia untuk jadual sesi dialisis, pendaftaran pesakit, laporan ujian darah, permohonan staf & WhatsApp.
                  </p>
                </div>

                <div className="p-3 bg-[#111827] border border-cyan-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-cyan-400 font-bold">
                    <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5" /> Custom</span>
                    <span className="text-[10px] bg-cyan-950 px-1.5 py-0.5 rounded">Staff Nurse</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Akses khas yang dipilih secara manual oleh Super Admin (Custom Module Checkboxes).
                  </p>
                </div>

                <div className="p-3 bg-[#111827] border border-slate-700 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Biasa</span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">Nurse</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Akses asas jururawat bertugas untuk jadual rawatan, ringkasan harian, ujian darah & surat rujukan hospital.
                  </p>
                </div>
              </div>

              {/* Current Logged In Admin Info */}
              <div className="p-3.5 bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-[#374151] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400">
                    {currentAdminStaff?.nama.slice(0, 2) || 'AD'}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Pengguna Admin Semasa:</span>
                    <strong className="text-white text-xs">{currentAdminStaff?.nama || 'Super Admin Pusat'}</strong>
                    <span className="text-slate-400 ml-2">({currentAdminStaff?.jawatan || 'Pengarah'})</span>
                  </div>
                </div>

                <div>
                  {getLevelBadge(currentAdminStaff?.adminLevel || 'SUPER_ADMIN')}
                </div>
              </div>

              {/* Staff Access Levels List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-[#1F2937] pb-2">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Senarai Staf & Status Level Akses Semasa</span>
                  </span>
                  <span className="text-xs font-normal text-slate-400">
                    Jumlah Staf: <strong className="text-emerald-400 font-mono">{filteredStaffList.length}</strong> / {staffList.length}
                  </span>
                </h3>

                {/* Staff Search & Role Filter Bar */}
                <div className="bg-[#0F172A] border border-[#1F2937] p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-inner">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari staf (nama, jawatan, no LJM)..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
                    {(['SEMUA', 'SUPER_ADMIN', 'PENTADBIR', 'CUSTOM', 'BIASA'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setStaffRoleFilter(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          staffRoleFilter === r
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-[#111827] text-slate-400 hover:text-white border border-[#1F2937]'
                        }`}
                      >
                        {r === 'SEMUA' ? 'Semua Role' : r.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredStaffList.length === 0 ? (
                    <div className="p-8 text-center bg-[#111827] border border-[#1F2937] rounded-2xl text-slate-400 space-y-2">
                      <Users className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="font-bold text-slate-300 text-sm">Tiada Staf Dijumpai</p>
                      <p className="text-xs text-slate-500">Tiada staf yang sepadan dengan carian atau penapis peranan.</p>
                      <button
                        type="button"
                        onClick={() => { setStaffSearchQuery(''); setStaffRoleFilter('SEMUA'); }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs rounded-lg font-bold cursor-pointer"
                      >
                        Set Semula Penapis
                      </button>
                    </div>
                  ) : (
                    filteredStaffList.map((staff) => {
                    const isEditing = editingStaffId === staff.id;
                    const activeLevel = staff.adminLevel || 'BIASA';

                    return (
                      <div
                        key={staff.id}
                        className={`bg-[#111827] border rounded-2xl p-4 transition-all ${
                          isEditing
                            ? 'border-emerald-500 shadow-xl shadow-emerald-950/40 bg-[#131C2E]'
                            : 'border-[#1F2937] hover:border-[#374151]'
                        }`}
                      >
                        {/* Row Main Summary */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={(staff.avatarUrl && staff.avatarUrl.trim() !== '') ? staff.avatarUrl : 'https://images.unsplash.com/photo-1594824813689-f54249a15a81?w=100&auto=format&fit=crop&q=80'}
                              alt={staff.nama}
                              className="w-10 h-10 rounded-xl object-cover border border-[#374151]"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-sm">{staff.nama}</h4>
                                <span className="text-[10px] bg-[#1F2937] text-slate-300 px-2 py-0.5 rounded font-mono border border-[#374151]">
                                  {staff.noPendaftaran || 'LJM'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">{staff.jawatan}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div>{getLevelBadge(activeLevel)}</div>

                            <button
                              onClick={() => isEditing ? setEditingStaffId(null) : handleStartEditing(staff)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                                isEditing
                                  ? 'bg-slate-700 text-slate-200'
                                  : 'bg-[#1F2937] hover:bg-[#374151] text-emerald-400 border border-[#374151]'
                              }`}
                            >
                              <Settings className="w-3.5 h-3.5" />
                              <span>{isEditing ? 'Tutup' : 'Tukar Level Akses'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Expandable Editing Panel for Super Admin */}
                        {isEditing && (
                          <div className="mt-4 pt-4 border-t border-[#1F2937] space-y-4 animate-fadeIn">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                                Pilih Level Akses Pentadbir untuk {staff.nama}:
                              </label>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedLevel('SUPER_ADMIN')}
                                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                    selectedLevel === 'SUPER_ADMIN'
                                      ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                                      : 'bg-[#0F172A] border-[#1F2937] text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <div className="font-bold text-xs flex items-center justify-between">
                                    <span>1. Super Admin</span>
                                    {selectedLevel === 'SUPER_ADMIN' && <Check className="w-4 h-4 text-amber-400" />}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">Owner / Pengarah (Akses Penuh 100%)</p>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedLevel('PENTADBIR')}
                                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                    selectedLevel === 'PENTADBIR'
                                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                      : 'bg-[#0F172A] border-[#1F2937] text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <div className="font-bold text-xs flex items-center justify-between">
                                    <span>2. Pentadbir</span>
                                    {selectedLevel === 'PENTADBIR' && <Check className="w-4 h-4 text-emerald-400" />}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">Supervisor / Sister (Penyelia Operasi)</p>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedLevel('CUSTOM')}
                                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                    selectedLevel === 'CUSTOM'
                                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                                      : 'bg-[#0F172A] border-[#1F2937] text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <div className="font-bold text-xs flex items-center justify-between">
                                    <span>3. Custom</span>
                                    {selectedLevel === 'CUSTOM' && <Check className="w-4 h-4 text-cyan-400" />}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">Staff Nurse (Senarai Modul Khas)</p>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedLevel('BIASA')}
                                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                    selectedLevel === 'BIASA'
                                      ? 'bg-slate-800 border-slate-500 text-slate-200'
                                      : 'bg-[#0F172A] border-[#1F2937] text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <div className="font-bold text-xs flex items-center justify-between">
                                    <span>4. Biasa</span>
                                    {selectedLevel === 'BIASA' && <Check className="w-4 h-4 text-slate-300" />}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">Nurse Bertugas (Akses Asas Dialisis)</p>
                                </button>
                              </div>
                            </div>

                            {/* Custom Module Selection Checkboxes */}
                            <div className="bg-[#0F172A] p-4 rounded-xl border border-cyan-500/40 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2937] pb-2">
                                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                                  <Sliders className="w-4 h-4" />
                                  <span>Tetapan Akses Modul Individu untuk {staff.nama}:</span>
                                </span>
                                <div className="flex items-center space-x-2 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const allChecked = Object.keys(customPerms).reduce((acc, k) => {
                                        acc[k as keyof CustomModulePermissions] = true;
                                        return acc;
                                      }, {} as CustomModulePermissions);
                                      setCustomPerms(allChecked);
                                    }}
                                    className="px-2 py-1 bg-cyan-950 text-cyan-300 border border-cyan-700 rounded hover:bg-cyan-900 cursor-pointer font-bold"
                                  >
                                    Pilih Semua Modul
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomPerms(DEFAULT_CUSTOM_PERMISSIONS);
                                    }}
                                    className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded hover:bg-slate-700 cursor-pointer font-bold"
                                  >
                                    Reset Default Nurse
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const noneChecked = Object.keys(customPerms).reduce((acc, k) => {
                                        acc[k as keyof CustomModulePermissions] = false;
                                        return acc;
                                      }, {} as CustomModulePermissions);
                                      setCustomPerms(noneChecked);
                                    }}
                                    className="px-2 py-1 bg-rose-950 text-rose-300 border border-rose-800 rounded hover:bg-rose-900 cursor-pointer font-bold"
                                  >
                                    Kosongkan All
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                {MODULE_LABELS.map((mod) => (
                                  <label
                                    key={mod.key}
                                    className={`flex items-start space-x-2.5 p-2.5 rounded-lg border transition cursor-pointer ${
                                      customPerms[mod.key]
                                        ? 'bg-cyan-950/60 border-cyan-500/60 text-white'
                                        : 'bg-[#111827] border-[#1F2937] text-slate-400 hover:bg-[#1E293B]'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={Boolean(customPerms[mod.key])}
                                      onChange={() => handleToggleModulePerm(mod.key)}
                                      className="mt-0.5 rounded text-cyan-500 focus:ring-cyan-500 bg-[#0F172A]"
                                    />
                                    <div>
                                      <span className="font-semibold block text-xs">{mod.label}</span>
                                      <span className="text-[10px] text-slate-400 leading-tight block">{mod.desc}</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingStaffId(null)}
                                className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                              >
                                Batal
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSaveStaffRole(staff.id)}
                                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan Level Akses</span>
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  }))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#111827] border-t border-[#1F2937] flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-400 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px]">
              {modalTab === 'PAGES'
                ? 'Perubahan paparan halaman disimpan secara automatik dan berkuatkuasa serta-merta pada bar navigasi.'
                : 'Perubahan level akses akan serta merta mengubah menu & hak modul pengguna.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1F2937] hover:bg-[#374151] text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
