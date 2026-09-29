import React, { useState, useRef } from 'react';
import { 
  Patient, 
  TreatmentSession, 
  BloodTestRecord, 
  DoctorVisit, 
  TransactionPayment, 
  NotificationLog, 
  PreRegisteredPatient, 
  ShiftConfig, 
  CentreInfo 
} from '../types';
import { 
  Download, 
  Upload, 
  ShieldCheck, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  FileJson, 
  Clock, 
  RefreshCw, 
  HardDrive,
  FileText,
  Lock,
  Layers,
  Archive
} from 'lucide-react';

interface SystemBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  sessions: TreatmentSession[];
  bloodTests: BloodTestRecord[];
  doctorVisits: DoctorVisit[];
  transactions: TransactionPayment[];
  notifications: NotificationLog[];
  preRegisteredPatients: PreRegisteredPatient[];
  shifts: ShiftConfig[];
  centreInfo: CentreInfo;
  onRestoreData: (restored: {
    patients?: Patient[];
    sessions?: TreatmentSession[];
    bloodTests?: BloodTestRecord[];
    doctorVisits?: DoctorVisit[];
    transactions?: TransactionPayment[];
    notifications?: NotificationLog[];
    preRegisteredPatients?: PreRegisteredPatient[];
    shifts?: ShiftConfig[];
  }, mode: 'OVERWRITE' | 'MERGE') => void;
  onResetFreshStart?: () => void;
}

export const SystemBackupModal: React.FC<SystemBackupModalProps> = ({
  isOpen,
  onClose,
  patients = [],
  sessions = [],
  bloodTests = [],
  doctorVisits = [],
  transactions = [],
  notifications = [],
  preRegisteredPatients = [],
  shifts = [],
  centreInfo,
  onRestoreData,
  onResetFreshStart
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT'>('EXPORT');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importParsedData, setImportParsedData] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'OVERWRITE' | 'MERGE'>('OVERWRITE');
  const [isSuccess, setIsSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalRecordsCount =
    patients.length +
    sessions.length +
    bloodTests.length +
    doctorVisits.length +
    transactions.length +
    notifications.length +
    preRegisteredPatients.length +
    shifts.length;

  // Handle Export Data to JSON File
  const handleExportJSON = () => {
    const backupData = {
      system: 'Pusat Dialisis KaizenBros System',
      version: '2.0',
      exportTimestamp: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString('ms-MY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      data5YearRetentionCompliant: true,
      centreInfo,
      summary: {
        totalPatients: patients.length,
        totalSessions: sessions.length,
        totalBloodTests: bloodTests.length,
        totalDoctorVisits: doctorVisits.length,
        totalTransactions: transactions.length,
        totalNotifications: notifications.length,
        totalPreRegPatients: preRegisteredPatients.length,
        totalShifts: shifts.length,
        grandTotalRecords: totalRecordsCount
      },
      data: {
        patients,
        sessions,
        bloodTests,
        doctorVisits,
        transactions,
        notifications,
        preRegisteredPatients,
        shifts
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const filename = `KAIZENBROS_BACKUP_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsSuccess(`Eksport Sandaran JSON Berjaya! Fail '${filename}' telah dimuat turun.`);
    setTimeout(() => setIsSuccess(null), 6000);
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Validate JSON payload
        if (!json || typeof json !== 'object') {
          throw new Error('Format fail JSON tidak sah.');
        }

        const dataObj = json.data || json; // Support both wrapped structure and raw object

        if (!dataObj.patients && !dataObj.sessions && !dataObj.bloodTests) {
          throw new Error('Fail JSON tidak mengandungi rekod perubatan/pesakit yang sah.');
        }

        setImportParsedData(json);
      } catch (err: any) {
        setImportError(`Gagal membaca fail JSON: ${err.message || 'Format tidak disokong.'}`);
        setImportParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleConfirmRestore = () => {
    if (!importParsedData) return;

    const dataObj = importParsedData.data || importParsedData;

    onRestoreData(
      {
        patients: Array.isArray(dataObj.patients) ? dataObj.patients : undefined,
        sessions: Array.isArray(dataObj.sessions) ? dataObj.sessions : undefined,
        bloodTests: Array.isArray(dataObj.bloodTests) ? dataObj.bloodTests : undefined,
        doctorVisits: Array.isArray(dataObj.doctorVisits) ? dataObj.doctorVisits : undefined,
        transactions: Array.isArray(dataObj.transactions) ? dataObj.transactions : undefined,
        notifications: Array.isArray(dataObj.notifications) ? dataObj.notifications : undefined,
        preRegisteredPatients: Array.isArray(dataObj.preRegisteredPatients) ? dataObj.preRegisteredPatients : undefined,
        shifts: Array.isArray(dataObj.shifts) ? dataObj.shifts : undefined
      },
      restoreMode
    );

    setIsSuccess(
      `Pemulihan Data Berjaya! Sistem kini dikemas kini mengikut rekod dari fail sandaran JSON (${restoreMode === 'OVERWRITE' ? 'Ganti Sepenuhnya' : 'Gabung Record'}).`
    );
    setImportFile(null);
    setImportParsedData(null);
    setTimeout(() => {
      setIsSuccess(null);
      onClose();
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] max-w-2xl w-full p-6 space-y-5 shadow-2xl text-[#E2E8F0] animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-950 text-cyan-400 rounded-xl border border-cyan-800/50">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Sandaran & Pemulihan Data Sistem (JSON)</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-mono rounded-full font-bold">
                  Akreditasi KKM 5-Tahun
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Eksport atau muat naik rekod tempatan untuk keselamatan simpanan 5 tahun mengikut undang-undang KKM.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#0F172A] p-1 rounded-xl border border-[#1F2937]">
          <button
            onClick={() => {
              setActiveTab('EXPORT');
              setImportError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'EXPORT'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Eksport Sandaran JSON (Backup Local)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('IMPORT');
              setIsSuccess(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'IMPORT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Muat Naik / Pulihkan Data (Import Restore)</span>
          </button>
        </div>

        {isSuccess && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs font-medium flex items-center space-x-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{isSuccess}</span>
          </div>
        )}

        {activeTab === 'EXPORT' ? (
          <div className="space-y-4">
            {/* Summary statistics grid */}
            <div className="p-4 bg-[#0F172A] border border-[#1F2937] rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-cyan-400" />
                  <span>Ringkasan Fail Sandaran JSON Semasa</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  {totalRecordsCount} Jumlah Rekod Terlibat
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="p-2.5 bg-[#111827] rounded-lg border border-[#1F2937]">
                  <span className="block text-[10px] text-slate-400">Rekod Pesakit</span>
                  <span className="text-sm font-bold text-emerald-400">{patients.length} Pesakit</span>
                </div>
                <div className="p-2.5 bg-[#111827] rounded-lg border border-[#1F2937]">
                  <span className="block text-[10px] text-slate-400">Sesi Dialisis</span>
                  <span className="text-sm font-bold text-cyan-400">{sessions.length} Sesi</span>
                </div>
                <div className="p-2.5 bg-[#111827] rounded-lg border border-[#1F2937]">
                  <span className="block text-[10px] text-slate-400">Ujian Darah (5 Thn)</span>
                  <span className="text-sm font-bold text-rose-400">{bloodTests.length} Ujian</span>
                </div>
                <div className="p-2.5 bg-[#111827] rounded-lg border border-[#1F2937]">
                  <span className="block text-[10px] text-slate-400">Lawatan Doktor</span>
                  <span className="text-sm font-bold text-amber-400">{doctorVisits.length} Lawatan</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
                <div className="p-2 bg-[#111827] rounded border border-[#1F2937] text-slate-300">
                  <span className="text-[10px] text-slate-500 block">Kewangan/Resit:</span>
                  <span className="font-bold text-emerald-400">{transactions.length} Transaksi</span>
                </div>
                <div className="p-2 bg-[#111827] rounded border border-[#1F2937] text-slate-300">
                  <span className="text-[10px] text-slate-500 block">Log WhatsApp:</span>
                  <span className="font-bold text-cyan-400">{notifications.length} Mesej</span>
                </div>
                <div className="p-2 bg-[#111827] rounded border border-[#1F2937] text-slate-300">
                  <span className="text-[10px] text-slate-500 block">Pra-Pendaftaran:</span>
                  <span className="font-bold text-amber-400">{preRegisteredPatients.length} Permohonan</span>
                </div>
              </div>
            </div>

            {/* Compliance note */}
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-slate-300 flex items-start space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Satu Klik Muat Turun Tempatan (Local Offline Backup):</span>
                Fail `.json` yang dieksport mengandungi data berstruktur lengkap dan sedia untuk disimpan dalam pemacu keras (Hard Disk / Pendrive) bagi memenuhi keperluan pematuhan simpanan data rekod perubatan 5 tahun KKM.
              </div>
            </div>

            {/* Fresh Start Reset Box */}
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/50 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Reset Keseluruhan Data Sistem (Fresh Start)</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Memadamkan semua data pesakit, pra-pendaftaran, jadual rawatan, rekod ujian darah, dan kewangan untuk memulakan sistem semula secara bersih. <strong>Rekod Staf TIDAK akan dipadamkan.</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Adakah anda pasti mahu memadamkan semua rekod klinikal & kewangan untuk mulakan dgn Fresh Start? Rekod staf dikekalkan.')) {
                    if (onResetFreshStart) {
                      onResetFreshStart();
                      setIsSuccess('Sistem telah berjaya ditetapkan semula (Fresh Start). Data pesakit & kewangan dibersihkan, rekod staf dikekalkan.');
                    }
                  }
                }}
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer"
              >
                Tetapkan Semula Data (Fresh Start)
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleExportJSON}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-950 transition flex items-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Muat Turun Fail Sandaran (.JSON)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File upload area */}
            <div className="border-2 border-dashed border-[#374151] hover:border-emerald-500 rounded-2xl p-6 text-center space-y-3 bg-[#0F172A]/80 transition">
              <FileJson className="w-10 h-10 text-emerald-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-white">
                  Pilih atau Tarik Fail Sandaran JSON (.json)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fail mesti berformat JSON KaizenBros Dialysis Backup
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#1F2937] hover:bg-slate-700 text-slate-200 border border-[#374151] rounded-xl text-xs font-bold cursor-pointer transition inline-flex items-center space-x-1.5"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{importFile ? importFile.name : 'Cari Fail Sandaran JSON'}</span>
              </button>
            </div>

            {importError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Preview of Parsed Data */}
            {importParsedData && (
              <div className="p-4 bg-[#0F172A] border border-emerald-800/50 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pratonton Kandungan Fail Sandaran</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Tarikh Export: {importParsedData.formattedDate || importParsedData.exportTimestamp || 'N/A'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-slate-300">
                  <div className="p-2 bg-[#111827] rounded border border-[#1F2937]">
                    <span className="text-[10px] text-slate-500 block">Pesakit:</span>
                    <span className="font-bold text-emerald-400">
                      {importParsedData.data?.patients?.length || importParsedData.patients?.length || 0} orang
                    </span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-[#1F2937]">
                    <span className="text-[10px] text-slate-500 block">Sesi Rawatan:</span>
                    <span className="font-bold text-cyan-400">
                      {importParsedData.data?.sessions?.length || importParsedData.sessions?.length || 0} rekod
                    </span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-[#1F2937]">
                    <span className="text-[10px] text-slate-500 block">Ujian Darah:</span>
                    <span className="font-bold text-rose-400">
                      {importParsedData.data?.bloodTests?.length || importParsedData.bloodTests?.length || 0} ujian
                    </span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-[#1F2937]">
                    <span className="text-[10px] text-slate-500 block">Lawatan Doktor:</span>
                    <span className="font-bold text-amber-400">
                      {importParsedData.data?.doctorVisits?.length || importParsedData.doctorVisits?.length || 0} rekod
                    </span>
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="space-y-1.5 pt-2 border-t border-[#1F2937]">
                  <label className="block font-bold text-white">Mod Pemulihan Data:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode('OVERWRITE')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                        restoreMode === 'OVERWRITE'
                          ? 'bg-rose-950/60 border-rose-600 text-white font-bold'
                          : 'bg-[#111827] border-[#1F2937] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block text-xs">Ganti Sepenuhnya (Overwrite)</span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        Memadam data semasa & menggantikan secara bersih dari fail JSON ini.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRestoreMode('MERGE')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                        restoreMode === 'MERGE'
                          ? 'bg-emerald-950/60 border-emerald-600 text-white font-bold'
                          : 'bg-[#111827] border-[#1F2937] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block text-xs">Gabung Data (Merge)</span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        Menambah rekod baharu tanpa memadamkan pesakit/sesi sedia ada.
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-950 transition flex items-center space-x-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-950" />
                    <span>Sahkan & Pulihkan Data Sekarang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
