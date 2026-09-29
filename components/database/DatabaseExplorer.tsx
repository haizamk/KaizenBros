'use client';

import React, { useState } from 'react';
import { 
  Database, 
  FileCode, 
  Server, 
  Terminal, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Copy, 
  Check, 
  Layers,
  ArrowRight,
  BookOpen,
  Cloud,
  Lock,
  Flame,
  FileText
} from 'lucide-react';

export function DatabaseExplorer() {
  const [activeTab, setActiveTab] = useState<'audit_report' | 'schema' | 'firebase_code' | 'backup_tools'>('audit_report');
  const [selectedCollection, setSelectedCollection] = useState<string>('registrations');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSimulatingBackup, setIsSimulatingBackup] = useState(false);
  const [backupLog, setBackupLog] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const runBackupSimulation = () => {
    setIsSimulatingBackup(true);
    setBackupLog('Menghubungi Google Cloud Firebase Firestore Instance...');
    setTimeout(() => {
      setBackupLog((prev) => `${prev}\nMengesahkan koleksi: registrations, patients, dialysis_sessions, audit_logs...`);
    }, 600);
    setTimeout(() => {
      setBackupLog((prev) => `${prev}\nMenjalankan gcloud firestore export gs://kaizenbros-dialysis-backups/...`);
    }, 1200);
    setTimeout(() => {
      setBackupLog((prev) => `${prev}\nEksport berjaya dipindahkan ke Cloud Storage Bucket (kaizenbros-backup-${new Date().toISOString().slice(0,10)}.json.gz)`);
    }, 1800);
    setTimeout(() => {
      setBackupLog((prev) => `${prev}\n✓ Sandaran Firestore NoSQL selamat & disinkroni!`);
      setIsSimulatingBackup(false);
    }, 2400);
  };

  const collections = [
    { name: 'registrations', docs: 8, desc: 'Pendaftaran pesakit baru dari borang web, status kelulusan, dokumen lampiran & penaja' },
    { name: 'patients', docs: 24, desc: 'Profil pesakit dialisis, berat kering, akses vaskular & status Hepatitis B/C' },
    { name: 'dialysis_sessions', docs: 24, desc: 'Sesi rawatan harian, pre/post weight, UF rate, tekanan darah & masa' },
    { name: 'users', docs: 6, desc: 'Akaun pengguna & peranan RBAC (ADMIN, NEPHROLOGIST, HEAD_NURSE, STAFF_NURSE, PATIENT)' },
    { name: 'vital_signs', docs: 48, desc: 'Bacaan BP berkala, nadi, UF rate & suhu badan setiap jam' },
    { name: 'dialysis_chairs', docs: 12, desc: '12 stesen fizikal kerusi rawatan (B-01 hingga B-12)' },
    { name: 'dialysis_machines', docs: 12, desc: 'Mesin Fresenius 4008S NG & 5008S CorDiax (Online HDF)' },
    { name: 'medications', docs: 8, desc: 'Formulari ubat dialisis (EPO Recormon, Venofer, Phosphate binder)' },
    { name: 'clinical_notes', docs: 15, desc: 'Nota klinikal doktor nefrologi & pemerhatian jururawat' },
    { name: 'audit_logs', docs: 12, desc: 'Jejak audit keselamatan transaksi (Pengguna, Tindakan, IP, Masa)' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider flex items-center">
                <Flame className="w-4 h-4 mr-1 text-amber-500 fill-amber-500" />
                ARKITEKTUR NEXT.JS 15 & FIREBASE FIRESTORE (NOSQL)
              </span>
              <span className="bg-emerald-950 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800">
                Pangkalan Data Awan Cloud / Realtime
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              KAIZENBROS DATABASE & CODE WORKBENCH
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Struktur Koleksi Firestore NoSQL, Peraturan Keselamatan Rules, Kod Integrasi Next.js & Sandaran Awan
            </p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-14 z-30 px-4 sm:px-8 backdrop-blur">
        <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('audit_report')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'audit_report'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Laporan Arkitektur & Teknologi</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'schema'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Koleksi & Skema Firestore NoSQL</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase_code')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'firebase_code'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>3. Kod SDK Firebase & API Routes</span>
          </button>

          <button
            onClick={() => setActiveTab('backup_tools')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'backup_tools'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>4. Keselamatan & Sandaran Data Cloud</span>
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-8 space-y-6">
        
        {/* TAB 1: ARCHITECTURE REPORT */}
        {activeTab === 'audit_report' && (
          <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
                STRUKTUR TEKNOLOGI & ARCHITECTURE OVERVIEW
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Pusat Dialisis KaizenBros: Next.js 15 + Firebase Cloud Firestore
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-900/50 space-y-3">
                <h3 className="text-cyan-400 font-black text-base flex items-center">
                  <Cloud className="w-5 h-5 mr-2" />
                  <span>Ciri-ciri Utama Firebase Firestore NoSQL:</span>
                </h3>
                <ul className="space-y-2 text-slate-300 text-xs sm:text-sm">
                  <li><strong>Format Dokumen Fleksibel:</strong> Menggunakan struktur dokumen JSON (Key-Value) yang mudah dikemaskini tanpa risau skema jadual rosak.</li>
                  <li><strong>Kemaskini Masa-Nyata (Realtime):</strong> Apabila jururawat mencatat bacaan tekanan darah atau berat pesakit, skrin doktor & admin bertukar serta-merta tanpa perlu refresh page.</li>
                  <li><strong>Skala & Keselamatan Google:</strong> Diselenggara penuh di Google Cloud Platform dengan kuota percuma harian (50,000 bacaan & 20,000 penulisan sehari).</li>
                  <li><strong>Peraturan Keselamatan Rules:</strong> Menggunakan `firestore.rules` untuk mengawal hak akses RBAC bagi Admin, Jururawat, dan Pesakit.</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-900/50 space-y-3">
                <h3 className="text-emerald-400 font-black text-base flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span>Penyesuaian Di Server VPS Anda:</span>
                </h3>
                <ul className="space-y-2 text-slate-300 text-xs sm:text-sm">
                  <li><strong>Framework Next.js 15:</strong> Laman web diproses secara pantas di pelayan VPS menggunakan PM2 & Nginx Reverse Proxy.</li>
                  <li><strong>Persistensi Tempatan & Awan:</strong> Pendaftaran pesakit baru disinkronkan ke Firebase Firestore dan disimpan dalam `localStorage` pelayar untuk kebolehcapaian serta-merta.</li>
                  <li><strong>Muat Naik Dokumen:</strong> Surat rujukan doktor/darah yang dimuat naik pesakit ditukar ke format Data URL / Cloud Storage untuk imbasan admin.</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-white">Ringkasan Koleksi Pangkalan Data Firestore:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-emerald-400 block text-sm mb-1 font-bold">Koleksi Pendaftaran (`registrations`):</strong>
                  <p className="text-slate-300">
                    Menyimpan borang pendaftaran pesakit baru, status kelulusan (`BARU`, `DISEMAK`, `DILULUSKAN`), dokumen lampiran PDF/JPG, dan penetapan penaja PERKESO/Zakat oleh admin.
                  </p>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-cyan-400 block text-sm mb-1 font-bold">Koleksi Pesakit (`patients`):</strong>
                  <p className="text-slate-300">
                    Profil pesakit tetap, nombor MyKad, berat kering target, jenis akses vaskular (AVF/AVG/Permacath), dan status keputusan darah Hepatitis.
                  </p>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <strong className="text-amber-400 block text-sm mb-1 font-bold">Koleksi Sesi Dialisis (`dialysis_sessions`):</strong>
                  <p className="text-slate-300">
                    Sesi harian dialisis, berat sebelum & selepas, bacaan tekanan darah (BP), UF rate, dan nota pemerhatian jururawat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FIRESTORE COLLECTIONS & SCHEMAS */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Koleksi Firestore (Firestore Collections)</h2>
                <p className="text-xs text-slate-400">Senarai koleksi NoSQL yang menyimpan data aplikasi Pusat Dialisis KaizenBros</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Collection List */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
                  Senarai Koleksi Firestore ({collections.length})
                </span>
                {collections.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCollection(c.name)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      selectedCollection === c.name
                        ? 'bg-amber-600 text-white font-bold shadow'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-sm block">{c.name}</span>
                      <span className="text-[10px] opacity-80 block truncate max-w-[200px]">{c.desc}</span>
                    </div>
                    <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded font-mono font-bold ml-2">
                      {c.docs} docs
                    </span>
                  </button>
                ))}
              </div>

              {/* Schema Details */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs text-amber-400 font-mono font-bold">Firestore Collection Schema</span>
                    <h3 className="text-xl font-black text-white font-mono">{selectedCollection}</h3>
                  </div>
                  <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full font-bold">
                    NoSQL JSON Model
                  </span>
                </div>

                {selectedCollection === 'registrations' && (
                  <div className="space-y-4 text-xs">
                    <p className="text-slate-300">
                      Koleksi ini menyimpan borang pendaftaran baru yang dihantar dari laman web awam dan diuruskan oleh admin.
                    </p>
                    <pre className="bg-slate-950 p-4 rounded-xl text-emerald-400 font-mono border border-slate-800 overflow-x-auto text-[11px] leading-relaxed">
{`// Firestore Collection: /registrations/{registrationId}
{
  "id": "KB-REG-847291",
  "full_name": "Zulkifli bin Hashim",
  "ic_number": "681120-10-5311",
  "phone_number": "017-6543210",
  "email": "zulkifli68@gmail.com",
  "age": 58,
  "gender": "Lelaki",
  "address": "No 45, Jalan Rinching Indah 3, 43500 Semenyih, Selangor",
  "patient_category": "Pesakit Baru Dialisis",
  "medical_notes": "Surat rujukan Hospital Kajang. AVF lengan left.",
  "document": {
    "name": "Surat_Rujukan_Doktor.pdf",
    "type": "application/pdf",
    "size": "1.2 MB",
    "data_url": "data:application/pdf;base64,..."
  },
  "sponsor_type": "PERKESO / SOCSO", // Ditetapkan oleh Admin
  "preferred_days": "Isnin, Rabu, Jumaat", // Ditetapkan oleh Admin
  "preferred_shift": "Syif Pagi (7:00 AM)", // Ditetapkan oleh Admin
  "assigned_chair": "B-05", // Ditetapkan oleh Admin
  "status": "BARU", // BARU | DISEMAK | DILULUSKAN | DITOLAK
  "admin_notes": "Dokumen disahkan lengkap.",
  "created_at": "2026-09-28 10:15:00"
}`}
                    </pre>
                  </div>
                )}

                {selectedCollection !== 'registrations' && (
                  <div className="space-y-4 text-xs">
                    <p className="text-slate-300">
                      Dokumen NoSQL Firestore bagi koleksi <strong className="text-amber-400 font-mono">{selectedCollection}</strong>.
                    </p>
                    <pre className="bg-slate-950 p-4 rounded-xl text-cyan-400 font-mono border border-slate-800 overflow-x-auto text-[11px] leading-relaxed">
{`// Firestore Collection: /${selectedCollection}/{docId}
{
  "_id": "auto_generated_doc_id",
  "updated_at": "2026-09-28 12:00:00",
  "created_at": "2026-09-28 08:00:00",
  "status": "ACTIVE",
  "metadata": {
    "centre_license": "KKM/BPP/2023/HD-8491",
    "region": "Semenyih, Selangor"
  }
}`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CODE SNIPPETS */}
        {activeTab === 'firebase_code' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">Kod Integrasi Firebase SDK & Next.js</h2>
                <p className="text-xs text-slate-400">Pengurusan sambungan Firestore, Auth, dan API Route Server</p>
              </div>

              <button
                onClick={() => copyToClipboard(`// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "kaizenbros-dialysis.firebaseapp.com",
  projectId: "ai-studio-pusatdialisiskai-24a59215",
  storageBucket: "kaizenbros-dialysis.appspot.com"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);`)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center space-x-2 border border-slate-700"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Disalin!' : 'Salin Kod Firebase'}</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <span className="text-xs text-amber-400 font-mono font-bold block">1. Inisialisasi Firebase SDK (lib/firebase.ts)</span>
              <pre className="bg-slate-950 p-4 rounded-xl text-amber-300 font-mono border border-slate-800 overflow-x-auto text-xs leading-relaxed">
{`import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "kaizenbros-dialysis.firebaseapp.com",
  projectId: "ai-studio-pusatdialisiskai-24a59215",
  storageBucket: "kaizenbros-dialysis.appspot.com"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);`}
              </pre>

              <span className="text-xs text-cyan-400 font-mono font-bold block pt-2">2. Peraturan Keselamatan (firestore.rules)</span>
              <pre className="bg-slate-950 p-4 rounded-xl text-cyan-300 font-mono border border-slate-800 overflow-x-auto text-xs leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kebenaran Pendaftaran Pesakit Baru
    match /registrations/{regId} {
      allow create: if true; // Pesakit awam boleh hantar pendaftaran
      allow read, update, delete: if request.auth != null; // Admin sahaja boleh urus
    }
    
    // Kebenaran Sesi Dialisis & Pesakit
    match /patients/{patientId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role in ['ADMIN', 'HEAD_NURSE'];
    }
  }
}`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: BACKUP & TOOLS */}
        {activeTab === 'backup_tools' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
                  SANDARAN & KESELAMATAN DATA CLOUD
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  Pengurusan Backup & Export Firebase Firestore
                </h2>
                <p className="text-xs text-slate-400">
                  Uji simulasi ekspot pangkalan data Firestore NoSQL ke Google Cloud Storage Bucket
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Simulasi Backup Firestore Harian</h3>
                    <p className="text-xs text-slate-400">Menjalankan arahan automatik gcloud firestore export</p>
                  </div>

                  <button
                    onClick={runBackupSimulation}
                    disabled={isSimulatingBackup}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-lg disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSimulatingBackup ? 'animate-spin' : ''}`} />
                    <span>{isSimulatingBackup ? 'Sedang Membuat Sandaran...' : 'Jalankan Backup Sekarang'}</span>
                  </button>
                </div>

                {backupLog && (
                  <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 whitespace-pre-line leading-relaxed">
                    {backupLog}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
