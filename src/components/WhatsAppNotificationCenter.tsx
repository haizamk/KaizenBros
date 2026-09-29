import React, { useState } from 'react';
import { NurseWalkthroughGuide } from './NurseWalkthroughGuide';
import { 
  NotificationLog, 
  Patient, 
  TreatmentSession, 
  DoctorVisit, 
  BloodTestRecord, 
  TransactionPayment 
} from '../types';
import { 
  MessageSquareShare, 
  Send, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Stethoscope, 
  Droplet, 
  CreditCard, 
  Settings, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  Sliders,
  Mail,
  Check,
  Filter
} from 'lucide-react';
import { 
  buildWhatsAppLink, 
  createSessionReminderMessage, 
  createDoctorVisitMessage, 
  createBloodTestReminderMessage, 
  createPaymentReminderMessage,
  createSessionEmailMessage,
  createDoctorVisitEmailMessage,
  createBloodTestEmailMessage,
  createPaymentEmailMessage,
  formatMalayDate,
  EmailNotificationContent
} from '../utils/whatsappHelper';

interface WhatsAppNotificationCenterProps {
  notifications: NotificationLog[];
  patients: Patient[];
  sessions: TreatmentSession[];
  doctorVisits: DoctorVisit[];
  bloodTests: BloodTestRecord[];
  transactions: TransactionPayment[];
  onTriggerBulkReminders: () => number;
  onSendCustomNotification: (log: NotificationLog) => void;
}

export const WhatsAppNotificationCenter: React.FC<WhatsAppNotificationCenterProps> = ({
  notifications,
  patients,
  sessions,
  doctorVisits,
  bloodTests,
  transactions,
  onTriggerBulkReminders,
  onSendCustomNotification
}) => {
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeDoctorVisits = Array.isArray(doctorVisits) ? doctorVisits : [];
  const safeBloodTests = Array.isArray(bloodTests) ? bloodTests : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const [activeSubTab, setActiveSubTab] = useState<'AUTO_DISPATCH' | 'PREVIEW' | 'TEMPLATES' | 'LOGS'>('AUTO_DISPATCH');
  const [autoWhatsAppActive, setAutoWhatsAppActive] = useState<boolean>(true);
  const [autoEmailActive, setAutoEmailActive] = useState<boolean>(true);
  const [searchLog, setSearchLog] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'WHATSAPP' | 'EMAIL'>('ALL');
  const [bulkStatusMsg, setBulkStatusMsg] = useState<string | null>(null);

  // Preview generator states
  const [previewChannel, setPreviewChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [previewType, setPreviewType] = useState<'SESI' | 'DOKTOR' | 'DARAH' | 'BAYARAN'>('SESI');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(safePatients[0]?.id || '');
  const selectedPatient = safePatients.find((p) => p.id === selectedPatientId) || safePatients[0];

  // Derive message content for WhatsApp and Email previews
  let previewWaText = '';
  let previewEmailData: EmailNotificationContent = {
    subject: '',
    bodyText: '',
    bodyHtml: ''
  };

  if (selectedPatient) {
    if (previewType === 'SESI') {
      const sess = safeSessions.find((s) => s.patientId === selectedPatient.id) || {
        id: 'SES-DEMO',
        patientId: selectedPatient.id,
        patientName: selectedPatient.nama,
        tarikh: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        corakHari: selectedPatient.sesiJadual.corakHari,
        shift: selectedPatient.sesiJadual.shift,
        masaMula: '07:00',
        masaTamat: '11:00',
        stesenNo: selectedPatient.sesiJadual.stesenNo,
        status: 'AKAN_DATANG',
        jururawatBertugas: 'Sister Hanim binti Othman'
      };
      previewWaText = createSessionReminderMessage(selectedPatient, sess);
      previewEmailData = createSessionEmailMessage(selectedPatient, sess);
    } else if (previewType === 'DOKTOR') {
      const doc = safeDoctorVisits.find((d) => d.patientId === selectedPatient.id) || {
        id: 'DOC-DEMO',
        patientId: selectedPatient.id,
        patientName: selectedPatient.nama,
        namaDoktor: 'Dr. Azman bin Khairuddin',
        jawatanDoktor: 'Pakar Perunding Kanan Nefrologi',
        tarikhLawatan: selectedPatient.tarikhLawatanDoktorSeterusnya,
        masa: '09:30 Pagi',
        status: 'TERJADUAL',
        tujuan: 'Rounds Bulanan' as const,
        notifikasiDihantar: false
      };
      previewWaText = createDoctorVisitMessage(selectedPatient, doc);
      previewEmailData = createDoctorVisitEmailMessage(selectedPatient, doc);
    } else if (previewType === 'DARAH') {
      previewWaText = createBloodTestReminderMessage(selectedPatient, selectedPatient.tarikhUjianDarahSeterusnya);
      previewEmailData = createBloodTestEmailMessage(selectedPatient, selectedPatient.tarikhUjianDarahSeterusnya);
    } else if (previewType === 'BAYARAN') {
      const tx = safeTransactions.find((t) => t.patientId === selectedPatient.id) || {
        id: 'TX-DEMO',
        invoisNo: 'INV-2026-DEMO',
        patientId: selectedPatient.id,
        patientName: selectedPatient.nama,
        tarikh: new Date().toISOString().split('T')[0],
        perkara: 'Rawatan Hemodialisis Bulanan',
        jumlahKasar: 2600.00,
        subsidiPenaja: 2470.00,
        bayaranPesakit: 130.00,
        kaedah: 'SOCSO' as const,
        status: 'LUNAS' as const
      };
      previewWaText = createPaymentReminderMessage(selectedPatient, tx);
      previewEmailData = createPaymentEmailMessage(selectedPatient, tx);
    }
  }

  const handleBulkDispatch = () => {
    const count = onTriggerBulkReminders();
    setBulkStatusMsg(`Sistem berjaya mengimbas rekod dan menjana ${count} notifikasi automatik dua saluran (WhatsApp + Emel Sandaran) kepada pesakit.`);
    setTimeout(() => setBulkStatusMsg(null), 6000);
  };

  const handleSendDualPreview = () => {
    if (!selectedPatient) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const waUrl = buildWhatsAppLink(selectedPatient.noTelefon, previewWaText);

    // 1. WhatsApp Log
    const waLog: NotificationLog = {
      id: `NOTIF-WA-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.nama,
      noTelefon: selectedPatient.noTelefon,
      emel: selectedPatient.emel,
      jenis: previewType === 'SESI' ? 'SESI_RAWATAN' : previewType === 'DOKTOR' ? 'LAWATAN_DOKTOR' : previewType === 'DARAH' ? 'TEST_DARAH' : 'PEMBAYARAN_INVOIS',
      saluran: 'WHATSAPP',
      tajuk: `Peringatan ${previewType} (WhatsApp)`,
      kandungan: previewWaText,
      tarikhMasaDihantar: nowStr,
      status: 'BERJAYA',
      pautanWhatsApp: waUrl
    };
    onSendCustomNotification(waLog);

    // 2. Email Log (Secondary Channel)
    const emailLog: NotificationLog = {
      id: `NOTIF-EML-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.nama,
      noTelefon: selectedPatient.noTelefon,
      emel: selectedPatient.emel,
      jenis: previewType === 'SESI' ? 'SESI_RAWATAN' : previewType === 'DOKTOR' ? 'LAWATAN_DOKTOR' : previewType === 'DARAH' ? 'TEST_DARAH' : 'PEMBAYARAN_INVOIS',
      saluran: 'EMAIL',
      tajuk: previewEmailData.subject,
      kandungan: previewEmailData.bodyText,
      tarikhMasaDihantar: nowStr,
      status: 'BERJAYA'
    };
    onSendCustomNotification(emailLog);

    if (previewChannel === 'WHATSAPP') {
      window.open(waUrl, '_blank');
    } else {
      alert(`[SIMULASI EMEL DUA SALURAN]\nEmel peringatan berjaya dihantar ke: ${selectedPatient.emel}\nSubjek: ${previewEmailData.subject}`);
    }
  };

  const filteredLogs = safeNotifications.filter((l) => {
    if (!l) return false;
    const pName = (l.patientName || '').toLowerCase();
    const phone = l.noTelefon || '';
    const email = (l.emel || '').toLowerCase();
    const content = (l.kandungan || '').toLowerCase();
    const query = (searchLog || '').toLowerCase();

    const matchesSearch = 
      pName.includes(query) ||
      phone.includes(searchLog) ||
      email.includes(query) ||
      content.includes(query);

    const matchesChannel = 
      channelFilter === 'ALL' ||
      (channelFilter === 'WHATSAPP' && (l.saluran === 'WHATSAPP' || !l.saluran)) ||
      (channelFilter === 'EMAIL' && l.saluran === 'EMAIL');

    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-6 text-[#E2E8F0]">
      {/* Walkthrough Guide for New Staff / Nurse */}
      <NurseWalkthroughGuide tabId="whatsapp" isAdminAuthenticated={true} />

      {/* Header */}
      <div className="bg-[#111827] p-6 rounded-xl border border-[#1F2937] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center justify-center">
              <MessageSquareShare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Pusat Notifikasi Dua Saluran (WhatsApp & Emel Automatik)
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Integrasi pengiriman notifikasi automatik dua saluran — WhatsApp sebagai saluran utama dan Emel sebagai saluran sandaran — supaya pesakit menerima maklumat janji temu, rondaan doktor, dan ujian darah dengan berkesan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Status Toggle */}
          <button
            onClick={() => setAutoWhatsAppActive(!autoWhatsAppActive)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
              autoWhatsAppActive 
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' 
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoWhatsAppActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>📲 WhatsApp: {autoWhatsAppActive ? 'AKTIF' : 'JEDA'}</span>
          </button>

          {/* Email Status Toggle */}
          <button
            onClick={() => setAutoEmailActive(!autoEmailActive)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
              autoEmailActive 
                ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300' 
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoEmailActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>✉️ Emel Sandaran: {autoEmailActive ? 'AKTIF' : 'JEDA'}</span>
          </button>
        </div>
      </div>

      {bulkStatusMsg && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center space-x-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{bulkStatusMsg}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex space-x-2 border-b border-[#1F2937] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('AUTO_DISPATCH')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
            activeSubTab === 'AUTO_DISPATCH'
              ? 'bg-[#10B981] text-[#0A0C10] shadow-md shadow-emerald-950'
              : 'text-slate-400 hover:bg-[#111827] hover:text-white'
          }`}
        >
          🚀 Automasi Dua Saluran
        </button>
        <button
          onClick={() => setActiveSubTab('PREVIEW')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
            activeSubTab === 'PREVIEW'
              ? 'bg-[#10B981] text-[#0A0C10] shadow-md shadow-emerald-950'
              : 'text-slate-400 hover:bg-[#111827] hover:text-white'
          }`}
        >
          📱 Simulasi & Pratonton (WhatsApp / Emel)
        </button>
        <button
          onClick={() => setActiveSubTab('LOGS')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
            activeSubTab === 'LOGS'
              ? 'bg-[#10B981] text-[#0A0C10] shadow-md shadow-emerald-950'
              : 'text-slate-400 hover:bg-[#111827] hover:text-white'
          }`}
        >
          📑 Log Mesej & Emel Terhantar ({notifications.length})
        </button>
        <button
          onClick={() => setActiveSubTab('TEMPLATES')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
            activeSubTab === 'TEMPLATES'
              ? 'bg-[#10B981] text-[#0A0C10] shadow-md shadow-emerald-950'
              : 'text-slate-400 hover:bg-[#111827] hover:text-white'
          }`}
        >
          ⚙️ Templat WhatsApp & Emel
        </button>
      </div>

      {/* TAB 1: AUTO DISPATCH */}
      {activeSubTab === 'AUTO_DISPATCH' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Rule 1: Dialysis Session */}
            <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  <Calendar className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  WhatsApp + Emel Sandaran
                </span>
              </div>
              <h2 className="text-sm font-bold text-white">Peringatan Sesi & Masa Datang</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menghantar maklumat masa tepat, nombor stesen, jururawat, dan peringatan hadir 15 minit awal untuk basuh fistula dan timbang berat badan secara automatik menerusi WhatsApp dan Emel.
              </p>
              <div className="text-[11px] text-emerald-400 font-medium font-mono">
                Kekerapan: Setiap hari sesi (MWF / TTS)
              </div>
            </div>

            {/* Rule 2: Doctor Visits */}
            <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                  <Stethoscope className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  WhatsApp + Emel Sandaran
                </span>
              </div>
              <h2 className="text-sm font-bold text-white">Peringatan Lawatan Doktor Pakar</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Memaklumkan pesakit tentang lawatan Dr. Azman (Pakar Nefrologi) dan peringatan membawa rekod ubat terkini melalui dua saluran serentak.
              </p>
              <div className="text-[11px] text-indigo-400 font-medium font-mono">
                Kekerapan: Bulanan & mengikut janji temu khas
              </div>
            </div>

            {/* Rule 3: Blood Test Date */}
            <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/40">
                  <Droplet className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  WhatsApp + Emel Sandaran
                </span>
              </div>
              <h2 className="text-sm font-bold text-white">Peringatan Tarikh Ambil Test Darah</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Peringatan berkala untuk ujian Hb, profil buah pinggang, elektrolit (kalium), dan keperluan puasa dikirim secara salinan dua saluran.
              </p>
              <div className="text-[11px] text-rose-400 font-medium font-mono">
                Kekerapan: Setiap 30 hari mengikut kitaran pesakit
              </div>
            </div>
          </div>

          {/* Bulk Dispatch Action Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-[#111827] to-[#0A0C10] p-6 sm:p-8 rounded-2xl text-white shadow-2xl border border-emerald-800/40 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-900/40 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-700/50">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pencetus Dua Saluran (WhatsApp + Auto-Emel)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
                Jalankan Imbasan & Hantar Peringatan Dua Saluran
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tekan butang di sebelah untuk menjana dan menghantar notifikasi secara serentak ke WhatsApp (utamanya) dan Emel (sandaran) kepada semua pesakit yang mempunyai sesi rawatan, janji temu doktor, atau ujian darah dalam tempoh 48 jam.
              </p>
            </div>

            <button
              onClick={handleBulkDispatch}
              id="btn-trigger-bulk-whatsapp"
              className="px-6 py-4 bg-[#10B981] hover:bg-emerald-400 text-[#0A0C10] font-bold rounded-xl text-sm shadow-xl shadow-emerald-950 transition-all hover:scale-105 flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Hantar Notifikasi Dua Saluran</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE DUAL-CHANNEL PREVIEW */}
      {activeSubTab === 'PREVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Controls */}
          <div className="lg:col-span-5 bg-[#111827] p-6 rounded-xl border border-[#1F2937] shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Tetapan Mesej Dua Saluran</span>
            </h2>

            {/* Saluran Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Saluran Pratonton</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPreviewChannel('WHATSAPP')}
                  className={`p-2.5 rounded-lg text-xs font-bold border flex items-center justify-center space-x-2 transition ${
                    previewChannel === 'WHATSAPP' 
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300' 
                      : 'bg-[#0F172A] border-[#1F2937] text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquareShare className="w-4 h-4 text-emerald-400" />
                  <span>📱 WhatsApp</span>
                </button>
                <button
                  onClick={() => setPreviewChannel('EMAIL')}
                  className={`p-2.5 rounded-lg text-xs font-bold border flex items-center justify-center space-x-2 transition ${
                    previewChannel === 'EMAIL' 
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300' 
                      : 'bg-[#0F172A] border-[#1F2937] text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>✉️ Emel Automatik</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Pesakit</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.noTelefon} | {p.emel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Peringatan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPreviewType('SESI')}
                  className={`p-2.5 rounded-lg text-xs font-bold border text-left transition ${
                    previewType === 'SESI' ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300' : 'bg-[#0F172A] border-[#1F2937] text-slate-400 hover:bg-[#1F2937] hover:text-white'
                  }`}
                >
                  Sesi Rawatan & Masa
                </button>
                <button
                  onClick={() => setPreviewType('DOKTOR')}
                  className={`p-2.5 rounded-lg text-xs font-bold border text-left transition ${
                    previewType === 'DOKTOR' ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300' : 'bg-[#0F172A] border-[#1F2937] text-slate-400 hover:bg-[#1F2937] hover:text-white'
                  }`}
                >
                  Lawatan Doktor Pakar
                </button>
                <button
                  onClick={() => setPreviewType('DARAH')}
                  className={`p-2.5 rounded-lg text-xs font-bold border text-left transition ${
                    previewType === 'DARAH' ? 'bg-rose-950/60 border-rose-500/60 text-rose-300' : 'bg-[#0F172A] border-[#1F2937] text-slate-400 hover:bg-[#1F2937] hover:text-white'
                  }`}
                >
                  Tarikh Ujian Darah
                </button>
                <button
                  onClick={() => setPreviewType('BAYARAN')}
                  className={`p-2.5 rounded-lg text-xs font-bold border text-left transition ${
                    previewType === 'BAYARAN' ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' : 'bg-[#0F172A] border-[#1F2937] text-slate-400 hover:bg-[#1F2937] hover:text-white'
                  }`}
                >
                  Invois / Bayaran
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1F2937]">
              <button
                onClick={handleSendDualPreview}
                id="btn-open-wa-direct"
                className="w-full py-3 bg-[#10B981] hover:bg-emerald-400 text-[#0A0C10] font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-950"
              >
                <Send className="w-4 h-4" />
                <span>Simulasi Hantar Dua Saluran (WA + Emel)</span>
              </button>
            </div>
          </div>

          {/* Simulator Preview Display */}
          <div className="lg:col-span-7 flex justify-center">
            {previewChannel === 'WHATSAPP' ? (
              /* Smartphone Simulator Preview */
              <div className="w-full max-w-md bg-[#0A0C10] rounded-[36px] p-3 shadow-2xl border-4 border-[#1F2937]">
                <div className="w-28 h-4 bg-[#1F2937] rounded-full mx-auto mb-2" />
                <div className="bg-[#0b141a] rounded-[28px] overflow-hidden flex flex-col min-h-[480px]">
                  <div className="bg-[#202c33] text-slate-100 p-3 flex items-center space-x-3 border-b border-slate-700/50">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      KB
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold truncate text-white">Pusat Dialisis KaizenBros</h3>
                      <span className="text-[10px] text-emerald-400 block font-medium">Akaun Perniagaan Rasmi KKM</span>
                    </div>
                  </div>

                  <div className="flex-1 p-4 bg-[#0b141a] bg-opacity-95 overflow-y-auto space-y-3">
                    <div className="text-center">
                      <span className="text-[10px] bg-[#182229] text-slate-400 px-2.5 py-1 rounded-md">
                        Mesej disulitkan (WhatsApp Utama)
                      </span>
                    </div>

                    <div className="ml-auto max-w-[88%] bg-[#005c4b] text-slate-100 p-3.5 rounded-2xl rounded-tr-none shadow-sm text-xs space-y-2 whitespace-pre-wrap font-sans leading-relaxed">
                      {previewWaText}
                      <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-200/80 pt-1">
                        <span>{new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-cyan-300 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-[#202c33] flex items-center space-x-2 text-xs text-slate-400">
                    <div className="flex-1 bg-[#2a3942] py-2 px-3 rounded-full text-slate-300 text-[11px]">
                      Mesej WhatsApp dihantar...
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Email Client Mockup Preview */
              <div className="w-full max-w-lg bg-[#0F172A] rounded-2xl border border-[#334155] shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-[#1E293B] p-3 border-b border-[#334155] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Pratonton Emel Sandaran Automatik</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    SALURAN SANDARAN
                  </span>
                </div>

                <div className="p-4 space-y-3 bg-[#0F172A] text-xs border-b border-[#1E293B]">
                  <div>
                    <span className="text-slate-500 font-medium">Dari: </span>
                    <span className="text-slate-200 font-mono">Pusat Dialisis KaizenBros &lt;notifikasi@kaizenbros.com&gt;</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Kepada: </span>
                    <span className="text-cyan-300 font-mono">{selectedPatient?.nama} &lt;{selectedPatient?.emel}&gt;</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Subjek: </span>
                    <span className="text-emerald-300 font-bold">{previewEmailData.subject}</span>
                  </div>
                </div>

                {/* HTML Body preview container */}
                <div className="p-4 bg-[#020617] overflow-y-auto max-h-[420px]">
                  <div dangerouslySetInnerHTML={{ __html: previewEmailData.bodyHtml }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LOGS */}
      {activeSubTab === 'LOGS' && (
        <div className="bg-[#111827] rounded-xl border border-[#1F2937] shadow-xl space-y-4 p-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Rekod Penghantaran Mesej WhatsApp & Emel Sandaran</h2>
              <p className="text-xs text-slate-400">Jejak status setiap peringatan yang dihantar melalui WhatsApp dan Emel</p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Channel Filter */}
              <div className="flex items-center space-x-1 bg-[#0F172A] border border-[#374151] p-1 rounded-lg text-xs">
                <button
                  onClick={() => setChannelFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${channelFilter === 'ALL' ? 'bg-[#10B981] text-[#0A0C10]' : 'text-slate-400 hover:text-white'}`}
                >
                  Semua ({safeNotifications.length})
                </button>
                <button
                  onClick={() => setChannelFilter('WHATSAPP')}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${channelFilter === 'WHATSAPP' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'}`}
                >
                  📲 WhatsApp
                </button>
                <button
                  onClick={() => setChannelFilter('EMAIL')}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${channelFilter === 'EMAIL' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-white'}`}
                >
                  ✉️ Emel
                </button>
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari dalam log..."
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0F172A] text-slate-300 font-bold border-b border-[#1F2937]">
                <tr>
                  <th className="py-2.5 px-3">Tarikh & Masa</th>
                  <th className="py-2.5 px-3">Saluran</th>
                  <th className="py-2.5 px-3">Pesakit & Hubungan</th>
                  <th className="py-2.5 px-3">Jenis Peringatan</th>
                  <th className="py-2.5 px-3">Tajuk / Kandungan</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1F2937]/50">
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {log.tarikhMasaDihantar}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {log.saluran === 'EMAIL' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 inline-flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-cyan-400" />
                          <span>EMEL</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 inline-flex items-center space-x-1">
                          <MessageSquareShare className="w-3 h-3 text-emerald-400" />
                          <span>WHATSAPP</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-white block">{log.patientName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {log.saluran === 'EMAIL' ? log.emel : log.noTelefon}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#1F2937] text-slate-300">
                        {log.jenis}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-slate-300">
                      <span className="font-semibold text-white block truncate">{log.tajuk}</span>
                      <span className="text-[11px] text-slate-400 truncate block">{log.kandungan}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                        ✓ {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {log.saluran === 'EMAIL' ? (
                        <span className="text-cyan-400 text-[11px] font-medium">Emel Dihantar</span>
                      ) : (
                        <a
                          href={log.pautanWhatsApp || buildWhatsAppLink(log.noTelefon, log.kandungan)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center space-x-1"
                        >
                          <span>Buka Chat</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TEMPLATES */}
      {activeSubTab === 'TEMPLATES' && (
        <div className="bg-[#111827] rounded-xl border border-[#1F2937] shadow-xl p-6 space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-base font-bold text-white">Templat Mesej Piawai Dua Saluran (WhatsApp & Emel)</h2>
            <p className="text-xs text-slate-400">Templat mesej rasmi yang diformat khusus untuk WhatsApp dan salinan berformat Emel</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-xl border border-[#1F2937] bg-[#0F172A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 text-sm">1. Peringatan Sesi & Masa Hadir</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">WA + EMEL</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Mengandungi tag nama pesakit, tarikh, waktu mula & tamat, stesen mesin, jururawat bertugas, serta arahan wajib hadir 15 minit awal untuk mencuci fistula AVF dan menimbang berat badan.
              </p>
              <div className="p-2.5 bg-[#111827] rounded-lg border border-[#1F2937] text-slate-300 font-mono text-[10px]">
                Tag aktif: &#123;nama&#125;, &#123;tarikh&#125;, &#123;masa&#125;, &#123;stesen&#125;, &#123;jururawat&#125;, &#123;jenisAkses&#125;
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#1F2937] bg-[#0F172A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 text-sm">2. Peringatan Tarikh Ambil Test Darah</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">WA + EMEL</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Dihantar 48 jam sebelum sesi dialisis di mana darah bulanan akan diambil. Memaklumkan ujian Hb, profil buah pinggang, elektrolit, dan arahan jika perlu berpuasa.
              </p>
              <div className="p-2.5 bg-[#111827] rounded-lg border border-[#1F2937] text-slate-300 font-mono text-[10px]">
                Tag aktif: &#123;nama&#125;, &#123;tarikhUjian&#125;, &#123;parameter&#125;, &#123;arahanPuasa&#125;
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#1F2937] bg-[#0F172A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-400 text-sm">3. Peringatan Lawatan Pakar Nefrologi</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">WA + EMEL</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Pemberitahuan tarikh lawatan rondaan klinikal Dr. Azman, masa konsultasi, dan peringatan membawa rekod ubat terkini atau surat hospital luar.
              </p>
              <div className="p-2.5 bg-[#111827] rounded-lg border border-[#1F2937] text-slate-300 font-mono text-[10px]">
                Tag aktif: &#123;nama&#125;, &#123;namaDoktor&#125;, &#123;tarikhLawatan&#125;, &#123;tujuan&#125;
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#1F2937] bg-[#0F172A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-sm">4. Penyata Invois & Subsidi Penaja</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">WA + EMEL</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Perincian invois rawatan, amaun subsidi PERKESO / JPA / Zakat yang ditolak, dan baki bayaran pesakit berserta pautan resit rasmi.
              </p>
              <div className="p-2.5 bg-[#111827] rounded-lg border border-[#1F2937] text-slate-300 font-mono text-[10px]">
                Tag aktif: &#123;nama&#125;, &#123;invoisNo&#125;, &#123;jumlahKasar&#125;, &#123;subsidiPenaja&#125;, &#123;bakiPesakit&#125;
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

