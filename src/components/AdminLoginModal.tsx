import React, { useState } from 'react';
import { StaffMember } from '../types';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Stethoscope, 
  UserCheck, 
  HelpCircle,
  Sparkles,
  X
} from 'lucide-react';
import { KaizenBrosLogo } from './KaizenBrosLogo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  onLoginSuccess: (staff: StaffMember, roleTitle: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onLoginSuccess
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('st-01');
  const [customUsername, setCustomUsername] = useState<string>('');
  const [useCustomInput, setUseCustomInput] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const enteredUser = useCustomInput ? customUsername.trim().toLowerCase() : selectedStaffId.toLowerCase();

      // Check for Secret Webmaster Access (Login: admin / Password: 123456)
      if ((enteredUser === 'admin' || customUsername.trim().toLowerCase() === 'admin') && password === '123456') {
        const webmasterStaff: StaffMember = {
          id: 'WEBMASTER-ROOT',
          nama: 'Webmaster (System Root)',
          jawatan: 'System Webmaster & Lead Administrator',
          kategori: 'DOKTOR',
          adminLevel: 'WEBMASTER',
          kelayakan: 'System Master Access Level 0',
          noPendaftaran: 'SYS-ROOT-001',
          pengalamanTahun: 20,
          jadualBertugas: '24/7 Unlimited Access',
          emel: 'webmaster@kaizenbros.com',
          telefon: '010-0000000',
          tentang: 'Akses Penuh Webmaster Root Sistem.',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
        };
        onLoginSuccess(webmasterStaff, 'Webmaster • Full Root Access');
        onClose();
        return;
      }

      const staff = staffList.find((s) => s.id === selectedStaffId) || {
        id: 'st-01',
        nama: 'Dr. Azman bin Khairuddin',
        jawatan: 'Pakar Perunding Kanan & Pengarah Perubatan',
        kategori: 'DOKTOR',
        kelayakan: 'MBBS (Malaya), MMed (Internal Med), FRCP',
        noPendaftaran: 'MMC 28419',
        pengalamanTahun: 18,
        jadualBertugas: 'Selasa & Khamis (09:00 - 13:00)',
        emel: 'azman.khairuddin@kaizenbros.com',
        telefon: '012-3456789',
        tentang: 'Ketua Pengarah Perubatan Pusat Dialisis KaizenBros.',
        avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'
      };

      // Simple validation for security demo
      if (password.length < 4) {
        setErrorMessage('Kata laluan sekurang-kurangnya 4 aksara.');
        return;
      }

      const levelTitle = staff.adminLevel === 'WEBMASTER'
        ? 'Webmaster (Root Access)'
        : staff.adminLevel === 'SUPER_ADMIN' 
        ? 'Super Admin (Owner)' 
        : staff.adminLevel === 'PENTADBIR' 
        ? 'Pentadbir (Supervisor)' 
        : staff.adminLevel === 'CUSTOM' 
        ? 'Custom (Staff Nurse)' 
        : 'Biasa (Nurse)';

      const roleTitle = `${staff.nama.split(' ')[0]} • ${levelTitle}`;
      onLoginSuccess(staff, roleTitle);
      onClose();
    }, 400);
  };

  const handleQuickDemoLogin = (staffId: string) => {
    const staff = staffList.find((s) => s.id === staffId);
    if (staff) {
      const levelTitle = staff.adminLevel === 'SUPER_ADMIN' 
        ? 'Super Admin (Owner)' 
        : staff.adminLevel === 'PENTADBIR' 
        ? 'Pentadbir (Supervisor)' 
        : staff.adminLevel === 'CUSTOM' 
        ? 'Custom (Staff Nurse)' 
        : 'Biasa (Nurse)';

      const roleTitle = `${staff.nama.split(' ')[0]} • ${levelTitle}`;
      onLoginSuccess(staff, roleTitle);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#111827] rounded-2xl max-w-md w-full border border-[#1F2937] shadow-2xl overflow-hidden relative">
        {/* Top Header Decor */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#0F172A] to-teal-950 p-6 border-b border-[#1F2937] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <KaizenBrosLogo size={42} className="shadow-md shadow-black/60" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black text-white font-serif tracking-tight">KAIZENBROS</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                Log Masuk Keselamatan Staf
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Compliance Banner */}
          <div className="p-3 bg-[#0A0C10] rounded-xl border border-emerald-800/30 flex items-center space-x-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Persekitaran Web Selamat</span>
              <span className="text-[11px] text-slate-400">Akses dihadkan untuk staf berdaftar & pengurusan sahaja.</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Staff Selector / Custom Username Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Pilih Akaun Staf / Username
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomInput(!useCustomInput)}
                  className="text-[10px] text-cyan-400 hover:underline cursor-pointer font-mono"
                >
                  {useCustomInput ? '📋 Guna Senarai Staf' : '⌨️ Taip Username/ID'}
                </button>
              </div>

              {useCustomInput ? (
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  placeholder="Masukkan ID / Username Staf"
                  className="w-full bg-[#0A0C10] text-slate-200 border border-[#374151] rounded-xl px-3.5 py-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                  required
                />
              ) : (
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-[#0A0C10] text-slate-200 border border-[#374151] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                >
                  {staffList.map((staf) => (
                    <option key={staf.id} value={staf.id}>
                      {staf.nama} ({staf.jawatan})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Laluan Staf
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata laluan"
                  className="w-full bg-[#0A0C10] text-slate-200 border border-[#374151] rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 text-xs"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Mengesahkan Sesi Keselamatan...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Log Masuk Pentadbir Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-2 border-t border-[#1F2937] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Akses Pantas Percubaan Admin:</span>
              </span>
              <span className="text-[10px] text-slate-500">Klik untuk masuk</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('st-01')}
                className="p-2 bg-[#0A0C10] hover:bg-[#1F2937] border border-amber-500/40 rounded-xl text-left transition cursor-pointer group"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-amber-400 font-bold">👑</span>
                  <span className="text-xs font-bold text-white truncate">Super Admin</span>
                </div>
                <span className="text-[10px] text-amber-300 block mt-0.5 truncate">Dr. Azman (Owner)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('st-03')}
                className="p-2 bg-[#0A0C10] hover:bg-[#1F2937] border border-emerald-500/40 rounded-xl text-left transition cursor-pointer group"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-emerald-400 font-bold">🛡️</span>
                  <span className="text-xs font-bold text-white truncate">Pentadbir</span>
                </div>
                <span className="text-[10px] text-emerald-300 block mt-0.5 truncate">Sister Hanim (Supervisor)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('st-02')}
                className="p-2 bg-[#0A0C10] hover:bg-[#1F2937] border border-teal-500/40 rounded-xl text-left transition cursor-pointer group col-span-2"
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-teal-400 font-bold">🩺</span>
                  <span className="text-xs font-bold text-white truncate">Pentadbir Klinikal</span>
                </div>
                <span className="text-[10px] text-teal-300 block mt-0.5 truncate">Dr. Sarah Nadira (Resident Doctor)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
