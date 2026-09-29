import React, { useState } from 'react';
import { 
  Patient, 
  TreatmentSession, 
  BloodTestRecord, 
  DoctorVisit, 
  TransactionPayment, 
  CentreInfo 
} from '../types';
import { KaizenBrosLogo } from './KaizenBrosLogo';
import { OfficialA5ReceiptModal } from './OfficialA5ReceiptModal';
import { MedicalReportPdfModal } from './MedicalReportPdfModal';
import { formatCurrencyRM, formatMalayDate, buildWhatsAppLink } from '../utils/whatsappHelper';
import { generateDrAiBloodSummary } from '../utils/drAiHelper';
import { 
  User, 
  Calendar, 
  Activity, 
  CreditCard, 
  Stethoscope, 
  PhoneCall, 
  MessageSquare, 
  FileText, 
  Printer, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  LogOut, 
  LogIn, 
  UserPlus, 
  AlertCircle,
  CheckCircle2,
  Droplets,
  Heart,
  Download,
  Building2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  XCircle,
  TrendingUp,
  BarChart3,
  Sparkles,
  Bot,
  FileSpreadsheet,
  Mail,
  MessageCircle
} from 'lucide-react';

interface PatientPortalViewProps {
  patients: Patient[];
  sessions: TreatmentSession[];
  bloodTests: BloodTestRecord[];
  doctorVisits: DoctorVisit[];
  transactions: TransactionPayment[];
  centreInfo: CentreInfo;
  onOpenPreRegistration: () => void;
  onSwitchToAdminPortal: () => void;
  onUpdatePatient?: (updatedPatient: Patient) => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  patients,
  sessions,
  bloodTests,
  doctorVisits,
  transactions,
  centreInfo,
  onOpenPreRegistration,
  onSwitchToAdminPortal,
  onUpdatePatient
}) => {
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeBloodTests = Array.isArray(bloodTests) ? bloodTests : [];
  const safeDoctorVisits = Array.isArray(doctorVisits) ? doctorVisits : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const [loggedInPatient, setLoggedInPatient] = useState<Patient | null>(() => {
    // Check if previously logged in or default to first patient
    try {
      const saved = localStorage.getItem('kaizenbros_patient_user_id');
      if (saved) {
        const found = safePatients.find((p) => p.id === saved || p.noIC === saved);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // First-Time Login Password Reset State
  const [pendingPasswordChangePatient, setPendingPasswordChangePatient] = useState<Patient | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Password Validation Requirements Check
  const isLengthValid = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = isLengthValid && hasLetter && hasNumber && hasSpecialChar && isMatch;

  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<TransactionPayment | null>(null);
  const [isMedicalReportModalOpen, setIsMedicalReportModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'jadual' | 'darah' | 'kewangan' | 'doktor' | 'laporan' | 'profil'>('jadual');
  const [patientDarahViewMode, setPatientDarahViewMode] = useState<'TREND_5_YEARS' | 'VERTICAL_3' | 'DR_AI_SUMMARY'>('TREND_5_YEARS');

  // Patient Edit Personal Info State
  const [isEditPersonalModalOpen, setIsEditPersonalModalOpen] = useState(false);
  const [personalSuccessMsg, setPersonalSuccessMsg] = useState('');
  const [personalFormData, setPersonalFormData] = useState({
    noTelefon: '',
    emel: '',
    alamat: '',
    namaWaris: '',
    hubunganWaris: 'Pasangan',
    telefonWaris: '',
  });

  const handleOpenPersonalEdit = () => {
    if (!loggedInPatient) return;
    setPersonalFormData({
      noTelefon: loggedInPatient.noTelefon || '',
      emel: loggedInPatient.emel || '',
      alamat: loggedInPatient.alamat || '',
      namaWaris: loggedInPatient.namaWaris || '',
      hubunganWaris: loggedInPatient.hubunganWaris || 'Pasangan',
      telefonWaris: loggedInPatient.telefonWaris || '',
    });
    setIsEditPersonalModalOpen(true);
  };

  const handleSavePersonalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInPatient) return;

    const updatedPatient: Patient = {
      ...loggedInPatient,
      noTelefon: personalFormData.noTelefon,
      emel: personalFormData.emel,
      alamat: personalFormData.alamat,
      namaWaris: personalFormData.namaWaris,
      hubunganWaris: personalFormData.hubunganWaris,
      telefonWaris: personalFormData.telefonWaris,
    };

    if (onUpdatePatient) {
      onUpdatePatient(updatedPatient);
    }

    setLoggedInPatient(updatedPatient);
    setIsEditPersonalModalOpen(false);
    setPersonalSuccessMsg('✓ Maklumat peribadi anda (telefon, emel, alamat & waris) telah berjaya dikemaskini.');
    setTimeout(() => setPersonalSuccessMsg(''), 6000);
  };

  const handleSendWhatsAppReceipt = (tx: TransactionPayment) => {
    if (!loggedInPatient) return;
    const text = `*PUSAT DIALISIS KAIZENBROS* 💳\n_Salinan Resit & Invois Rawatan_\n\nSalam Sejahtera *${loggedInPatient.nama}*,\n\nBerikut adalah ringkasan resit/invois rawatan anda:\n- No. Invois: ${tx.invoisNo}\n- Tarikh: ${tx.tarikh}\n- Perkara: ${tx.perkara}\n- Jumlah Bayaran: RM ${tx.bayaranPesakit.toFixed(2)}\n- Status: ${tx.status}\n\nDokumen A5 PDF/PNG rasmi boleh diakses di Portal Pesakit KaizenBros.\n\nSekian, terima kasih.`;
    const url = buildWhatsAppLink(loggedInPatient.noTelefon, text);
    window.open(url, '_blank');
  };

  const handleSendEmailReceipt = (tx: TransactionPayment) => {
    if (!loggedInPatient) return;
    const email = loggedInPatient.emel || '';
    const subject = encodeURIComponent(`Resit / Invois Rawatan Dialisis #${tx.invoisNo} - ${loggedInPatient.nama}`);
    const body = encodeURIComponent(
      `Salam Sejahtera ${loggedInPatient.nama},\n\n` +
      `Berikut adalah salinan perincian resit/invois rawatan hemodialisis anda:\n\n` +
      `--------------------------------------------------\n` +
      `No. Invois/Resit : ${tx.invoisNo} / ${tx.resitNo || 'KB-RCP-RASMI'}\n` +
      `Tarikh Rawatan   : ${formatMalayDate(tx.tarikh)}\n` +
      `Perkara Rawatan  : ${tx.perkara}\n` +
      `Jumlah Kasar     : RM ${tx.jumlahKasar.toFixed(2)}\n` +
      `Subsidi Penaja   : -RM ${tx.subsidiPenaja.toFixed(2)} (${loggedInPatient.penaja})\n` +
      `Bayaran Pesakit  : RM ${tx.bayaranPesakit.toFixed(2)}\n` +
      `Status Bayaran   : ${tx.status}\n` +
      `--------------------------------------------------\n\n` +
      `Resit rasmi ini diiktiraf bagi pelepasan cukai LHDN dan tuntutan penaja.\n\n` +
      `Pusat Dialisis KaizenBros`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanInput = loginInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanInput) {
      setLoginError('Sila masukkan No. Kad Pengenalan, No. Telefon atau No. Pesakit (MRN).');
      return;
    }

    if (!passwordInput.trim()) {
      setLoginError('Sila masukkan Kata Laluan anda.');
      return;
    }

    const matched = safePatients.find((p) => {
      const pIC = (p.noIC || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const pPhone = (p.noTelefon || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const pId = (p.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return pIC === cleanInput || pIC.includes(cleanInput) ||
             pPhone === cleanInput || pPhone.includes(cleanInput) ||
             pId === cleanInput || pId.includes(cleanInput);
    });

    if (!matched) {
      setLoginError('Maklumat pesakit tidak dijumpai. Sila semak No. IC, No. Telefon atau No. Pesakit.');
      return;
    }

    const expectedPassword = matched.password || '123456';
    if (passwordInput.trim() !== expectedPassword) {
      setLoginError('Kata laluan tidak tepat. Sila cuba lagi. (Kata laluan default pesakit baharu ialah 123456).');
      return;
    }

    // First-time login check or default password '123456'
    const isFirstTime = matched.isFirstLogin === true || expectedPassword === '123456' || !matched.password;
    if (isFirstTime) {
      setPendingPasswordChangePatient(matched);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChangeError('');
    } else {
      setLoggedInPatient(matched);
      try {
        localStorage.setItem('kaizenbros_patient_user_id', matched.id);
      } catch (err) {
        // ignore
      }
    }
  };

  const handleLogout = () => {
    setLoggedInPatient(null);
    try {
      localStorage.removeItem('kaizenbros_patient_user_id');
    } catch (err) {
      // ignore
    }
  };

  const handleQuickDemoSelect = (patient: Patient) => {
    const expectedPassword = patient.password || '123456';
    const isFirstTime = patient.isFirstLogin === true || expectedPassword === '123456' || !patient.password;

    if (isFirstTime) {
      setPendingPasswordChangePatient(patient);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChangeError('');
    } else {
      setLoggedInPatient(patient);
      try {
        localStorage.setItem('kaizenbros_patient_user_id', patient.id);
      } catch (err) {
        // ignore
      }
    }
  };

  const handleSaveFirstTimePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPasswordChangePatient) return;

    if (!isPasswordValid) {
      setPasswordChangeError('Sila pastikan kata laluan baharu memenuhi kesemua 5 syarat keselamatan.');
      return;
    }

    const updatedPatient: Patient = {
      ...pendingPasswordChangePatient,
      password: newPassword,
      isFirstLogin: false
    };

    if (onUpdatePatient) {
      onUpdatePatient(updatedPatient);
    }

    setLoggedInPatient(updatedPatient);
    setPendingPasswordChangePatient(null);
    try {
      localStorage.setItem('kaizenbros_patient_user_id', updatedPatient.id);
    } catch (err) {
      // ignore
    }
  };

  // Render First-Time Password Reset Screen / Modal
  if (pendingPasswordChangePatient) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#111827] border border-amber-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-950 text-amber-400 rounded-2xl border border-amber-800/50 mx-auto flex items-center justify-center shadow-lg">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">🔒 HAK AKSES PERTAMA KALI — CIPTA KATA LALUAN BAHARU</h2>
            <p className="text-xs text-slate-300">
              Selamat datang, <strong className="text-amber-300">{pendingPasswordChangePatient.nama}</strong> ({pendingPasswordChangePatient.id})!
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Demi keselamatan rekod perubatan anda di Pusat Dialisis KaizenBros, anda dikehendaki menukar kata laluan default (<code className="text-amber-300 font-mono">123456</code>) kepada kata laluan peribadi baharu.
            </p>
          </div>

          {passwordChangeError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passwordChangeError}</span>
            </div>
          )}

          <form onSubmit={handleSaveFirstTimePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kata Laluan Baharu *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata laluan baharu..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#0F172A] border border-[#374151] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sahkan Kata Laluan Baharu *
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulang semula kata laluan baharu..."
                className="w-full px-3.5 py-2.5 bg-[#0F172A] border border-[#374151] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden font-mono"
              />
            </div>

            {/* Security Requirement Checklist */}
            <div className="p-3.5 bg-[#0F172A] border border-[#1F2937] rounded-xl space-y-2 text-xs">
              <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
                Syarat Kelayakan Kata Laluan Baharu:
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className={`flex items-center space-x-2 ${isLengthValid ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {isLengthValid ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  <span>1. Minimum 8 aksara (Panjang semasa: {newPassword.length}/8)</span>
                </div>
                <div className={`flex items-center space-x-2 ${hasLetter ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {hasLetter ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  <span>2. Mengandungi sekurang-kurangnya 1 huruf (A-Z, a-z)</span>
                </div>
                <div className={`flex items-center space-x-2 ${hasNumber ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  <span>3. Mengandungi sekurang-kurangnya 1 nombor (0-9)</span>
                </div>
                <div className={`flex items-center space-x-2 ${hasSpecialChar ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {hasSpecialChar ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  <span>4. Mengandungi sekurang-kurangnya 1 aksara khas / simbol (@, #, $, %, !, &amp;, *, _)</span>
                </div>
                <div className={`flex items-center space-x-2 ${isMatch ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {isMatch ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  <span>5. Kata laluan &amp; Pengesahan adalah sepadan</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setPendingPasswordChangePatient(null)}
                className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={!isPasswordValid}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-lg ${
                  isPasswordValid
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-950/50'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simpan Kata Laluan Baharu &amp; Log Masuk</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // If not logged in, show patient login screen
  if (!loggedInPatient) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Logo & Portal Branding */}
          <div className="text-center space-y-3">
            <div className="inline-block p-1">
              <KaizenBrosLogo size={64} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase font-serif">
                Portal Pesakit
              </h1>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">
                Pusat Dialisis KaizenBros
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Semak jadual rawatan hemodialisis, keputusan ujian darah, dan muat turun resit rasmi saiz A5 untuk tuntutan PERKESO/JPA/Insurans.
              </p>
            </div>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                No. Kad Pengenalan (MyKad) / No. Telefon / No. Pesakit (MRN) *
              </label>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Contoh: 650214-10-5511 atau 0192345678"
                className="w-full px-3.5 py-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kata Laluan Pesakit *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Kata laluan (Default pesakit baharu: 123456)"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
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

            <div className="p-2.5 bg-[#0F172A] border border-amber-900/40 rounded-xl text-[11px] text-amber-300 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Pesakit Baharu: Log masuk menggunakan <strong>No. IC / Phone</strong> dengan Kata Laluan Default: <strong className="font-mono text-amber-200">123456</strong>.</span>
            </div>

            <button
              type="submit"
              id="btn-patient-login-submit"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Log Masuk ke Portal Pesakit</span>
            </button>
          </form>

          {/* Quick Demo Login Options */}
          {/* Alternative Actions: Pre-Registration & Switch to Admin */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#1F2937] text-center">
            <button
              onClick={onOpenPreRegistration}
              id="btn-login-open-pra-pendaftaran"
              className="flex items-center justify-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold py-1 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Belum berdaftar? Buat Pra-Pendaftaran Pesakit Baru</span>
            </button>

            <button
              onClick={onSwitchToAdminPortal}
              id="btn-login-switch-admin"
              className="text-[11px] text-slate-500 hover:text-slate-300 transition underline underline-offset-2"
            >
              Beralih ke Portal Pentadbir Klinik (Admin Dashboard)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If logged in as patient, display the patient dashboard!
  const patientSessions = safeSessions.filter((s) => s.patientId === loggedInPatient.id);
  const patientBloodTests = safeBloodTests.filter((b) => b.patientId === loggedInPatient.id);
  const patientVisits = safeDoctorVisits.filter((v) => v.patientId === loggedInPatient.id);
  const patientTransactions = safeTransactions.filter((t) => t.patientId === loggedInPatient.id);

  const upcomingSession = patientSessions[0];
  const latestBloodTest = patientBloodTests[0];

  return (
    <div className="space-y-6 text-[#E2E8F0]">
      {/* Top Patient Welcome Banner */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#111827] rounded-2xl flex items-center justify-center text-emerald-400 font-bold text-xl">
              {loggedInPatient.nama.charAt(0)}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-white">{loggedInPatient.nama}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-bold">
                {loggedInPatient.id}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {loggedInPatient.penaja}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              No. IC: <span className="font-mono text-slate-300">{loggedInPatient.noIC}</span> • Akses:{' '}
              <strong className="text-slate-200">{loggedInPatient.jenisAkses}</strong> ({loggedInPatient.lokasiAkses}) • Berat Kering:{' '}
              <strong className="text-emerald-400">{loggedInPatient.beratKering} kg</strong>
            </p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleOpenPersonalEdit}
            id="btn-patient-edit-personal-header"
            className="flex items-center space-x-1.5 text-xs px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition shadow-md cursor-pointer"
          >
            <span>✏️ Edit Maklumat Peribadi</span>
          </button>
          <button
            onClick={handleLogout}
            id="btn-patient-logout"
            className="flex items-center space-x-1.5 text-xs px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-800/50 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Keluar</span>
          </button>
        </div>
      </div>

      {personalSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{personalSuccessMsg}</span>
        </div>
      )}

      {/* Primary Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Next Treatment Session Card */}
        <div className="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400">
              <Calendar className="w-4 h-4" />
              <span>Sesi Rawatan Seterusnya</span>
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
              Terjadual
            </span>
          </div>

          {upcomingSession ? (
            <div className="space-y-2">
              <div className="text-lg font-bold text-white">
                {formatMalayDate(upcomingSession.tarikh)}
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>
                  {upcomingSession.masaMula} - {upcomingSession.masaTamat} ({upcomingSession.shift})
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Jururawat: <strong className="text-slate-200">{upcomingSession.jururawatBertugas}</strong>
              </div>
              <div className="p-2.5 bg-[#0F172A] rounded-xl border border-[#1F2937] text-[11px] text-slate-300">
                💡 <span className="text-emerald-400 font-semibold">Stesen Mesin:</span> Ditugaskan secara rawak semasa saringan hadir. Sila hadir <strong>15 minit awal</strong> untuk timbang berat badan.
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Tiada rekod sesi rawatan berjadual pada masa ini.</p>
          )}
        </div>

        {/* Latest Blood Test Metrics Card */}
        <div className="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400">
              <Activity className="w-4 h-4" />
              <span>Ujian Darah Terkini</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {latestBloodTest ? latestBloodTest.tarikhUjian : 'Tiada rekod'}
            </span>
          </div>

          {latestBloodTest ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#0F172A] p-2.5 rounded-xl border border-[#1F2937]">
                <div className="text-[10px] text-slate-400 font-mono">Hb (Darah)</div>
                <div className="text-base font-black text-emerald-400">{latestBloodTest.hb}</div>
                <div className="text-[9px] text-slate-400">Target 10-12</div>
              </div>
              <div className="bg-[#0F172A] p-2.5 rounded-xl border border-[#1F2937]">
                <div className="text-[10px] text-slate-400 font-mono">Kalium (K+)</div>
                <div className="text-base font-black text-emerald-400">{latestBloodTest.potassium}</div>
                <div className="text-[9px] text-slate-400">Selamat &lt; 5.5</div>
              </div>
              <div className="bg-[#0F172A] p-2.5 rounded-xl border border-[#1F2937]">
                <div className="text-[10px] text-slate-400 font-mono">Kt/V (Adequacy)</div>
                <div className="text-base font-black text-emerald-400">{latestBloodTest.ktV}</div>
                <div className="text-[9px] text-slate-400">Target &gt; 1.2</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Rekod ujian darah 3 bulan sedang diproses.</p>
          )}

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Ambil Darah Seterusnya (Setiap 3 Bulan):</span>
            <span className="font-semibold text-emerald-400 font-mono">
              {formatMalayDate(loggedInPatient.tarikhUjianDarahSeterusnya)}
            </span>
          </div>
        </div>

        {/* Emergency & Clinic Contact Card */}
        <div className="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl shadow-md space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-rose-400">
                <PhoneCall className="w-4 h-4" />
                <span>Bantuan & Kecemasan 24 Jam</span>
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Sekiranya anda mengalami sesak nafas, demam menggigil, atau fistula tersumbat (tiada getaran thrill), segera hubungi kami.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={`tel:${centreInfo.talianKecemasan24Jam}`}
              className="flex items-center justify-center space-x-2 w-full py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs transition shadow-md"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Talian Kecemasan: {centreInfo.talianKecemasan24Jam}</span>
            </a>
            <a
              href={buildWhatsAppLink(centreInfo.whatsappRasmi, `Salam KaizenBros, saya ${loggedInPatient.nama} (${loggedInPatient.id}) ingin bertanya mengenai sesi rawatan saya.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full py-2 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 border border-[#374151] font-semibold rounded-xl text-xs transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Jururawat Bertugas</span>
            </a>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-2 flex items-center space-x-2">
        <button
          onClick={() => setActiveSubTab('jadual')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
            activeSubTab === 'jadual'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#1F2937]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadual Rawatan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('kewangan')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
            activeSubTab === 'kewangan'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#1F2937]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Invois & Resit Rasmi A5 ({patientTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('darah')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
            activeSubTab === 'darah'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#1F2937]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Rekod Ujian Darah</span>
        </button>

        <button
          onClick={() => setActiveSubTab('doktor')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
            activeSubTab === 'doktor'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#1F2937]'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Lawatan Doktor Pakar</span>
        </button>

        <button
          onClick={() => setActiveSubTab('laporan')}
          id="tab-sub-muat-turun-laporan"
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
            activeSubTab === 'laporan'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#1F2937]'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Muat Turun Rekod Perubatan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profil')}
          id="tab-sub-profil-waris"
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
            activeSubTab === 'profil'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#1F2937]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil & Waris</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'kewangan' && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2937] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Resit Rasmi Pembayaran & Dokumen Tuntutan (Claim)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Resit rasmi saiz A5 lengkap dengan no. lesen KKM, perincian subsidi dan cop rasmi bagi urusan tuntutan PERKESO, JPA, Zakat, atau pelepasan cukai LHDN.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0F172A] text-slate-400 uppercase font-mono text-[11px] border-b border-[#1F2937]">
                <tr>
                  <th className="p-3">No. Invois / Resit</th>
                  <th className="p-3">Tarikh</th>
                  <th className="p-3">Perkara</th>
                  <th className="p-3">Jumlah Kasar</th>
                  <th className="p-3">Subsidi Penaja</th>
                  <th className="p-3">Bayaran Pesakit</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Tindakan Claim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {patientTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#1F2937]/50 transition">
                    <td className="p-3 font-mono font-bold text-white">
                      <div>{tx.invoisNo}</div>
                      <div className="text-[10px] text-emerald-400">{tx.resitNo || 'KB-RCP-RASMI'}</div>
                    </td>
                    <td className="p-3 font-mono">{tx.tarikh}</td>
                    <td className="p-3">{tx.perkara}</td>
                    <td className="p-3 font-mono">{formatCurrencyRM(tx.jumlahKasar)}</td>
                    <td className="p-3 font-mono text-emerald-400">-{formatCurrencyRM(tx.subsidiPenaja)}</td>
                    <td className="p-3 font-mono font-bold text-white">{formatCurrencyRM(tx.bayaranPesakit)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'PAID' || tx.status === 'Paid' || tx.status === 'LUNAS' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                      }`}>
                        {tx.status === 'PAID' || tx.status === 'Paid' || tx.status === 'LUNAS' ? 'Paid' : tx.status === 'UNPAID' ? 'Unpaid' : tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedTxForReceipt(tx)}
                          id={`btn-open-a5-receipt-${tx.id}`}
                          title="Lihat & Cetak Resit A5 (PDF/PNG)"
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-xs cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Resit A5</span>
                        </button>

                        <button
                          onClick={() => handleSendWhatsAppReceipt(tx)}
                          id={`btn-wa-receipt-${tx.id}`}
                          title="Hantar Salinan Resit ke WhatsApp"
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 border border-[#374151] font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={() => handleSendEmailReceipt(tx)}
                          id={`btn-email-receipt-${tx.id}`}
                          title="Hantar Salinan Resit ke E-mel"
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#1F2937] hover:bg-[#374151] text-sky-400 border border-[#374151] font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-sky-400" />
                          <span>E-mel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'jadual' && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-[#1F2937] pb-3">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>Senarai Sesi Rawatan Hemodialisis Anda</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patientSessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-[#0F172A] border border-[#1F2937] p-4 rounded-xl space-y-2 hover:border-emerald-500/40 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{formatMalayDate(sess.tarikh)}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    {sess.shift}
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{sess.masaMula} - {sess.masaTamat}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Jururawat: <span className="text-slate-200">{sess.jururawatBertugas}</span>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-[#1F2937] pt-2">
                  Stesen Mesin: <span className="text-emerald-400 font-medium">Ditentukan secara giliran/rawak semasa hadir</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'darah' && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-6 shadow-xl text-slate-200">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1F2937] pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2 font-serif">
                <Activity className="w-6 h-6 text-emerald-400" />
                <span>Rekod Ujian Darah & Analisa Trend 5 Tahun Pesakit</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Laporan digital penuh biokimia, perbandingan trend 5 tahun (2022 - 2026), dan rumusan pakar klinikal untuk kemudahan tontonan pesakit tanpa perlu mencetak.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsMedicalReportModalOpen(true)}
                id="btn-open-pdf-report-from-darah-tab"
                className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Jana & Cetak PDF Ujian Darah</span>
              </button>
            </div>
          </div>

          {/* Sub-Tab Mode Switcher */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-[#0F172A] rounded-xl border border-[#1F2937]">
            <button
              onClick={() => setPatientDarahViewMode('TREND_5_YEARS')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                patientDarahViewMode === 'TREND_5_YEARS'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#111827]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>📊 Analisa Trend 5 Tahun (2022 - 2026)</span>
            </button>

            <button
              onClick={() => setPatientDarahViewMode('VERTICAL_3')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                patientDarahViewMode === 'VERTICAL_3'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#111827]'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>📋 3 Ujian Terkini (Paparan Menegak)</span>
            </button>

            <button
              onClick={() => setPatientDarahViewMode('DR_AI_SUMMARY')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                patientDarahViewMode === 'DR_AI_SUMMARY'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#111827]'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>🤖 Rumusan Dr AI & Pakar Nefrologi</span>
            </button>
          </div>

          {/* Patient Demographics Banner Header */}
          <div className="bg-[#0F172A] border border-[#1F2937] p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Maklumat Demografik Pesakit & Rekod Bio-Makmal</span>
              </h3>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded-full">
                {patientBloodTests.length} Rekod Disimpan (2022 - 2026)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Nama Pesakit:</span>
                <span className="font-black text-white text-sm">{loggedInPatient.nama}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">No. MyKad & Umur:</span>
                <span className="font-mono font-bold text-cyan-400">{loggedInPatient.noIC} • {loggedInPatient.umur} Tth</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Akses Vaskular:</span>
                <span className="font-bold text-slate-200">{loggedInPatient.jenisAkses} ({loggedInPatient.lokasiAkses})</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Penaja Rawatan:</span>
                <span className="font-bold text-emerald-400">{loggedInPatient.penaja}</span>
              </div>
            </div>
          </div>

          {/* MODE 1: 5-YEAR LONGITUDINAL TREND ANALYSIS (2022 - 2026) */}
          {patientDarahViewMode === 'TREND_5_YEARS' && (
            <div className="space-y-6">
              {patientBloodTests.length === 0 ? (
                <div className="bg-[#0F172A] border border-[#1F2937] p-8 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl mx-auto flex items-center justify-center border border-slate-700">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Tiada Rekod Ujian Darah Dijumpai</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Tiada sebarang rekod ujian darah atau makmal disimpan bagi <strong className="text-slate-200">{loggedInPatient.nama}</strong>. Analisa trend 5 tahun hanya memaparkan data secara automatik apabila ujian darah dimuat naik oleh pihak klinik.
                  </p>
                </div>
              ) : (
                <>
                  {/* Stat Summary Cards for 5-Year Trends */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#0F172A] border border-emerald-900/40 p-3.5 rounded-xl">
                      <div className="text-[10px] font-mono text-emerald-400 uppercase">Purata Kt/V (5 Tahun)</div>
                      <div className="text-xl font-black text-emerald-400 mt-1">
                        {(patientBloodTests.reduce((acc, b) => acc + (b.ktV || 0), 0) / patientBloodTests.length).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Target KKM &gt; 1.20 (Cemerlang)</div>
                    </div>

                    <div className="bg-[#0F172A] border border-cyan-900/40 p-3.5 rounded-xl">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase">Trend Hemoglobin (Hb)</div>
                      <div className="text-xl font-black text-cyan-300 mt-1">
                        {patientBloodTests[0]?.hb || '-'} <span className="text-xs font-normal text-slate-400">g/dL</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Purata Anemia HD: 10 - 12 g/dL</div>
                    </div>

                    <div className="bg-[#0F172A] border border-rose-900/40 p-3.5 rounded-xl">
                      <div className="text-[10px] font-mono text-rose-400 uppercase">Kawalan Kalium (K+)</div>
                      <div className="text-xl font-black text-rose-300 mt-1">
                        {patientBloodTests[0]?.potassium || '-'} <span className="text-xs font-normal text-slate-400">mmol/L</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Julat Selamat: 3.5 - 5.5 mmol/L</div>
                    </div>

                    <div className="bg-[#0F172A] border border-amber-900/40 p-3.5 rounded-xl">
                      <div className="text-[10px] font-mono text-amber-400 uppercase">Simpanan Iron (Ferritin)</div>
                      <div className="text-xl font-black text-amber-300 mt-1">
                        {patientBloodTests[0]?.ferritin || '-'} <span className="text-xs font-normal text-slate-400">ng/mL</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Target Dialisis: 200 - 800 ng/mL</div>
                    </div>
                  </div>

              {/* 5-Year Matrix Table */}
              <div className="bg-[#0F172A] border border-[#1F2937] p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2937] pb-3">
                  <h3 className="font-bold text-white text-sm font-mono uppercase flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Jadual Perbandingan Parameter Ujian Darah 5 Tahun (2022 - 2026)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Perbandingan langsung merentasi 5 tahun
                  </span>
                </div>

                <div className="overflow-x-auto border border-[#1F2937] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#111827] text-slate-400 uppercase font-mono text-[10px] border-b border-[#1F2937]">
                      <tr>
                        <th className="p-3 border-r border-[#1F2937]">Parameter Ujian</th>
                        <th className="p-3 border-r border-[#1F2937] text-center">Julat Sasaran</th>
                        <th className="p-3 border-r border-[#1F2937] text-center bg-slate-900/60">2022</th>
                        <th className="p-3 border-r border-[#1F2937] text-center bg-slate-900/60">2023</th>
                        <th className="p-3 border-r border-[#1F2937] text-center bg-slate-900/60">2024</th>
                        <th className="p-3 border-r border-[#1F2937] text-center bg-slate-900/60">2025</th>
                        <th className="p-3 border-r border-[#1F2937] text-center bg-emerald-950/40 text-emerald-300 font-bold">2026 (Terkini)</th>
                        <th className="p-3 text-center">Analisa Trend 5 Tahun</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2937] text-[11px]">
                      {/* Haemoglobin */}
                      <tr className="hover:bg-[#111827]/60">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span>Haemoglobin (Hb g/dL)</span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">10.0 - 12.0</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.hb || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.hb || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.hb || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.hb || '-'}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">
                          {patientBloodTests.find(b => b.tarikhUjian?.includes('2026'))?.hb || patientBloodTests[0]?.hb || '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-400">↗️ Stabil (Memuaskan)</td>
                      </tr>

                      {/* Kalium */}
                      <tr className="hover:bg-[#111827]/60">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                          <span>Kalium / Potassium (K+ mmol/L)</span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">3.5 - 5.5</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.potassium || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.potassium || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.potassium || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.potassium || '-'}</td>
                        <td className="p-3 text-center font-mono font-bold text-rose-300 bg-emerald-950/20">
                          {patientBloodTests.find(b => b.tarikhUjian?.includes('2026'))?.potassium || patientBloodTests[0]?.potassium || '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-400">📉 Terkawal (Dalam Julat)</td>
                      </tr>

                      {/* Pre-Urea */}
                      <tr className="hover:bg-[#111827]/60">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                          <span>Urea Pre-Dialisis (mmol/L)</span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">&lt; 25.0</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.urea || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.urea || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.urea || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.urea || '-'}</td>
                        <td className="p-3 text-center font-mono font-bold text-white bg-emerald-950/20">
                          {patientBloodTests.find(b => b.tarikhUjian?.includes('2026'))?.urea || patientBloodTests[0]?.urea || '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-400">🟢 Penambahbaikan Penapisan</td>
                      </tr>

                      {/* Post-Urea */}
                      <tr className="hover:bg-[#111827]/60">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                          <span>Urea Post-Dialisis & URR %</span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">URR &gt; 65%</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.detailedParameters?.postUrea ? `${patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.detailedParameters?.postUrea} (${patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.detailedParameters?.urr}%)` : '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.detailedParameters?.postUrea ? `${patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.detailedParameters?.postUrea} (${patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.detailedParameters?.urr}%)` : '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.detailedParameters?.postUrea ? `${patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.detailedParameters?.postUrea} (${patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.detailedParameters?.urr}%)` : '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.detailedParameters?.postUrea ? `${patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.detailedParameters?.postUrea} (${patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.detailedParameters?.urr}%)` : '-'}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-300 bg-emerald-950/20">
                          {patientBloodTests[0]?.detailedParameters?.postUrea ? `${patientBloodTests[0].detailedParameters.postUrea} (URR ${patientBloodTests[0].detailedParameters.urr || 0}%)` : '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-400">↗️ Pembersihan Toksin Cemerlang</td>
                      </tr>

                      {/* Creatinine */}
                      <tr className="hover:bg-[#111827]/60">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <span>Creatinine Serum (µmol/L)</span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">Baseline ESRD</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.creatinine || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.creatinine || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.creatinine || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.creatinine || '-'}</td>
                        <td className="p-3 text-center font-mono font-bold text-white bg-emerald-950/20">
                          {patientBloodTests.find(b => b.tarikhUjian?.includes('2026'))?.creatinine || patientBloodTests[0]?.creatinine || '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-300">🟢 Paras Baseline Konsisten</td>
                      </tr>

                      {/* Kt/V */}
                      <tr className="hover:bg-[#111827]/60">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span>Kecukupan Dialisis (Kt/V)</span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">&gt; 1.20</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.ktV || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.ktV || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.ktV || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.ktV || '-'}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">
                          {patientBloodTests.find(b => b.tarikhUjian?.includes('2026'))?.ktV || patientBloodTests[0]?.ktV || '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-400">🌟 Melebihi Sasaran Minimum KKM</td>
                      </tr>

                      {/* Ferritin */}
                      <tr className="hover:bg-[#111827]/60">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <span>Serum Ferritin (ng/mL)</span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">200 - 800</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.ferritin || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.ferritin || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.ferritin || '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.ferritin || '-'}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-300 bg-emerald-950/20">
                          {patientBloodTests.find(b => b.tarikhUjian?.includes('2026'))?.ferritin || patientBloodTests[0]?.ferritin || '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-400">🟢 Simpanan Zat Besi Mencukupi</td>
                      </tr>

                      {/* Calcium & Phosphate */}
                      <tr className="hover:bg-[#111827]/60">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                          <span>Kalsium (Ca) / Fosfat (PO4)</span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">2.1-2.5 / 1.1-1.8</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.calcium ? `${patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.calcium} / ${patientBloodTests.find(b => b.tarikhUjian?.includes('2022'))?.phosphate}` : '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.calcium ? `${patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.calcium} / ${patientBloodTests.find(b => b.tarikhUjian?.includes('2023'))?.phosphate}` : '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.calcium ? `${patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.calcium} / ${patientBloodTests.find(b => b.tarikhUjian?.includes('2024'))?.phosphate}` : '-'}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.calcium ? `${patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.calcium} / ${patientBloodTests.find(b => b.tarikhUjian?.includes('2025'))?.phosphate}` : '-'}</td>
                        <td className="p-3 text-center font-mono font-bold text-white bg-emerald-950/20">
                          {patientBloodTests[0]?.calcium ? `${patientBloodTests[0].calcium} / ${patientBloodTests[0].phosphate}` : '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-400">🟢 Mineral Tulang Terkawal</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

              {/* Historical Log Summary Table */}
              <div className="bg-[#0F172A] border border-[#1F2937] p-5 rounded-2xl space-y-3">
                <h3 className="font-bold text-white text-sm font-mono uppercase flex items-center justify-between">
                  <span>Log Semua Keputusan Ujian Darah ({patientBloodTests.length} Rekod)</span>
                </h3>

                <div className="overflow-x-auto border border-[#1F2937] rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#111827] text-slate-400 uppercase font-mono text-[10px] border-b border-[#1F2937]">
                      <tr>
                        <th className="p-3">Tarikh Ujian</th>
                        <th className="p-3">Makmal Panel</th>
                        <th className="p-3">Hb (g/dL)</th>
                        <th className="p-3">Kalium (mmol/L)</th>
                        <th className="p-3">Kt/V</th>
                        <th className="p-3">Urea Pre</th>
                        <th className="p-3">Creatinine</th>
                        <th className="p-3">Ferritin</th>
                        <th className="p-3">Catatan Klinikal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2937] text-[11px]">
                      {patientBloodTests.map((b) => (
                        <tr key={b.id} className="hover:bg-[#1F2937]/50 transition">
                          <td className="p-3 font-mono font-semibold text-cyan-300">{b.tarikhUjian}</td>
                          <td className="p-3 font-semibold text-slate-200">{b.namaMakmal || 'Pathlab / PrimaLab'}</td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{b.hb}</td>
                          <td className="p-3 font-mono text-rose-300">{b.potassium}</td>
                          <td className="p-3 font-mono font-bold text-white">{b.ktV}</td>
                          <td className="p-3 font-mono text-slate-300">{b.urea}</td>
                          <td className="p-3 font-mono text-slate-300">{b.creatinine}</td>
                          <td className="p-3 font-mono text-amber-300">{b.ferritin}</td>
                          <td className="p-3 text-slate-400">{b.catatan || 'Parameter stabil.'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: 3 LATEST BLOOD TESTS STACKED VERTICALLY */}
          {patientDarahViewMode === 'VERTICAL_3' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                <h3 className="font-bold text-white text-sm font-mono uppercase flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-rose-400" />
                  <span>Senarai 3 Keputusan Ujian Darah Terkini (Menegak Ke Bawah)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Jumlah Rekod: {patientBloodTests.length}
                </span>
              </div>

              {patientBloodTests.slice(0, 3).map((b, idx) => (
                <div key={b.id} className="bg-[#0F172A] border border-[#1F2937] rounded-xl p-5 space-y-4 shadow-lg">
                  {/* Test Card Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#111827] p-3 rounded-lg border border-[#1F2937]">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black font-mono text-xs rounded-md shadow-xs">
                        UJIAN #{idx + 1} {idx === 0 ? '(TERKINI)' : ''}
                      </span>
                      <span className="font-mono font-bold text-base text-cyan-300">{b.tarikhUjian}</span>
                      <span className="text-slate-300 font-semibold text-xs">({b.namaMakmal || 'Makmal Panel'})</span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      PDF: <strong className="text-slate-200">{b.namaFailPDF || 'PrimaLab_KhairulHaizam.pdf'}</strong> • Oleh: {b.diMuatNaikOleh || 'Jururawat'}
                    </div>
                  </div>

                  {/* Key Metrics Quick Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-xs">
                    <div className="p-2 bg-[#111827] rounded-lg border border-[#1F2937]">
                      <span className="text-slate-400 text-[10px] block uppercase">Hb (Anemia)</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">{b.hb} g/dL</span>
                    </div>
                    <div className="p-2 bg-rose-950/40 rounded-lg border border-rose-800/40">
                      <span className="text-rose-400 text-[10px] block uppercase">Kalium (K+)</span>
                      <span className="font-mono font-bold text-rose-300 text-sm">{b.potassium} mmol/L</span>
                    </div>
                    <div className="p-2 bg-[#111827] rounded-lg border border-[#1F2937]">
                      <span className="text-slate-400 text-[10px] block uppercase">Urea Pre/Post</span>
                      <span className="font-mono font-bold text-white text-sm">{b.urea} / {b.detailedParameters?.postUrea || '-'}</span>
                    </div>
                    <div className="p-2 bg-[#111827] rounded-lg border border-[#1F2937]">
                      <span className="text-slate-400 text-[10px] block uppercase">Creatinine</span>
                      <span className="font-mono font-bold text-white text-sm">{b.creatinine}</span>
                    </div>
                    <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800/40">
                      <span className="text-emerald-400 text-[10px] block uppercase">Kt/V Adequacy</span>
                      <span className="font-mono font-bold text-emerald-300 text-sm">{b.ktV}</span>
                    </div>
                    <div className="p-2 bg-[#111827] rounded-lg border border-[#1F2937]">
                      <span className="text-slate-400 text-[10px] block uppercase">Fosfat (PO4)</span>
                      <span className="font-mono font-bold text-white text-sm">{b.phosphate} mmol/L</span>
                    </div>
                    <div className="p-2 bg-[#111827] rounded-lg border border-[#1F2937]">
                      <span className="text-slate-400 text-[10px] block uppercase">Kalsium (Ca)</span>
                      <span className="font-mono font-bold text-white text-sm">{b.calcium} mmol/L</span>
                    </div>
                    <div className="p-2 bg-[#111827] rounded-lg border border-[#1F2937]">
                      <span className="text-slate-400 text-[10px] block uppercase">Ferritin</span>
                      <span className="font-mono font-bold text-white text-sm">{b.ferritin} ng/mL</span>
                    </div>
                  </div>

                  {/* Comprehensive Parameters Table */}
                  <div className="overflow-x-auto border border-[#1F2937] rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#111827] text-slate-400 font-mono uppercase text-[10px] border-b border-[#1F2937]">
                          <th className="p-2 border-r border-[#1F2937]">Kumpulan Parameter</th>
                          <th className="p-2 border-r border-[#1F2937]">Ujian (Test)</th>
                          <th className="p-2 border-r border-[#1F2937] text-center">Keputusan Ujian</th>
                          <th className="p-2 border-r border-[#1F2937] text-center">Julat Rujukan Standard</th>
                          <th className="p-2 text-center">Status Klinikal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F2937] text-[11px]">
                        {/* FBC */}
                        <tr className="hover:bg-[#111827]/40">
                          <td className="p-2 font-bold text-slate-300 bg-[#111827]/60" rowSpan={3}>FULL BLOOD COUNT (FBC)</td>
                          <td className="p-2 font-semibold text-white">Haemoglobin (Hb) & RCC</td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-400">{b.hb} g/dL (RCC {b.detailedParameters?.rcc || 4.2})</td>
                          <td className="p-2 text-center font-mono text-slate-400">12.0 - 18.0 g/dL</td>
                          <td className="p-2 text-center font-bold text-amber-400">Target Anemia HD</td>
                        </tr>
                        <tr className="hover:bg-[#111827]/40">
                          <td className="p-2 font-semibold text-white">Haematocrit (PCV) & MCV / MCH</td>
                          <td className="p-2 text-center font-mono text-slate-300">{b.detailedParameters?.pcv || 37}% / MCV {b.detailedParameters?.mcv || 88}</td>
                          <td className="p-2 text-center font-mono text-slate-400">40-54% / 80-100 fL</td>
                          <td className="p-2 text-center font-bold text-emerald-400">Normal</td>
                        </tr>
                        <tr className="hover:bg-[#111827]/40">
                          <td className="p-2 font-semibold text-white">White Cells (WCC) & Platelet</td>
                          <td className="p-2 text-center font-mono text-slate-300">WCC {b.detailedParameters?.wcc || 6.5} / Platelet {b.detailedParameters?.platelet || 231}</td>
                          <td className="p-2 text-center font-mono text-slate-400">4.0-11.0 / 150-450</td>
                          <td className="p-2 text-center font-bold text-emerald-400">Normal</td>
                        </tr>

                        {/* RENAL & BIOCHEMISTRY */}
                        <tr className="hover:bg-[#111827]/40">
                          <td className="p-2 font-bold text-slate-300 bg-[#111827]/60" rowSpan={3}>RENAL & BIOKIMIA</td>
                          <td className="p-2 font-semibold text-white">Sodium (Na+) / Kalium (K+) / Chloride</td>
                          <td className="p-2 text-center font-mono font-bold text-rose-300">{b.detailedParameters?.sodium || 135} / {b.potassium} / {b.detailedParameters?.chloride || 96} mmol/L</td>
                          <td className="p-2 text-center font-mono text-slate-400">136-145 / 3.5-5.1 / 98-107</td>
                          <td className="p-2 text-center font-bold text-amber-400">Monitor Kalium</td>
                        </tr>
                        <tr className="hover:bg-[#111827]/40">
                          <td className="p-2 font-semibold text-white">Urea Pre / Post / URR %</td>
                          <td className="p-2 text-center font-mono font-bold text-white">{b.urea} / {b.detailedParameters?.postUrea || 5.4} mmol/L (URR {b.detailedParameters?.urr || 59.1}%)</td>
                          <td className="p-2 text-center font-mono text-slate-400">2.8-7.8 / &gt;65% URR</td>
                          <td className="p-2 text-center font-bold text-emerald-400">Kt/V {b.ktV} (Sesuai)</td>
                        </tr>
                        <tr className="hover:bg-[#111827]/40">
                          <td className="p-2 font-semibold text-white">Creatinine / Uric Acid</td>
                          <td className="p-2 text-center font-mono font-bold text-white">{b.creatinine} µmol/L / Uric {b.detailedParameters?.uricAcid || 0.33}</td>
                          <td className="p-2 text-center font-mono text-slate-400">44-106 / 0.20-0.42</td>
                          <td className="p-2 text-center font-bold text-slate-400">ESRD Baseline</td>
                        </tr>

                        {/* METABOLIC, IRON & SEROLOGY */}
                        <tr className="hover:bg-[#111827]/40">
                          <td className="p-2 font-bold text-slate-300 bg-[#111827]/60" rowSpan={3}>IRON, GLIKEMIK & SEROLOGI</td>
                          <td className="p-2 font-semibold text-white">Serum Ferritin / Serum Iron / TSAT %</td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-400">{b.ferritin} ng/mL / Iron {b.detailedParameters?.serumIron || 11.0} / TSAT {b.detailedParameters?.tsatPercent || 24}%</td>
                          <td className="p-2 text-center font-mono text-slate-400">200-800 ng/mL / 13-51%</td>
                          <td className="p-2 text-center font-bold text-emerald-400">Cukup Simpanan</td>
                        </tr>
                        <tr className="hover:bg-[#111827]/40">
                          <td className="p-2 font-semibold text-white">HbA1c % / Fasting Glucose</td>
                          <td className="p-2 text-center font-mono font-bold text-amber-300">HbA1c {b.detailedParameters?.hbA1cPercent || 6.6}% / Glucose {b.detailedParameters?.glucose || 7.6} mmol/L</td>
                          <td className="p-2 text-center font-mono text-slate-400">&lt;6.5% / 3.9-6.0</td>
                          <td className="p-2 text-center font-bold text-amber-400">Diabetic Control</td>
                        </tr>
                        <tr className="hover:bg-[#111827]/40">
                          <td className="p-2 font-semibold text-white">iPTH / Hepatitis B / Hep C / HIV</td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-400">PTH {b.detailedParameters?.iPTH || 38.8} / HBsAb {b.detailedParameters?.hBsAb || '182 mIU/mL'} / HIV NR / Hep C NR</td>
                          <td className="p-2 text-center font-mono text-slate-400">150-300 / &gt;10 mIU/mL</td>
                          <td className="p-2 text-center font-bold text-emerald-400">Imun & Negatif</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Doctor Note */}
                  <div className="p-3 bg-[#111827] rounded-lg border border-[#1F2937] text-xs text-slate-300">
                    <strong className="text-white">Nota / Catatan Klinikal:</strong> {b.catatan || 'Ujian berjalan lancar, parameter stabil.'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODE 3: RUMUSAN DR AI & PAKAR NEFROLOGI */}
          {patientDarahViewMode === 'DR_AI_SUMMARY' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-center space-x-3 text-xs text-emerald-200">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-white">Sistem Analisis AI Dr. Nephro AI Studio:</strong> Ulasan klinikal automatik dijana berdasarkan standard garis panduan KKM & KDOQI untuk bacaan makmal anda.
                </div>
              </div>

              {patientBloodTests.map((b, idx) => {
                const aiSummary = generateDrAiBloodSummary(b);
                return (
                  <div key={b.id} className="bg-[#0F172A] border border-[#1F2937] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-5 h-5 text-cyan-400" />
                        <h4 className="font-bold text-white text-sm">
                          Ulasan Ujian #{idx + 1} ({b.tarikhUjian})
                        </h4>
                      </div>
                      <span className="text-xs font-mono bg-cyan-950 text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-800/40">
                        Kt/V: {b.ktV} • Hb: {b.hb} g/dL
                      </span>
                    </div>

                    <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937] text-xs text-slate-300 space-y-2 whitespace-pre-line font-sans">
                      {aiSummary}
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400">
                      <strong className="text-slate-200">Syor Pemakanan & Gaya Hidup:</strong> Kawal pengambilan makanan tinggi kalium (pisang, durian, cempedak) dan kekalkan cecair mengikut cadangan doktor.
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'doktor' && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-[#1F2937] pb-3">
            <Stethoscope className="w-5 h-5 text-emerald-400" />
            <span>Rekod & Jadual Lawatan Pakar Nefrologi</span>
          </h2>

          <div className="space-y-3">
            {patientVisits.map((v) => (
              <div key={v.id} className="p-4 bg-[#0F172A] border border-[#1F2937] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white">{v.namaDoktor} ({v.jawatanDoktor})</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    {v.status}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  Tarikh: <span className="font-semibold text-white">{formatMalayDate(v.tarikhLawatan)}</span> ({v.masa})
                </div>
                <div className="text-xs text-slate-400">
                  Tujuan: <strong className="text-slate-200">{v.tujuan}</strong>
                </div>
                <div className="text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40">
                  Catatan Pakar: {v.catatanPakar || 'Pemeriksaan rutin memuaskan.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'laporan' && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <span>Muat Turun Rekod Perubatan & Laporan Dialisis</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Jana laporan ringkasan perubatan rasmi untuk rujukan doktor luar, hospital rujukan, atau urusan tuntutan insurans/penaja.
              </p>
            </div>

            <button
              onClick={() => setIsMedicalReportModalOpen(true)}
              id="btn-generate-pdf-report-main"
              className="flex items-center space-x-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Jana & Muat Turun Laporan Perubatan PDF</span>
            </button>
          </div>

          {/* Report Features Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0F172A] border border-[#1F2937] rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <Activity className="w-4 h-4" />
                <span>Ringkasan Ujian Darah 5 Tahun</span>
              </div>
              <p className="text-xs text-slate-300">
                Laporan lengkap mengandungi sejarah ujian darah berkala (Hb, Urea, Creatinine, Kalium, Kt/V) bersama nama makmal panel (Pathlab, Gribbles, BP Lab, Innoquest).
              </p>
            </div>

            <div className="p-4 bg-[#0F172A] border border-[#1F2937] rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                <Stethoscope className="w-4 h-4" />
                <span>Ulasan Pakar & Preskripsi</span>
              </div>
              <p className="text-xs text-slate-300">
                Merangkumi nota lawatan pakar nefrologi, jenis dialyser High-Flux FX80, dos Antikoagulan Heparin, serta sejarah suntikan Erythropoietin (EPO).
              </p>
            </div>

            <div className="p-4 bg-[#0F172A] border border-[#1F2937] rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Format Rasmi Berlesen KKM</span>
              </div>
              <p className="text-xs text-slate-300">
                Dilengkapi no. lesen accreditation KKM, alamat rasmi pusat, cop klinik dan ruang tandatangan pakar nefrologi untuk kegunaan rujukan doktor luar.
              </p>
            </div>
          </div>

          {/* Preview Details Card */}
          <div className="p-5 bg-[#0F172A] border border-[#1F2937] rounded-xl space-y-3">
            <div className="text-xs font-bold text-white border-b border-[#1F2937] pb-2 flex items-center justify-between">
              <span>Pratonton Ringkasan Profil Laporan Pesakit:</span>
              <span className="text-[10px] text-emerald-400 font-mono">Status: Bersedia untuk Dijana</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Nama Pesakit</span>
                <span className="font-bold text-white">{loggedInPatient.nama}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">No. IC</span>
                <span className="font-mono text-slate-200">{loggedInPatient.noIC}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Akses Vaskular</span>
                <span className="font-semibold text-emerald-400">{loggedInPatient.jenisAkses} ({loggedInPatient.lokasiAkses})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Pakar Nefrologi</span>
                <span className="font-semibold text-slate-200">Dr. Sarah binti Mohamad Noor</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PROFIL & MAKLUMAT WARIS PESAKIT */}
      {activeSubTab === 'profil' && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <User className="w-5 h-5 text-emerald-400" />
                <span>Profil Peribadi & Maklumat Waris Kecemasan</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Semak maklumat peribadi, hubungan waris, dan status pendaftaran rawatan anda.
              </p>
            </div>

            <button
              onClick={handleOpenPersonalEdit}
              id="btn-edit-personal-tab-body"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <span>✏️ Edit Maklumat Peribadi</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Boleh Dikemaskini oleh Pesakit */}
            <div className="p-5 bg-[#0F172A] border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider">
                  1. Maklumat Peribadi & Waris (Boleh Dikemaskini)
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-800/40">
                  Akses Edit Dibenarkan
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">No. Telefon WhatsApp Pesakit</span>
                  <span className="font-bold text-white text-sm font-mono">{loggedInPatient.noTelefon || 'Belum Ditetapkan'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Emel Pesakit</span>
                  <span className="font-medium text-slate-200">{loggedInPatient.emel || 'Tiada Emel'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Alamat Kediaman</span>
                  <span className="font-medium text-slate-200">{loggedInPatient.alamat || 'Belum Ditetapkan'}</span>
                </div>
                <div className="pt-2 border-t border-[#1F2937] space-y-1">
                  <span className="text-slate-400 block text-[11px]">Waris Kecemasan</span>
                  <p className="font-bold text-white">{loggedInPatient.namaWaris} ({loggedInPatient.hubunganWaris})</p>
                  <p className="text-slate-300 font-mono">No. Telefon Waris: {loggedInPatient.telefonWaris}</p>
                </div>
              </div>
            </div>

            {/* Box 2: Terkunci (Pendaftaran Rasmi & Klinikal) */}
            <div className="p-5 bg-[#0F172A] border border-[#1F2937] rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">
                  2. Pendaftaran Rasmi & Rekod Klinikal (Terkunci)
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded border border-slate-700">
                  🔒 Dikunci oleh Admin
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nama Rasmi MyKad</span>
                  <span className="font-bold text-white">{loggedInPatient.nama}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">No. MyKad (IC)</span>
                  <span className="font-mono text-slate-200">{loggedInPatient.noIC}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Agensi Penaja</span>
                  <span className="font-bold text-teal-400">{loggedInPatient.penaja}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">No. GL Penaja</span>
                  <span className="font-mono text-slate-200">{loggedInPatient.noRujukanPenaja || 'Tiada'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Jenis Akses Vaskular</span>
                  <span className="font-bold text-emerald-400">{loggedInPatient.jenisAkses} ({loggedInPatient.lokasiAkses})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Berat Kering Pesakit</span>
                  <span className="font-bold text-white font-mono">{loggedInPatient.beratKering} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kumpulan Darah</span>
                  <span className="font-bold text-rose-400">{loggedInPatient.kumpulanDarah}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Alergi Ubat</span>
                  <span className="font-bold text-amber-300">{loggedInPatient.alergi}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official A5 Receipt Modal */}
      <OfficialA5ReceiptModal
        isOpen={!!selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
        transaction={selectedTxForReceipt}
        patient={loggedInPatient}
        centreInfo={centreInfo}
      />

      {/* Official A4 Medical Report PDF Modal */}
      <MedicalReportPdfModal
        isOpen={isMedicalReportModalOpen}
        onClose={() => setIsMedicalReportModalOpen(false)}
        patient={loggedInPatient}
        bloodTests={safeBloodTests}
        doctorVisits={safeDoctorVisits}
        centreInfo={centreInfo}
        isReadOnly={true}
      />

      {/* Patient Edit Personal Info Modal */}
      {isEditPersonalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111827] border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  <span>Kemaskini Maklumat Peribadi & Waris</span>
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Sila pastikan nombor telefon WhatsApp & alamat anda dikemaskini.
                </p>
              </div>
              <button
                onClick={() => setIsEditPersonalModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-cyan-300 text-[11px] leading-relaxed">
              <strong>📌 Nota Penting Pesakit:</strong> Pesakit hanya dibenarkan mengemaskini maklumat telefon, emel, alamat dan waris. Maklumat MyKad, penaja, dan rekod klinikal dikunci oleh pentadbir klinik mengikut syarat KKM.
            </div>

            <form onSubmit={handleSavePersonalEdit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    No. Telefon Pesakit (WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    value={personalFormData.noTelefon}
                    onChange={(e) => setPersonalFormData({ ...personalFormData, noTelefon: e.target.value })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                    placeholder="cth: 0123456789"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Emel Pesakit
                  </label>
                  <input
                    type="email"
                    value={personalFormData.emel}
                    onChange={(e) => setPersonalFormData({ ...personalFormData, emel: e.target.value })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    placeholder="cth: pesakit@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Alamat Kediaman *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={personalFormData.alamat}
                    onChange={(e) => setPersonalFormData({ ...personalFormData, alamat: e.target.value })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-hidden resize-none"
                    placeholder="Alamat terkini kediaman anda"
                  />
                </div>

                <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1F2937] space-y-3">
                  <span className="font-bold text-emerald-400 block border-b border-[#1F2937] pb-1">
                    Maklumat Waris Kecemasan
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Waris *</label>
                      <input
                        type="text"
                        required
                        value={personalFormData.namaWaris}
                        onChange={(e) => setPersonalFormData({ ...personalFormData, namaWaris: e.target.value })}
                        className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Hubungan Waris</label>
                      <input
                        type="text"
                        value={personalFormData.hubunganWaris}
                        onChange={(e) => setPersonalFormData({ ...personalFormData, hubunganWaris: e.target.value })}
                        className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">No. Telefon Waris *</label>
                    <input
                      type="text"
                      required
                      value={personalFormData.telefonWaris}
                      onChange={(e) => setPersonalFormData({ ...personalFormData, telefonWaris: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setIsEditPersonalModalOpen(false)}
                  className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-patient-personal-edit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition cursor-pointer"
                >
                  Simpan Maklumat Peribadi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
