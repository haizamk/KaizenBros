'use client';

import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  HelpCircle, 
  Phone, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  MessageCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  authenticatePatient, 
  resetPatientPassword, 
  validatePasswordRules,
  resetAllPatientAccountsToDefault,
  PatientAccount 
} from '@/lib/auth-service';

interface PatientLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (patientAccount: PatientAccount) => void;
}

export function PatientLoginModal({
  isOpen,
  onClose,
  onLoginSuccess
}: PatientLoginModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'forgot'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Forgot password form state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotVerification, setForgotVerification] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccessMsg('');

    // Pre-validate password rules (6-12 chars)
    const passCheck = validatePasswordRules(loginPassword);
    if (!passCheck.isValid) {
      setLoginError(passCheck.error!);
      return;
    }

    const result = authenticatePatient(loginIdentifier, loginPassword);
    if (!result.success) {
      setLoginError(result.message);
      return;
    }

    setLoginSuccessMsg(result.message);
    setTimeout(() => {
      onLoginSuccess(result.patient!);
      onClose();
    }, 600);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setForgotError('Kata laluan baharu dan pengesahan kata laluan tidak sepadan.');
      return;
    }

    const passCheck = validatePasswordRules(newPassword);
    if (!passCheck.isValid) {
      setForgotError(passCheck.error!);
      return;
    }

    const result = resetPatientPassword(forgotIdentifier, forgotVerification, newPassword);
    if (!result.success) {
      setForgotError(result.message);
      return;
    }

    setForgotSuccessMsg(result.message);
    // Autofill into login
    setLoginIdentifier(forgotIdentifier);
    setLoginPassword(newPassword);

    setTimeout(() => {
      setActiveTab('login');
      setForgotSuccessMsg('');
    }, 2000);
  };

  // Quick Demo Autofill helpers
  const handleQuickFill = (id: string, pass: string) => {
    setLoginIdentifier(id);
    setLoginPassword(pass);
    setLoginError('');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-950 border border-emerald-700/80 flex items-center justify-center text-emerald-400 shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white flex items-center space-x-2">
                <span>Portal Pesakit KaizenBros</span>
              </h3>
              <p className="text-xs text-emerald-400 font-bold">
                {activeTab === 'login' ? 'Log Masuk Mesra Warga Emas' : 'Set Semula Kata Laluan'}
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
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Log Masuk</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('forgot');
              setForgotError('');
            }}
            className={`py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'forgot'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Lupa Kata Laluan</span>
          </button>
        </div>

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Feedback notifications */}
            {loginError && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-700/80 rounded-2xl flex items-start space-x-2.5 text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccessMsg && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-2xl flex items-center space-x-2.5 text-emerald-300 text-xs sm:text-sm font-medium animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <span>{loginSuccessMsg}</span>
              </div>
            )}

            {/* Input 1: Username choices */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nama Pengguna (Username):
                </label>
                <span className="text-[11px] text-cyan-400 font-semibold">
                  ID Pesakit / Emel / No. Telefon
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Contoh: P00123 atau khairul.haizam@gmail.com atau 012-3456789"
                  className="w-full min-h-[52px] bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 pl-11 text-sm font-medium text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                />
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-4 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                💡 Anda bebas menggunakan salah satu daripada <strong className="text-slate-200">ID Pesakit</strong>, <strong className="text-slate-200">Emel</strong>, atau <strong className="text-slate-200">No. Telefon</strong> yang didaftarkan.
              </p>
            </div>

            {/* Input 2: Password with 6-12 chars rule */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Kata Laluan (Password):
                </label>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  loginPassword.length >= 6 && loginPassword.length <= 12
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : loginPassword.length > 0
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {loginPassword.length}/12 aksara (Min 6 - Maks 12)
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={12}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan kata laluan (6 hingga 12 aksara)"
                  className="w-full min-h-[52px] bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 pl-11 pr-12 text-sm font-medium text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                />
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-4 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                  title={showPassword ? 'Sembunyi kata laluan' : 'Lihat kata laluan'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              className="w-full min-h-[54px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-base rounded-2xl flex items-center justify-center space-x-2.5 cursor-pointer shadow-lg shadow-emerald-950/50 transition-all border border-emerald-400 mt-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Log Masuk Portal Pesakit</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Forgot password link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('forgot');
                  setForgotIdentifier(loginIdentifier);
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer inline-flex items-center space-x-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Terlupa kata laluan? Klik di sini untuk set semula</span>
              </button>
            </div>

            {/* Quick Demo Helper */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold flex items-center space-x-1 text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ujian Demo Pantas (Quick Login):</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Kata Laluan Default: kaizen123</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('P00123', 'kaizen123')}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-[11px] font-bold text-left text-slate-300 hover:text-cyan-300 cursor-pointer truncate"
                >
                  👤 Khairul Haizam (P00123)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('P00104', 'kaizen123')}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-[11px] font-bold text-left text-slate-300 hover:text-cyan-300 cursor-pointer truncate"
                >
                  👤 Siti Aminah (P00104)
                </button>
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    resetAllPatientAccountsToDefault();
                    setLoginIdentifier('P00123');
                    setLoginPassword('kaizen123');
                    setLoginSuccessMsg('✓ Semua akaun & kata laluan pesakit berjaya di-reset ke nilai asal (kaizen123).');
                    setTimeout(() => setLoginSuccessMsg(''), 4000);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold inline-flex items-center space-x-1 cursor-pointer underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Semula Semua Akaun Pesakit (Default)</span>
                </button>
              </div>
            </div>

          </form>
        )}

        {/* TAB 2: FORGOT / RESET PASSWORD */}
        {activeTab === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            
            {forgotError && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-700/80 rounded-2xl flex items-start space-x-2.5 text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccessMsg && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-2xl flex items-center space-x-2.5 text-emerald-300 text-xs sm:text-sm font-medium animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-2xl text-xs text-cyan-300 leading-relaxed">
              🔐 <strong>Pengesahan Keselamatan Pesakit:</strong> Sila masukkan ID Pesakit dan No. Kad Pengenalan (IC) atau No. Telefon yang didaftarkan untuk mengesahkan identiti anda sebelum menetapkan kata laluan baharu.
            </div>

            {/* Step 1: Identifier */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                ID Pesakit atau Emel:
              </label>
              <input
                type="text"
                required
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                placeholder="Contoh: P00123 atau khairul.haizam@gmail.com"
                className="w-full min-h-[48px] bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl px-4 text-sm font-medium text-white outline-none"
              />
            </div>

            {/* Step 2: Second factor verification */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                No. Kad Pengenalan (IC) atau No. Telefon:
              </label>
              <input
                type="text"
                required
                value={forgotVerification}
                onChange={(e) => setForgotVerification(e.target.value)}
                placeholder="Contoh: 740815-10-5421 atau 012-3456789"
                className="w-full min-h-[48px] bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl px-4 text-sm font-medium text-white outline-none"
              />
            </div>

            {/* Step 3: New Password (6-12 chars) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Kata Laluan Baharu:
                </label>
                <span className="text-[11px] font-bold text-cyan-400">
                  {newPassword.length}/12 (Min 6, Maks 12)
                </span>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  maxLength={12}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kata laluan baharu (6 - 12 aksara)"
                  className="w-full min-h-[48px] bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl px-4 pr-11 text-sm font-medium text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Step 4: Confirm Password */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Sahkan Kata Laluan Baharu:
              </label>
              <input
                type="password"
                required
                maxLength={12}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Taip semula kata laluan baharu"
                className="w-full min-h-[48px] bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl px-4 text-sm font-medium text-white outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[52px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-black text-base rounded-2xl flex items-center justify-center space-x-2 cursor-pointer shadow-lg transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Simpan & Kemaskini Kata Laluan</span>
            </button>

            {/* Assistance via WhatsApp */}
            <div className="pt-2 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 mb-2">Masih menghadapi masalah log masuk?</p>
              <a
                href="https://wa.me/60193389922?text=Hai%20KaizenBros,%20saya%20pesakit%20dan%20memerlukan%20bantuan%20reset%20kata%20laluan%20portal."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-4 py-2 rounded-xl"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Bantuan Kaunter Dialisis via WhatsApp</span>
              </a>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
