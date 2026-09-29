import React from 'react';
import { 
  Building2, 
  UserPlus, 
  CalendarDays, 
  Activity, 
  Stethoscope, 
  MessageSquareShare, 
  CreditCard, 
  PhoneCall, 
  ShieldCheck, 
  Search,
  Clock,
  UserCheck,
  ClipboardList,
  BarChart3,
  Lock,
  Database,
  Briefcase,
  Palette,
  Ambulance,
  ChevronDown,
  Sun,
  Moon,
  User,
  Users,
  Sliders,
  Crown,
  Eye,
  Palmtree
} from 'lucide-react';
import { CentreInfo, StaffMember, AppTheme, AdminPageVisibility } from '../types';
import { KaizenBrosLogo } from './KaizenBrosLogo';

interface NavbarProps {
  centreInfo: CentreInfo;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickSearch: () => void;
  onOpenPreRegister?: () => void;
  onOpenJobApplication?: () => void;
  onOpenHospitalReferral?: () => void;
  onOpenAdminRoleManagement?: (tab?: 'ROLES' | 'PAGES') => void;
  onOpenSelfProfile?: () => void;
  onOpenBackup?: () => void;
  pendingNotificationsCount: number;
  pendingJobAppsCount?: number;
  isAdminAuthenticated: boolean;
  currentAdminStaff: StaffMember | null;
  adminRoleTitle: string;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  adminPageVisibility?: AdminPageVisibility;
}

export const Navbar: React.FC<NavbarProps> = ({
  centreInfo,
  activeTab,
  setActiveTab,
  onOpenQuickSearch,
  onOpenPreRegister,
  onOpenJobApplication,
  onOpenHospitalReferral,
  onOpenAdminRoleManagement,
  onOpenSelfProfile,
  onOpenBackup,
  pendingNotificationsCount,
  pendingJobAppsCount = 0,
  isAdminAuthenticated,
  currentAdminStaff,
  adminRoleTitle,
  onOpenAdminLogin,
  onLogoutAdmin,
  currentTheme,
  onSelectTheme,
  adminPageVisibility
}) => {
  // Public tabs on frontpage ordered strictly according to requirement:
  // 1. Profil center
  // 2. Portal pesakit
  // 3. Jawatan kosong
  // 4. Rawatan dialisis pelancong
  const publicNavItems = [
    { id: 'profil', label: 'Profil Pusat & Pasukan', icon: Building2 },
    { id: 'portal_pesakit', label: 'Portal Pesakit', icon: UserCheck, highlight: true },
    { id: 'kerjaya', label: 'Jawatan Kosong & Kerjaya', icon: Briefcase },
    { id: 'dialisis_pelancong', label: 'Rawatan Dialisis Pelancong', icon: Palmtree, highlight: true },
  ];

  const allAdminNavItems = [
    { id: 'ringkasan_klinikal', label: 'Ringkasan Klinikal Harian', icon: ClipboardList, permKey: 'ringkasanKlinikal' },
    { id: 'pendaftaran', label: 'Direktori & Pendaftaran Pesakit', icon: UserPlus, permKey: 'pendaftaranPesakit' },
    { id: 'dialisis_pelancong', label: 'Dialisis Pelancong', icon: Palmtree, permKey: 'dialisisPelancong' },
    { id: 'portal_pesakit', label: 'Portal Pesakit', icon: UserCheck, permKey: 'pendaftaranPesakit' },
    { id: 'pengurusan_staf', label: 'Pengurusan Pasukan Staf', icon: Users, permKey: 'permohonanStaf' },
    { id: 'jadual', label: 'Jadual Rawatan', icon: CalendarDays, permKey: 'jadualRawatan' },
    { id: 'kewangan', label: 'Kewangan & Resit A5', icon: CreditCard, permKey: 'kewangan' },
    { id: 'perubatan', label: 'Rekod & Ujian Darah', icon: Activity, permKey: 'ujianDarah' },
    { id: 'doktor', label: 'Lawatan Doktor', icon: Stethoscope, permKey: 'lawatanDoktor' },
    { 
      id: 'permohonan_kerjaya', 
      label: 'Pengurusan Permohonan Staf', 
      icon: Briefcase,
      permKey: 'permohonanStaf',
      badge: pendingJobAppsCount > 0 ? pendingJobAppsCount : undefined
    },
    { 
      id: 'whatsapp', 
      label: 'Notifikasi WhatsApp', 
      icon: MessageSquareShare,
      permKey: 'whatsapp',
      badge: pendingNotificationsCount > 0 ? pendingNotificationsCount : undefined 
    },
    { id: 'analitik', label: 'Analitik & KPI', icon: BarChart3, permKey: 'analitik' }
  ];

  // Role permissions checks
  const isSuperOrWebmaster = currentAdminStaff?.adminLevel === 'SUPER_ADMIN' || currentAdminStaff?.adminLevel === 'WEBMASTER';
  const canAccessTheme = isAdminAuthenticated && isSuperOrWebmaster;
  const canAccessBackup = isAdminAuthenticated && isSuperOrWebmaster;
  const canAccessRBAC = isAdminAuthenticated && (isSuperOrWebmaster || currentAdminStaff?.adminLevel === 'PENTADBIR');

  // Filter tabs according to current admin level & custom permissions and page visibility
  const filterAdminNavItems = () => {
    let items = allAdminNavItems;

    if (currentAdminStaff) {
      const level = currentAdminStaff.adminLevel || 'SUPER_ADMIN';

      if (level === 'CUSTOM') {
        const perms = currentAdminStaff.customPermissions;
        if (perms) {
          items = items.filter(item => {
            if (item.id === 'portal_pesakit') return true;
            const key = item.permKey as keyof typeof perms;
            return perms[key] !== false;
          });
        }
      } else if (level === 'BIASA') {
        const allowedIds = ['profil', 'jadual', 'perubatan', 'ringkasan_klinikal', 'portal_pesakit'];
        items = items.filter(item => allowedIds.includes(item.id));
      }
    }

    // Filter by adminPageVisibility (Allow admin to hide or show any page)
    if (adminPageVisibility) {
      items = items.filter(item => {
        const isVisible = adminPageVisibility[item.id as keyof AdminPageVisibility];
        return isVisible !== false;
      });
    }

    return items;
  };

  // Public tabs always show the 4 core requested tabs: 1. Profil 2. Portal Pesakit 3. Jawatan Kosong 4. Rawatan Dialisis Pelancong
  const visiblePublicNavItems = publicNavItems;

  const activeNavItems = isAdminAuthenticated ? filterAdminNavItems() : visiblePublicNavItems;

  return (
    <header className="sticky top-0 z-40 bg-[#111827] border-b border-[#1F2937] shadow-xl">
      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo and branding */}
          <div 
            onClick={() => setActiveTab('profil')} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <KaizenBrosLogo size={46} className="shadow-lg shadow-black/50" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white font-serif">
                  KAIZENBROS
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Dialysis
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                Pusat Dialisis Berlesen KKM
              </p>
            </div>
          </div>

          {/* Action quick shortcuts */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick 1-Click Universal Theme Toggle (Light / Dark Mode for Patients, Public & Staff) */}
            <div className="flex items-center bg-[#0F172A] border border-[#374151] hover:border-emerald-500/50 rounded-xl p-0.5 text-xs shadow-md transition-all">
              <button
                type="button"
                id="btn-header-theme-toggle"
                onClick={() => {
                  const nextTheme: AppTheme = currentTheme === 'dark' ? 'light-professional' : 'dark';
                  onSelectTheme(nextTheme);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  currentTheme === 'dark'
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/90'
                    : 'bg-amber-400 text-slate-950 font-black shadow-sm hover:bg-amber-300'
                }`}
                title={currentTheme === 'dark' ? 'Tukar ke Tema Cerah (Light Mode)' : 'Tukar ke Tema Gelap (Dark Mode)'}
              >
                {currentTheme === 'dark' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold">Gelap</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                    <span className="text-xs font-bold">Cerah</span>
                  </>
                )}
              </button>

              {/* Show dropdown selector for 3 modes ONLY on admin page */}
              {isAdminAuthenticated && (
                <select
                  value={currentTheme}
                  onChange={(e) => onSelectTheme(e.target.value as AppTheme)}
                  className="bg-transparent text-[11px] font-semibold text-slate-300 focus:outline-hidden cursor-pointer py-1 px-1.5 rounded hidden lg:block border-l border-slate-700/60 ml-0.5"
                  title="Pilih Mod Variasi Tema Paparan (Akses Admin)"
                >
                  <option value="dark" className="bg-[#111827] text-slate-200">
                    🌙 Mod Gelap
                  </option>
                  <option value="light-professional" className="bg-[#111827] text-slate-200">
                    ☀️ Mod Cerah
                  </option>
                  <option value="light-black-footer" className="bg-[#111827] text-slate-200">
                    🌓 Mod Cerah + Footer Hitam
                  </option>
                </select>
              )}
            </div>

            {/* Dedicated Button for System Data Backup (Super Admin & Webmaster Only) */}
            {canAccessBackup && onOpenBackup && (
              <button
                onClick={onOpenBackup}
                id="btn-top-system-backup"
                title="Sandaran & Pemulihan Data JSON (5 Tahun)"
                className="flex items-center space-x-1.5 px-3 py-2 bg-[#0F172A] hover:bg-[#1F2937] text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden md:inline">Sandaran JSON</span>
              </button>
            )}

            {/* Dedicated Button for Official Hospital Referral Letter (Admin Only) */}
            {isAdminAuthenticated && onOpenHospitalReferral && (
              <button
                onClick={onOpenHospitalReferral}
                id="btn-top-hospital-referral"
                title="Jana Surat Rujukan Hospital Kecemasan Rasmi"
                className="flex items-center space-x-1.5 px-3 py-2 bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Ambulance className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
                <span className="hidden xl:inline">Surat Rujukan Hospital</span>
                <span className="xl:hidden">Rujukan</span>
              </button>
            )}

            {/* Dedicated Button for Pre-Patient Registration */}
            {onOpenPreRegister && (
              <button
                onClick={onOpenPreRegister}
                id="btn-top-pre-register-dedicated"
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-lg text-xs shadow-md shadow-emerald-950/80 transition-all cursor-pointer hover:scale-[1.02] border border-emerald-300/40"
              >
                <ClipboardList className="w-4 h-4 text-slate-950 shrink-0" />
                <span className="hidden sm:inline">Pra-Pendaftaran Pesakit</span>
                <span className="sm:hidden">Daftar</span>
              </button>
            )}

            {/* Direct Button 1: Admin RBAC Level Management (Super Admin, Webmaster & Pentadbir Only) */}
            {canAccessRBAC && onOpenAdminRoleManagement && (
              <button
                onClick={() => onOpenAdminRoleManagement('ROLES')}
                id="btn-top-rbac-roles"
                title="Tetapan Level Akses Staf RBAC (Super Admin, Pentadbir, Custom, Biasa)"
                className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-amber-950 via-[#1E1B4B] to-slate-900 hover:from-amber-900 hover:to-indigo-950 text-amber-300 border border-amber-500/50 rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden lg:inline">Level Akses RBAC</span>
                <span className="lg:hidden">RBAC</span>
              </button>
            )}

            {/* Direct Button 2: Page Visibility Control (Hide / Show Pages) */}
            {canAccessRBAC && onOpenAdminRoleManagement && (
              <button
                onClick={() => onOpenAdminRoleManagement('PAGES')}
                id="btn-top-rbac-pages"
                title="Kawalan Paparan Halaman Admin (Boleh Sembunyi / Paparkan Setiap Page)"
                className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-teal-950 via-[#0F172A] to-slate-900 hover:from-teal-900 hover:to-slate-800 text-teal-300 border border-teal-500/50 rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Eye className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="hidden lg:inline">Paparan Halaman</span>
                <span className="lg:hidden">Pages</span>
              </button>
            )}

            {/* Logged in Admin Indicator (If authenticated) */}
            {isAdminAuthenticated && (
              <div className="flex items-center space-x-2 bg-[#0F172A] border border-emerald-800/60 px-3 py-1.5 rounded-xl shadow-inner">
                <button
                  onClick={onOpenSelfProfile}
                  title="Buka & Kemaskini Profil Peribadi Saya"
                  className="flex items-center space-x-2 hover:bg-slate-800/80 p-1 rounded-lg transition cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div className="text-left hidden md:block">
                    <span className="block text-xs font-bold text-white truncate max-w-[130px] hover:text-emerald-300">
                      {currentAdminStaff?.nama.split(' ')[0] || 'Admin'}
                    </span>
                    <span className="block text-[9px] text-emerald-400 font-mono uppercase tracking-wider">
                      {adminRoleTitle || 'Akses Pentadbir'}
                    </span>
                  </div>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  title="Kunci / Log Keluar Sesi Admin"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer flex items-center gap-1 border-l border-slate-700/60 ml-1 pl-2"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-semibold text-rose-400 hidden xl:inline">Kunci</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab navigation row - Optimized for Mobile + Desktop */}
        <div className="border-t border-[#1F2937] py-2">
          {/* Mobile Dropdown Tab Selector (Visible on Mobile ONLY in Admin Mode) */}
          {isAdminAuthenticated && (
            <div className="md:hidden w-full">
              <div className="relative flex items-center">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full bg-[#0F172A] text-emerald-300 font-bold border-2 border-emerald-500/60 rounded-xl py-2.5 px-3.5 pr-10 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none shadow-lg cursor-pointer appearance-none"
                >
                  {activeNavItems.map((item) => (
                    <option key={item.id} value={item.id} className="bg-[#111827] text-slate-200 font-medium py-1">
                      📌 {item.label} {item.badge ? `(${item.badge})` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 pointer-events-none text-emerald-400 flex items-center gap-1 font-mono text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                  <span>Pilih Tab Menu</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}

          {/* Horizontal Tab Navigation (Shown on Frontpage on all devices, or Desktop in Admin Mode) */}
          <div className={`${isAdminAuthenticated ? 'hidden md:flex' : 'flex'} items-center justify-between overflow-x-auto no-scrollbar`}>
            <nav className="flex space-x-1 overflow-x-auto no-scrollbar">
              {activeNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all relative cursor-pointer ${
                      isActive
                        ? 'bg-[#1F2937] text-emerald-400 border border-[#374151] shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]/50'
                    }`}
                  >
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                    )}
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-[#0A0C10]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
