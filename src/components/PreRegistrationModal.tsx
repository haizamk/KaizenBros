import React, { useState } from 'react';
import { PreRegisteredPatient, VascularAccessType, SponsorType, PreRegisteredDocument } from '../types';
import { 
  ClipboardCheck, 
  X, 
  User, 
  Phone, 
  Hospital, 
  HeartPulse, 
  Send, 
  MessageSquare,
  Upload,
  FileText,
  Paperclip,
  Trash2,
  Lock,
  CheckCircle2,
  Info,
  ShieldCheck,
  FileCheck,
  Camera,
  Sparkles
} from 'lucide-react';
import { buildWhatsAppLink } from '../utils/whatsappHelper';
import { INITIAL_NEARBY_HOSPITALS, calculateAgeFromDOB, extractDOBFromIC } from '../data/initialData';
import { ICScannerModal, ExtractedICData } from './ICScannerModal';

interface PreRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPreRegisteredPatient: (prePatient: PreRegisteredPatient) => void;
}

export const PreRegistrationModal: React.FC<PreRegistrationModalProps> = ({
  isOpen,
  onClose,
  onAddPreRegisteredPatient
}) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [lastSubmitted, setLastSubmitted] = useState<PreRegisteredPatient | null>(null);
  const [isScanICModalOpen, setIsScanICModalOpen] = useState(false);
  const [scanSuccessAlert, setScanSuccessAlert] = useState<string | null>(null);

  // Form Data (Personal + Hospital / Doctor + Referral docs)
  const [formData, setFormData] = useState({
    nama: '',
    noIC: '',
    noTelefon: '',
    emel: '',
    tarikhLahir: '',
    umur: 0,
    jantina: 'LELAKI' as 'LELAKI' | 'PEREMPUAN',
    alamat: '',
    namaWaris: '',
    telefonWaris: '',
    hubunganWaris: 'Pasangan',
    hospitalRujukanSelection: INITIAL_NEARBY_HOSPITALS[2], // Hospital Serdang
    customHospitalRujukan: '',
    doktorMerujuk: '',
    jenisAksesSemasa: 'AVF' as VascularAccessType | 'BELUM_BEDAH_FISTULA',
    penajaPilihan: 'SOCSO' as SponsorType,
    catatanKhas: ''
  });

  // Attached files state - DEFAULTS TO EMPTY ARRAY AS REQUESTED
  const [attachedDocs, setAttachedDocs] = useState<PreRegisteredDocument[]>([]);

  // Document Upload State
  const [docCategory, setDocCategory] = useState<'SURAT_RUJUKAN' | 'SALINAN_IC' | 'LAPORAN_DARAH' | 'SURAT_PENAJA' | 'LAIN_LAIN'>('SURAT_RUJUKAN');
  const [docNote, setDocNote] = useState('');

  if (!isOpen) return null;

  // Auto calculate age & extract DOB from IC
  const handleICChange = (icVal: string) => {
    const extracted = extractDOBFromIC(icVal);
    if (extracted) {
      const calculatedAge = calculateAgeFromDOB(extracted);
      setFormData((prev) => ({
        ...prev,
        noIC: icVal,
        tarikhLahir: extracted,
        umur: calculatedAge
      }));
    } else {
      setFormData((prev) => ({ ...prev, noIC: icVal }));
    }
  };

  const handleDOBChange = (dobVal: string) => {
    const calculatedAge = calculateAgeFromDOB(dobVal);
    setFormData((prev) => ({
      ...prev,
      tarikhLahir: dobVal,
      umur: calculatedAge
    }));
  };

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

    const personName = extractedData.nama ? extractedData.nama.trim() : 'Pesakit';
    setScanSuccessAlert(`Pengekstrakan IC Berjaya: ${personName} (IC: ${cleanIC || 'MyKad'})`);
    setTimeout(() => setScanSuccessAlert(null), 6000);
  };

  // Handle actual file upload from file picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileDataUrl = event.target?.result as string;
        const newDoc: PreRegisteredDocument = {
          id: `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          namaDokumen: file.name,
          jenisDokumen: docCategory,
          tarikhMuatNaik: new Date().toISOString().split('T')[0],
          saizFile: `${(file.size / 1024).toFixed(0)} KB`,
          fileDataUrl: fileDataUrl,
          nota: docNote || `Muat naik: ${file.name}`
        };
        setAttachedDocs((prev) => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    });

    setDocNote('');
    // Reset file input value
    e.target.value = '';
  };

  // Preset sample attachment helpers for fast testing
  const handleAddPresetDoc = (type: 'SURAT_RUJUKAN' | 'SALINAN_IC' | 'SURAT_PENAJA' | 'LAPORAN_DARAH') => {
    let name = '';
    let nota = '';
    if (type === 'SURAT_RUJUKAN') {
      name = `Surat_Rujukan_Doktor_${formData.hospitalRujukan.split(' ')[0] || 'Hospital'}.pdf`;
      nota = 'Surat rujukan daripada Hospital/Klinik Kesihatan';
    } else if (type === 'SALINAN_IC') {
      name = `Salinan_IC_${formData.nama ? formData.nama.replace(/\s+/g, '_') : 'Pesakit'}.jpg`;
      nota = 'Salinan Kad Pengenalan MyKad';
    } else if (type === 'SURAT_PENAJA') {
      name = `Surat_Jaminan_${formData.penajaPilihan}.pdf`;
      nota = 'Surat jaminan penaja/subsidi rawatan';
    } else {
      name = 'Laporan_Ujian_Darah_Serologi.pdf';
      nota = 'Laporan keputusan ujian darah terkini';
    }

    const newDoc: PreRegisteredDocument = {
      id: `DOC-PRESET-${Date.now()}`,
      namaDokumen: name,
      jenisDokumen: type,
      tarikhMuatNaik: new Date().toISOString().split('T')[0],
      saizFile: '1.5 MB',
      nota: nota
    };

    setAttachedDocs((prev) => [...prev, newDoc]);
  };

  const handleRemoveDoc = (id: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.noIC.trim() || !formData.noTelefon.trim()) {
      alert('Sila lengkapkan Nama Penuh, No. Kad Pengenalan dan No. Telefon.');
      return;
    }

    const finalHospital = formData.hospitalRujukanSelection === 'Lain-lain (Hospital Swasta / Klinik Pakar Luar)'
      ? (formData.customHospitalRujukan.trim() || 'Hospital Swasta / Klinik Pakar Luar')
      : formData.hospitalRujukanSelection;

    const docLabels = attachedDocs.map((d) => d.namaDokumen);

    const newPre: PreRegisteredPatient = {
      id: `PRE-${Date.now().toString().slice(-4)}`,
      nama: formData.nama,
      noIC: formData.noIC,
      noTelefon: formData.noTelefon,
      emel: formData.emel || `${formData.nama.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      tarikhLahir: formData.tarikhLahir,
      umur: Number(formData.umur) || 0,
      jantina: formData.jantina,
      alamat: formData.alamat,
      namaWaris: formData.namaWaris,
      telefonWaris: formData.telefonWaris,
      hubunganWaris: formData.hubunganWaris,
      hospitalRujukan: finalHospital,
      doktorMerujuk: formData.doktorMerujuk,
      jenisAksesSemasa: formData.jenisAksesSemasa,
      penajaPilihan: formData.penajaPilihan,
      dokumenTersedia: docLabels, // WILL BE [] IF NO DOCS UPLOADED
      lampiranFail: attachedDocs, // WILL BE [] IF NO DOCS UPLOADED
      tarikhMohon: new Date().toISOString().split('T')[0],
      statusPenilaian: 'DALAM_PENILAIAN',
      nasihatKlinikalPakar: 'Permohonan pra-pendaftaran diterima. Jururawat bertugas akan menghubungi waris untuk semakan dokumen rujukan & temujanji saringan fizikal di klinik.'
    };

    onAddPreRegisteredPatient(newPre);
    setLastSubmitted(newPre);
    setStep('success');
  };

  const handleNotifyClinicViaWhatsApp = () => {
    if (!lastSubmitted) return;
    const docSummary = lastSubmitted.lampiranFail && lastSubmitted.lampiranFail.length > 0
      ? lastSubmitted.lampiranFail.map((d) => `• ${d.namaDokumen} (${d.jenisDokumen})`).join('\n')
      : 'Tiada lampiran';

    const msg = `*PERMOHONAN PRA-PENDAFTARAN PESAKIT BARU* 🏥
*Pusat Dialisis KaizenBros*

Salam pentadbir klinik, saya ingin memaklumkan pendaftaran pra-pesakit baru:
👤 *Nama Pesakit:* ${lastSubmitted.nama}
🪪 *No. K/P:* ${lastSubmitted.noIC}
📞 *Telefon:* ${lastSubmitted.noTelefon}
🏥 *Hospital Rujukan:* ${lastSubmitted.hospitalRujukan}
👨‍⚕️ *Doktor Merujuk:* ${lastSubmitted.doktorMerujuk || 'N/A'}
💉 *Akses Vaskular:* ${lastSubmitted.jenisAksesSemasa || 'N/A'}
🏛 *Pilihan Penaja:* ${lastSubmitted.penajaPilihan}

📁 *Lampiran Dokumen:*
${docSummary}

Mohon pihak klinik menyemak permohonan dan menghubungi kami untuk langkah seterusnya. Terima kasih.`;

    const link = buildWhatsAppLink('0193389922', msg);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl bg-[#111827] text-slate-100 rounded-2xl border border-emerald-500/40 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0A0C10] border-b border-[#1F2937]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Borang Pra-Pendaftaran Pesakit Baru</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold">
                  Ringkas & Mudah
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Isi maklumat asas & muat naik surat rujukan/IC. Maklumat klinikal penuh akan dimasukkan oleh Admin Klinik.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1F2937] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Clear Admin Boundary Info Box */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs space-y-2 text-emerald-200">
              <div className="font-bold flex items-center gap-2 text-emerald-300 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pendaftaran Ringkas Pesakit & Penjaga</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Pesakit/waris hanya perlu melengkapkan maklumat peribadi, hospital rujukan, serta melampirkan <strong>Surat Rujukan Hospital, Salinan MyKad, atau dokumen berkaitan</strong>.
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-amber-300">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Segala rekod klinikal terperinci (seperti berat kering, ujian serologi Hepatitis/HIV, & tetapan stesen dialisis) akan dikemaskini oleh Admin/Jururawat di Klinik.</span>
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

            {/* Bahagian 1: Profil Pesakit & Waris */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#1F2937] p-2 rounded-lg border border-[#374151]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>1. Maklumat Peribadi Pesakit & Waris</span>
                </h3>
                <button
                  type="button"
                  id="btn-scan-ic-prereg"
                  onClick={() => setIsScanICModalOpen(true)}
                  className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer hover:scale-105"
                  title="Imbas MyKad menggunakan kamera"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-950" />
                  <span>Imbas IC (Kamera AI)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Nama Penuh Pesakit (Di Kad Pengenalan) *
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
                    placeholder="Contoh: Haji Ismail bin Hassan"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    No. Kad Pengenalan (MyKad) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.noIC}
                    onChange={(e) => handleICChange(e.target.value)}
                    placeholder="Contoh: 610814-10-5543"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    💡 Tarikh lahir & umur akan diekstrak secara automatik dari No. MyKad
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tarikh Lahir *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tarikhLahir}
                    onChange={(e) => handleDOBChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Umur (Tahun)</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800/40">Auto</span>
                  </label>
                  <input
                    type="number"
                    required
                    readOnly
                    value={formData.umur || ''}
                    placeholder="Auto dikira"
                    className="w-full px-3 py-2 bg-[#0B132B] border border-emerald-500/30 rounded-lg text-sm text-emerald-300 font-bold font-mono focus:outline-hidden cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jantina</label>
                  <select
                    value={formData.jantina}
                    onChange={(e) => setFormData({ ...formData, jantina: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="LELAKI">Lelaki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    No. WhatsApp (Pesakit) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.noTelefon}
                    onChange={(e) => setFormData({ ...formData, noTelefon: e.target.value })}
                    placeholder="019-XXXXXXX"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Kediaman Pesakit</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="No. Rumah, Jalan, Semenyih, Selangor / Kajang"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Waris / Penjaga</label>
                  <input
                    type="text"
                    value={formData.namaWaris}
                    onChange={(e) => setFormData({ ...formData, namaWaris: e.target.value })}
                    placeholder="Contoh: Puan Fatimah"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">No. Telefon Waris</label>
                  <input
                    type="tel"
                    value={formData.telefonWaris}
                    onChange={(e) => setFormData({ ...formData, telefonWaris: e.target.value })}
                    placeholder="012-XXXXXXX"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hubungan Waris</label>
                  <input
                    type="text"
                    value={formData.hubunganWaris}
                    onChange={(e) => setFormData({ ...formData, hubunganWaris: e.target.value })}
                    placeholder="Anak / Pasangan / Penjaga"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Bahagian 2: Hospital Rujukan & Penaja */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-[#1F2937] p-2 rounded-lg border border-[#374151] flex items-center gap-2">
                <Hospital className="w-4 h-4" />
                <span>2. Hospital Rujukan & Cadangan Penaja</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hospital Asal / Rujukan Terkini *
                  </label>
                  <select
                    required
                    value={formData.hospitalRujukanSelection}
                    onChange={(e) => setFormData({ ...formData, hospitalRujukanSelection: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-medium"
                  >
                    {INITIAL_NEARBY_HOSPITALS.map((hosp, idx) => (
                      <option key={idx} value={hosp}>
                        {hosp}
                      </option>
                    ))}
                  </select>

                  {formData.hospitalRujukanSelection === 'Lain-lain (Hospital Swasta / Klinik Pakar Luar)' && (
                    <input
                      type="text"
                      required
                      value={formData.customHospitalRujukan}
                      onChange={(e) => setFormData({ ...formData, customHospitalRujukan: e.target.value })}
                      placeholder="Sila nyatakan nama hospital swasta / klinik luar..."
                      className="w-full px-3 py-2 mt-2 bg-[#0F172A] border border-amber-500/50 rounded-lg text-sm text-amber-200 focus:border-amber-400 focus:outline-hidden font-medium"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Doktor Pakar Merujuk (Sekiranya Ada)
                  </label>
                  <input
                    type="text"
                    value={formData.doktorMerujuk}
                    onChange={(e) => setFormData({ ...formData, doktorMerujuk: e.target.value })}
                    placeholder="Contoh: Dr. Khairil (Pakar Nefrologi)"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jenis Akses Vaskular Semasa (Pilihan Ringkas)
                  </label>
                  <select
                    value={formData.jenisAksesSemasa}
                    onChange={(e) => setFormData({ ...formData, jenisAksesSemasa: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="AVF">AV Fistula (AVF)</option>
                    <option value="AVG">AV Graft (AVG)</option>
                    <option value="PERMACATH">Permacath (Katakli Kekal)</option>
                    <option value="CVC_TEMPORARY">CVC Sementara</option>
                    <option value="BELUM_BEDAH_FISTULA">Belum Bedah Fistula / Menunggu Pembedahan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cadangan Sumber Penaja / Subsidi Rawatan
                  </label>
                  <select
                    value={formData.penajaPilihan}
                    onChange={(e) => setFormData({ ...formData, penajaPilihan: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="SOCSO">PERKESO / SOCSO (Skim Keilatan)</option>
                    <option value="JPA_KWAP">JPA / KWAP (Pesara Kerajaan)</option>
                    <option value="ZAKAT_SELANGOR">Lembaga Zakat Selangor (LZS)</option>
                    <option value="ZAKAT_MAIWP">Baitulmal MAIWP</option>
                    <option value="INSURANS_SWASTA">Insurans Kesihatan Swasta</option>
                    <option value="SENDIRI">Bayaran Sendiri (Self-Pay)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bahagian 3: Muat Naik / Lampiran Surat Rujukan & Dokumen */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between bg-[#1F2937] p-2 rounded-lg border border-[#374151]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>3. Muat Naik Surat Rujukan, Salinan IC & Surat-Surat Lain</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">PDF, JPG, PNG</span>
              </div>

              {/* Upload Input Area */}
              <div className="bg-[#0F172A] p-4 rounded-xl border border-dashed border-[#374151] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kategori Dokumen Yang Dimuat Naik
                    </label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-[#111827] border border-[#374151] rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="SURAT_RUJUKAN">📄 Surat Rujukan Hospital / Doktor</option>
                      <option value="SALINAN_IC">🪪 Salinan Kad Pengenalan (MyKad)</option>
                      <option value="LAPORAN_DARAH">🧪 Laporan Ujian Darah / Serologi</option>
                      <option value="SURAT_PENAJA">🏛 Surat Penaja / GL PERKESO / JPA / Zakat</option>
                      <option value="LAIN_LAIN">📁 Surat-Surat Lain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Catatan / Nota Dokumen (Pilihan)
                    </label>
                    <input
                      type="text"
                      value={docNote}
                      onChange={(e) => setDocNote(e.target.value)}
                      placeholder="contoh: Surat Rujukan Hosp Serdang 2026"
                      className="w-full px-3 py-1.5 bg-[#111827] border border-[#374151] rounded-lg text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#1F2937]">
                  <label className="w-full sm:w-auto cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition">
                    <Paperclip className="w-4 h-4" />
                    <span>Pilih Fail Daripada Komputer / Telefon</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Tambah Contoh:</span>
                    <button
                      type="button"
                      onClick={() => handleAddPresetDoc('SURAT_RUJUKAN')}
                      className="px-2 py-1 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 rounded text-[10px] font-medium border border-[#374151]"
                    >
                      + Surat Rujukan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetDoc('SALINAN_IC')}
                      className="px-2 py-1 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 rounded text-[10px] font-medium border border-[#374151]"
                    >
                      + Salinan IC
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetDoc('SURAT_PENAJA')}
                      className="px-2 py-1 bg-[#1F2937] hover:bg-[#374151] text-emerald-400 rounded text-[10px] font-medium border border-[#374151]"
                    >
                      + Surat Penaja
                    </button>
                  </div>
                </div>
              </div>

              {/* List of attached files */}
              {attachedDocs.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Senarai Dokumen Terlampir ({attachedDocs.length}):</span>
                    <span className="text-[11px] text-emerald-400">Telah bersedia untuk dihantar</span>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {attachedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2.5 bg-[#0F172A] border border-[#1F2937] rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate flex items-center gap-2">
                              <span>{doc.namaDokumen}</span>
                              <span className="text-[9px] font-mono uppercase bg-[#1F2937] text-emerald-400 px-1.5 py-0.5 rounded border border-[#374151]">
                                {doc.jenisDokumen.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Saiz: {doc.saizFile || 'Terlampir'}</span>
                              <span>•</span>
                              <span className="truncate">{doc.nota}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition shrink-0"
                          title="Padam dokumen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#0F172A] border border-[#1F2937] rounded-xl text-center text-xs text-slate-400">
                  Belum ada dokumen diuji/dilampirkan. Sila muat naik surat rujukan & salinan IC pesakit.
                </div>
              )}
            </div>

            {/* Butang Hantar */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1F2937]">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Pusat Dialisis KaizenBros • Saringan & Kelayakan Slot KKM</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-pra-pendaftaran"
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm shadow-md shadow-emerald-950 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Hantar Permohonan Pra-Pendaftaran</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Confirmation & Medical Guidance View */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl font-bold text-white">
                Pra-Pendaftaran Berjaya Diterima!
              </h3>
              <p className="text-sm text-slate-300">
                Maklumat asas bagi <strong className="text-white">{lastSubmitted?.nama}</strong> (No. Rujukan: <span className="font-mono text-emerald-400">{lastSubmitted?.id}</span>) beserta <strong className="text-emerald-300">{lastSubmitted?.lampiranFail?.length || 0} lampiran dokumen</strong> telah dihantar ke rekod semakan Pusat Dialisis KaizenBros.
              </p>
            </div>

            {/* Advice & Monitoring Box */}
            <div className="bg-[#0F172A] border border-[#374151] p-5 rounded-xl text-left space-y-3 max-w-xl mx-auto text-xs text-slate-300">
              <div className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                <HeartPulse className="w-4 h-4" />
                <span>Langkah Seterusnya Oleh Klinik KaizenBros:</span>
              </div>
              <ul className="space-y-2 list-disc list-inside text-slate-300">
                <li>
                  <strong>Semakan Surat Rujukan:</strong> Pentadbir / Jururawat Klinik akan menyemak surat rujukan hospital dan mengesahkan status slot.
                </li>
                <li>
                  <strong>Kemaskini Rekod Klinikal Admin:</strong> Segala perincian klinikal (seperti berat kering, serologi darah, & tetapan mesin dialisis) akan dimasukkan oleh pihak Admin di Klinik semasa pendaftaran rasmi.
                </li>
                <li>
                  <strong>Bantuan Penaja:</strong> Pihak KaizenBros akan menyediakan surat jaminan & sokongan permohonan subsidi PERKESO / JPA / Zakat.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleNotifyClinicViaWhatsApp}
                id="btn-pra-pendaftaran-whatsapp"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm shadow-md transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Maklumkan Klinik via WhatsApp (019-338 9922)</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-slate-200 font-semibold rounded-lg text-sm transition cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        )}
      </div>

      {/* IC Scanner Modal */}
      <ICScannerModal
        isOpen={isScanICModalOpen}
        onClose={() => setIsScanICModalOpen(false)}
        onScanComplete={handleScanICComplete}
      />
    </div>
  );
};
