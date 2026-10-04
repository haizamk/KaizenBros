'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Stethoscope, 
  UserCheck, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Fingerprint
} from 'lucide-react';
import { 
  authenticateStaff, 
  resetStaffPassword, 
  validatePasswordRules,
  CLINIC_DEFAULT_2FA_PIN,
  CLINIC_MASTER_RECOVERY_KEY,
  StaffAccount 
} from '@/lib/auth-service';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (staffAccount: StaffAccount) => void;
  onAuditLog?: (action: string, description: string) => void;
}

export function StaffLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onAuditLog
}: StaffLoginModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'reset'>('login');
  const [selectedRole, setSelectedRole] = useState<'nurse' | 'admin'>('nurse');

  // Login form state
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [securityPin, setSecurityPin] = useState(CLINIC_DEFAULT_2FA_PIN);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  // Reset form state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [masterRecoveryKey, setMasterRecoveryKey] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [confirmStaffPassword, setConfirmStaffPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Lockout countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockCountdown > 0) {
      timer = setInterval(() => {
        setLockCountdown(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setLoginError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockCountdown]);

  if (!isOpen) return null;

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setLoginError('');
    setLoginSuccessMsg('');

    const passCheck = validatePasswordRules(staffPassword);
    if (!passCheck.isValid) {
      setLoginError(passCheck.error!);
      return;
    }

    const result = authenticateStaff(staffIdentifier, staffPassword, securityPin);

    if (!result.success) {
      if (result.isLocked) {
        setIsLocked(true);
        setLockCountdown(result.remainingLockSeconds || 30);
        onAuditLog?.('KESELAMATAN_AMARAN', `Percubaan login staf disekat kerana kegagalan berulang: ${staffIdentifier}`);
      } else {
        onAuditLog?.('LOGIN_GAGAL', `Percubaan login staf gagal untuk ID: ${staffIdentifier}`);
      }
      setLoginError(result.message);
      return;
    }

    const roleStr = (result.staff?.role || 'STAFF').toUpperCase();
    onAuditLog?.('LOGIN_BERJAYA', `Kakitangan ${result.staff?.name || 'Staf'} (${roleStr}) berjaya log masuk.`);
    setLoginSuccessMsg(result.message);

    setTimeout(() => {
      onLoginSuccess(result.staff!);
      onClose();
    }, 600);
  };

  const handleStaffReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccessMsg('');

    if (newStaffPassword !== confirmStaffPassword) {
      setResetError('Kata laluan baharu dan pengesahan tidak sepadan.');
      return;
    }

    const passCheck = validatePasswordRules(newStaffPassword);
    if (!passCheck.isValid) {
      setResetError(passCheck.error!);
      return;
    }

    const result = resetStaffPassword(resetIdentifier, masterRecoveryKey, newStaffPassword);
    if (!result.success) {
      setResetError(result.message);
      return;
    }

    onAuditLog?.('TUKAR_KATALALUAN_STAF', `Kata laluan staf dikemaskini oleh kelulusan pentadbir: ${resetIdentifier}`);
    setResetSuccessMsg(result.message);

    setStaffIdentifier(resetIdentifier);
    setStaffPassword(newStaffPassword);

    setTimeout(() => {
      setActiveTab('login');
      setResetSuccessMsg('');
    }, 2000);
  };

  // Quick Demo Autofill helpers
  const handleQuickFill = (role: 'nurse' | 'admin', id: string, pass: string) => {
    setSelectedRole(role);
    setStaffIdentifier(id);
    setStaffPassword(pass);
    setSecurityPin(CLINIC_DEFAULT_2FA_PIN);
    setLoginError('');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-950 border border-cyan-700/80 flex items-center justify-center text-cyan-400 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black text-white">Portal Staf Klinikal</h3>
                <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-black px-2 py-0.5 rounded">
                  MAX SECURITY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Pusat Hemodialisis KaizenBros (KKM Compliant)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold flex items-center justify-center cursor-pointer text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
            className={`py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Log Masuk Keselamatan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('reset');
              setResetError('');
            }}
            className={`py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'reset'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Pemulihan Kata Laluan</span>
          </button>
        </div>

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            
            {/* Feedback notifications */}
            {loginError && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-700/80 rounded-2xl flex items-start space-x-2.5 text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccessMsg && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-2xl flex items-center space-x-2.5 text-emerald-300 text-xs sm:text-sm font-medium animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <span>{loginSuccessMsg}</span>
              </div>
            )}

            {/* Lockout Warning Box */}
            {isLocked && (
              <div className="p-4 bg-amber-950/90 border-2 border-amber-600 rounded-2xl flex items-center space-x-3 text-amber-200 text-xs sm:text-sm animate-pulse">
                <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-bold">Akaun Disekat Sementara (Brute-Force Protection)</p>
                  <p className="text-xs text-amber-300">Sila tunggu baki masa: <strong>{lockCountdown} saat</strong> sebelum mencuba semula.</p>
                </div>
              </div>
            )}

            {/* Role Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Pilih Kategori Kakitangan:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedRole('nurse')}
                  className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 cursor-pointer transition-all ${
                    selectedRole === 'nurse'
                      ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Stethoscope className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-black">Jururawat Klinikal</div>
                    <div className="text-[10px] text-slate-400">Sister & Staff Nurse</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 cursor-pointer transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-indigo-950/70 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs font-black">Pentadbir / Doktor</div>
                    <div className="text-[10px] text-slate-400">Pakar Nefrologi & Admin</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Staff ID / Email */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                ID Kakitangan (Staff ID) atau Emel Rasmi:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  value={staffIdentifier}
                  onChange={(e) => setStaffIdentifier(e.target.value)}
                  placeholder={selectedRole === 'nurse' ? 'Contoh: SN-01 atau sister.siti@kaizenbrosdialysis.com.my' : 'Contoh: ADM-01 atau dr.azman@kaizenbrosdialysis.com.my'}
                  className="w-full min-h-[50px] bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl px-4 pl-11 text-sm font-medium text-white placeholder-slate-500 outline-none transition-all shadow-inner disabled:opacity-50"
                />
                <UserCheck className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Password (6-12 chars) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Kata Laluan Keselamatan:
                </label>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  staffPassword.length >= 6 && staffPassword.length <= 12
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : staffPassword.length > 0
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {staffPassword.length}/12 aksara (Min 6 - Maks 12)
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={12}
                  disabled={isLocked}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Kata laluan staf (6 - 12 aksara)"
                  className="w-full min-h-[50px] bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl px-4 pl-11 pr-12 text-sm font-medium text-white placeholder-slate-500 outline-none transition-all shadow-inner disabled:opacity-50"
                />
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 2FA Clinic Security PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  PIN Keselamatan 2FA Klinik:
                </label>
                <span className="text-[11px] text-cyan-400 font-mono">
                  Default PIN: 7788
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  maxLength={6}
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  placeholder="Masukkan 4-digit PIN Klinik"
                  className="w-full min-h-[50px] bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl px-4 pl-11 text-sm font-mono tracking-widest font-bold text-cyan-300 placeholder-slate-600 outline-none transition-all shadow-inner disabled:opacity-50"
                />
                <Fingerprint className="w-5 h-5 text-cyan-500 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked}
              className="w-full min-h-[54px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-black text-base rounded-2xl flex items-center justify-center space-x-2.5 cursor-pointer shadow-lg shadow-cyan-950/50 transition-all border border-cyan-400 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Log Masuk Keselamatan Tinggi</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Forgot password link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reset');
                  setResetIdentifier(staffIdentifier);
                }}
                className="text-xs text-slate-400 hover:text-cyan-400 font-bold hover:underline cursor-pointer inline-flex items-center space-x-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Lupa Kata Laluan Staf? Pemulihan Khas Pentadbir</span>
              </button>
            </div>

            {/* Quick Demo Helper */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold flex items-center space-x-1 text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Isi Pantas Akaun Demo Staf:</span>
                </span>
                <span className="text-[10px] text-cyan-300 font-mono">PIN: 7788</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('nurse', 'SN-01', 'Sister@2026')}
                  className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-[11px] font-bold text-left text-slate-300 hover:text-cyan-300 cursor-pointer"
                >
                  👩‍⚕️ Sister Siti (SN-01)
                  <div className="text-[9px] text-slate-400 font-mono">Sister@2026</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'ADM-01', 'Admin@2026')}
                  className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-[11px] font-bold text-left text-slate-300 hover:text-indigo-300 cursor-pointer"
                >
                  👨‍⚕️ Dr. Azman (ADM-01)
                  <div className="text-[9px] text-slate-400 font-mono">Admin@2026</div>
                </button>
              </div>
            </div>

          </form>
        )}

        {/* TAB 2: STAFF PASSWORD RESET */}
        {activeTab === 'reset' && (
          <form onSubmit={handleStaffReset} className="space-y-4">
            
            {resetError && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-700/80 rounded-2xl flex items-start space-x-2.5 text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccessMsg && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-2xl flex items-center space-x-2.5 text-emerald-300 text-xs sm:text-sm font-medium animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            <div className="p-3.5 bg-indigo-950/50 border border-indigo-700/70 rounded-2xl text-xs text-indigo-300 leading-relaxed space-y-1">
              <p className="font-bold flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Protokol Keselamatan Pemulihan Staf KaizenBros</span>
              </p>
              <p className="text-[11px] text-slate-300">
                Set semula kata laluan staf memerlukan <strong>Master Recovery Key</strong> yang disahkan oleh Pengarah Perubatan (Dr. Azman).
              </p>
            </div>

            {/* Staff ID */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                ID Kakitangan atau Emel Rasmi:
              </label>
              <input
                type="text"
                required
                value={resetIdentifier}
                onChange={(e) => setResetIdentifier(e.target.value)}
                placeholder="Contoh: SN-01 atau ADM-01"
                className="w-full min-h-[48px] bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl px-4 text-sm font-medium text-white outline-none"
              />
            </div>

            {/* Master Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Master Security Key Klinik:
                </label>
                <span className="text-[10px] text-indigo-400 font-mono">
                  Default Key: {CLINIC_MASTER_RECOVERY_KEY}
                </span>
              </div>
              <input
                type="text"
                required
                value={masterRecoveryKey}
                onChange={(e) => setMasterRecoveryKey(e.target.value)}
                placeholder={`Masukkan Master Key (${CLINIC_MASTER_RECOVERY_KEY})`}
                className="w-full min-h-[48px] bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl px-4 font-mono text-sm font-bold text-indigo-300 outline-none"
              />
            </div>

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Kata Laluan Baharu (6 - 12 aksara):
                </label>
                <span className="text-[11px] font-bold text-indigo-400">
                  {newStaffPassword.length}/12
                </span>
              </div>
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  maxLength={12}
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="Kata laluan baharu staf"
                  className="w-full min-h-[48px] bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl px-4 pr-11 text-sm font-medium text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showResetPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Sahkan Kata Laluan Baharu:
              </label>
              <input
                type="password"
                required
                maxLength={12}
                value={confirmStaffPassword}
                onChange={(e) => setConfirmStaffPassword(e.target.value)}
                placeholder="Ulang semula kata laluan baharu"
                className="w-full min-h-[48px] bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl px-4 text-sm font-medium text-white outline-none"
              />
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              className="w-full min-h-[52px] bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black text-base rounded-2xl flex items-center justify-center space-x-2 cursor-pointer shadow-lg transition-all"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Sahkan & Kemaskini Kata Laluan Staf</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
