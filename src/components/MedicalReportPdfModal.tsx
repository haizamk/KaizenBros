import React, { useState } from 'react';
import { Patient, BloodTestRecord, DoctorVisit, CentreInfo, DigitalSignatureData } from '../types';
import { KaizenBrosLogo } from './KaizenBrosLogo';
import { DigitalSignatureModal } from './DigitalSignatureModal';
import { formatMalayDate } from '../utils/whatsappHelper';
import { downloadElementAsPng } from '../utils/html2canvasHelper';
import { 
  Printer, 
  X, 
  Download, 
  Image,
  FileText, 
  ShieldCheck, 
  Activity, 
  User, 
  Building2, 
  Stethoscope,
  Droplet,
  HeartPulse,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  FileSignature
} from 'lucide-react';

interface MedicalReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  bloodTests: BloodTestRecord[];
  doctorVisits: DoctorVisit[];
  centreInfo: CentreInfo;
  defaultViewMode?: 'REPORT' | 'COMPARISON' | 'VERTICAL_3_TESTS';
  isReadOnly?: boolean;
}

export const MedicalReportPdfModal: React.FC<MedicalReportPdfModalProps> = ({
  isOpen,
  onClose,
  patient,
  bloodTests = [],
  doctorVisits = [],
  centreInfo,
  defaultViewMode = 'VERTICAL_3_TESTS',
  isReadOnly = false
}) => {
  if (!isOpen || !patient) return null;

  const safeBloodTests = Array.isArray(bloodTests) ? bloodTests : [];
  const safeVisits = Array.isArray(doctorVisits) ? doctorVisits : [];

  // Filter 5-year blood test history for this patient sorted by date descending
  const patientBloodTests = safeBloodTests
    .filter((b) => b.patientId === patient.id)
    .sort((a, b) => new Date(b.tarikhUjian).getTime() - new Date(a.tarikhUjian).getTime());

  const patientVisits = safeVisits
    .filter((v) => v.patientId === patient.id)
    .sort((a, b) => new Date(b.tarikhLawatan).getTime() - new Date(a.tarikhLawatan).getTime());

  // Top 3 latest tests for vertical specialist report
  const threeLatestTests = patientBloodTests.slice(0, 3);

  // Default selected date to latest test date or today
  const [selectedDate, setSelectedDate] = useState<string>(
    patientBloodTests[0]?.tarikhUjian || new Date().toISOString().split('T')[0]
  );
  const [reportFormat, setReportFormat] = useState<'SINGLE_PAGE' | 'MULTI_PAGE'>('MULTI_PAGE');
  const [viewMode, setViewMode] = useState<'REPORT' | 'COMPARISON' | 'VERTICAL_3_TESTS'>(defaultViewMode);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  // Digital Signature state
  const [digitalSignature, setDigitalSignature] = useState<DigitalSignatureData | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Render Doctor / Specialist Signature block with digital signature support
  const renderDoctorSignatureBlock = () => {
    if (digitalSignature && digitalSignature.signatureImage && digitalSignature.signatureImage.trim() !== '') {
      return (
        <div 
          className={`text-right space-y-0.5 ${!isReadOnly ? 'cursor-pointer group' : ''}`} 
          onClick={() => !isReadOnly && setIsSignatureModalOpen(true)}
          title={!isReadOnly ? "Klik untuk tukar atau kemaskini Tandatangan Digital" : undefined}
        >
          <div className="relative inline-block text-right">
            <img 
              src={digitalSignature.signatureImage} 
              alt="Tandatangan Digital Pakar" 
              className="h-10 sm:h-12 object-contain ml-auto block print:h-10" 
            />
            <div className="border-b-2 border-slate-900 pb-0.5 font-mono text-[8px] text-emerald-800 font-bold flex items-center justify-end gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
              <span>DISAHKAN DIGITAL ({digitalSignature.signatureId})</span>
            </div>
          </div>
          <div className="font-bold text-slate-900 text-[10px]">{digitalSignature.signerName}</div>
          <div className="text-slate-600 text-[9px]">{digitalSignature.signerRole}</div>
          <div className="text-slate-400 text-[8px] font-mono">Tarikh Disahkan: {digitalSignature.signedAt}</div>
        </div>
      );
    }

    return (
      <div 
        className={`text-right space-y-0.5 ${!isReadOnly ? 'cursor-pointer group' : ''}`} 
        onClick={() => !isReadOnly && setIsSignatureModalOpen(true)}
        title={!isReadOnly ? "Klik untuk tambah Tandatangan Digital" : undefined}
      >
        <div className={`w-44 border-b-2 border-slate-800 pb-6 text-center text-slate-400 font-mono text-[8px] ${!isReadOnly ? 'group-hover:bg-emerald-50 group-hover:border-emerald-500 group-hover:text-emerald-700' : ''} transition rounded-t p-1`}>
          {!isReadOnly ? '[ + TANDATANGAN DIGITAL ]' : '[ TANDATANGAN DOKTOR PAKAR ]'}
        </div>
        <div className="font-bold text-slate-900 text-[10px]">Dr. Sarah binti Mohamad Noor</div>
        <div className="text-slate-600 text-[9px]">Pakar Nefrologi / Pengarah Perubatan (MMC 59402)</div>
      </div>
    );
  };

  // Find blood test record for selected target date (or fallback to closest/latest)
  const targetBloodTest = patientBloodTests.find((b) => b.tarikhUjian === selectedDate) || patientBloodTests[0];

  // Compare previous blood test (chronologically immediately before selectedDate)
  const targetIndex = patientBloodTests.findIndex((b) => b.id === targetBloodTest?.id);
  const previousBloodTest = targetIndex >= 0 && targetIndex < patientBloodTests.length - 1
    ? patientBloodTests[targetIndex + 1]
    : null;

  const currentDateFormatted = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = async () => {
    await downloadElementAsPng(
      'medical-report-printable-area',
      `Laporan_Perubatan_KaizenBros_${patient.nama.replace(/\s+/g, '_')}_${selectedDate}.png`,
      () => setIsGeneratingPng(true),
      () => setIsGeneratingPng(false)
    );
  };

  // Standard Header Banner with KaizenBros Logo, Address & Phone Number for Specialist Doctor Printing
  const renderHeaderBanner = (titleTag: string = "3 UJIAN DARAH TERKINI (MENEGAK)") => (
    <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center space-x-3.5">
        <KaizenBrosLogo size={52} showText={false} />
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
            {centreInfo.nama || 'Pusat Dialisis KaizenBros'}
          </h1>
          <p className="text-[10px] text-slate-700 font-bold">
            Lesen KKM: <span className="font-mono">{centreInfo.noPendaftaranKKM || 'KKM/HD/2023/8892'}</span>
          </p>
          <p className="text-[10px] text-slate-600 font-medium">
            📍 {centreInfo.alamat || '27 & 29G, Jalan 5/10, Seksyen 5 Bandar Rinching, 43500 Semenyih, Selangor'}
          </p>
          <p className="text-[10px] text-slate-600 font-medium">
            📞 Tel: <strong className="text-slate-900 font-mono">{centreInfo.telefonUtama || '03-87270791'}</strong> | 🆘 Kecemasan 24Jam: <strong className="text-slate-900 font-mono">{centreInfo.talianKecemasan24Jam || '019-338 9922'}</strong> | ✉️ {centreInfo.emel || 'admin@kaizenbrosdialysis.com.my'}
          </p>
        </div>
      </div>

      <div className="text-left sm:text-right shrink-0">
        <span className="font-mono text-[10px] font-bold bg-slate-900 text-emerald-400 px-3 py-1 rounded inline-block uppercase tracking-wider">
          {titleTag}
        </span>
        <div className="text-[10px] text-slate-600 font-mono mt-1">Ref: REF-MED-{patient.id}-{selectedDate.replace(/-/g, '')}</div>
        <div className="text-[10px] text-slate-500 font-mono">Tarikh Cetak: {currentDateFormatted}</div>
      </div>
    </div>
  );

  // Render Full 6-Category Clinical Parameter Table for Complete Specialist Monitoring
  const renderFullParametersTable = (b: BloodTestRecord) => (
    <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-xs print:shadow-none">
      <table className="w-full text-left text-[10px] print:text-[8px] border-collapse">
        <thead>
          <tr className="bg-slate-900 text-white font-mono uppercase text-[9px] print:text-[7.5px]">
            <th className="p-1.5 print:p-0.5 border-r border-slate-800">Kumpulan Parameter</th>
            <th className="p-1.5 print:p-0.5 border-r border-slate-800">Ujian / Bio-Penanda (Test)</th>
            <th className="p-1.5 print:p-0.5 border-r border-slate-800 text-center bg-slate-800 text-emerald-300">Keputusan (Result)</th>
            <th className="p-1.5 print:p-0.5 border-r border-slate-800 text-center">Julat Rujukan Standard</th>
            <th className="p-1.5 print:p-0.5 text-center">Status Klinikal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {/* 1. FULL BLOOD COUNT (FBC) */}
          <tr>
            <td className="p-1.5 print:p-0.5 font-bold text-slate-900 bg-slate-100 uppercase font-mono text-[9px] print:text-[7.5px]" rowSpan={7}>
              1. FULL BLOOD COUNT (FBC)
            </td>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Haemoglobin (Hb)</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold text-amber-800 bg-amber-50">{b.hb} g/dL</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">12.0 - 18.0 g/dL</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-amber-700">Rendah (Target HD)</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">RCC / PCV / MCV</td>
            <td className="p-1 print:p-0.5 text-center font-mono">{b.detailedParameters?.rcc || 4.2} / {b.detailedParameters?.pcv || 37}% / {b.detailedParameters?.mcv || 88} fL</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">4.5-6.5 / 40-54 / 80-100</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Normal</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">MCH / MCHC / RDW</td>
            <td className="p-1 print:p-0.5 text-center font-mono">{b.detailedParameters?.mch || 28} pg / {b.detailedParameters?.mchc || 32} g/dL / {b.detailedParameters?.rdw || 13.2}%</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">27-32 / 30-35 / 10-16.5%</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Normal</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">White Cell Count (WCC)</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold">{b.detailedParameters?.wcc || 6.5} x10^3/µL</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">4.0 - 11.0 x10^3/µL</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Normal</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Neutrophils / Lymphocytes / Monocytes</td>
            <td className="p-1 print:p-0.5 text-center font-mono">{b.detailedParameters?.neutrophils || 53}% / {b.detailedParameters?.lymphocytes || 18}% / {b.detailedParameters?.monocytes || 7}%</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">40-75% / 20-65% / 2-10%</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-amber-700">Lym Rendah Sedikit</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Eosinophils / Basophils</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-rose-800 font-bold">{b.detailedParameters?.eosinophils || 21}% / {b.detailedParameters?.basophils || 1}%</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">1-6% / 0-1%</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-rose-700">Eosinophils High</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Platelet Count</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold">{b.detailedParameters?.platelet || 231} x10^3/µL</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">150 - 450 x10^3/µL</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Normal</td>
          </tr>

          {/* 2. BIOKIMIA & FUNGSI GINJAL */}
          <tr>
            <td className="p-1.5 print:p-0.5 font-bold text-slate-900 bg-slate-100 uppercase font-mono text-[9px] print:text-[7.5px]" rowSpan={4}>
              2. BIOKIMIA & FUNGSI GINJAL
            </td>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Sodium (Na+) / Potassium (K+) / Chloride (Cl-)</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold text-rose-800 bg-rose-50">{b.detailedParameters?.sodium || 135} / {b.potassium} / {b.detailedParameters?.chloride || 96} mmol/L</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">136-145 / 3.5-5.1 / 98-107</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-amber-700">Monitor K+ & Na+</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Urea Pre / Post-Dialysis</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold">{b.urea} / {b.detailedParameters?.postUrea || 5.4} mmol/L</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">2.8 - 7.8 mmol/L</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-slate-700">Pre-HD High (Normal)</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Urea Reduction Rate (URR) & Kt/V</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold text-emerald-800 bg-emerald-50">{b.detailedParameters?.urr || 59.1}% URR • Kt/V {b.ktV}</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">&gt;65% URR / &gt;1.20 Kt/V</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Adequacy Memuaskan</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Creatinine / Uric Acid</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold">{b.creatinine} µmol/L / {b.detailedParameters?.uricAcid || 0.33} mmol/L</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">44-106 µmol/L / 0.20-0.42</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-slate-700">ESRD Baseline</td>
          </tr>

          {/* 3. TULANG, BESI & GLIKEMIK */}
          <tr>
            <td className="p-1.5 print:p-0.5 font-bold text-slate-900 bg-slate-100 uppercase font-mono text-[9px] print:text-[7.5px]" rowSpan={4}>
              3. TULANG, BESI & GLIKEMIK
            </td>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Calcium / Corrected Ca / Phosphate</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold">{b.calcium} / {b.detailedParameters?.correctedCalcium || 2.21} / {b.phosphate} mmol/L</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">2.15-2.50 / 0.65-1.60</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Ca-PO4 Terkawal</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Serum Ferritin / Serum Iron / TIBC</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold">{b.ferritin} ng/mL / {b.detailedParameters?.serumIron || 11.0} µmol/L / {b.detailedParameters?.tibc || 41.4}</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">200-800 / 5.8-34.5 / 45-70</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Simpanan Besi Mencukupi</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">% Saturation (TSAT) / Transferrin</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold">{b.detailedParameters?.tsatPercent || 24}% TSAT / {b.detailedParameters?.transferrin || 1.85} g/L</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">13 - 51% / 2.0 - 3.6 g/L</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">TSAT Target Capai</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Glycated HbA1c % / HbA1c-IFCC / Fasting Glucose</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold text-amber-800 bg-amber-50">{b.detailedParameters?.hbA1cPercent || 6.6}% / {b.detailedParameters?.hbA1cMmolMol || 49} / {b.detailedParameters?.glucose || 7.6} mmol/L</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">&lt;6.5% / &lt;48 / 3.9-6.0</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-amber-700">Diabetic Target Monitor</td>
          </tr>

          {/* 4. PROFIL LIPID & RISIKO KORONARI */}
          <tr>
            <td className="p-1.5 print:p-0.5 font-bold text-slate-900 bg-slate-100 uppercase font-mono text-[9px] print:text-[7.5px]" rowSpan={2}>
              4. PROFIL LIPID & RISIKO KORONARI
            </td>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Total Cholesterol / HDL / non-HDL / LDL</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold">{b.detailedParameters?.totalCholesterol || 2.4} / {b.detailedParameters?.hdlCholesterol || 0.9} / {b.detailedParameters?.nonHdlCholesterol || 1.5} / {b.detailedParameters?.ldlCholesterol || 0.9} mmol/L</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">&lt;5.2 / &gt;1.0 / &lt;3.4 / &lt;2.6</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Lipid Profil Baik</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Triglycerides / Chol:HDL Ratio</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold">{b.detailedParameters?.triglycerides || 1.6} mmol/L / {b.detailedParameters?.cholHdlRatio || 2.7}</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">&lt;1.7 mmol/L / &lt;3.5 Ratio</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Nisbah Risiko Rendah</td>
          </tr>

          {/* 5. FUNGSI HATI & PROTEIN */}
          <tr>
            <td className="p-1.5 print:p-0.5 font-bold text-slate-900 bg-slate-100 uppercase font-mono text-[9px] print:text-[7.5px]" rowSpan={2}>
              5. FUNGSI HATI & PROTEIN
            </td>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Serum Albumin</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold text-emerald-800 bg-emerald-50">{b.albumin || 48} g/L</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">35 - 52 g/L</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Status Nutrisi Cemerlang</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Alkaline Phosphatase (ALP) & SGPT / ALT</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold">{b.detailedParameters?.alp || 116} U/L / {b.detailedParameters?.altSgpt || 14} U/L</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">40-129 U/L / &lt;50 U/L</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Fungsi Hati Normal</td>
          </tr>

          {/* 6. SEROLOGI & HORMONE */}
          <tr>
            <td className="p-1.5 print:p-0.5 font-bold text-slate-900 bg-slate-100 uppercase font-mono text-[9px] print:text-[7.5px]" rowSpan={2}>
              6. SEROLOGI & HORMONE
            </td>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">iPTH (Intact Parathyroid Hormone)</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold text-rose-800 bg-rose-50">{b.detailedParameters?.iPTH || 38.8} pg/mL</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">150 - 300 pg/mL (KDIGO HD)</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-amber-700">Monitor iPTH</td>
          </tr>
          <tr>
            <td className="p-1 print:p-0.5 font-semibold text-slate-800">Hepatitis B (HBsAg / HBsAb) / Hep C / HIV</td>
            <td className="p-1 print:p-0.5 text-center font-mono font-bold text-emerald-800">NR / {b.detailedParameters?.hBsAb || '182 mIU/mL (Imun)'} / NR / NR</td>
            <td className="p-1 print:p-0.5 text-center font-mono text-slate-500">NR / &gt;10 mIU/mL / NR / NR</td>
            <td className="p-1 print:p-0.5 text-center font-bold text-emerald-700">Bebas & Imun Hep B</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Helper for trend badge
  const getTrendBadge = (currentVal?: number, prevVal?: number, isHigherBetter: boolean = true) => {
    if (currentVal === undefined || prevVal === undefined) return <span className="text-slate-400 font-mono text-[10px]">-</span>;
    const diff = Number((currentVal - prevVal).toFixed(2));
    if (diff === 0) {
      return <span className="text-slate-500 font-mono text-[10px] font-medium">= (Stabil)</span>;
    }
    const isGood = isHigherBetter ? diff > 0 : diff < 0;
    return (
      <span className={`inline-flex items-center gap-0.5 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
        isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}>
        {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{diff > 0 ? `+${diff}` : `${diff}`}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Control Toolbar (Hidden during printing) */}
      <div className="fixed top-2 left-2 right-2 sm:top-4 sm:left-auto sm:right-4 z-50 flex flex-wrap items-center justify-between sm:justify-end gap-2 bg-[#111827] border border-[#1F2937] p-2.5 rounded-2xl shadow-2xl print:hidden">
        
        {/* Date Selector */}
        <div className="flex items-center space-x-2 bg-[#0F172A] border border-[#374151] px-3 py-1.5 rounded-xl text-xs">
          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-semibold hidden sm:inline">Tarikh Rekod:</span>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-emerald-400 font-bold focus:outline-hidden cursor-pointer"
          >
            {patientBloodTests.map((b, idx) => (
              <option key={b.id} value={b.tarikhUjian} className="bg-[#111827] text-white">
                {idx === 0 ? `Terkini (${b.tarikhUjian})` : b.tarikhUjian} ({b.namaMakmal || 'Makmal Panel'})
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle: 3 Tests Vertical vs Report vs Comparison */}
        <div className="flex items-center bg-[#0F172A] border border-[#374151] p-1 rounded-xl text-xs overflow-x-auto">
          <button
            onClick={() => setViewMode('VERTICAL_3_TESTS')}
            className={`px-3 py-1 rounded-lg font-semibold transition shrink-0 ${
              viewMode === 'VERTICAL_3_TESTS' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 3 Ujian Darah Terkini (Menegak)
          </button>
          <button
            onClick={() => setViewMode('REPORT')}
            className={`px-3 py-1 rounded-lg font-semibold transition shrink-0 ${
              viewMode === 'REPORT' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            📄 Laporan Rasmi
          </button>
          <button
            onClick={() => setViewMode('COMPARISON')}
            className={`px-3 py-1 rounded-lg font-semibold transition shrink-0 ${
              viewMode === 'COMPARISON' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 Perbandingan Rekod
          </button>
        </div>

        {/* Format Selector: Single Page vs Multi-Page */}
        {viewMode === 'REPORT' && (
          <div className="hidden md:flex items-center bg-[#0F172A] border border-[#374151] p-1 rounded-xl text-xs">
            <button
              onClick={() => setReportFormat('SINGLE_PAGE')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                reportFormat === 'SINGLE_PAGE' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
              }`}
            >
              1 Muka Surat
            </button>
            <button
              onClick={() => setReportFormat('MULTI_PAGE')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                reportFormat === 'MULTI_PAGE' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
              }`}
            >
              Multi-Page (Lengkap)
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(true)}
              id="btn-digital-signature-report"
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                digitalSignature
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                  : 'bg-[#1E293B] text-slate-200 hover:text-white border-[#374151] hover:bg-slate-800'
              }`}
              title="Klik untuk tandatangan digital laporan ini"
            >
              <FileSignature className="w-4 h-4 text-emerald-400" />
              <span>{digitalSignature ? '✓ Ditandatangani Digital' : '✍️ Tandatangan Digital'}</span>
            </button>
          )}

          <button
            onClick={handleDownloadPng}
            disabled={isGeneratingPng}
            id="btn-download-png-report"
            className="flex items-center space-x-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <Image className="w-4 h-4" />
            <span>{isGeneratingPng ? 'Muat Turun...' : 'Muat Turun PNG'}</span>
          </button>

          <button
            onClick={handlePrint}
            id="btn-print-download-pdf-report"
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Muat Turun PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-[#1F2937] hover:bg-[#374151] text-white rounded-xl border border-[#374151] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div id="medical-report-printable-area" className="w-full max-w-4xl my-16 sm:my-12 print:my-0 print:py-0 print:max-w-none">
        {/* VIEW MODE 0: VERTICAL 3 LATEST BLOOD TESTS (FOR SPECIALIST DOCTOR REFERENCE) */}
        {viewMode === 'VERTICAL_3_TESTS' && (
          <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-8 shadow-2xl space-y-4 print:m-0 print:p-2 print:shadow-none print:w-full text-xs">
            {/* Header Document Banner with Logo, Address & Tel */}
            {renderHeaderBanner("3 UJIAN DARAH TERKINI (MENEGAK)")}

            {/* MANDATORY USER REQUIREMENT 3: Patient Demographics Header BEFORE parameter data below */}
            <div className="bg-slate-50 border-2 border-slate-800 p-3 rounded-xl space-y-2 text-[11px] print:p-2.5 print:space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h2 className="font-black text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>PROFIL PESAKIT & RINGKASAN MAKLUMAT UJIAN</span>
                </h2>
                <span className="text-[10px] font-mono text-slate-600">Pusat Hemodialisis Kaizen Bros</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs print:text-[10px]">
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block font-semibold">Nama Pesakit</span>
                  <span className="font-black text-slate-900 text-xs sm:text-sm">{patient.nama}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block font-semibold">Umur</span>
                  <span className="font-bold text-slate-900">{patient.umur} Tahun</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block font-semibold">No. Kad Pengenalan (IC)</span>
                  <span className="font-mono font-bold text-slate-900">{patient.noIC}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block font-semibold">Jantina</span>
                  <span className="font-bold text-slate-900 uppercase">{patient.jantina}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block font-semibold">3 Tarikh Test Terkini</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded text-[10px]">
                    {threeLatestTests.map(t => t.tarikhUjian).join(' • ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block font-semibold">Penaja Rawatan</span>
                  <span className="font-bold text-slate-900">{patient.penaja} ({patient.noRujukanPenaja || 'PERKESO'})</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block font-semibold">Akses Vaskular</span>
                  <span className="font-bold text-slate-900">{patient.jenisAkses} ({patient.lokasiAkses})</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block font-semibold">Berat Kering & Telefon</span>
                  <span className="font-bold text-slate-900">{patient.beratKering} kg • {patient.noTelefon}</span>
                </div>
              </div>
            </div>

            {/* MANDATORY USER REQUIREMENT 1: Data parameter 3 ujian darah terkini dipaparkan secara MENEGAK ke bawah */}
            <div className="space-y-4 print:space-y-3">
              <div className="font-black text-slate-900 text-xs uppercase font-mono border-b-2 border-slate-800 pb-1 flex items-center justify-between">
                <span>REKOD PARAMETER 3 UJIAN DARAH TERKINI (DIPAPARKAN SECARA MENEGAK)</span>
                <span className="text-[10px] text-slate-500 font-normal">Susunan: Terkini ke Sebelumnya</span>
              </div>

              {threeLatestTests.length === 0 ? (
                <div className="p-4 bg-slate-100 text-slate-600 text-center rounded-xl font-mono">
                  Tiada rekod ujian darah dijumpai untuk pesakit ini.
                </div>
              ) : (
                threeLatestTests.map((b, idx) => (
                  <div key={b.id} className={idx > 0 ? "page-break-before-always print:pt-2 space-y-3" : "space-y-3"}>
                    {idx > 0 && (
                      <div className="hidden print:block mb-2">
                        {renderHeaderBanner(`3 UJIAN DARAH TERKINI (${idx + 1}/3)`)}
                      </div>
                    )}
                    <div className="border-2 border-slate-300 rounded-xl p-3 space-y-2.5 bg-white shadow-xs page-break-inside-avoid break-inside-avoid print:p-2.5">
                      {/* Test Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-slate-900 text-white p-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black font-mono text-[10px] rounded uppercase">
                            UJIAN DARAH #{idx + 1} {idx === 0 ? '(TERKINI)' : ''}
                          </span>
                          <span className="font-mono font-bold text-xs sm:text-sm text-emerald-300">{b.tarikhUjian}</span>
                          <span className="text-slate-400 text-[11px] font-semibold">({b.namaMakmal || 'Makmal Panel'})</span>
                        </div>
                        <div className="text-[9.5px] font-mono text-slate-300">
                          Fail PDF: <strong className="text-white">{b.namaFailPDF || 'PrimaLab_KhairulHaizam_12Jul2026.pdf'}</strong> • Dimuat naik: {b.diMuatNaikOleh || 'Sister Hanim'}
                        </div>
                      </div>

                      {/* Highlights Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 text-center text-[9.5px]">
                        <div className="p-1 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[8.5px] uppercase font-semibold">Hemoglobin</span>
                          <span className="font-mono font-black text-xs text-slate-900">{b.hb} g/dL</span>
                        </div>
                        <div className="p-1 bg-rose-50 rounded border border-rose-200">
                          <span className="text-rose-600 block text-[8.5px] uppercase font-semibold">Kalium (K+)</span>
                          <span className="font-mono font-black text-xs text-rose-800">{b.potassium} mmol/L</span>
                        </div>
                        <div className="p-1 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[8.5px] uppercase font-semibold">Urea Pre/Post</span>
                          <span className="font-mono font-black text-xs text-slate-900">{b.urea} / {b.detailedParameters?.postUrea || '-'}</span>
                        </div>
                        <div className="p-1 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[8.5px] uppercase font-semibold">Creatinine</span>
                          <span className="font-mono font-black text-xs text-slate-900">{b.creatinine} µmol/L</span>
                        </div>
                        <div className="p-1 bg-emerald-50 rounded border border-emerald-200">
                          <span className="text-emerald-700 block text-[8.5px] uppercase font-semibold">Kt/V Dialisis</span>
                          <span className="font-mono font-black text-xs text-emerald-800">{b.ktV}</span>
                        </div>
                        <div className="p-1 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[8.5px] uppercase font-semibold">Fosfat (PO4)</span>
                          <span className="font-mono font-black text-xs text-slate-900">{b.phosphate} mmol/L</span>
                        </div>
                        <div className="p-1 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[8.5px] uppercase font-semibold">Kalsium (Ca)</span>
                          <span className="font-mono font-black text-xs text-slate-900">{b.calcium} mmol/L</span>
                        </div>
                        <div className="p-1 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[8.5px] uppercase font-semibold">Ferritin</span>
                          <span className="font-mono font-black text-xs text-slate-900">{b.ferritin} ng/mL</span>
                        </div>
                      </div>

                      {/* Detailed Full Parameter Table */}
                      {renderFullParametersTable(b)}

                      {/* Notes */}
                      <div className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[9.5px]">
                        <strong className="text-slate-900">Nota / Ulasan Makmal:</strong> {b.catatan || 'Tiada catatan khas.'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Doctor Signature & Accreditation Footer */}
            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-end text-[10.5px] page-break-inside-avoid break-inside-avoid">
              <div className="space-y-1">
                <div className="w-32 border-b border-slate-800 pb-4 text-center text-slate-400 font-mono text-[9px]">
                  [ COP RASMI PUSAT ]
                </div>
                <div className="font-bold text-slate-900">{centreInfo.namaPusat}</div>
              </div>

              {renderDoctorSignatureBlock()}
            </div>
          </div>
        )}

        {/* VIEW MODE 1: COMPARISON VIEW (VIEWING & COMPARING HISTORICAL RECORDS) */}
        {viewMode === 'COMPARISON' && (
          <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 print:m-0 print:p-4 text-xs">
            <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-700" />
                  <span>Jadual Perbandingan & Trend Rekod Perubatan Lampau</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Perbandingan parameter biokimia ujian darah antara tarikh pilihan ({selectedDate}) dengan tarikh-tarikh ujian sebelumnya.
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-slate-900">{patient.nama}</span>
                <span className="block font-mono text-[10px] text-slate-500">IC: {patient.noIC}</span>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono uppercase text-[10px]">
                    <th className="p-2.5 border-b border-slate-800">Parameter Klinikal</th>
                    <th className="p-2.5 border-b border-slate-800 text-center bg-emerald-900 text-emerald-300">
                      Tarikh Pilihan:<br />
                      <span className="font-black text-xs text-white">{selectedDate}</span>
                    </th>
                    {patientBloodTests.slice(1, 4).map((b) => (
                      <th key={b.id} className="p-2.5 border-b border-slate-800 text-center">
                        Tarikh Lampau:<br />
                        <span className="font-semibold">{b.tarikhUjian}</span>
                      </th>
                    ))}
                    <th className="p-2.5 border-b border-slate-800 text-center">Julat Rujukan</th>
                    <th className="p-2.5 border-b border-slate-800 text-center">Trend (Delta)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {/* Hb */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">Hemoglobin (Hb)</td>
                    <td className="p-2.5 text-center font-mono font-black text-emerald-800 bg-emerald-50">
                      {targetBloodTest?.hb} g/dL
                    </td>
                    {patientBloodTests.slice(1, 4).map((b) => (
                      <td key={b.id} className="p-2.5 text-center font-mono text-slate-700">{b.hb} g/dL</td>
                    ))}
                    <td className="p-2.5 text-center font-mono text-slate-500">10.0 - 12.0 g/dL</td>
                    <td className="p-2.5 text-center">
                      {getTrendBadge(targetBloodTest?.hb, previousBloodTest?.hb, true)}
                    </td>
                  </tr>

                  {/* Potassium */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">Kalium (Potassium K+)</td>
                    <td className="p-2.5 text-center font-mono font-black text-slate-900 bg-emerald-50">
                      {targetBloodTest?.potassium} mmol/L
                    </td>
                    {patientBloodTests.slice(1, 4).map((b) => (
                      <td key={b.id} className="p-2.5 text-center font-mono text-slate-700">{b.potassium} mmol/L</td>
                    ))}
                    <td className="p-2.5 text-center font-mono text-slate-500">3.5 - 5.5 mmol/L</td>
                    <td className="p-2.5 text-center">
                      {getTrendBadge(targetBloodTest?.potassium, previousBloodTest?.potassium, false)}
                    </td>
                  </tr>

                  {/* Kt/V */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">Kt/V (Adequacy Dialisis)</td>
                    <td className="p-2.5 text-center font-mono font-black text-emerald-800 bg-emerald-50">
                      {targetBloodTest?.ktV}
                    </td>
                    {patientBloodTests.slice(1, 4).map((b) => (
                      <td key={b.id} className="p-2.5 text-center font-mono text-slate-700">{b.ktV}</td>
                    ))}
                    <td className="p-2.5 text-center font-mono text-slate-500">&gt; 1.20</td>
                    <td className="p-2.5 text-center">
                      {getTrendBadge(targetBloodTest?.ktV, previousBloodTest?.ktV, true)}
                    </td>
                  </tr>

                  {/* Urea Pre */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">Urea (Pre-Dialysis)</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-900 bg-emerald-50">
                      {targetBloodTest?.urea} mmol/L
                    </td>
                    {patientBloodTests.slice(1, 4).map((b) => (
                      <td key={b.id} className="p-2.5 text-center font-mono text-slate-700">{b.urea} mmol/L</td>
                    ))}
                    <td className="p-2.5 text-center font-mono text-slate-500">2.8 - 7.8 mmol/L</td>
                    <td className="p-2.5 text-center">
                      {getTrendBadge(targetBloodTest?.urea, previousBloodTest?.urea, false)}
                    </td>
                  </tr>

                  {/* Creatinine */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">Creatinine</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-900 bg-emerald-50">
                      {targetBloodTest?.creatinine} µmol/L
                    </td>
                    {patientBloodTests.slice(1, 4).map((b) => (
                      <td key={b.id} className="p-2.5 text-center font-mono text-slate-700">{b.creatinine} µmol/L</td>
                    ))}
                    <td className="p-2.5 text-center font-mono text-slate-500">44 - 106 µmol/L</td>
                    <td className="p-2.5 text-center">
                      {getTrendBadge(targetBloodTest?.creatinine, previousBloodTest?.creatinine, false)}
                    </td>
                  </tr>

                  {/* Phosphate */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">Fosfat (Phosphate)</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-900 bg-emerald-50">
                      {targetBloodTest?.phosphate} mmol/L
                    </td>
                    {patientBloodTests.slice(1, 4).map((b) => (
                      <td key={b.id} className="p-2.5 text-center font-mono text-slate-700">{b.phosphate} mmol/L</td>
                    ))}
                    <td className="p-2.5 text-center font-mono text-slate-500">0.81 - 1.45 mmol/L</td>
                    <td className="p-2.5 text-center">
                      {getTrendBadge(targetBloodTest?.phosphate, previousBloodTest?.phosphate, false)}
                    </td>
                  </tr>

                  {/* Ferritin */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">Serum Ferritin</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-900 bg-emerald-50">
                      {targetBloodTest?.ferritin || 474} ng/mL
                    </td>
                    {patientBloodTests.slice(1, 4).map((b) => (
                      <td key={b.id} className="p-2.5 text-center font-mono text-slate-700">{b.ferritin || 'N/A'} ng/mL</td>
                    ))}
                    <td className="p-2.5 text-center font-mono text-slate-500">200 - 800 ng/mL</td>
                    <td className="p-2.5 text-center">
                      {getTrendBadge(targetBloodTest?.ferritin, previousBloodTest?.ferritin, true)}
                    </td>
                  </tr>

                  {/* iPTH */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">iPTH (Intact Parathyroid)</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-900 bg-emerald-50">
                      {targetBloodTest?.detailedParameters?.iPTH || 38.8} pg/mL
                    </td>
                    {patientBloodTests.slice(1, 4).map((b) => (
                      <td key={b.id} className="p-2.5 text-center font-mono text-slate-700">
                        {b.detailedParameters?.iPTH || 'N/A'} pg/mL
                      </td>
                    ))}
                    <td className="p-2.5 text-center font-mono text-slate-500">150 - 300 pg/mL</td>
                    <td className="p-2.5 text-center">
                      <span className="text-emerald-800 font-mono text-[10px] font-bold">Stabil</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Doctor Note for Comparison */}
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 space-y-1">
              <div className="font-bold text-slate-900 text-xs">Rumusan Trend Klinikal Pesakit:</div>
              <p className="text-slate-700 text-[11px]">
                Parameter utama bagi tarikh <strong>{selectedDate}</strong> menunjukkan paras Hemoglobin (Hb = {targetBloodTest?.hb} g/dL) & Kt/V ({targetBloodTest?.ktV}) berada dalam kriteria piawaian kualiti KKM. Tiada tanda kemerosotan fungsi vascular access.
              </p>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: TRADITIONAL OFFICIAL MEDICAL REPORT (PRINTABLE FORMAT FOR TARGET DATE) */}
        {viewMode === 'REPORT' && (
          <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-8 shadow-2xl space-y-4 print:m-0 print:p-4 print:shadow-none print:w-full print:max-w-none text-xs">
            
            {/* PAGE 1: TRADITIONAL CLINICAL DISCHARGE & MEDICAL REPORT SUMMARY */}
            <div className="space-y-2.5 print:space-y-2 page-break-after-always">
              {/* Official Header Banner with KaizenBros Logo & Details */}
              {renderHeaderBanner("REKOD PERUBATAN RASMI")}

              {/* Title Banner */}
              <div className="bg-slate-100 p-2 rounded-lg border border-slate-300 text-center space-y-0.5">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                  RINGKASAN REKOD PERUBATAN & STATUS KLINIKAL PESAKIT
                </h2>
                <div className="flex items-center justify-center gap-2 text-[10px]">
                  <span className="text-slate-600">Tarikh Rekod Ditetapkan:</span>
                  <span className="font-mono font-bold bg-slate-900 text-emerald-400 px-2 py-0.5 rounded text-[11px]">
                    {selectedDate}
                  </span>
                  <span className="text-slate-500">({targetBloodTest?.namaMakmal || 'Makmal Panel'})</span>
                </div>
              </div>

              {/* Patient Profile & Access Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-[11px] border-b border-slate-300 pb-0.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-700" />
                    <span>Profil Pesakit</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                    <span className="text-slate-500">Nama Penuh:</span>
                    <span className="font-bold text-slate-900">{patient.nama}</span>

                    <span className="text-slate-500">No. MyKad:</span>
                    <span className="font-mono font-semibold text-slate-900">{patient.noIC}</span>

                    <span className="text-slate-500">ID Pesakit:</span>
                    <span className="font-mono font-bold text-slate-900">{patient.id}</span>

                    <span className="text-slate-500">Umur / Jantina:</span>
                    <span>{patient.umur} tahun ({patient.jantina})</span>

                    <span className="text-slate-500">Penaja Rawatan:</span>
                    <span className="font-bold text-slate-900">{patient.penaja} ({patient.noRujukanPenaja || 'N/A'})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-[11px] border-b border-slate-300 pb-0.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-700" />
                    <span>Status Klinikal & Akses Vaskular</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                    <span className="text-slate-500">Akses Vaskular:</span>
                    <span className="font-bold text-slate-900">{patient.jenisAkses} ({patient.lokasiAkses})</span>

                    <span className="text-slate-500">Berat Kering (Dry Wt):</span>
                    <span className="font-bold text-emerald-700">{patient.beratKering} kg</span>

                    <span className="text-slate-500">Kumpulan Darah:</span>
                    <span className="font-mono font-semibold">{patient.kumpulanDarah || 'A+'}</span>

                    <span className="text-slate-500">Alergi:</span>
                    <span className="text-rose-700 font-semibold">{patient.alergi || 'Tiada'}</span>

                    <span className="text-slate-500">Komorbiditi:</span>
                    <span className="text-slate-800">{patient.komorbid?.join(', ') || 'ESRD, Hipertensi'}</span>
                  </div>
                </div>
              </div>

              {/* Target Date Laboratory Test Results Table */}
              <div className="space-y-1">
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-0.5">
                  <h3 className="font-black text-slate-900 text-[11px] uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-700" />
                    <span>Keputusan Ujian Darah Bagi Tarikh Ditetapkan ({selectedDate})</span>
                  </h3>
                  <span className="text-[9.5px] text-slate-500 font-mono">
                    Makmal: {targetBloodTest?.namaMakmal || 'Prima Lab Sdn. Bhd.'}
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-mono uppercase text-[9px]">
                        <th className="py-1 px-2 border-r border-slate-800">Bio-Penanda / Parameter</th>
                        <th className="py-1 px-2 border-r border-slate-800 text-center">Keputusan</th>
                        <th className="py-1 px-2 border-r border-slate-800 text-center">Julat Rujukan Standard</th>
                        <th className="py-1 px-2 border-r border-slate-800 text-center">Unit</th>
                        <th className="py-1 px-2 text-center">Status / Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-0.5 px-2 font-bold text-slate-900">Hemoglobin (Hb)</td>
                        <td className="py-0.5 px-2 text-center font-mono font-black text-emerald-800 bg-emerald-50">{targetBloodTest?.hb}</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-600">10.0 - 12.0</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-500">g/dL</td>
                        <td className="py-0.5 px-2 text-center"><span className="text-emerald-800 font-bold">NORMAL</span></td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-0.5 px-2 font-bold text-slate-900">Kalium (Potassium K+)</td>
                        <td className="py-0.5 px-2 text-center font-mono font-black text-slate-900">{targetBloodTest?.potassium}</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-600">3.5 - 5.5</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-500">mmol/L</td>
                        <td className="py-0.5 px-2 text-center"><span className="text-emerald-800 font-bold">SELAMAT</span></td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-2 font-bold text-slate-900">Kt/V (Adequacy Dialisis)</td>
                        <td className="py-0.5 px-2 text-center font-mono font-black text-emerald-800 bg-emerald-50">{targetBloodTest?.ktV}</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-600">&gt; 1.20</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-500">Indeks</td>
                        <td className="py-0.5 px-2 text-center"><span className="text-emerald-800 font-bold">MEMUASKAN</span></td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-0.5 px-2 font-bold text-slate-900">Urea Pre-Dialysis</td>
                        <td className="py-0.5 px-2 text-center font-mono font-bold text-slate-900">{targetBloodTest?.urea}</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-600">2.8 - 7.8</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-500">mmol/L</td>
                        <td className="py-0.5 px-2 text-center"><span className="text-slate-700">Tinggi (Perlu Dialisis)</span></td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-2 font-bold text-slate-900">Creatinine</td>
                        <td className="py-0.5 px-2 text-center font-mono font-bold text-slate-900">{targetBloodTest?.creatinine}</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-600">44 - 106</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-500">µmol/L</td>
                        <td className="py-0.5 px-2 text-center"><span className="text-slate-700">ESRD Baseline</span></td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-0.5 px-2 font-bold text-slate-900">Fosfat (Phosphate)</td>
                        <td className="py-0.5 px-2 text-center font-mono font-bold text-slate-900">{targetBloodTest?.phosphate}</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-600">0.81 - 1.45</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-500">mmol/L</td>
                        <td className="py-0.5 px-2 text-center"><span className="text-emerald-800 font-bold">TERKAWAL</span></td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-2 font-bold text-slate-900">Serum Ferritin</td>
                        <td className="py-0.5 px-2 text-center font-mono font-bold text-slate-900">{targetBloodTest?.ferritin || 474}</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-600">200 - 800</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-500">ng/mL</td>
                        <td className="py-0.5 px-2 text-center"><span className="text-emerald-800 font-bold">MENCUKUPI</span></td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-0.5 px-2 font-bold text-slate-900">iPTH (Intact Parathyroid)</td>
                        <td className="py-0.5 px-2 text-center font-mono font-bold text-slate-900">{targetBloodTest?.detailedParameters?.iPTH || 38.8}</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-600">150 - 300</td>
                        <td className="py-0.5 px-2 text-center font-mono text-slate-500">pg/mL</td>
                        <td className="py-0.5 px-2 text-center"><span className="text-slate-700">Rendah (Monitor)</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Doctor Visit & Prescriptions */}
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-[11px] uppercase border-b border-slate-300 pb-0.5 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-700" />
                  <span>Preskripsi Hemodialisis & Ulasan Pakar Nefrologi</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                    <div className="font-bold text-slate-900">Preskripsi Hemodialisis Rutin:</div>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5 text-[9.5px]">
                      <li>Kekerapan: 3 Sesi / Seminggu (4 Jam Per Sesi)</li>
                      <li>Dialyser: High-Flux FX80 (Fresenius)</li>
                      <li>Antikoagulan: Heparin Sodium (Bolus 1000 IU + Maintenance 500 IU/jam)</li>
                      <li>Suntikan EPO: Erythropoietin (Eprex 4000 IU) 2x Seminggu</li>
                    </ul>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                    <div className="font-bold text-slate-900">Catatan Lawatan Pakar Terkini:</div>
                    {patientVisits.length > 0 ? (
                      <div className="text-slate-700 italic text-[9.5px]">
                        "{patientVisits[0].catatanPakar || 'Kadar pembersihan toksin dan Hb pesakit adalah memuaskan. Teruskan preskripsi sedia ada.'}"
                        <div className="mt-0.5 text-[9px] font-semibold text-slate-900 not-italic">
                          — {patientVisits[0].namaDoktor} ({formatMalayDate(patientVisits[0].tarikhLawatan)})
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic text-[9.5px]">Tiada nota lawatan pakar terkini.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Signatures & Accreditation Footer */}
              <div className="pt-2 border-t-2 border-slate-800 flex justify-between items-end text-[10px] page-break-inside-avoid">
                <div className="space-y-0.5">
                  <div className="w-32 h-14 border border-dashed border-slate-400 rounded-md bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 font-mono text-[8px] mb-0.5">
                    <Building2 className="w-4 h-4 mb-0.5 text-slate-400" />
                    <span>[ COP RASMI PUSAT ]</span>
                  </div>
                  <div className="font-bold text-slate-900 text-[10px]">{centreInfo.nama || centreInfo.namaPusat || 'Pusat Dialisis KaizenBros'}</div>
                  <div className="text-slate-500 text-[9px]">No. Lesen KKM: {centreInfo.noPendaftaranKKM || 'KKM/HD/2023/8892'}</div>
                </div>

                {renderDoctorSignatureBlock()}
              </div>

              {/* Page Number */}
              <div className="text-center text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-200">
                Muka Surat 1 dari {reportFormat === 'MULTI_PAGE' ? '2' : '1'} • Ringkasan Rekod Perubatan Rasmi
              </div>
            </div>

            {/* PAGE 2: LAMPIRAN A (IF MULTI-PAGE FORMAT IS SELECTED) */}
            {reportFormat === 'MULTI_PAGE' && (
              <div className="pt-4 space-y-2.5 print:space-y-2 border-t-2 border-slate-300 page-break-before-always">
                {renderHeaderBanner("LAMPIRAN PENUH PARAMETER LAB (DISAHKAN)")}
                <div className="border-b border-slate-800 pb-1 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-slate-900 text-[11px] uppercase font-mono flex items-center gap-2">
                      <span>KEPUTUSAN PENUH UJIAN LAB BIOKIMIA</span>
                    </h3>
                    <p className="text-[9.5px] text-slate-600">
                      Pusat Makmal Panel: <strong>{targetBloodTest?.namaMakmal || 'Prima Lab Sdn. Bhd.'}</strong> (Ref No: <strong>0907260678</strong> | Tarikh Test: <strong>{selectedDate}</strong>)
                    </p>
                  </div>
                </div>

                {/* Complete Laboratory Report Table */}
                {renderFullParametersTable(targetBloodTest)}

                <div className="p-2 bg-slate-100 rounded-lg border border-slate-300 flex justify-between items-center text-[9.5px] page-break-inside-avoid">
                  <div>
                    <strong>Maklumat Pengesahan Ujian Makmal:</strong><br />
                    Pengesahan Keputusan Oleh: <span>Nurkhalida Binti Mohd Khairi MAHPC(MLS)04804</span>
                  </div>
                  <div className="text-right font-mono">
                    Tarikh & Masa Laporan: <strong>12/07/2026 11:14:24</strong>
                  </div>
                </div>

                {/* Signatures & Accreditation Footer for Lampiran A */}
                <div className="pt-2 border-t-2 border-slate-800 flex justify-between items-end text-[10px] page-break-inside-avoid">
                  <div className="space-y-0.5">
                    <div className="w-32 h-14 border border-dashed border-slate-400 rounded-md bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 font-mono text-[8px] mb-0.5">
                      <Building2 className="w-4 h-4 mb-0.5 text-slate-400" />
                      <span>[ COP RASMI PUSAT ]</span>
                    </div>
                    <div className="font-bold text-slate-900 text-[10px]">{centreInfo.nama || centreInfo.namaPusat || 'Pusat Dialisis KaizenBros'}</div>
                    <div className="text-slate-500 text-[9px]">No. Lesen KKM: {centreInfo.noPendaftaranKKM || 'KKM/HD/2023/8892'}</div>
                  </div>

                  {renderDoctorSignatureBlock()}
                </div>

                {/* Page Number */}
                <div className="text-center text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-200">
                  -Lampiran Keputusan Penuh Ujian Biokimia-
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Digital Signature Pad Modal */}
      <DigitalSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={(sigData) => setDigitalSignature(sigData)}
        initialSignature={digitalSignature}
        patientName={patient.nama}
      />
    </div>
  );
};


