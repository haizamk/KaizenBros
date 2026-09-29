import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

interface AdminPasswordConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  actionLabel?: string;
}

export const AdminPasswordConfirmModal: React.FC<AdminPasswordConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Pengesahan Keselamatan Pentadbir',
  description = 'Sila masukkan kata laluan keselamatan admin untuk mengesahkan tindakan edit / padam maklumat sensitif ini.',
  actionLabel = 'Sahkan Tindakan'
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validPasswords = ['admin123', 'kaizen2026', 'webmaster', 'root', '123456'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validPasswords.includes(password.trim().toLowerCase())) {
      setError(null);
      setPassword('');
      onConfirm();
      onClose();
    } else {
      setError('Kata laluan tidak sah! Sila guna: admin123 atau kaizen2026');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] max-w-md w-full p-6 space-y-4 shadow-2xl text-[#E2E8F0] animate-fadeIn">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-[#1F2937] pb-3">
          <div className="p-2 bg-amber-950 text-amber-400 rounded-xl border border-amber-800/50">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-serif">{title}</h3>
            <p className="text-xs text-slate-400">Pengesahan kebenaran sensitif KKM</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-[#0F172A] p-3 rounded-xl border border-[#1F2937]">
          {description}
        </p>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Kata Laluan Pentadbir</span>
              <span className="text-[10px] text-amber-400 font-mono font-normal">Hint: admin123 / kaizen2026</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata laluan admin..."
                autoFocus
                className="w-full bg-[#0F172A] border border-[#374151] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <KeyRound className="w-4 h-4" />
              <span>{actionLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
