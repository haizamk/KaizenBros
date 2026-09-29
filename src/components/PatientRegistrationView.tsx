import React, { useState } from 'react';
import { NurseWalkthroughGuide } from './NurseWalkthroughGuide';
import { 
  Patient, 
  SponsorType, 
  VascularAccessType, 
  SchedulePattern, 
  ShiftType,
  PreRegisteredPatient
} from '../types';
import { 
  UserPlus, 
  Search, 
  Filter, 
  User, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  MessageCircle, 
  Stethoscope, 
  Weight, 
  Plus, 
  Clock, 
  Building2, 
  FileCheck, 
  Lock, 
  ChevronRight,
  ClipboardList,
  XCircle,
  UserX,
  X,
  KeyRound,
  Shield,
  Camera,
  Sparkles
} from 'lucide-react';
import { buildWhatsAppLink, formatMalayDate, generatePatientMRN } from '../utils/whatsappHelper';
import { PreRegistrationModal } from './PreRegistrationModal';
import { ICScannerModal, ExtractedICData } from './ICScannerModal';
import { INITIAL_NEARBY_HOSPITALS, calculateAgeFromDOB, extractDOBFromIC } from '../data/initialData';

interface PatientRegistrationViewProps {
  patients: Patient[];
  preRegisteredPatients: PreRegisteredPatient[];
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient?: (patient: Patient) => void;
  onAddPreRegisteredPatient: (pre: PreRegisteredPatient) => void;
  onUpdatePreRegisteredPatient: (pre: PreRegisteredPatient) => void;
  onDeletePreRegisteredPatient?: (preId: string) => void;
  onSelectPatientForMessage: (patient: Patient) => void;
  isAdmin?: boolean;
}

export const PatientRegistrationView: React.FC<PatientRegistrationViewProps> = ({
  patients = [],
  preRegisteredPatients = [],
  onAddPatient,
  onUpdatePatient,
  onAddPreRegisteredPatient,
  onUpdatePreRegisteredPatient,
  onDeletePreRegisteredPatient,
  onSelectPatientForMessage,
  isAdmin = true
}) => {
  const safePatients = Array.isArray(patients) ? patients : [];
  const safePreRegPatients = Array.isArray(preRegisteredPatients) ? preRegisteredPatients : [];

  const [activeMainTab, setActiveMainTab] = useState<'OFFICIAL' | 'PRE_REGISTER'>('OFFICIAL');
  const [showForm, setShowForm] = useState(false);
  const [isPreRegModalOpen, setIsPreRegModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSponsor, setFilterSponsor] = useState<string>('ALL');
  const [filterPattern, setFilterPattern] = useState<string>('ALL');
  const [selectedPatientModal, setSelectedPatientModal] = useState<Patient | null>(null);
  const [selectedPreRegForDetail, setSelectedPreRegForDetail] = useState<PreRegisteredPatient | null>(null);

  // Rejection State for Pre-Registered Patients
  const [rejectingPreRegModal, setRejectingPreRegModal] = useState<PreRegisteredPatient | null>(null);
  const [rejectReasonSelection, setRejectReasonSelection] = useState<string>(
    'Status Serologi Positive (Hepatitis B / HCV / HIV - Tiada Unit Isolation)'
  );
  const [customRejectReason, setCustomRejectReason] = useState<string>('');

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPreRegModal) return;

    const finalReason =
      rejectReasonSelection === 'Lain-lain Alasan (Sila Nyatakan)'
        ? customRejectReason.trim()
        : rejectReasonSelection;

    if (!finalReason) {
      alert('Sila nyatakan alasan penolakan pendaftaran.');
      return;
    }

    const updatedPre: PreRegisteredPatient = {
      ...rejectingPreRegModal,
      statusPenilaian: 'DITOLAK',
      alasanPenolakan: finalReason,
      nasihatKlinikalPakar: `Permohonan DITOLAK pada ${new Date().toISOString().split('T')[0]}. Alasan: ${finalReason}`
    };

    onUpdatePreRegisteredPatient(updatedPre);
    if (selectedPreRegForDetail?.id === updatedPre.id) {
      setSelectedPreRegForDetail(updatedPre);
    }
    setRejectingPreRegModal(null);
    setFormSuccessMessage(`Permohonan ${updatedPre.nama} (${updatedPre.id}) telah DITOLAK. Alasan: ${finalReason}`);
    setTimeout(() => setFormSuccessMessage(''), 6000);
  };

  const handleSendWhatsAppRejection = (pre: PreRegisteredPatient) => {
    const reasonText = pre.alasanPenolakan || 'Tidak memenuhi kriteria pengambilan terkini / isu kapasiti.';
    const msg = `*PEMAKLUMAN STATUS PERMOHONAN DIALISIS* 🏥
*Pusat Dialisis KaizenBros*

Salam Tuan/Puan ${pre.nama},

Mengenai permohonan pra-pendaftaran dialisis bernombor *${pre.id}*:

Status: ❌ *DITOLAK / TIDAK DAPAT DITERIMA BUAT MASA INI*
Alasan: ${reasonText}

Sekiranya anda mempunyai pertanyaan lanjut atau dokumen rujukan tambahan, sila hubungi kaunter pentadbiran kami di 03-87270791 / 019-3389922. Terima kasih.`;

    window.open(buildWhatsAppLink(pre.noTelefon, msg), '_blank');
  };

  // Admin Patient Edit State
  const [editingPatientModal, setEditingPatientModal] = useState<Patient | null>(null);
  const [editAdminFormData, setEditAdminFormData] = useState({
    nama: '',
    noIC: '',
    umur: 55,
    jantina: 'LELAKI' as 'LELAKI' | 'PEREMPUAN',
    noTelefon: '',
    emel: '',
    alamat: '',
    namaWaris: '',
    telefonWaris: '',
    hubunganWaris: 'Pasangan',
    status: 'AKTIF' as 'AKTIF' | 'CUTI' | 'HOSPITAL',
    penaja: 'SOCSO' as SponsorType,
    noRujukanPenaja: '',
    jenisAkses: 'AVF' as VascularAccessType,
    lokasiAkses: '',
    beratKering: 60.0,
    beratSemasa: 62.5,
    kumpulanDarah: 'O+' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
    alergi: '',
    komorbid: '',
    corakHari: 'ISNIN_RABU_JUMAAT' as SchedulePattern,
    shift: 'PAGI' as ShiftType,
    stesenNo: 1,
    tarikhUjianDarahSeterusnya: '',
    tarikhLawatanDoktorSeterusnya: '',
  });

  const handleOpenAdminEdit = (patient: Patient) => {
    setEditingPatientModal(patient);
    setEditAdminFormData({
      nama: patient.nama,
      noIC: patient.noIC,
      umur: patient.umur,
      jantina: patient.jantina,
      noTelefon: patient.noTelefon,
      emel: patient.emel,
      alamat: patient.alamat,
      namaWaris: patient.namaWaris,
      telefonWaris: patient.telefonWaris,
      hubunganWaris: patient.hubunganWaris,
      status: patient.status || 'AKTIF',
      penaja: patient.penaja,
      noRujukanPenaja: patient.noRujukanPenaja || '',
      jenisAkses: patient.jenisAkses,
      lokasiAkses: patient.lokasiAkses,
      beratKering: patient.beratKering,
      beratSemasa: patient.beratSemasa,
      kumpulanDarah: patient.kumpulanDarah,
      alergi: patient.alergi,
      komorbid: Array.isArray(patient.komorbid) ? patient.komorbid.join(', ') : (patient.komorbid || ''),
      corakHari: patient.sesiJadual.corakHari,
      shift: patient.sesiJadual.shift,
      stesenNo: patient.sesiJadual.stesenNo || 1,
      tarikhUjianDarahSeterusnya: patient.tarikhUjianDarahSeterusnya || '',
      tarikhLawatanDoktorSeterusnya: patient.tarikhLawatanDoktorSeterusnya || '',
    });
  };

  const handleSaveAdminEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatientModal) return;

    const updatedPatient: Patient = {
      ...editingPatientModal,
      nama: editAdminFormData.nama,
      noIC: editAdminFormData.noIC,
      umur: Number(editAdminFormData.umur),
      jantina: editAdminFormData.jantina,
      noTelefon: editAdminFormData.noTelefon,
      emel: editAdminFormData.emel,
      alamat: editAdminFormData.alamat,
      namaWaris: editAdminFormData.namaWaris,
      telefonWaris: editAdminFormData.telefonWaris,
      hubunganWaris: editAdminFormData.hubunganWaris,
      status: editAdminFormData.status,
      penaja: editAdminFormData.penaja,
      noRujukanPenaja: editAdminFormData.noRujukanPenaja,
      jenisAkses: editAdminFormData.jenisAkses,
      lokasiAkses: editAdminFormData.lokasiAkses,
      beratKering: Number(editAdminFormData.beratKering),
      beratSemasa: Number(editAdminFormData.beratSemasa),
      kumpulanDarah: editAdminFormData.kumpulanDarah,
      alergi: editAdminFormData.alergi,
      komorbid: editAdminFormData.komorbid
        ? editAdminFormData.komorbid.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      sesiJadual: {
        corakHari: editAdminFormData.corakHari,
        shift: editAdminFormData.shift,
        stesenNo: Number(editAdminFormData.stesenNo || 1),
      },
      tarikhUjianDarahSeterusnya: editAdminFormData.tarikhUjianDarahSeterusnya,
      tarikhLawatanDoktorSeterusnya: editAdminFormData.tarikhLawatanDoktorSeterusnya,
    };

    if (onUpdatePatient) {
      onUpdatePatient(updatedPatient);
    }

    if (selectedPatientModal?.id === updatedPatient.id) {
      setSelectedPatientModal(updatedPatient);
    }

    setEditingPatientModal(null);
    setFormSuccessMessage(`✓ Maklumat peribadi & kesihatan pesakit ${updatedPatient.nama} berjaya dikemaskini oleh Admin.`);
    setTimeout(() => setFormSuccessMessage(''), 6000);
  };

  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    noIC: '',
    noTelefon: '',
    emel: '',
    tarikhLahir: '',
    umur: 55,
    jantina: 'LELAKI' as 'LELAKI' | 'PEREMPUAN',
    alamat: '',
    namaWaris: '',
    telefonWaris: '',
    hubunganWaris: 'Pasangan',
    penaja: 'SOCSO' as SponsorType,
    noRujukanPenaja: '',
    jenisAkses: 'AVF' as VascularAccessType,
    lokasiAkses: 'Left Radiocephalic (Lengan Kiri Bawah)',
    beratKering: 60.0,
    beratSemasa: 62.5,
    kumpulanDarah: 'O+' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
    alergi: 'Tiada Alergi Diketahui (NKDA)',
    komorbid: 'Hipertensi, Diabetes Mellitus, ESRD',
    corakHari: 'ISNIN_RABU_JUMAAT' as SchedulePattern,
    shift: 'PAGI' as ShiftType,
    stesenNo: 1,
    tarikhUjianDarahSeterusnya: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    tarikhLawatanDoktorSeterusnya: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const [importedPreRegId, setImportedPreRegId] = useState<string | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState('');
  const [isScanICModalOpen, setIsScanICModalOpen] = useState(false);
  const [scanSuccessAlert, setScanSuccessAlert] = useState<string | null>(null);

  // Handle scanned IC data from Camera AI OCR
  const handleScanICComplete = (extractedData: ExtractedICData) => {
    const cleanIC = extractedData.noIC ? extractedData.noIC.trim() : '';
    const extractedDob = extractedData.tarikhLahir || (cleanIC ? extractDOBFromIC(cleanIC) : '');
    const calculatedAge = extractedDob ? calculateAgeFromDOB(extractedDob) : formData.umur;

    let genderVal = formData.jantina;
    if (extractedData.jantina) {
      const gUpper = extractedData.jantina.toUpperCase();
      if (gUpper.includes('LELAKI') || gUpper === 'M' || gUpper === 'MALE') {
        genderVal = 'LELAKI';
      } else if (gUpper.includes('PEREMPUAN') || gUpper.includes('WANITA') || gUpper === 'F' || gUpper === 'FEMALE') {
        genderVal = 'PEREMPUAN';
      }
    }

    setFormData((prev) => ({
      ...prev,
      nama: extractedData.nama ? extractedData.nama.trim() : prev.nama,
      noIC: cleanIC || prev.noIC,
      tarikhLahir: extractedDob || prev.tarikhLahir,
      umur: calculatedAge > 0 ? calculatedAge : prev.umur,
      jantina: genderVal,
      alamat: extractedData.alamat ? extractedData.alamat.trim() : prev.alamat
    }));

    // Ensure form is visible
    setShowForm(true);

    const personName = extractedData.nama ? extractedData.nama.trim() : 'Pesakit';
    setScanSuccessAlert(`Pengekstrakan AI Berjaya: ${personName} (IC: ${cleanIC || 'MyKad'})`);
    setTimeout(() => setScanSuccessAlert(null), 7000);
  };

  // Handle converting a pre-registered patient into official form
  const handleLoadFromPreReg = (pre: PreRegisteredPatient) => {
    const extractedDob = extractDOBFromIC(pre.noIC || '');
    const calculatedAge = extractedDob ? calculateAgeFromDOB(extractedDob) : (pre.umur || 55);
    setFormData({
      nama: pre.nama,
      noIC: pre.noIC,
      noTelefon: pre.noTelefon,
      emel: pre.emel || '',
      tarikhLahir: extractedDob || '',
      umur: calculatedAge,
      jantina: pre.jantina || 'LELAKI',
      alamat: pre.alamat || '',
      namaWaris: pre.namaWaris || '',
      telefonWaris: pre.telefonWaris || '',
      hubunganWaris: pre.hubunganWaris || 'Pasangan',
      penaja: pre.penajaPilihan || 'SOCSO',
      noRujukanPenaja: 'GL-PENDING-KKM',
      jenisAkses: (pre.jenisAksesSemasa === 'BELUM_BEDAH_FISTULA' ? 'AVF' : pre.jenisAksesSemasa) as VascularAccessType || 'AVF',
      lokasiAkses: pre.lokasiAkses || 'Left Radiocephalic (Lengan Kiri Bawah)',
      beratKering: pre.anggaranBeratKering || 60.0,
      beratSemasa: (pre.anggaranBeratKering || 60.0) + 2.0,
      kumpulanDarah: (pre.kumpulanDarah as any) || 'O+',
      alergi: 'Tiada Alergi Diketahui (NKDA)',
      komorbid: `ESRD (${pre.peringkatPenyakit || 'Stage 5'}), Rujukan: ${pre.hospitalRujukan}`,
      corakHari: pre.cadanganJadual?.corakHari || 'ISNIN_RABU_JUMAAT',
      shift: pre.cadanganJadual?.shift || 'PAGI',
      stesenNo: 1,
      tarikhUjianDarahSeterusnya: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      tarikhLawatanDoktorSeterusnya: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    });
    setImportedPreRegId(pre.id);
    setShowForm(true);
    setActiveMainTab('OFFICIAL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.noIC.trim() || !formData.noTelefon.trim()) {
      alert('Sila lengkapkan Nama Pesakit, No. IC dan No. Telefon.');
      return;
    }

    const calculatedAge = formData.tarikhLahir ? calculateAgeFromDOB(formData.tarikhLahir) : Number(formData.umur);
    const autoMrn = generatePatientMRN(patients);
    const newPatient: Patient = {
      id: autoMrn,
      nama: formData.nama,
      noIC: formData.noIC,
      noTelefon: formData.noTelefon,
      emel: formData.emel || `${formData.nama.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      tarikhLahir: formData.tarikhLahir,
      umur: calculatedAge > 0 ? calculatedAge : Number(formData.umur),
      jantina: formData.jantina,
      alamat: formData.alamat,
      namaWaris: formData.namaWaris,
      telefonWaris: formData.telefonWaris,
      hubunganWaris: formData.hubunganWaris,
      tarikhDaftar: new Date().toISOString().split('T')[0],
      status: 'AKTIF',
      penaja: formData.penaja,
      noRujukanPenaja: formData.noRujukanPenaja,
      jenisAkses: formData.jenisAkses,
      lokasiAkses: formData.lokasiAkses,
      beratKering: Number(formData.beratKering),
      beratSemasa: Number(formData.beratSemasa),
      kumpulanDarah: formData.kumpulanDarah,
      alergi: formData.alergi,
      komorbid: formData.komorbid.split(',').map((s) => s.trim()).filter(Boolean),
      sesiJadual: {
        corakHari: formData.corakHari,
        shift: formData.shift,
        stesenNo: Number(formData.stesenNo)
      },
      tarikhUjianDarahSeterusnya: formData.tarikhUjianDarahSeterusnya,
      tarikhLawatanDoktorSeterusnya: formData.tarikhLawatanDoktorSeterusnya,
      password: '123456',
      isFirstLogin: true
    };

    onAddPatient(newPatient);

    // If imported from pre-registered, delete record from pre-registration list upon becoming official patient
    if (importedPreRegId) {
      if (onDeletePreRegisteredPatient) {
        onDeletePreRegisteredPatient(importedPreRegId);
      }
      setImportedPreRegId(null);
    }

    setFormSuccessMessage(`Pesakit ${newPatient.nama} (${newPatient.id}) telah berjaya didaftarkan! No. Pesakit auto-generated: ${newPatient.id}. Pesakit boleh log masuk Portal menggunakan No. IC / Phone dengan Kata Laluan Default: 123456.`);
    setShowForm(false);

    // Reset some fields
    setFormData({
      ...formData,
      nama: '',
      noIC: '',
      noTelefon: '',
      alamat: '',
      namaWaris: '',
      telefonWaris: '',
      noRujukanPenaja: ''
    });

    setTimeout(() => {
      setFormSuccessMessage('');
    }, 6000);
  };

  const filteredPatients = safePatients.filter((p) => {
    if (!p) return false;
    const pName = (p.nama || '').toLowerCase();
    const pIC = p.noIC || '';
    const pId = (p.id || '').toLowerCase();
    const pPhone = p.noTelefon || '';
    const query = (searchQuery || '').toLowerCase();

    const matchesSearch = 
      pName.includes(query) ||
      pIC.includes(searchQuery) ||
      pId.includes(query) ||
      pPhone.includes(searchQuery);

    const matchesSponsor = filterSponsor === 'ALL' || p.penaja === filterSponsor;
    const matchesPattern = filterPattern === 'ALL' || p.sesiJadual?.corakHari === filterPattern;

    return matchesSearch && matchesSponsor && matchesPattern;
  });

  const filteredPreReg = safePreRegPatients.filter((pre) => {
    if (!pre) return false;
    const preName = (pre.nama || '').toLowerCase();
    const preIC = pre.noIC || '';
    const preHosp = (pre.hospitalRujukan || '').toLowerCase();
    const prePhone = pre.noTelefon || '';
    const query = (searchQuery || '').toLowerCase();

    return (
      preName.includes(query) ||
      preIC.includes(searchQuery) ||
      preHosp.includes(query) ||
      prePhone.includes(searchQuery)
    );
  });

  return (
    <div className="space-y-6 text-[#E2E8F0]">
      {/* Walkthrough Guide for New Staff / Nurse */}
      <NurseWalkthroughGuide tabId="pendaftaran" isAdminAuthenticated={true} />

      {/* Header and Dual Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] p-6 rounded-xl border border-[#1F2937] shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <UserPlus className="w-6 h-6 text-emerald-400" />
            <span>Pendaftaran & Direktori Pesakit Dialisis</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pengurusan pra-pendaftaran pemohon baru untuk nasihat klinikal serta pendaftaran pesakit rasmi (Admin Sahaja).
          </p>
        </div>

        {/* The two distinct buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Button 1: Imbas IC (Kamera AI) */}
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setIsScanICModalOpen(true);
            }}
            id="btn-top-scan-ic"
            className="flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md border border-emerald-500/60 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Buka kamera untuk imbas kad pengenalan MyKad pesakit dan ekstrak maklumat secara automatik"
          >
            <Camera className="w-4 h-4 text-emerald-300" />
            <span>Imbas IC (Kamera)</span>
          </button>

          {/* Button 2: Pra-Pendaftaran Pesakit Baru (Public/Intake) */}
          <button
            onClick={() => setIsPreRegModalOpen(true)}
            id="btn-open-pra-pendaftaran"
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 border border-emerald-500/50 hover:border-emerald-400 font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
          >
            <ClipboardList className="w-4 h-4 text-emerald-400" />
            <span>Pra-Pendaftaran Pesakit Baru</span>
          </button>

          {/* Button 3: Daftar Pesakit Baru (Admin Only) */}
          <button
            onClick={() => setShowForm(!showForm)}
            id="btn-toggle-add-patient-admin"
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-950 transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{showForm ? 'Tutup Borang' : 'Daftar Pesakit Baru (Admin)'}</span>
          </button>
        </div>
      </div>

      {formSuccessMessage && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center space-x-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{formSuccessMessage}</span>
        </div>
      )}

      {/* Main Tabs: Official Patients vs Pre-Registration Intake */}
      <div className="flex space-x-2 border-b border-[#1F2937] pb-2">
        <button
          onClick={() => setActiveMainTab('OFFICIAL')}
          id="tab-official-patients"
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center space-x-2 ${
            activeMainTab === 'OFFICIAL'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:bg-[#111827] hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Pesakit Rasmi Berdaftar ({patients.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('PRE_REGISTER')}
          id="tab-pre-registered-patients"
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center space-x-2 ${
            activeMainTab === 'PRE_REGISTER'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:bg-[#111827] hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Senarai Pra-Pendaftaran & Saringan ({preRegisteredPatients.length})</span>
        </button>
      </div>

      {/* Admin Registration Form Modal / Panel */}
      {showForm && (
        <form 
          onSubmit={handleSubmit}
          className="bg-[#111827] rounded-2xl border border-emerald-500/40 p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn"
        >
          <div className="border-b border-[#1F2937] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Borang Pendaftaran Pesakit Hemodialisis Rasmi (Admin Sahaja)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pendaftaran rasmi pesakit ke dalam sistem berpusat KKM.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Scan IC Button inside Form */}
              <button
                type="button"
                id="btn-scan-ic-form-header"
                onClick={() => setIsScanICModalOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-950/60 transition cursor-pointer border border-emerald-300/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>Imbas IC (Kamera AI)</span>
                <Sparkles className="w-3 h-3 text-amber-900" />
              </button>

              {/* Quick Helper: Select from Pre-Registered Patients */}
              {preRegisteredPatients.length > 0 && (
                <div className="flex items-center space-x-2 bg-[#0F172A] px-3 py-1.5 rounded-xl border border-emerald-800/40">
                  <span className="text-xs text-slate-300 font-medium">Tarik Data:</span>
                  <select
                    onChange={(e) => {
                      const pre = preRegisteredPatients.find((p) => p.id === e.target.value);
                      if (pre) handleLoadFromPreReg(pre);
                    }}
                    className="bg-[#1F2937] text-xs text-emerald-300 font-semibold p-1.5 rounded-lg border border-[#374151] focus:outline-hidden"
                    defaultValue=""
                  >
                    <option value="" disabled>Pilih daripada Pra-Pesakit...</option>
                    {preRegisteredPatients.map((pre) => (
                      <option key={pre.id} value={pre.id}>
                        {pre.nama} ({pre.statusPenilaian})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {scanSuccessAlert && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn shadow-lg shadow-emerald-950/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{scanSuccessAlert}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setScanSuccessAlert(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {importedPreRegId && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
              <span>
                ✓ Data telah dimuat naik daripada rekod Pra-Pendaftaran <strong>{importedPreRegId}</strong>. Sila sahkan jadual sesi sebelum simpan.
              </span>
              <button
                type="button"
                onClick={() => setImportedPreRegId(null)}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Batal Rujukan
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Section 1: Profil Peribadi */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#1F2937] p-2 rounded-md border border-[#374151]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  1. Maklumat Peribadi Pesakit
                </h3>
                <button
                  type="button"
                  id="btn-scan-ic-section-1"
                  onClick={() => setIsScanICModalOpen(true)}
                  className="text-[11px] text-emerald-300 hover:text-emerald-200 font-bold flex items-center gap-1 bg-emerald-950/80 border border-emerald-700/70 px-2.5 py-1 rounded-md hover:bg-emerald-900 transition cursor-pointer hover:scale-105"
                  title="Imbas IC dengan kamera"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imbas IC</span>
                </button>
              </div>

              {/* Auto Generated MRN & Login Credentials Info */}
              <div className="p-2.5 bg-[#0F172A] border border-emerald-800/40 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">No. Pesakit / MRN (Auto):</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800/60 text-xs">
                    {generatePatientMRN(patients)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Akses Login: <strong>No. IC / Phone</strong> • Pass Default: <strong className="text-amber-300 font-mono">123456</strong></span>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Nama Penuh Pesakit (Mengikut IC) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScanICModalOpen(true)}
                    className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Camera className="w-3 h-3 text-teal-400" />
                    <span>Imbas IC</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="cth: Ahmad bin Razak"
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    No. Kad Pengenalan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.noIC}
                    onChange={(e) => {
                      const icVal = e.target.value;
                      const extractedDob = extractDOBFromIC(icVal);
                      if (extractedDob) {
                        const age = calculateAgeFromDOB(extractedDob);
                        setFormData({
                          ...formData,
                          noIC: icVal,
                          tarikhLahir: extractedDob,
                          umur: age > 0 ? age : formData.umur
                        });
                      } else {
                        setFormData({ ...formData, noIC: icVal });
                      }
                    }}
                    placeholder="650214-10-5511"
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">💡 Auto dari IC</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tarikh Lahir (DOB) *
                  </label>
                  <input
                    type="date"
                    value={formData.tarikhLahir}
                    onChange={(e) => {
                      const dobVal = e.target.value;
                      const calculatedAge = calculateAgeFromDOB(dobVal);
                      setFormData({
                        ...formData,
                        tarikhLahir: dobVal,
                        umur: calculatedAge > 0 ? calculatedAge : formData.umur
                      });
                    }}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">💡 Pilih untuk kira umur</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Umur (Tahun)</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded border border-emerald-800 font-mono font-bold">Auto</span>
                  </label>
                  <input
                    type="number"
                    value={formData.umur}
                    onChange={(e) => setFormData({ ...formData, umur: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jantina
                  </label>
                  <select
                    value={formData.jantina}
                    onChange={(e) => setFormData({ ...formData, jantina: e.target.value as any })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="LELAKI">Lelaki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kumpulan Darah
                  </label>
                  <select
                    value={formData.kumpulanDarah}
                    onChange={(e) => setFormData({ ...formData, kumpulanDarah: e.target.value as any })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  No. Telefon Pesakit (Wajib untuk WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.noTelefon}
                  onChange={(e) => setFormData({ ...formData, noTelefon: e.target.value })}
                  placeholder="019-234 5678"
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Emel Pesakit
                </label>
                <input
                  type="email"
                  value={formData.emel}
                  onChange={(e) => setFormData({ ...formData, emel: e.target.value })}
                  placeholder="pesakit@gmail.com"
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alamat Kediaman
                </label>
                <textarea
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Alamat penuh pesakit..."
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-[#1F2937] space-y-3">
                <span className="text-xs font-semibold text-slate-400 block">Maklumat Waris / Kecemasan</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nama Waris"
                    value={formData.namaWaris}
                    onChange={(e) => setFormData({ ...formData, namaWaris: e.target.value })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-slate-100 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="Hubungan (cth: Pasangan)"
                    value={formData.hubunganWaris}
                    onChange={(e) => setFormData({ ...formData, hubunganWaris: e.target.value })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-slate-100 focus:outline-hidden"
                  />
                </div>
                <input
                  type="text"
                  placeholder="No Telefon Waris (Kecemasan)"
                  value={formData.telefonWaris}
                  onChange={(e) => setFormData({ ...formData, telefonWaris: e.target.value })}
                  className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-slate-100 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Section 2: Maklumat Klinikal & Dialisis */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-[#1F2937] p-2 rounded-md border border-[#374151]">
                2. Status Klinikal & Akses Vaskular
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jenis Akses Vaskular
                  </label>
                  <select
                    value={formData.jenisAkses}
                    onChange={(e) => setFormData({ ...formData, jenisAkses: e.target.value as any })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="AVF">AVF (Arteriovenous Fistula)</option>
                    <option value="AVG">AVG (Arteriovenous Graft)</option>
                    <option value="PERMACATH">Permacath (Tunneled Catheter)</option>
                    <option value="CATHETER_TEMPORARY">IJ / Femoral Catheter Semasa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lokasi Akses
                  </label>
                  <input
                    type="text"
                    value={formData.lokasiAkses}
                    onChange={(e) => setFormData({ ...formData, lokasiAkses: e.target.value })}
                    placeholder="cth: Lengan Kiri Bawah (Radiocephalic)"
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Berat Kering Sasaran (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.beratKering}
                    onChange={(e) => setFormData({ ...formData, beratKering: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Berat Semasa (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.beratSemasa}
                    onChange={(e) => setFormData({ ...formData, beratSemasa: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sejarah Alergi Ubat / Makanan
                </label>
                <input
                  type="text"
                  value={formData.alergi}
                  onChange={(e) => setFormData({ ...formData, alergi: e.target.value })}
                  placeholder="cth: Tiada Alergi / Alergi Penicillin"
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Komorbiditi / Sejarah Perubatan (Pisahkan dengan koma)
                </label>
                <textarea
                  rows={2}
                  value={formData.komorbid}
                  onChange={(e) => setFormData({ ...formData, komorbid: e.target.value })}
                  placeholder="Hipertensi, Diabetes Mellitus Type 2, Ischemic Heart Disease..."
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1F2937] text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-emerald-400 block">SOP Akses Fistula:</span>
                <p>Pesakit dinasihatkan mencuci lengan akses dengan sabun antiseptik chlorhexidine sebelum menyertai giliran hemodialisis.</p>
              </div>
            </div>

            {/* Section 3: Penaja & Jadual Tetap */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-[#1F2937] p-2 rounded-md border border-[#374151]">
                3. Penaja & Penjadualan Rawatan
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Agensi Penaja / Kaedah Bayaran
                </label>
                <select
                  value={formData.penaja}
                  onChange={(e) => setFormData({ ...formData, penaja: e.target.value as any })}
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="SOCSO">PERKESO / SOCSO (Subsidi Penuh Dialisis)</option>
                  <option value="JPA_KWAP">JPA / KWAP (Pesara Kerajaan Persekutuan)</option>
                  <option value="ZAKAT_MAIWP">Zakat MAIWP / Lembaga Zakat Negeri</option>
                  <option value="PERSENDIRIAN">Persendirian (Bayaran Tunai/Kad/FPX)</option>
                  <option value="INSURANS">Insurans Swasta (Prudential, Great Eastern, dsb.)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  No. Rujukan GL / Surat Kelulusan Penaja
                </label>
                <input
                  type="text"
                  value={formData.noRujukanPenaja}
                  onChange={(e) => setFormData({ ...formData, noRujukanPenaja: e.target.value })}
                  placeholder="cth: SOCSO/KL/2026/9921"
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Corak Hari Sesi
                  </label>
                  <select
                    value={formData.corakHari}
                    onChange={(e) => setFormData({ ...formData, corakHari: e.target.value as any })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="ISNIN_RABU_JUMAAT">Isnin, Rabu, Jumaat (MWF)</option>
                    <option value="SELASA_KHAMIS_SABTU">Selasa, Khamis, Sabtu (TTS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Shift Sesi
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="PAGI">Pagi (06:00 - 10:00)</option>
                    <option value="TENGAHARI">Tengahari (10:00 - 14:00)</option>
                    <option value="PETANG">Petang (14:00 - 18:00)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1F2937]">
                <div className="text-xs font-semibold text-emerald-400 mb-1">Penugasan Stesen Mesin:</div>
                <p className="text-[11px] text-slate-300">
                  Stesen mesin hemodialisis ditetapkan secara <strong>rawak / giliran triage</strong> semasa pesakit hadir mengikut SOP klinikal pusat dialisis.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tarikh Test Darah Seterusnya
                  </label>
                  <input
                    type="date"
                    value={formData.tarikhUjianDarahSeterusnya}
                    onChange={(e) => setFormData({ ...formData, tarikhUjianDarahSeterusnya: e.target.value })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tarikh Lawatan Doktor
                  </label>
                  <input
                    type="date"
                    value={formData.tarikhLawatanDoktorSeterusnya}
                    onChange={(e) => setFormData({ ...formData, tarikhLawatanDoktorSeterusnya: e.target.value })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-[#1F2937]">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-xl text-sm font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-submit-patient-registration"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              Daftar Pesakit & Aktifkan Notifikasi WhatsApp
            </button>
          </div>
        </form>
      )}

      {/* VIEW 1: OFFICIAL PATIENTS */}
      {activeMainTab === 'OFFICIAL' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937] shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari pesakit, No. IC, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Penaja:</span>
              </div>
              <select
                value={filterSponsor}
                onChange={(e) => setFilterSponsor(e.target.value)}
                className="bg-[#0F172A] text-xs text-slate-200 border border-[#374151] rounded-lg p-1.5 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="ALL">Semua Penaja</option>
                <option value="SOCSO">PERKESO</option>
                <option value="JPA_KWAP">JPA / KWAP</option>
                <option value="ZAKAT_MAIWP">Zakat MAIWP</option>
                <option value="PERSENDIRIAN">Persendirian</option>
                <option value="INSURANS">Insurans</option>
              </select>

              <div className="flex items-center space-x-1 text-xs text-slate-400 ml-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Corak Hari:</span>
              </div>
              <select
                value={filterPattern}
                onChange={(e) => setFilterPattern(e.target.value)}
                className="bg-[#0F172A] text-xs text-slate-200 border border-[#374151] rounded-lg p-1.5 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="ALL">Semua Hari</option>
                <option value="ISNIN_RABU_JUMAAT">Isnin/Rabu/Jumaat</option>
                <option value="SELASA_KHAMIS_SABTU">Selasa/Khamis/Sabtu</option>
              </select>
            </div>
          </div>

          {/* Patients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-[#111827] rounded-xl border border-[#1F2937] hover:border-emerald-500/40 p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                        {patient.id}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1 group-hover:text-emerald-400 transition">
                        {patient.nama}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        IC: {patient.noIC} • {patient.umur} Thn ({patient.jantina})
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F2937] text-slate-300 border border-[#374151]">
                      {patient.penaja}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 border-t border-[#1F2937] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Akses Vaskular:</span>
                      <span className="font-semibold text-emerald-400">{patient.jenisAkses} ({patient.lokasiAkses})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Berat Kering:</span>
                      <span className="font-semibold text-white">{patient.beratKering} kg (Semasa: {patient.beratSemasa} kg)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Jadual Sesi:</span>
                      <span className="font-semibold text-cyan-400">
                        {patient.sesiJadual.corakHari === 'ISNIN_RABU_JUMAAT' ? 'Isnin/Rabu/Jumaat' : 'Selasa/Khamis/Sabtu'} ({patient.sesiJadual.shift})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Stesen Mesin:</span>
                      <span className="text-slate-200">Rawak / Di Kaunter Semasa Hadir</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1F2937] flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedPatientModal(patient)}
                      className="text-xs text-slate-300 hover:text-white font-medium underline underline-offset-2"
                    >
                      Profil Lengkap
                    </button>
                    <button
                      onClick={() => handleOpenAdminEdit(patient)}
                      id={`btn-edit-patient-admin-${patient.id}`}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                    >
                      <span>✏️ Edit Pesakit</span>
                    </button>
                  </div>

                  <a
                    href={buildWhatsAppLink(patient.noTelefon, `Salam Encik/Puan ${patient.nama}. Ini mesej rasmi dari Pusat Dialisis KaizenBros mengenai status fail dan jadual rawatan anda.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: PRE-REGISTERED PATIENTS & CLINICAL SCREENING */}
      {activeMainTab === 'PRE_REGISTER' && (
        <div className="space-y-4">
          <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                <span>Senarai Pra-Pendaftaran & Penilaian Klinikal</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Semua permohonan pra-pendaftaran pesakit baru melalui portal atau kaunter disaring di sini untuk semakan doktor pakar & jururawat sebelum diterima masuk secara rasmi.
              </p>
            </div>

            <button
              onClick={() => setIsPreRegModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Borang Pra-Pendaftaran Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredPreReg.map((pre) => (
              <div
                key={pre.id}
                className="bg-[#111827] border border-[#1F2937] hover:border-emerald-500/40 rounded-xl p-5 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-bold">
                          {pre.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pre.statusPenilaian === 'LAYAK_DITERIMA'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                            : pre.statusPenilaian === 'TELAH_DIDAFTAR'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                            : pre.statusPenilaian === 'DITOLAK'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                        }`}>
                          {pre.statusPenilaian === 'DITOLAK' ? '❌ DITOLAK' : pre.statusPenilaian}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5">{pre.nama}</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        IC: {pre.noIC} • {pre.umur} Thn ({pre.jantina})
                      </p>
                    </div>

                    <div className="text-right text-[10px] text-slate-400">
                      <div>Mohon: {pre.tarikhMohon}</div>
                      <div className="font-semibold text-emerald-400">{pre.penajaPilihan}</div>
                    </div>
                  </div>

                  {/* Medical & Screening Specs */}
                  <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1F2937] space-y-2 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400">Hospital Rujukan:</span>{' '}
                      <strong className="text-white">{pre.hospitalRujukan}</strong> {pre.doktorMerujuk ? `(${pre.doktorMerujuk})` : ''}
                    </div>
                    <div>
                      <span className="text-slate-400">Akses Vaskular:</span>{' '}
                      <strong className="text-emerald-400">{pre.jenisAksesSemasa || 'Belum Ditetapkan'}</strong> {pre.lokasiAkses ? `(${pre.lokasiAkses})` : ''}
                    </div>

                    {pre.statusSerologiHepatitis ? (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#1F2937]">
                        <span>Serologi Hepatitis:</span>
                        <span className="font-mono text-emerald-400">
                          HBsAg: {pre.statusSerologiHepatitis.hbsAg} | HCV: {pre.statusSerologiHepatitis.antiHCV} | HIV: {pre.statusSerologiHepatitis.hiv}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-300/80 italic pt-1 border-t border-[#1F2937]">
                        * Serologi Hepatitis & Berat Kering akan disemak/dimasukkan oleh Admin semasa pendaftaran.
                      </div>
                    )}
                  </div>

                  {/* Attached Documents Section */}
                  <div className="p-3 bg-[#131C31] rounded-xl border border-emerald-500/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Dokumen Terlampir ({pre.lampiranFail?.length || pre.dokumenTersedia?.length || 0})</span>
                      </span>
                      <button
                        onClick={() => setSelectedPreRegForDetail(pre)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
                      >
                        Lihat / Pratonton
                      </button>
                    </div>

                    {pre.lampiranFail && pre.lampiranFail.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {pre.lampiranFail.map((doc) => (
                          <span
                            key={doc.id}
                            onClick={() => setSelectedPreRegForDetail(pre)}
                            className="inline-flex items-center gap-1 text-[10px] bg-[#0F172A] text-slate-200 border border-[#374151] px-2 py-0.5 rounded cursor-pointer hover:border-emerald-500"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span className="truncate max-w-[140px]">{doc.namaDokumen}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        {pre.dokumenTersedia && pre.dokumenTersedia.length > 0 
                          ? pre.dokumenTersedia.join(', ')
                          : 'Tiada lampiran khas'}
                      </p>
                    )}
                  </div>

                  {/* Rejection Alert Box if Status is DITOLAK */}
                  {pre.statusPenilaian === 'DITOLAK' ? (
                    <div className="p-3 bg-rose-950/70 rounded-xl border border-rose-800/80 text-xs space-y-1 text-rose-200">
                      <span className="font-bold text-rose-300 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>PERMOHONAN DITOLAK</span>
                      </span>
                      <p className="text-[11px] leading-relaxed text-rose-100">
                        <strong>Alasan Penolakan:</strong> {pre.alasanPenolakan || pre.nasihatKlinikalPakar}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppRejection(pre)}
                        className="mt-1.5 px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded text-[10px] font-bold inline-flex items-center gap-1 transition"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Maklumkan Penolakan via WhatsApp</span>
                      </button>
                    </div>
                  ) : (
                    /* Clinical Advice & Monitoring Notes */
                    <div className="p-3 bg-[#1F2937]/50 rounded-xl border border-[#374151] text-xs space-y-1">
                      <span className="font-bold text-amber-300 block">Nasihat & Status Semakan:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {pre.nasihatKlinikalPakar || 'Menunggu semakan surat rujukan hospital dan saringan dokumen oleh jururawat penyelia.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#1F2937] flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <a
                      href={buildWhatsAppLink(pre.noTelefon, `Salam Tuan/Puan ${pre.nama}. Kami daripada Pusat Dialisis KaizenBros ingin menyusul permohonan Pra-Pendaftaran anda (${pre.id}). Sila hubungi kami untuk semakan dokumen dan temujanji saringan.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Pemohon</span>
                    </a>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedPreRegForDetail(pre)}
                      className="px-2.5 py-1.5 bg-[#1F2937] hover:bg-[#374151] text-slate-200 rounded-lg text-xs font-semibold border border-[#374151]"
                    >
                      Fail Penuh
                    </button>

                    {pre.statusPenilaian !== 'TELAH_DIDAFTAR' && pre.statusPenilaian !== 'DITOLAK' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingPreRegModal(pre);
                            setRejectReasonSelection('Status Serologi Positive (Hepatitis B / HCV / HIV - Tiada Unit Isolation)');
                            setCustomRejectReason('');
                          }}
                          className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-semibold border border-rose-800/60 flex items-center space-x-1 transition"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>

                        <button
                          onClick={() => handleLoadFromPreReg(pre)}
                          id={`btn-convert-prereg-${pre.id}`}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1 shadow-md"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Luluskan & Daftar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-Registration Modal */}
      <PreRegistrationModal
        isOpen={isPreRegModalOpen}
        onClose={() => setIsPreRegModalOpen(false)}
        onAddPreRegisteredPatient={(preData) => {
          onAddPreRegisteredPatient(preData);
          setFormSuccessMessage(`Permohonan Pra-Pendaftaran untuk ${preData.nama} (${preData.id}) telah berjaya dihantar!`);
          setTimeout(() => setFormSuccessMessage(''), 6000);
        }}
      />

      {/* Full Patient Detail Modal */}
      {selectedPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl max-w-2xl w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedPatientModal.nama}</h3>
                <p className="text-slate-400 font-mono">{selectedPatientModal.id} • MyKad: {selectedPatientModal.noIC}</p>
              </div>
              <button
                onClick={() => setSelectedPatientModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1F2937] space-y-1.5">
                <span className="font-bold text-white block border-b border-[#1F2937] pb-1">Maklumat Peribadi & Waris</span>
                <div><span className="text-slate-500">Emel:</span> <span className="font-medium text-slate-200">{selectedPatientModal.emel}</span></div>
                <div><span className="text-slate-500">Alamat:</span> <span className="font-medium text-slate-200">{selectedPatientModal.alamat}</span></div>
                <div><span className="text-slate-500">Waris:</span> <span className="font-medium text-slate-200">{selectedPatientModal.namaWaris} ({selectedPatientModal.hubunganWaris})</span></div>
                <div><span className="text-slate-500">Telefon Waris:</span> <span className="font-medium text-slate-200">{selectedPatientModal.telefonWaris}</span></div>
              </div>

              <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1F2937] space-y-1.5">
                <span className="font-bold text-emerald-400 block border-b border-[#1F2937] pb-1">Klinikal Dialisis</span>
                <div><span className="text-slate-500">Akses Vaskular:</span> <span className="font-bold text-emerald-300">{selectedPatientModal.jenisAkses} ({selectedPatientModal.lokasiAkses})</span></div>
                <div><span className="text-slate-500">Berat Kering:</span> <span className="font-bold text-white font-mono">{selectedPatientModal.beratKering} kg</span></div>
                <div><span className="text-slate-500">Kumpulan Darah:</span> <span className="font-bold text-rose-400">{selectedPatientModal.kumpulanDarah}</span></div>
                <div><span className="text-slate-500">Alergi:</span> <span className="font-bold text-amber-400">{selectedPatientModal.alergi}</span></div>
              </div>

              <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1F2937] space-y-1.5">
                <span className="font-bold text-teal-400 block border-b border-[#1F2937] pb-1">Penaja & Penjadualan</span>
                <div><span className="text-slate-500">Penaja:</span> <span className="font-bold text-teal-300">{selectedPatientModal.penaja}</span></div>
                <div><span className="text-slate-500">No. Rujukan GL:</span> <span className="font-mono text-slate-200">{selectedPatientModal.noRujukanPenaja || 'Tiada'}</span></div>
                <div><span className="text-slate-500">Hari & Sesi:</span> <span className="font-medium text-slate-200">{selectedPatientModal.sesiJadual.corakHari} ({selectedPatientModal.sesiJadual.shift})</span></div>
                <div><span className="text-slate-500">Stesen Mesin:</span> <span className="font-bold text-white">Penetapan Rawak / Saringan Semasa Hadir</span></div>
              </div>

              <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1F2937] space-y-1.5">
                <span className="font-bold text-cyan-400 block border-b border-[#1F2937] pb-1">Peringatan Berjadual</span>
                <div><span className="text-slate-500">Test Darah Akan Datang:</span> <span className="font-bold text-rose-400 font-mono">{selectedPatientModal.tarikhUjianDarahSeterusnya}</span></div>
                <div><span className="text-slate-500">Lawatan Doktor Pakar:</span> <span className="font-bold text-cyan-300 font-mono">{selectedPatientModal.tarikhLawatanDoktorSeterusnya}</span></div>
                <div><span className="text-slate-500">Komorbid:</span> <span className="font-medium text-slate-300">{selectedPatientModal.komorbid.join(', ')}</span></div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleOpenAdminEdit(selectedPatientModal)}
                id="btn-edit-patient-from-detail-modal"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer flex items-center space-x-1"
              >
                <span>✏️ Edit Maklumat (Admin)</span>
              </button>

              <a
                href={buildWhatsAppLink(selectedPatientModal.noTelefon, `Salam Encik/Puan ${selectedPatientModal.nama}, ini maklumat fail rasmi rawatan anda di Pusat Dialisis KaizenBros.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 border border-[#374151] font-bold rounded-lg text-xs flex items-center space-x-1.5 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Pesakit</span>
              </a>

              <button
                onClick={() => setSelectedPatientModal(null)}
                className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-200 rounded-lg text-xs font-semibold border border-[#374151] transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Full Patient Edit Modal */}
      {editingPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#111827] border border-emerald-500/40 rounded-2xl max-w-3xl w-full p-6 space-y-5 text-xs shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  <span>Kemaskini Semua Maklumat Peribadi & Kesihatan Pesakit (Admin)</span>
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  ID: <strong className="text-emerald-400 font-mono">{editingPatientModal.id}</strong> • Pendaftaran Rasmi KKM
                </p>
              </div>
              <button
                onClick={() => setEditingPatientModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdminEdit} className="space-y-5">
              {/* Section 1: Profil Peribadi */}
              <div className="bg-[#0F172A] p-4 rounded-xl border border-[#1F2937] space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-[#1F2937] pb-1.5">
                  1. Maklumat Peribadi & Demografik
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Penuh *</label>
                    <input
                      type="text"
                      required
                      value={editAdminFormData.nama}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, nama: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">No. MyKad (IC) *</label>
                    <input
                      type="text"
                      required
                      value={editAdminFormData.noIC}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, noIC: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Status Pesakit</label>
                    <select
                      value={editAdminFormData.status}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, status: e.target.value as any })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden font-bold"
                    >
                      <option value="AKTIF">AKTIF</option>
                      <option value="CUTI">CUTI</option>
                      <option value="HOSPITAL">HOSPITAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Umur (Tahun)</label>
                    <input
                      type="number"
                      value={editAdminFormData.umur}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, umur: Number(e.target.value) })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Jantina</label>
                    <select
                      value={editAdminFormData.jantina}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, jantina: e.target.value as any })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="LELAKI">LELAKI</option>
                      <option value="PEREMPUAN">PEREMPUAN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">No. Telefon *</label>
                    <input
                      type="text"
                      required
                      value={editAdminFormData.noTelefon}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, noTelefon: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Emel Pesakit</label>
                    <input
                      type="email"
                      value={editAdminFormData.emel}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, emel: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Alamat Kediaman</label>
                    <input
                      type="text"
                      value={editAdminFormData.alamat}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, alamat: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Waris Kecemasan */}
              <div className="bg-[#0F172A] p-4 rounded-xl border border-[#1F2937] space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-[#1F2937] pb-1.5">
                  2. Maklumat Waris / Hubungan Kecemasan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Waris</label>
                    <input
                      type="text"
                      value={editAdminFormData.namaWaris}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, namaWaris: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Hubungan Waris</label>
                    <input
                      type="text"
                      value={editAdminFormData.hubunganWaris}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, hubunganWaris: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">No. Telefon Waris</label>
                    <input
                      type="text"
                      value={editAdminFormData.telefonWaris}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, telefonWaris: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Maklumat Kesihatan & Dialisis */}
              <div className="bg-[#0F172A] p-4 rounded-xl border border-[#1F2937] space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider border-b border-[#1F2937] pb-1.5">
                  3. Maklumat Kesihatan & Klinikal Dialisis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Jenis Akses Vaskular</label>
                    <select
                      value={editAdminFormData.jenisAkses}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, jenisAkses: e.target.value as any })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden font-bold text-emerald-400"
                    >
                      <option value="AVF">AVF (Arteriovenous Fistula)</option>
                      <option value="AVG">AVG (Arteriovenous Graft)</option>
                      <option value="CVC_TEMPORARY">CVC (Katakli Sementara)</option>
                      <option value="PERMACATH">Permacath (Katakli Kekal)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Lokasi Akses</label>
                    <input
                      type="text"
                      value={editAdminFormData.lokasiAkses}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, lokasiAkses: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Berat Kering (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editAdminFormData.beratKering}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, beratKering: Number(e.target.value) })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 font-mono font-bold text-emerald-300 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Berat Semasa (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editAdminFormData.beratSemasa}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, beratSemasa: Number(e.target.value) })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Kumpulan Darah</label>
                    <select
                      value={editAdminFormData.kumpulanDarah}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, kumpulanDarah: e.target.value as any })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="AB+">AB+</option>
                      <option value="O-">O-</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Alergi Ubat / Makanan</label>
                    <input
                      type="text"
                      value={editAdminFormData.alergi}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, alergi: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden text-amber-300"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Komorbid (Dipisahkan Koma)</label>
                    <input
                      type="text"
                      value={editAdminFormData.komorbid}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, komorbid: e.target.value })}
                      placeholder="cth: Hipertensi, Diabetes Mellitus (DM), ESRD"
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Penaja & Penjadualan */}
              <div className="bg-[#0F172A] p-4 rounded-xl border border-[#1F2937] space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-[#1F2937] pb-1.5">
                  4. Penaja & Penjadualan Rawatan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Agensi Penaja</label>
                    <select
                      value={editAdminFormData.penaja}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, penaja: e.target.value as any })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden font-bold"
                    >
                      <option value="SOCSO">SOCSO / PERKESO</option>
                      <option value="JPA_KWAP">JPA / KWAP</option>
                      <option value="ZAKAT_MAIWP">Zakat MAIWP</option>
                      <option value="PERSENDIRIAN">Persendirian</option>
                      <option value="INSURANS">Insurans Swasta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">No. Rujukan GL / Penaja</label>
                    <input
                      type="text"
                      value={editAdminFormData.noRujukanPenaja}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, noRujukanPenaja: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Corak Hari Sesi</label>
                    <select
                      value={editAdminFormData.corakHari}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, corakHari: e.target.value as any })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="ISNIN_RABU_JUMAAT">Isnin/Rabu/Jumaat (MWF)</option>
                      <option value="SELASA_KHAMIS_SABTU">Selasa/Khamis/Sabtu (TTS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Shift Sesi</label>
                    <select
                      value={editAdminFormData.shift}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, shift: e.target.value as any })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="PAGI">Pagi (06:00 - 10:00)</option>
                      <option value="TENGAHARI">Tengahari (10:00 - 14:00)</option>
                      <option value="PETANG">Petang (14:00 - 18:00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tarikh Ujian Darah Seterusnya</label>
                    <input
                      type="date"
                      value={editAdminFormData.tarikhUjianDarahSeterusnya}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, tarikhUjianDarahSeterusnya: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tarikh Lawatan Doktor Seterusnya</label>
                    <input
                      type="date"
                      value={editAdminFormData.tarikhLawatanDoktorSeterusnya}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, tarikhLawatanDoktorSeterusnya: e.target.value })}
                      className="w-full p-2 bg-[#111827] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Akses Portal & Keselamatan Akaun */}
              <div className="bg-[#0F172A] p-4 rounded-xl border border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Akses Portal Pesakit &amp; Kata Laluan</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Status Login: <strong className="text-slate-200">{editingPatientModal.isFirstLogin ? 'Pendaftaran Baharu (Belum Tukar Password)' : 'Telah Menukar Password Peribadi'}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Reset kata laluan ${editingPatientModal.nama} ke default '123456'?`)) {
                        const resetP: Patient = {
                          ...editingPatientModal,
                          password: '123456',
                          isFirstLogin: true
                        };
                        if (onUpdatePatient) onUpdatePatient(resetP);
                        setEditingPatientModal(resetP);
                        alert(`Kata laluan ${editingPatientModal.nama} telah di-reset ke '123456'. Pesakit perlu menukar kata laluan semasa log masuk.`);
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800/60 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Kata Laluan ke Default (123456)</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setEditingPatientModal(null)}
                  className="px-5 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-admin-patient-edit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer"
                >
                  Simpan Perubahan Pesakit (Admin)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-Registered Patient Full Detail & Document Inspection Modal */}
      {selectedPreRegForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#111827] border border-emerald-500/40 rounded-2xl max-w-3xl w-full p-6 space-y-5 text-xs shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-bold">
                    {selectedPreRegForDetail.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                    {selectedPreRegForDetail.statusPenilaian}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{selectedPreRegForDetail.nama}</h3>
                <p className="text-slate-400 text-[11px] font-mono">
                  MyKad: {selectedPreRegForDetail.noIC} • {selectedPreRegForDetail.umur} Tahun ({selectedPreRegForDetail.jantina})
                </p>
              </div>

              <button
                onClick={() => setSelectedPreRegForDetail(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-[#1F2937]"
              >
                ✕
              </button>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal & Waris */}
              <div className="p-3.5 bg-[#0F172A] rounded-xl border border-[#1F2937] space-y-2">
                <span className="font-bold text-emerald-400 block border-b border-[#1F2937] pb-1 uppercase tracking-wider text-[11px]">
                  👤 Profil Peribadi & Waris
                </span>
                <div><span className="text-slate-400">No. Telefon:</span> <span className="font-mono text-white font-bold">{selectedPreRegForDetail.noTelefon}</span></div>
                <div><span className="text-slate-400">Emel:</span> <span className="text-slate-200">{selectedPreRegForDetail.emel}</span></div>
                <div><span className="text-slate-400">Alamat:</span> <span className="text-slate-200">{selectedPreRegForDetail.alamat || 'N/A'}</span></div>
                <div><span className="text-slate-400">Nama Waris:</span> <span className="text-white font-semibold">{selectedPreRegForDetail.namaWaris || 'N/A'} ({selectedPreRegForDetail.hubunganWaris})</span></div>
                <div><span className="text-slate-400">Tel Waris:</span> <span className="font-mono text-slate-200">{selectedPreRegForDetail.telefonWaris || 'N/A'}</span></div>
              </div>

              {/* Medical & Referral */}
              <div className="p-3.5 bg-[#0F172A] rounded-xl border border-[#1F2937] space-y-2">
                <span className="font-bold text-emerald-400 block border-b border-[#1F2937] pb-1 uppercase tracking-wider text-[11px]">
                  🏥 Hospital Rujukan & Cadangan
                </span>
                <div><span className="text-slate-400">Hospital Asal:</span> <span className="text-white font-bold">{selectedPreRegForDetail.hospitalRujukan}</span></div>
                <div><span className="text-slate-400">Doktor Pakar:</span> <span className="text-slate-200">{selectedPreRegForDetail.doktorMerujuk || 'N/A'}</span></div>
                <div><span className="text-slate-400">Akses Vaskular:</span> <span className="text-emerald-300 font-bold">{selectedPreRegForDetail.jenisAksesSemasa || 'Belum Ditetapkan'}</span></div>
                <div><span className="text-slate-400">Cadangan Penaja:</span> <span className="text-amber-300 font-bold">{selectedPreRegForDetail.penajaPilihan}</span></div>
                <div><span className="text-slate-400">Tarikh Mohon:</span> <span className="font-mono text-slate-200">{selectedPreRegForDetail.tarikhMohon}</span></div>
              </div>
            </div>

            {/* Document Inspection Box */}
            <div className="p-4 bg-[#0A0C10] rounded-xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Semakan Dokumen Terlampir ({selectedPreRegForDetail.lampiranFail?.length || selectedPreRegForDetail.dokumenTersedia?.length || 0})</span>
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Diverifikasi Oleh Admin
                </span>
              </div>

              {selectedPreRegForDetail.lampiranFail && selectedPreRegForDetail.lampiranFail.length > 0 ? (
                <div className="space-y-2">
                  {selectedPreRegForDetail.lampiranFail.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-[#111827] border border-[#1F2937] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white text-xs flex items-center gap-2">
                          <span>{doc.namaDokumen}</span>
                          <span className="text-[9px] font-mono uppercase bg-[#1F2937] text-emerald-400 px-1.5 py-0.5 rounded border border-[#374151]">
                            {doc.jenisDokumen.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Tarikh: {doc.tarikhMuatNaik}</span>
                          <span>•</span>
                          <span>Saiz: {doc.saizFile || '1.2 MB'}</span>
                          {doc.nota && (
                            <>
                              <span>•</span>
                              <span className="text-amber-300/80">{doc.nota}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (doc.fileDataUrl && doc.fileDataUrl.trim() !== '') {
                            const w = window.open();
                            w?.document.write(`<iframe src="${doc.fileDataUrl}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                          } else {
                            alert(`Pratonton Dokumen: ${doc.namaDokumen}\nDokumen surat rujukan ini sedia ada dalam simpanan selamat klinik.`);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition shrink-0"
                      >
                        Pratonton
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-[#111827] rounded-lg text-slate-400 text-xs text-center">
                  Dokumen tersedia: {selectedPreRegForDetail.dokumenTersedia?.join(', ') || 'Tiada'}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1F2937]">
              <a
                href={buildWhatsAppLink(selectedPreRegForDetail.noTelefon, `Salam Tuan/Puan ${selectedPreRegForDetail.nama}. Kami dari Pusat Dialisis KaizenBros telah semak permohonan & dokumen anda (${selectedPreRegForDetail.id}).`)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 border border-[#374151] font-bold rounded-lg text-xs flex items-center space-x-1.5 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Pemohon</span>
              </a>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedPreRegForDetail(null)}
                  className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Tutup
                </button>

                {selectedPreRegForDetail.statusPenilaian !== 'TELAH_DIDAFTAR' && selectedPreRegForDetail.statusPenilaian !== 'DITOLAK' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const pre = selectedPreRegForDetail;
                        setRejectingPreRegModal(pre);
                        setRejectReasonSelection('Status Serologi Positive (Hepatitis B / HCV / HIV - Tiada Unit Isolation)');
                        setCustomRejectReason('');
                      }}
                      className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-bold rounded-lg text-xs flex items-center space-x-1 transition"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Tolak Pendaftaran</span>
                    </button>

                    <button
                      onClick={() => {
                        const pre = selectedPreRegForDetail;
                        setSelectedPreRegForDetail(null);
                        handleLoadFromPreReg(pre);
                      }}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Luluskan & Isi Details Klinikal Rasmi (Admin)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingPreRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleConfirmRejection}
            className="bg-[#111827] border border-rose-800/60 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-950 text-rose-400 rounded-lg border border-rose-800/40">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tolak Pendaftaran Pesakit Baru</h3>
                  <p className="text-slate-400 font-mono text-[11px]">
                    ID: {rejectingPreRegModal.id} • {rejectingPreRegModal.nama}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingPreRegModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl space-y-1 text-rose-200">
              <span className="font-bold block text-[11px]">Sila Nyatakan Alasan Penolakan:</span>
              <p className="text-[11px] text-slate-300">
                Alasan ini akan direkodkan dalam fail pesakit & boleh dihantar secara automatik ke WhatsApp pemohon.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pilih Alasan Utama Penolakan *
                </label>
                <select
                  value={rejectReasonSelection}
                  onChange={(e) => setRejectReasonSelection(e.target.value)}
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-white focus:border-rose-500 focus:outline-hidden font-medium"
                >
                  <option value="Status Serologi Positive (Hepatitis B / HCV / HIV - Tiada Unit Isolation)">
                    1. Status Serologi Positive (Hepatitis B / HCV / HIV - Tiada Unit Isolation)
                  </option>
                  <option value="Kapasiti Sesi & Stesen Dialisis Penuh">
                    2. Kapasiti Sesi & Stesen Dialisis Penuh
                  </option>
                  <option value="Dokumen Kelulusan Penaja (PERKESO/JPA/Zakat) Tidak Memenuhi Syarat KKM">
                    3. Dokumen Kelulusan Penaja (PERKESO/JPA/Zakat) Tidak Memenuhi Syarat KKM
                  </option>
                  <option value="Permohonan Dibatalkan Atas Permintaan Pesakit / Waris">
                    4. Permohonan Dibatalkan Atas Permintaan Pesakit / Waris
                  </option>
                  <option value="Kondisi Klinikal Tidak Stabil / Memerlukan Rawatan Hospital Tertentu">
                    5. Kondisi Klinikal Tidak Stabil / Memerlukan Rawatan Hospital Tertentu
                  </option>
                  <option value="Lain-lain Alasan (Sila Nyatakan)">
                    6. Lain-lain Alasan (Sila Nyatakan)
                  </option>
                </select>
              </div>

              {rejectReasonSelection === 'Lain-lain Alasan (Sila Nyatakan)' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nyatakan Alasan Khusus *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    placeholder="Sila tulis alasan terperinci penolakan di sini..."
                    className="w-full p-2.5 bg-[#0F172A] border border-rose-500/50 rounded-lg text-xs text-rose-100 focus:border-rose-400 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#1F2937] flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setRejectingPreRegModal(null)}
                className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 font-semibold rounded-lg text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow-lg"
              >
                <XCircle className="w-4 h-4" />
                <span>Sahkan Penolakan Pendaftaran</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IC Scanner Modal with Camera Access and AI Extraction */}
      <ICScannerModal
        isOpen={isScanICModalOpen}
        onClose={() => setIsScanICModalOpen(false)}
        onScanComplete={handleScanICComplete}
      />
    </div>
  );
};
