import React, { useState } from 'react';
import { StaffMember } from '../types';
import { 
  User, 
  Mail, 
  Phone, 
  KeyRound, 
  Save, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  BadgeCheck, 
  Award, 
  Calendar, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2,
  Sparkles
} from 'lucide-react';

interface StaffSelfProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: StaffMember | null;
  onUpdateStaffProfile: (updatedStaff: StaffMember) => void;
}

export const StaffSelfProfileModal: React.FC<StaffSelfProfileModalProps> = ({
  isOpen,
  onClose,
  currentStaff,
  onUpdateStaffProfile
}) => {
  if (!isOpen || !currentStaff) return null;

  const [nama, setNama] = useState(currentStaff.nama);
  const [emel, setEmel] = useState(currentStaff.emel);
  const [telefon, setTelefon] = useState(currentStaff.telefon);
  const [kelayakan, setKelayakan] = useState(currentStaff.kelayakan);
  const [noPendaftaran, setNoPendaftaran] = useState(currentStaff.noPendaftaran);
  const [tentang, setTentang] = useState(currentStaff.tentang);
  const [avatarUrl, setAvatarUrl] = useState(currentStaff.avatarUrl);

  // Login credentials section
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password security validation checks
  const isMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword) {
      if (!isMinLength || !hasLetter || !hasNumber || !hasSpecialChar) {
        alert('Kata laluan baharu mestilah sekurang-kurangnya 8 aksara, mengandungi sekurang-kurangnya 1 huruf, 1 nombor, dan 1 aksara khas (simbol).');
        return;
      }
      if (!isMatching) {
        alert('Pengesahan kata laluan tidak sepadan dengan kata laluan baharu!');
        return;
      }
    }

    const updated: StaffMember = {
      ...currentStaff,
      nama,
      emel,
      telefon,
      kelayakan,
      noPendaftaran,
      tentang,
      avatarUrl
    };

    onUpdateStaffProfile(updated);

    if (newPassword) {
      setSuccessMsg('Profil peribadi dan kata laluan log masuk anda telah berjaya dikemaskini!');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setSuccessMsg('Profil peribadi anda telah berjaya dikemaskini!');
    }

    setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111827] border-2 border-emerald-500/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto animate-fadeIn relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl || currentStaff.avatarUrl}
              alt={currentStaff.nama}
              className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shadow-md"
            />
            <div>
              <h3 className="text-lg font-bold text-white font-serif">
                Profil Peribadi & Log Masuk Staf
              </h3>
              <p className="text-xs text-emerald-400 font-mono font-medium">
                {currentStaff.jawatan}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="mt-4 bg-emerald-950 border border-emerald-400 text-emerald-200 px-4 py-3 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="bg-[#0F172A] border border-[#1F2937] p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">ID Staf:</span>
            <span className="font-mono font-bold text-amber-300">{currentStaff.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nama Penuh
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                No. Telefon
              </label>
              <input
                type="text"
                required
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Emel Log Masuk
              </label>
              <input
                type="email"
                required
                value={emel}
                onChange={(e) => setEmel(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                No. Pendaftaran LJM / MMC
              </label>
              <input
                type="text"
                value={noPendaftaran}
                onChange={(e) => setNoPendaftaran(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Kelayakan & Pos Basik
            </label>
            <input
              type="text"
              value={kelayakan}
              onChange={(e) => setKelayakan(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              URL Foto Avatar
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Ringkasan Biodata / Pengalaman
            </label>
            <textarea
              rows={2}
              value={tentang}
              onChange={(e) => setTentang(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#374151] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Section: Change Password */}
          <div className="bg-[#0F172A] border border-emerald-800/60 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Tukar Kata Laluan Log Masuk Portal
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Kata Laluan Baharu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak tukar"
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Pengesahan Kata Laluan
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulang kata laluan baharu"
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {newPassword.length > 0 && (
              <div className="p-2.5 bg-[#111827] border border-[#374151] rounded-lg text-[11px] space-y-1">
                <span className="text-slate-400 font-semibold block mb-1">Syarat Keselamatan Kata Laluan:</span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className={isMinLength ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {isMinLength ? '✓' : '○'} Min. 8 Aksara
                  </span>
                  <span className={hasLetter ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasLetter ? '✓' : '○'} Sekurang-kurangnya 1 Huruf
                  </span>
                  <span className={hasNumber ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasNumber ? '✓' : '○'} Sekurang-kurangnya 1 Nombor
                  </span>
                  <span className={hasSpecialChar ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasSpecialChar ? '✓' : '○'} Sekurang-kurangnya 1 Simbol Khas
                  </span>
                  <span className={isMatching ? 'text-emerald-400 font-bold col-span-2' : 'text-slate-500 col-span-2'}>
                    {isMatching ? '✓ Pengesahan Kata Laluan Sepadan' : '○ Pengesahan Kata Laluan Belum Sepadan'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>Simpan Kemaskini Profil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
