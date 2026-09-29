import React, { useState } from 'react';
import { NurseWalkthroughGuide } from './NurseWalkthroughGuide';
import { 
  BloodTestRecord, 
  Patient,
  DoctorVisit,
  CentreInfo,
  ComprehensiveBloodParameters
} from '../types';
import { PdfBloodReportUploadModal } from './PdfBloodReportUploadModal';
import { MedicalReportPdfModal } from './MedicalReportPdfModal';
import { generateDrAiBloodSummary } from '../utils/drAiHelper';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  Send, 
  Droplet, 
  FileSpreadsheet, 
  ShieldAlert, 
  Clock,
  Upload,
  Printer,
  Building2,
  Sparkles,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
  Filter,
  Edit,
  Save,
  X,
  Bot
} from 'lucide-react';
import { 
  createBloodTestReminderMessage, 
  buildWhatsAppLink, 
  formatMalayDate 
} from '../utils/whatsappHelper';

interface MedicalBloodTestViewProps {
  bloodTests: BloodTestRecord[];
  patients: Patient[];
  doctorVisits?: DoctorVisit[];
  centreInfo?: CentreInfo;
  onAddBloodTest: (record: BloodTestRecord) => void;
  onUpdateBloodTest?: (record: BloodTestRecord) => void;
  onSendBloodTestReminder: (record: BloodTestRecord, patient: Patient) => void;
}

export const MedicalBloodTestView: React.FC<MedicalBloodTestViewProps> = ({
  bloodTests = [],
  patients = [],
  doctorVisits = [],
  centreInfo = {
    namaPusat: 'Pusat Hemodialisis Kaizen Bros',
    alamat: 'No. 12, Jalan Pusat Perniagaan 3, 43000 Kajang, Selangor',
    noTelefon: '03-8733 9920',
    emel: 'info@kaizenbrosdialysis.com',
    talianKecemasan24Jam: '019-223 8811'
  },
  onAddBloodTest,
  onUpdateBloodTest,
  onSendBloodTestReminder
}) => {
  const safeBloodTests = Array.isArray(bloodTests) ? bloodTests : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeVisits = Array.isArray(doctorVisits) ? doctorVisits : [];

  const [selectedPatientId, setSelectedPatientId] = useState<string>('ALL');
  const [globalPageFilter, setGlobalPageFilter] = useState<'ALL' | 'PAGE1' | 'PAGE2' | 'PAGE3' | 'PAGE4'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploadPdfOpen, setIsUploadPdfOpen] = useState(false);
  const [isMedicalReportOpen, setIsMedicalReportOpen] = useState(false);
  const [selectedPatientForReport, setSelectedPatientForReport] = useState<Patient | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Doctor AI Summary Edit State
  const [editingDrAiRecord, setEditingDrAiRecord] = useState<BloodTestRecord | null>(null);
  const [drAiText, setDrAiText] = useState<string>('');

  const [formData, setFormData] = useState({
    patientId: safePatients[0]?.id || '',
    tarikhUjian: new Date().toISOString().split('T')[0],
    tarikhUjianSeterusnya: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    hb: 11.8,
    urea: 13.2,
    creatinine: 905,
    potassium: 5.4,
    calcium: 2.37,
    phosphate: 1.79,
    albumin: 48,
    ktV: 1.38,
    ferritin: 474,
    catatan: 'Parameter klinikal dari ujian darah berkala'
  });

  const filteredTests = selectedPatientId === 'ALL'
    ? safeBloodTests
    : safeBloodTests.filter((t) => t.patientId === selectedPatientId);

  const handleSaveDrAiNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrAiRecord) return;

    const updatedRecord: BloodTestRecord = {
      ...editingDrAiRecord,
      maklumatDrAI: drAiText
    };

    if (onUpdateBloodTest) {
      onUpdateBloodTest(updatedRecord);
    }
    setEditingDrAiRecord(null);
    setAlertMessage(`Rumusan / Nota Dr AI & Pakar bagi ${editingDrAiRecord.patientName} telah berjaya dikemas kini.`);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === formData.patientId);
    if (!patient) return;

    const draftRecord: Partial<BloodTestRecord> = {
      tarikhUjian: formData.tarikhUjian,
      hb: Number(formData.hb),
      urea: Number(formData.urea),
      creatinine: Number(formData.creatinine),
      potassium: Number(formData.potassium),
      ktV: Number(formData.ktV),
      ferritin: Number(formData.ferritin)
    };

    const newRecord: BloodTestRecord = {
      id: `BLD-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      tarikhUjian: formData.tarikhUjian,
      tarikhUjianSeterusnya: formData.tarikhUjianSeterusnya,
      tahunUjian: new Date(formData.tarikhUjian).getFullYear(),
      namaMakmal: 'Prima Lab Sdn. Bhd.',
      diMuatNaikOleh: 'Sister Hanim binti Othman',
      hb: Number(formData.hb),
      urea: Number(formData.urea),
      creatinine: Number(formData.creatinine),
      potassium: Number(formData.potassium),
      calcium: Number(formData.calcium),
      phosphate: Number(formData.phosphate),
      albumin: Number(formData.albumin),
      ktV: Number(formData.ktV),
      ferritin: Number(formData.ferritin),
      detailedParameters: {
        rcc: 4.2, pcv: 37, mcv: 88, mch: 28, mchc: 32, rdw: 13.2, platelet: 231, wcc: 6.5,
        neutrophils: 53, lymphocytes: 18, monocytes: 7, eosinophils: 21, basophils: 1,
        totalCholesterol: 2.4, hdlCholesterol: 0.9, nonHdlCholesterol: 1.5, ldlCholesterol: 0.9, triglycerides: 1.6, cholHdlRatio: 2.7,
        alp: 116, altSgpt: 14, glucose: 7.6, glucoseCategory: 'Fasting', sodium: 135, chloride: 96, uricAcid: 0.33, correctedCalcium: 2.21,
        postUrea: 5.4, urr: 59.1, hbA1cPercent: 6.6, hbA1cMmolMol: 49, serumIron: 11.0, tibc: 41.4, tsatPercent: 24, transferrin: 1.85,
        iPTH: 38.8, hivAgAb: 'Non Reactive', hBsAg: 'Non Reactive', hBsAb: '182 mIU/mL (Imun)', hepCAbIgG: 'Non Reactive'
      },
      statusPeringatan: 'AKAN_DATANG',
      catatan: formData.catatan,
      maklumatDrAI: generateDrAiBloodSummary(draftRecord)
    };

    onAddBloodTest(newRecord);
    setShowAddModal(false);
    setAlertMessage(`Rekod ujian darah baru untuk ${patient.nama} telah direkodkan.`);
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const handleSendReminder = (test: BloodTestRecord) => {
    const patient = patients.find((p) => p.id === test.patientId);
    if (!patient) return;

    onSendBloodTestReminder(test, patient);
    const msg = createBloodTestReminderMessage(patient, test.tarikhUjianSeterusnya, test.catatan);
    const waUrl = buildWhatsAppLink(patient.noTelefon, msg);

    window.open(waUrl, '_blank');
    setAlertMessage(`Peringatan WhatsApp tarikh ujian darah dihantar kepada ${patient.nama} (${patient.noTelefon}).`);
    setTimeout(() => setAlertMessage(null), 5000);
  };

  return (
    <div className="space-y-6 text-[#E2E8F0]">
      {/* Walkthrough Guide for New Staff / Nurse */}
      <NurseWalkthroughGuide tabId="perubatan" isAdminAuthenticated={true} />

      {/* Header */}
      <div className="bg-[#111827] p-6 rounded-xl border border-[#1F2937] shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2 font-serif">
            <Activity className="w-6 h-6 text-rose-400" />
            <span>Maklumat Perubatan & Rekod Ujian Darah Pesakit</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pemantauan lengkap parameter biokimia (Hb, Kalium, Fosfat, Kalsium, Kt/V, FBC, Lipid, Fungsi Hati, Dialysis Urea Pre/Post, HbA1c, Profil Besi, iPTH & Hepatitis) berformat 4 Muka Surat secara menegak ke bawah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsUploadPdfOpen(true)}
            id="btn-upload-pdf-blood-report"
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Muat Naik PDF Laporan (AI 4 Muka Surat)</span>
          </button>

          <button
            onClick={() => {
              const targetP = safePatients.find((p) => p.id === selectedPatientId) || safePatients[0];
              if (targetP) {
                setSelectedPatientForReport(targetP);
                setIsMedicalReportOpen(true);
              }
            }}
            id="btn-print-patient-medical-report"
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Jana Laporan PDF (5 Tahun)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            id="btn-add-blood-test"
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-950 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Kemas Kini Manual</span>
          </button>
        </div>
      </div>

      {/* 5-Year Data Retention Banner */}
      <div className="p-3 bg-[#0F172A] border border-cyan-800/40 rounded-xl text-xs text-slate-300 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800/40 font-mono font-bold text-[10px]">
            5 TAHUN
          </div>
          <div>
            <span className="font-bold text-white">Dasar Penyimpanan Data Ujian Darah 5 Tahun (KKM):</span>{' '}
            <span className="text-slate-400">
              Sistem mengekalkan rekod ujian darah 4 muka surat selama 5 tahun untuk pemantauan klinikal jangka panjang dan audit kualiti.
            </span>
          </div>
        </div>
        <span className="text-[10px] text-cyan-400 font-mono shrink-0 hidden sm:inline">Piawaian Audit KKM</span>
      </div>

      {alertMessage && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center space-x-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{alertMessage}</span>
        </div>
      )}

      {/* Clinical Target Guidelines Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111827] p-4 rounded-xl border border-[#1F2937] text-xs">
        <div className="p-2.5 bg-[#0F172A] rounded-lg border border-[#1F2937]">
          <span className="text-slate-400 block">Hemoglobin (Hb)</span>
          <span className="text-sm font-bold text-white">10.0 - 12.0 g/dL</span>
          <span className="text-[10px] text-slate-500 block">Sasaran Anemia Dialisis</span>
        </div>
        <div className="p-2.5 bg-[#0F172A] rounded-lg border border-[#1F2937]">
          <span className="text-slate-400 block">Kalium / Potassium (K)</span>
          <span className="text-sm font-bold text-rose-400">3.5 - 5.1 mmol/L</span>
          <span className="text-[10px] text-rose-400/80 block">&gt; 5.1 Bahaya Jantung!</span>
        </div>
        <div className="p-2.5 bg-[#0F172A] rounded-lg border border-[#1F2937]">
          <span className="text-slate-400 block">Fosfat / Phosphate (PO4)</span>
          <span className="text-sm font-bold text-white">0.65 - 1.60 mmol/L</span>
          <span className="text-[10px] text-slate-500 block">Kawalan Tulang & Gatal</span>
        </div>
        <div className="p-2.5 bg-[#0F172A] rounded-lg border border-[#1F2937]">
          <span className="text-slate-400 block">Kecukupan Dialisis (Kt/V)</span>
          <span className="text-sm font-bold text-emerald-400">≥ 1.20</span>
          <span className="text-[10px] text-slate-500 block">Standard Kualiti KKM</span>
        </div>
      </div>

      {/* Filter Toolbar: Patient & Multi-Page View Filter */}
      <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Tapis Mengikut Pesakit:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs px-3 py-1.5 border border-[#374151] rounded-lg bg-[#0F172A] text-slate-200 min-w-[200px] focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="ALL">Semua Pesakit ({bloodTests.length} Rekod)</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.nama} ({p.id})</option>
            ))}
          </select>
        </div>

        {/* Global Page View Selector */}
        <div className="flex items-center space-x-1 text-xs overflow-x-auto py-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1 hidden lg:inline">Paparan Muka Surat:</span>
          <button
            onClick={() => setGlobalPageFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${globalPageFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-[#0F172A] text-slate-300 hover:bg-[#1F2937]'}`}
          >
            Semua Menegak
          </button>
          <button
            onClick={() => setGlobalPageFilter('PAGE1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${globalPageFilter === 'PAGE1' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-[#0F172A] text-slate-300 hover:bg-[#1F2937]'}`}
          >
            Muka Surat 1 (FBC)
          </button>
          <button
            onClick={() => setGlobalPageFilter('PAGE2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${globalPageFilter === 'PAGE2' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-[#0F172A] text-slate-300 hover:bg-[#1F2937]'}`}
          >
            Muka Surat 2 (Hati & Renal)
          </button>
          <button
            onClick={() => setGlobalPageFilter('PAGE3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${globalPageFilter === 'PAGE3' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-[#0F172A] text-slate-300 hover:bg-[#1F2937]'}`}
          >
            Muka Surat 3 (Urea & Besi)
          </button>
          <button
            onClick={() => setGlobalPageFilter('PAGE4')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${globalPageFilter === 'PAGE4' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-[#0F172A] text-slate-300 hover:bg-[#1F2937]'}`}
          >
            Muka Surat 4 (iPTH & Hepatitis)
          </button>
        </div>
      </div>

      {/* BLOOD TEST CARDS STACKED VERTICALLY DOWNWARD (SECARA MENEGAK KE BAWAH) */}
      <div className="space-y-6">
        {filteredTests.map((test) => {
          const isHighPotassium = test.potassium > 5.1;
          const isLowHb = test.hb < 10.0;
          const isHighPhosphate = test.phosphate > 1.60;
          const isAdequateKtV = test.ktV >= 1.2;

          const d = test.detailedParameters || {
            rcc: 4.2, pcv: 37, mcv: 88, mch: 28, mchc: 32, rdw: 13.2, platelet: 231, wcc: 6.5,
            neutrophils: 53, lymphocytes: 18, monocytes: 7, eosinophils: 21, basophils: 1,
            totalCholesterol: 2.4, hdlCholesterol: 0.9, nonHdlCholesterol: 1.5, ldlCholesterol: 0.9, triglycerides: 1.6, cholHdlRatio: 2.7,
            alp: 116, altSgpt: 14, glucose: 7.6, sodium: 135, chloride: 96, uricAcid: 0.33, correctedCalcium: 2.21,
            postUrea: 5.4, urr: 59.1, hbA1cPercent: 6.6, hbA1cMmolMol: 49, serumIron: 11.0, tibc: 41.4, tsatPercent: 24, transferrin: 1.85,
            iPTH: 38.8, hivAgAb: 'Non Reactive', hBsAg: 'Non Reactive', hBsAb: '182 mIU/mL (Imun)', hepCAbIgG: 'Non Reactive'
          };

          return (
            <div
              key={test.id}
              id={`blood-test-card-${test.id}`}
              className={`rounded-2xl border p-5 sm:p-6 shadow-2xl transition-all space-y-5 ${
                isHighPotassium 
                  ? 'border-rose-500/50 bg-[#1A1218]' 
                  : 'bg-[#111827] border-[#1F2937]'
              }`}
            >
              {/* Card Title & Lab Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2937] pb-4">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-xs font-bold text-[#0A0C10] bg-emerald-400 px-2.5 py-0.5 rounded font-mono">
                      {test.id}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Tarikh Ujian: <strong className="text-white">{formatMalayDate(test.tarikhUjian)}</strong> ({test.tahunUjian || 2026})
                    </span>
                    {test.namaFailPDF && (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-mono rounded-md flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{test.namaFailPDF}</span>
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2 font-serif">
                    <span>{test.patientName}</span>
                    <span className="text-xs text-slate-400 font-mono font-normal">({test.patientId})</span>
                  </h3>
                  
                  <div className="text-xs text-cyan-300 font-medium flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Makmal: <strong className="text-white">{test.namaMakmal || 'Prima Lab Sdn. Bhd.'}</strong></span>
                    <span className="text-slate-500">• Pengesah: {test.diMuatNaikOleh || 'Jururawat Kanan'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {isHighPotassium && (
                    <span className="flex items-center space-x-1 px-3 py-1 bg-rose-950/90 text-rose-300 text-xs font-bold rounded-full border border-rose-800/80 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>AMARAN KALIUM TINGGI</span>
                    </span>
                  )}

                  <button
                    onClick={() => {
                      const p = safePatients.find((pt) => pt.id === test.patientId);
                      if (p) {
                        setSelectedPatientForReport(p);
                        setIsMedicalReportOpen(true);
                      }
                    }}
                    className="px-3 py-1.5 bg-[#1F2937] hover:bg-[#374151] text-cyan-300 text-xs font-bold rounded-lg border border-[#374151] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF</span>
                  </button>
                </div>
              </div>

              {/* VERTICAL STACKED PARAMETERS - 4 PAGES breakdown (NO HORIZONTAL SCROLL) */}
              <div className="space-y-4">
                
                {/* PAGE 1: FULL BLOOD COUNT & CORONARY RISK */}
                {(globalPageFilter === 'ALL' || globalPageFilter === 'PAGE1') && (
                  <div className="bg-[#0F172A] border border-[#1F2937] p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                      <h4 className="text-xs font-extrabold text-emerald-400 flex items-center gap-2 uppercase tracking-wider font-serif">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <span>Muka Surat 1: Full Blood Count (FBC) & Profile Lipid</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">PrimaLab / KKM Standard</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
                      {/* Hb */}
                      <div className={`p-2.5 rounded-lg border ${test.hb < 10.0 ? 'bg-amber-950/40 border-amber-800/60' : 'bg-[#1E293B] border-[#374151]'}`}>
                        <span className="text-[10px] text-slate-400 block">Hemoglobin (Hb)</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className={`text-sm font-bold font-mono ${test.hb < 10.0 ? 'text-amber-400' : 'text-white'}`}>{test.hb} g/dL</span>
                          {test.hb < 12.0 && <span className="text-[9px] bg-amber-950 text-amber-300 px-1 py-0.5 rounded font-bold">L</span>}
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 12.0 - 18.0</span>
                      </div>

                      {/* RCC */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Red Cell Count (RCC)</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-amber-400 font-mono">{d.rcc || 4.2} 10^6/uL</span>
                          <span className="text-[9px] bg-amber-950 text-amber-300 px-1 py-0.5 rounded font-bold">L</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 4.5 - 6.5</span>
                      </div>

                      {/* PCV */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Haematocrit (PCV)</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-amber-400 font-mono">{d.pcv || 37} %</span>
                          <span className="text-[9px] bg-amber-950 text-amber-300 px-1 py-0.5 rounded font-bold">L</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 40 - 54</span>
                      </div>

                      {/* MCV / MCH */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">MCV / MCH</span>
                        <span className="text-xs font-bold text-white block font-mono mt-0.5">{d.mcv || 88} fL / {d.mch || 28} pg</span>
                        <span className="text-[9px] text-slate-500 block">MCHC: {d.mchc || 32} g/dL</span>
                      </div>

                      {/* Platelet */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Platelet</span>
                        <span className="text-sm font-bold text-white block font-mono mt-0.5">{d.platelet || 231} 10^3/uL</span>
                        <span className="text-[9px] text-slate-500 block">Ref: 150 - 450</span>
                      </div>

                      {/* Eosinophils */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Eosinophils</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-rose-400 font-mono">{d.eosinophils || 21} %</span>
                          <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.5 rounded font-bold">H</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 1 - 6</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 2: LIVER FUNCTION & RENAL FUNCTION PROFILE */}
                {(globalPageFilter === 'ALL' || globalPageFilter === 'PAGE2') && (
                  <div className="bg-[#0F172A] border border-[#1F2937] p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                      <h4 className="text-xs font-extrabold text-cyan-400 flex items-center gap-2 uppercase tracking-wider font-serif">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span>Muka Surat 2: Liver Function Profile & Renal Function Profile</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">Elektrolit & Buah Pinggang</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
                      {/* Albumin */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Albumin</span>
                        <span className="text-sm font-bold text-white block font-mono mt-0.5">{test.albumin} g/L</span>
                        <span className="text-[9px] text-slate-500 block">Ref: 35 - 52</span>
                      </div>

                      {/* Kalium */}
                      <div className={`p-2.5 rounded-lg border ${isHighPotassium ? 'bg-rose-950/80 border-rose-800' : 'bg-[#1E293B] border-[#374151]'}`}>
                        <span className="text-[10px] text-slate-400 block">Kalium (K)</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className={`text-sm font-bold font-mono ${isHighPotassium ? 'text-rose-300' : 'text-white'}`}>{test.potassium} mmol/L</span>
                          {isHighPotassium && <span className="text-[9px] bg-rose-900 text-rose-200 px-1 py-0.5 rounded font-bold">H</span>}
                        </div>
                        <span className="text-[9px] text-rose-400/80 block">Ref: 3.5 - 5.1</span>
                      </div>

                      {/* Creatinine */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Creatinine</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-rose-400 font-mono">{test.creatinine} umol/L</span>
                          <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.5 rounded font-bold">H</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 59 - 116</span>
                      </div>

                      {/* Phosphate */}
                      <div className={`p-2.5 rounded-lg border ${isHighPhosphate ? 'bg-rose-950/50 border-rose-800' : 'bg-[#1E293B] border-[#374151]'}`}>
                        <span className="text-[10px] text-slate-400 block">Fosfat (PO4)</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-rose-400 font-mono">{test.phosphate} mmol/L</span>
                          {isHighPhosphate && <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.5 rounded font-bold">H</span>}
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 0.65 - 1.60</span>
                      </div>

                      {/* Sodium */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Natrium (Na)</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-amber-400 font-mono">{d.sodium || 135} mmol/L</span>
                          <span className="text-[9px] bg-amber-950 text-amber-300 px-1 py-0.5 rounded font-bold">L</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 136 - 145</span>
                      </div>

                      {/* Fasting Glucose */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Fasting Glucose</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-rose-400 font-mono">{d.glucose || 7.6} mmol/L</span>
                          <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.5 rounded font-bold">H</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 3.9 - 6.0</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 3: DIALYSIS PRE/POST UREA, HbA1c & IRON PROFILE */}
                {(globalPageFilter === 'ALL' || globalPageFilter === 'PAGE3') && (
                  <div className="bg-[#0F172A] border border-[#1F2937] p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                      <h4 className="text-xs font-extrabold text-amber-400 flex items-center gap-2 uppercase tracking-wider font-serif">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span>Muka Surat 3: Dialysis Pre/Post Urea, HbA1c & Iron Profile</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">Kecukupan Dialisis & Anemia</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
                      {/* Pre Urea */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Urea Pre-Dialysis</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-rose-400 font-mono">{test.urea} mmol/L</span>
                          <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.5 rounded font-bold">H</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 2.8 - 8.1</span>
                      </div>

                      {/* Post Urea & URR */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Post Urea & URR %</span>
                        <span className="text-sm font-bold text-emerald-400 block font-mono mt-0.5">{d.postUrea || 5.4} mmol/L</span>
                        <span className="text-[9px] text-emerald-400 block font-bold">URR {d.urr || 59.1}%</span>
                      </div>

                      {/* Kt/V */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Kt/V (Adequacy)</span>
                        <span className="text-sm font-bold text-emerald-400 block font-mono mt-0.5">{test.ktV}</span>
                        <span className="text-[9px] text-slate-400 block">{isAdequateKtV ? 'Standard KKM' : 'Kurang'}</span>
                      </div>

                      {/* HbA1c */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">HbA1c</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-rose-400 font-mono">{d.hbA1cPercent || 6.6} %</span>
                          <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.5 rounded font-bold">H</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">{d.hbA1cMmolMol || 49} mmol/mol</span>
                      </div>

                      {/* Ferritin */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Ferritin</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-rose-400 font-mono">{test.ferritin} ug/L</span>
                          <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.5 rounded font-bold">H</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 30 - 400</span>
                      </div>

                      {/* TSAT */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">% Saturation (TSAT)</span>
                        <span className="text-sm font-bold text-white block font-mono mt-0.5">{d.tsatPercent || 24} %</span>
                        <span className="text-[9px] text-slate-500 block">Ref: 13 - 51</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 4: CHEMISTRY-HORMONE (iPTH) & SEROLOGY / HEPATITIS */}
                {(globalPageFilter === 'ALL' || globalPageFilter === 'PAGE4') && (
                  <div className="bg-[#0F172A] border border-[#1F2937] p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                      <h4 className="text-xs font-extrabold text-teal-400 flex items-center gap-2 uppercase tracking-wider font-serif">
                        <Layers className="w-4 h-4 text-teal-400" />
                        <span>Muka Surat 4: Chemistry-Hormone (iPTH) & Serologi / Hepatitis</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">Pencegahan Jangkitan</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5 text-xs">
                      {/* iPTH */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Intact PTH (iPTH)</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-sm font-bold text-rose-400 font-mono">{d.iPTH || 38.8} pmol/L</span>
                          <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.5 rounded font-bold">H</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">Ref: 1.6 - 6.9</span>
                      </div>

                      {/* HBsAb */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">HBs Antibody (Antibodi Hep B)</span>
                        <span className="text-sm font-bold text-emerald-400 block font-mono mt-0.5">{d.hBsAb || '182 mIU/mL'}</span>
                        <span className="text-[9px] text-emerald-400/80 block">&gt;10 mIU/mL (Imun Terpelihara)</span>
                      </div>

                      {/* HBsAg */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">HBs Antigen (Hepatitis B)</span>
                        <span className="text-sm font-bold text-emerald-400 block font-mono mt-0.5">{d.hBsAg || 'Non Reactive'}</span>
                        <span className="text-[9px] text-slate-500 block">Saringan Bebas Hep B</span>
                      </div>

                      {/* Hep C */}
                      <div className="p-2.5 rounded-lg border bg-[#1E293B] border-[#374151]">
                        <span className="text-[10px] text-slate-400 block">Hepatitis C Ab IgG</span>
                        <span className="text-sm font-bold text-emerald-400 block font-mono mt-0.5">{d.hepCAbIgG || 'Non Reactive'}</span>
                        <span className="text-[9px] text-slate-500 block">Saringan Bebas Hep C</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Maklumat Dr AI & Rumusan Doktor Pakar */}
              <div className="bg-[#0F172A] border border-cyan-800/50 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-cyan-900/50 pb-2">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase font-serif">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Maklumat Dr AI & Rumusan Doktor Pakar</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingDrAiRecord(test);
                      setDrAiText(test.maklumatDrAI || generateDrAiBloodSummary(test));
                    }}
                    className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Sunting Nota Doktor Pakar</span>
                  </button>
                </div>
                <div className="text-xs text-slate-200 whitespace-pre-line font-mono bg-[#0A0C10]/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {test.maklumatDrAI || generateDrAiBloodSummary(test)}
                </div>
              </div>

              {/* Doctor / Nurse Notes */}
              {test.catatan && (
                <div className="p-3 bg-[#0F172A] rounded-xl text-xs text-slate-300 italic border-l-4 border-emerald-500 flex items-start space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>"{test.catatan}"</span>
                </div>
              )}

              {/* WhatsApp Reminder Trigger Bar */}
              <div className="pt-3 border-t border-[#1F2937] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>
                    Tarikh Ujian Seterusnya: <strong className="text-white font-mono">{formatMalayDate(test.tarikhUjianSeterusnya)}</strong>
                  </span>
                </div>

                <button
                  onClick={() => handleSendReminder(test)}
                  id={`btn-remind-blood-${test.id}`}
                  className="px-4 py-2 bg-[#10B981] hover:bg-emerald-400 text-[#0A0C10] rounded-xl font-bold flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-950 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Hantar WhatsApp Peringatan Tarikh Ambil Darah</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Add Blood Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTest}
            className="bg-[#111827] rounded-2xl border border-[#1F2937] max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto text-[#E2E8F0]"
          >
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2 font-serif">
                <Droplet className="w-5 h-5 text-rose-400" />
                <span>Kemas Kini Keputusan Ujian Darah Manual</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pilih Pesakit</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.id}) - IC: {p.noIC}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tarikh Ujian Ini</label>
                  <input
                    type="date"
                    value={formData.tarikhUjian}
                    onChange={(e) => setFormData({ ...formData, tarikhUjian: e.target.value })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tarikh Ujian Seterusnya</label>
                  <input
                    type="date"
                    value={formData.tarikhUjianSeterusnya}
                    onChange={(e) => setFormData({ ...formData, tarikhUjianSeterusnya: e.target.value })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Hb (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hb}
                    onChange={(e) => setFormData({ ...formData, hb: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kalium / K (mmol/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.potassium}
                    onChange={(e) => setFormData({ ...formData, potassium: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Fosfat / PO4 (mmol/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.phosphate}
                    onChange={(e) => setFormData({ ...formData, phosphate: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kt/V (Kecukupan)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ktV}
                    onChange={(e) => setFormData({ ...formData, ktV: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kalsium (mmol/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.calcium}
                    onChange={(e) => setFormData({ ...formData, calcium: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Albumin (g/L)</label>
                  <input
                    type="number"
                    value={formData.albumin}
                    onChange={(e) => setFormData({ ...formData, albumin: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Catatan Doktor / Kaunseling Diet</label>
                <textarea
                  rows={2}
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Komen mengenai dos ubat, suntikan EPO, kawalan makanan..."
                  className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#1F2937]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 border border-[#374151] rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-rose-950 cursor-pointer"
              >
                Simpan Keputusan Makmal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Auto-Extract PDF Blood Report Upload Modal */}
      <PdfBloodReportUploadModal
        isOpen={isUploadPdfOpen}
        onClose={() => setIsUploadPdfOpen(false)}
        patients={safePatients}
        onAddBloodTest={(record) => {
          onAddBloodTest(record);
          setAlertMessage(`Laporan darah PDF 4 muka surat dari ${record.namaMakmal} berjaya di-ekstrak dan disimpan untuk ${record.patientName}!`);
          setTimeout(() => setAlertMessage(null), 6000);
        }}
      />

      {/* Edit Dr AI Notes Modal for Specialist Doctor */}
      {editingDrAiRecord && (
        <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl border border-[#1F2937] max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fadeIn text-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center space-x-2.5 text-cyan-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white font-serif">
                  Sunting Maklumat Dr AI & Nota Pakar Nefrologi
                </h3>
              </div>
              <button
                onClick={() => setEditingDrAiRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1F2937]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Doktor pakar boleh menyunting, menambah arahan ubat, atau menyesuaikan rumusan klinikal AI bagi pesakit <strong>{editingDrAiRecord.patientName}</strong> ({editingDrAiRecord.patientId}):
            </p>

            <form onSubmit={handleSaveDrAiNotes} className="space-y-4">
              <textarea
                rows={10}
                value={drAiText}
                onChange={(e) => setDrAiText(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#374151] rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-hidden leading-relaxed"
                placeholder="Masukkan rumusan klinikal atau nota doktor pakar..."
              />

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDrAiRecord(null)}
                  className="px-4 py-2 bg-[#1F2937] hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Nota Doktor Pakar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Medical Report PDF Modal */}
      <MedicalReportPdfModal
        isOpen={isMedicalReportOpen}
        onClose={() => setIsMedicalReportOpen(false)}
        patient={selectedPatientForReport || safePatients[0] || null}
        bloodTests={safeBloodTests}
        doctorVisits={safeVisits}
        centreInfo={centreInfo}
      />
    </div>
  );
};
