import React, { useState, useEffect } from 'react';
import { downloadElementAsPng } from '../utils/html2canvasHelper';
import { 
  Building2, 
  FileText, 
  X, 
  Printer, 
  Send, 
  Copy, 
  Image,
  CheckCircle2, 
  AlertTriangle, 
  Stethoscope, 
  User, 
  Clock, 
  Calendar, 
  Activity, 
  PhoneCall, 
  ShieldCheck, 
  ChevronRight, 
  FileCheck, 
  Sparkles,
  Ambulance
} from 'lucide-react';
import { Patient, CentreInfo, StaffMember } from '../types';

interface HospitalReferralLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  centreInfo: CentreInfo;
  staffList?: StaffMember[];
  preSelectedPatient?: Patient | null;
}

import { INITIAL_NEARBY_HOSPITALS } from '../data/initialData';

const PRESET_HOSPITALS = INITIAL_NEARBY_HOSPITALS;

const PRESET_REFERRAL_REASONS = [
  {
    title: 'Hypotension Akut & Dyspnea Semasa Dialisis',
    summary: 'Pesakit mengalami penurunan tekanan darah mendadak (BP < 90/60 mmHg) disertai sesak nafas (SpO2 < 92%) semasa sesi dialisis ke-2 jam.',
    vitals: 'BP: 85/50 mmHg, PR: 110 bpm, SpO2: 90% (Under O2 3L/min), Temp: 36.8°C'
  },
  {
    title: 'Kegagalan Akses Vascular (AVF/AVG Thrombosis)',
    summary: 'Sumbatan vascular access (Thrombosis AV Fistula). Hilang bunyi bruit dan rasa thrill pada lengan kiri pra-rawatan.',
    vitals: 'BP: 135/85 mmHg, PR: 78 bpm, SpO2: 98%, Temp: 36.5°C'
  },
  {
    title: 'Syak Jangkitan Tapak Catheter Exit-Site / Peritonitis',
    summary: 'Tapak keluar catheter (exit-site Permacath) bengkak, kemerahan, serta mengeluarkan lelehan nanah (purulent discharge) disertai demam menggigil.',
    vitals: 'BP: 110/70 mmHg, PR: 98 bpm, SpO2: 96%, Temp: 38.5°C'
  },
  {
    title: 'Fluid Overload Berat / Edema Paru-Paru (Pulmonary Edema)',
    summary: 'Penambahan berat badan melampau (+4.5 kg pra-dialisis), orthopnea, batuk berfokus, dan crackles pada pemeriksaan paru-paru.',
    vitals: 'BP: 180/105 mmHg, PR: 104 bpm, SpO2: 89% (On Air), Temp: 36.9°C'
  },
  {
    title: 'Tindak Balas Pyrogenic / Demam Tinggi Semasa Rawatan',
    summary: 'Pesakit mengalami menggigil teruk (rigors) dan demam mendadak selepas 1 jam dialisis dimulakan. Sesi dihentikan serta-merta.',
    vitals: 'BP: 100/60 mmHg, PR: 115 bpm, SpO2: 95%, Temp: 39.1°C'
  },
  {
    title: 'Keputusan Ujian Darah Abnormal Kritis (Hyperkalemia / Severe Anemia)',
    summary: 'Ujian darah terkini menunjukkan Potassium (K+) kritis 6.8 mmol/L atau Hemoglobin (Hb) 5.8 g/dL yang memerlukan transfusi darah / rawatan segera.',
    vitals: 'BP: 140/90 mmHg, PR: 82 bpm, SpO2: 97%, Temp: 36.7°C'
  }
];

export const HospitalReferralLetterModal: React.FC<HospitalReferralLetterModalProps> = ({
  isOpen,
  onClose,
  patients,
  centreInfo,
  staffList = [],
  preSelectedPatient
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [customPatientName, setCustomPatientName] = useState<string>('');
  const [customPatientIC, setCustomPatientIC] = useState<string>('');
  const [customPatientAge, setCustomPatientAge] = useState<number>(55);
  const [customPatientGender, setCustomPatientGender] = useState<'LELAKI' | 'PEREMPUAN'>('LELAKI');
  const [customVascularAccess, setCustomVascularAccess] = useState<string>('AVF Lengan Kiri');

  const [hospitalTarget, setHospitalTarget] = useState<string>(PRESET_HOSPITALS[0]);
  const [customHospital, setCustomHospital] = useState<string>('');
  const [referralDate, setReferralDate] = useState<string>('');
  const [referralTime, setReferralTime] = useState<string>('');
  
  const [reasonTitle, setReasonTitle] = useState<string>(PRESET_REFERRAL_REASONS[0].title);
  const [clinicalDescription, setClinicalDescription] = useState<string>(PRESET_REFERRAL_REASONS[0].summary);
  const [vitalSigns, setVitalSigns] = useState<string>(PRESET_REFERRAL_REASONS[0].vitals);
  const [dialysisTreatmentNotes, setDialysisTreatmentNotes] = useState<string>(
    'Mesin: Fresenius 5008S | Dialyzer: F60 | BFR: 250 ml/min | UF Goal: 2.5L (Terhenti pada 1.2L)'
  );
  
  const [referringNurseName, setReferringNurseName] = useState<string>('Sr. Siti Rahmah binti Abdullah');
  const [referringNurseLJM, setReferringNurseLJM] = useState<string>('LJM: 84920');
  const [ambulanceArranged, setAmbulanceArranged] = useState<boolean>(true);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Initialize date & time and patient selection
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().slice(0, 5);
      setReferralDate(dateStr);
      setReferralTime(timeStr);

      if (preSelectedPatient) {
        setSelectedPatientId(preSelectedPatient.id);
      } else if (patients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patients[0].id);
      }

      if (staffList && staffList.length > 0) {
        const nurse = staffList.find(s => {
          if (!s) return false;
          const jawatanLower = (s.jawatan || '').toLowerCase();
          const kategoriLower = (s.kategori || '').toLowerCase();
          return jawatanLower.includes('jururawat') || jawatanLower.includes('sister') || kategoriLower.includes('jururawat');
        });
        if (nurse && nurse.nama) {
          setReferringNurseName(nurse.nama);
          if (nurse.noPendaftaran) {
            setReferringNurseLJM(nurse.noPendaftaran.startsWith('LJM') ? nurse.noPendaftaran : `LJM: ${nurse.noPendaftaran}`);
          }
        }
      }
    }
  }, [isOpen, preSelectedPatient, patients, staffList]);

  // Derived patient info
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const activePatientName = selectedPatient ? selectedPatient.nama : (customPatientName || 'PESAKIT KAIZENBROS');
  const activePatientIC = selectedPatient ? selectedPatient.noIC : (customPatientIC || '700101-10-5432');
  const activePatientAge = selectedPatient ? selectedPatient.umur : customPatientAge;
  const activePatientGender = selectedPatient ? selectedPatient.jantina : customPatientGender;
  const activePatientAccess = selectedPatient ? `${selectedPatient.jenisAkses} (${selectedPatient.lokasiAkses || 'Lengan'})` : customVascularAccess;
  const activePatientSponsor = selectedPatient ? selectedPatient.penaja : 'SOCSO / Zakat';
  const activePatientDryWeight = selectedPatient ? selectedPatient.beratKering : 58.5;
  const activePatientWaris = selectedPatient ? `${selectedPatient.namaWaris} (${selectedPatient.telefonWaris})` : 'Ahmad Bin Razak (012-3456789)';

  const finalHospitalName = hospitalTarget === 'Lain-Lain Hospital (Sila Nyatakan)' ? (customHospital || 'Hospital Kerajaan') : hospitalTarget;

  // Quick Preset Selection Handler
  const handleApplyPresetReason = (preset: typeof PRESET_REFERRAL_REASONS[0]) => {
    setReasonTitle(preset.title);
    setClinicalDescription(preset.summary);
    setVitalSigns(preset.vitals);
  };

  // Generate Letter Reference ID
  const letterRefNo = `PD-REF/${referralDate ? referralDate.replace(/-/g, '') : '20260907'}/${selectedPatientId ? selectedPatientId.replace('PAT-', '') : '99'}`;

  // Formatted Raw Text for Copy / WhatsApp
  const generateRawText = () => {
    return `*PUSAT DIALISIS KAIZENBROS (SEMENYIH, SELANGOR) SDN BHD*
(No. Pendaftaran KKM: ${centreInfo.noPendaftaranKKM})
*SURAT RUJUKAN KECEMASAN / HOSPITAL*

No. Rujukan: ${letterRefNo}
Tarikh & Masa: ${referralDate} @ ${referralTime}

KEPADA:
*Pegawai Perubatan Yang Berkhidmat*
${finalHospitalName}

*MAKLUMAT PESAKIT:*
• Nama: ${activePatientName}
• No. KP/IC: ${activePatientIC}
• Umur/Jantina: ${activePatientAge} Tahun / ${activePatientGender}
• Akses Vascular: ${activePatientAccess}
• Berat Kering: ${activePatientDryWeight} kg
• Penaja/Waris: ${activePatientSponsor} | Waris: ${activePatientWaris}

*SEBAB RUJUKAN / INDIKASI KLINIKAL:*
*${reasonTitle}*
${clinicalDescription}

*TANDA VITAL SEMASA:*
${vitalSigns}

*CATATAN RAWATAN DIALISIS:*
${dialysisTreatmentNotes}
Status Ambulans: ${ambulanceArranged ? 'Ambulans Bantuan Dipanggil' : 'Pengangkutan Sendiri/Keluarga'}

*JURURAWAT MERUJUK:*
${referringNurseName} (${referringNurseLJM})
${centreInfo.nama}
Talian Kecemasan Pusat: ${centreInfo.talianKecemasan24Jam}`;
  };

  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateRawText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = async () => {
    await downloadElementAsPng(
      'printable-referral-letter',
      `Surat_Rujukan_Hospital_${activePatientName.replace(/\s+/g, '_')}_${referralDate}.png`,
      () => setIsGeneratingPng(true),
      () => setIsGeneratingPng(false)
    );
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateRawText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleSaveToRecord = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-referral-letter, #printable-referral-letter * {
            visibility: visible;
          }
          #printable-referral-letter {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-[#0F172A] border border-[#1F2937] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between no-print shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/90 border border-red-800/60 flex items-center justify-center text-red-400 shadow-inner">
              <Ambulance className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-800/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  SOP Rujukan Kecemasan
                </span>
                <span className="text-xs text-slate-400 font-mono">Modul One-Click Nurse</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-serif">
                Penjana Surat Rujukan Hospital Rasmi (Hospital Referral Letter)
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

        {/* Modal Body: Split view (Form controls on Left, Live Official Printable Letter on Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0B0F19]">
          
          {/* LEFT COLUMN: Input Form (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4 no-print border-b lg:border-b-0 lg:border-r border-[#1F2937] lg:pr-6">
            
            {/* Quick Preset Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Preset Sebab Rujukan Klinikal:</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {PRESET_REFERRAL_REASONS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPresetReason(preset)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      reasonTitle === preset.title
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-medium'
                        : 'bg-[#111827] border-[#1F2937] text-slate-300 hover:bg-[#1F2937]'
                    }`}
                  >
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>{preset.title}</span>
                      {reasonTitle === preset.title && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{preset.summary}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Selection */}
            <div className="space-y-1.5 bg-[#111827] p-3.5 rounded-xl border border-[#1F2937]">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Pilih Pesakit Dialisis:</span>
                <span className="text-[10px] text-emerald-400 font-mono">Pangkalan Data Active</span>
              </label>

              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.noIC}) - {p.jenisAkses}
                  </option>
                ))}
                <option value="CUSTOM">+ Masukkan Manual Pesakit Lain</option>
              </select>

              {selectedPatientId === 'CUSTOM' && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F2937] text-xs">
                  <input
                    type="text"
                    placeholder="Nama Pesakit"
                    value={customPatientName}
                    onChange={(e) => setCustomPatientName(e.target.value)}
                    className="bg-[#0F172A] border border-[#374151] rounded px-2 py-1 text-white"
                  />
                  <input
                    type="text"
                    placeholder="No. IC (cth: 700101-10-1234)"
                    value={customPatientIC}
                    onChange={(e) => setCustomPatientIC(e.target.value)}
                    className="bg-[#0F172A] border border-[#374151] rounded px-2 py-1 text-white"
                  />
                </div>
              )}
            </div>

            {/* Target Hospital & Date/Time */}
            <div className="space-y-3 bg-[#111827] p-3.5 rounded-xl border border-[#1F2937]">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Hospital Rujukan (Target Hospital):</label>
                <select
                  value={hospitalTarget}
                  onChange={(e) => setHospitalTarget(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                >
                  {PRESET_HOSPITALS.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>

                {hospitalTarget === 'Lain-Lain Hospital (Sila Nyatakan)' && (
                  <input
                    type="text"
                    placeholder="Nama Hospital / Jabatan Rujukan"
                    value={customHospital}
                    onChange={(e) => setCustomHospital(e.target.value)}
                    className="w-full mt-1.5 bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-0.5">Tarikh Rujukan:</label>
                  <input
                    type="date"
                    value={referralDate}
                    onChange={(e) => setReferralDate(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Masa Kecemasan:</label>
                  <input
                    type="time"
                    value={referralTime}
                    onChange={(e) => setReferralTime(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Reason Details & Vitals Form */}
            <div className="space-y-3 bg-[#111827] p-3.5 rounded-xl border border-[#1F2937]">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tajuk / Indikasi Utama Rujukan:</label>
                <input
                  type="text"
                  value={reasonTitle}
                  onChange={(e) => setReasonTitle(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-1.5 text-xs text-white font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Ringkasan Klinikal & Simptom Pesakit:</label>
                <textarea
                  rows={3}
                  value={clinicalDescription}
                  onChange={(e) => setClinicalDescription(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#374151] rounded-lg p-2.5 text-xs text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tanda-Tanda Vital Semasa (Vital Signs):</label>
                <input
                  type="text"
                  value={vitalSigns}
                  onChange={(e) => setVitalSigns(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Catatan Parameter Mesin Dialisis:</label>
                <input
                  type="text"
                  value={dialysisTreatmentNotes}
                  onChange={(e) => setDialysisTreatmentNotes(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Nurse Signature Details */}
            <div className="space-y-2 bg-[#111827] p-3.5 rounded-xl border border-[#1F2937]">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-0.5">Nama Jururawat Merujuk:</label>
                  <input
                    type="text"
                    value={referringNurseName}
                    onChange={(e) => setReferringNurseName(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">No. LJM / Jawatan:</label>
                  <input
                    type="text"
                    value={referringNurseLJM}
                    onChange={(e) => setReferringNurseLJM(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#374151] rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="ambulance-check"
                  checked={ambulanceArranged}
                  onChange={(e) => setAmbulanceArranged(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 bg-[#0F172A]"
                />
                <label htmlFor="ambulance-check" className="text-xs text-slate-300 cursor-pointer">
                  Ambulans 999 / Swasta telah dipanggil & dimaklumkan
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Official Printable Letter Preview (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between no-print bg-[#111827] p-3 rounded-xl border border-[#1F2937]">
              <div className="flex items-center space-x-2 text-xs text-slate-300 font-bold">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Pratonton Surat Rujukan Ke Hospital (Format Cetakan Rasmi A4)</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyText}
                  className="px-3 py-1.5 bg-[#1F2937] hover:bg-[#374151] text-slate-200 text-xs font-semibold rounded-lg border border-[#374151] transition flex items-center space-x-1 cursor-pointer"
                >
                  {copiedText ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copiedText ? 'Teks Disalin!' : 'Salin Teks'}</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-800/60 transition flex items-center space-x-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleDownloadPng}
                  disabled={isGeneratingPng}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <Image className="w-3.5 h-3.5 text-white" />
                  <span>{isGeneratingPng ? 'Muat Turun...' : 'Muat Turun PNG'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-lg transition shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-950" />
                  <span>Cetak / PDF A4</span>
                </button>
              </div>
            </div>

            {/* Official Printable Paper Layout */}
            <div 
              id="printable-referral-letter" 
              className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 font-serif text-xs leading-relaxed max-w-full"
            >
              {/* LETTERHEAD HEADER */}
              <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-base font-sans">
                      KB
                    </div>
                    <div>
                      <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-900 font-sans">
                        PUSAT DIALISIS KAIZENBROS (SEMENYIH, SELANGOR) SDN BHD
                      </h1>
                      <p className="text-[10px] text-slate-600 font-sans">
                        Diiktiraf & Berlesen di bawah Akta Kemudahan & Perkhidmatan Jagaan Kesihatan Swasta 1998 KKM
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 font-sans pt-1">
                    No. Pendaftaran KKM: <strong>{centreInfo.noPendaftaranKKM}</strong> | Alamat: {centreInfo.alamat}
                    <br />
                    Tel Utama: {centreInfo.telefonUtama} | Talian Kecemasan 24/7: <strong>{centreInfo.talianKecemasan24Jam}</strong> | Emel: {centreInfo.emel}
                  </p>
                </div>

                <div className="text-right font-sans text-[10px] space-y-0.5">
                  <span className="inline-block bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-300 uppercase tracking-wider">
                    Sangat Segera / Kecemasan
                  </span>
                  <p className="font-mono pt-1 text-slate-700">Ref: <strong>{letterRefNo}</strong></p>
                  <p className="text-slate-600">Tarikh: {referralDate}</p>
                  <p className="text-slate-600">Masa: {referralTime}</p>
                </div>
              </div>

              {/* RECIPIENT HEADER */}
              <div className="mb-4 space-y-1 font-sans">
                <p className="font-bold text-slate-900 uppercase">KEPADA:</p>
                <p className="font-bold text-slate-800 text-sm">{finalHospitalName}</p>
                <p className="text-slate-600 text-[11px]">Pegawai Perubatan Yang Berkhidmat / Pakar Nefrologi / Jabatan Kecemasan & Trauma</p>
              </div>

              {/* SUBJECT TITLE */}
              <div className="my-4 p-2.5 bg-slate-100 border-l-4 border-slate-900 font-sans">
                <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  PER: SURAT RUJUKAN PESAKIT HEMODIALISIS KRONIK (PERUBATAN / KECEMASAN)
                </h2>
              </div>

              {/* PATIENT PARTICULARS TABLE */}
              <div className="my-4 font-sans border border-slate-300 rounded-lg overflow-hidden text-[11px]">
                <div className="bg-slate-800 text-white font-bold px-3 py-1 uppercase tracking-wider text-[10px]">
                  1. BUTIRAN PERIBADI & RAWATAN PESAKIT
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Nama Pesakit:</span>
                    <strong className="text-slate-900 text-xs">{activePatientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">No. Kad Pengenalan:</span>
                    <strong className="text-slate-900 font-mono">{activePatientIC}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Umur / Jantina:</span>
                    <span className="text-slate-900">{activePatientAge} Tahun ({activePatientGender})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Jenis Akses Vascular:</span>
                    <strong className="text-slate-900">{activePatientAccess}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Berat Kering (Target):</span>
                    <span className="text-slate-900 font-mono">{activePatientDryWeight} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Penaja Rawatan:</span>
                    <span className="text-slate-900">{activePatientSponsor}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[9px] uppercase">Nama & Tel Waris Kecemasan:</span>
                    <span className="text-slate-900">{activePatientWaris}</span>
                  </div>
                </div>
              </div>

              {/* CLINICAL REASON & INDICATIONS */}
              <div className="my-4 font-sans space-y-2">
                <div className="font-bold text-slate-900 uppercase text-[11px]">
                  2. SEBAB RUJUKAN & INDIKASI KLINIKAL:
                </div>
                <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg space-y-1">
                  <h3 className="font-bold text-red-900 text-xs uppercase">{reasonTitle}</h3>
                  <p className="text-slate-800 text-[11px] leading-relaxed">{clinicalDescription}</p>
                </div>
              </div>

              {/* VITAL SIGNS & DIALYSIS PARAMETERS */}
              <div className="my-4 font-sans grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider text-emerald-800">
                    TANDA VITAL SEMASA RUJUKAN:
                  </span>
                  <p className="font-mono text-slate-900 font-semibold">{vitalSigns}</p>
                </div>

                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider text-cyan-800">
                    CATATAN DIALISIS & MESIN:
                  </span>
                  <p className="font-mono text-slate-900">{dialysisTreatmentNotes}</p>
                </div>
              </div>

              {/* ACTION TAKEN & AMBULANCE STATUS */}
              <div className="my-3 font-sans text-[11px] text-slate-800 space-y-1">
                <p>
                  <strong>Tindakan Awal Diberikan:</strong> Rawatan hemodialisis dihentikan sementara secara selamat (return blood done), sokongan oksigen & pemantauan rapi tanda vital.
                </p>
                <p>
                  <strong>Pengangkutan Kecemasan:</strong> {ambulanceArranged ? 'Ambulans Bantuan Kecemasan telah dipanggil & dimaklumkan.' : 'Pesakit dihantar menggunakan kenderaan waris/keluarga.'}
                </p>
              </div>

              {/* CLOSING & SIGNATURE */}
              <div className="mt-8 pt-4 border-t border-slate-300 font-sans flex items-end justify-between">
                <div className="space-y-1 text-[11px]">
                  <p>Harap pihak Tuan/Puan dapat memberikan penilaian dan rawatan selanjutnya.</p>
                  <p className="pt-2 text-slate-600">Sekian, terima kasih.</p>
                  
                  <div className="pt-6 space-y-0.5">
                    <div className="w-36 border-b border-slate-900 pb-1 font-bold text-slate-900">
                      {referringNurseName}
                    </div>
                    <p className="font-bold text-slate-800">{referringNurseLJM}</p>
                    <p className="text-slate-600 text-[10px]">Staff Nurse / Sister On-Duty</p>
                    <p className="text-slate-600 text-[10px]">{centreInfo.nama}</p>
                  </div>
                </div>

                {/* STAMP PLACEHOLDER */}
                <div className="w-28 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-[9px] text-slate-400 text-center p-1 font-sans">
                  <span>COP RASMI PUSAT DIALISIS</span>
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="no-print pt-2 flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 text-xs font-semibold rounded-xl border border-[#374151] transition cursor-pointer"
              >
                Tutup
              </button>

              <button
                onClick={handleSaveToRecord}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg flex items-center space-x-2 cursor-pointer"
              >
                {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : <ShieldCheck className="w-4 h-4 text-slate-950" />}
                <span>{savedSuccess ? 'Rekod Disimpan!' : 'Simpan Dalam Rekod Pesakit'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
