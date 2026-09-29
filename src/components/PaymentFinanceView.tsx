import React, { useState } from 'react';
import { NurseWalkthroughGuide } from './NurseWalkthroughGuide';
import { 
  TransactionPayment, 
  Patient, 
  PaymentMethod, 
  PaymentStatus,
  CentreInfo
} from '../types';
import { 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Plus, 
  Printer, 
  Send, 
  Download, 
  Filter, 
  TrendingUp, 
  Building2, 
  DollarSign,
  Receipt,
  Mail
} from 'lucide-react';
import { 
  formatCurrencyRM, 
  formatMalayDate, 
  createPaymentReminderMessage, 
  buildWhatsAppLink 
} from '../utils/whatsappHelper';
import { convertNumberToMalayWords } from '../utils/numberToWords';
import { OfficialA5ReceiptModal } from './OfficialA5ReceiptModal';
import { INITIAL_CENTRE_INFO } from '../data/initialData';

interface PaymentFinanceViewProps {
  transactions: TransactionPayment[];
  patients: Patient[];
  centreInfo?: CentreInfo;
  onAddTransaction: (tx: TransactionPayment) => void;
  onUpdateTransaction?: (tx: TransactionPayment) => void;
  onDeleteTransaction?: (txId: string) => void;
  onSendPaymentNotification: (tx: TransactionPayment, patient: Patient) => void;
}

export const PaymentFinanceView: React.FC<PaymentFinanceViewProps> = ({
  transactions = [],
  patients = [],
  centreInfo,
  onAddTransaction,
  onSendPaymentNotification
}) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safePatients = Array.isArray(patients) ? patients : [];

  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionPayment | null>(null);
  const [showQRModal, setShowQRModal] = useState<TransactionPayment | null>(null);
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: safePatients[0]?.id || '',
    tarikh: new Date().toISOString().split('T')[0],
    perkara: 'Rawatan Hemodialisis Bulanan (13 Sesi) + EPO',
    jumlahKasar: 2600.00,
    subsidiPenaja: 2470.00,
    bayaranPesakit: 130.00,
    kaedah: 'SOCSO' as PaymentMethod,
    status: 'PAID' as PaymentStatus,
    nota: 'Tuntutan disahkan'
  });

  // Calculate stats
  const totalGross = safeTransactions.reduce((sum, t) => sum + t.jumlahKasar, 0);
  const totalSponsorSubsidy = safeTransactions.reduce((sum, t) => sum + t.subsidiPenaja, 0);
  const totalPatientPaid = safeTransactions
    .filter((t) => t.status === 'PAID' || t.status === 'Paid' || t.status === 'LUNAS')
    .reduce((sum, t) => sum + t.bayaranPesakit, 0);
  const pendingAmount = safeTransactions
    .filter((t) => t.status === 'UNPAID' || t.status === 'Unpaid' || t.status === 'MENUNGGU' || t.status === 'TERTUNGGAK')
    .reduce((sum, t) => sum + t.bayaranPesakit, 0);

  const handlePatientSelectInForm = (pId: string) => {
    const patient = safePatients.find((p) => p.id === pId);
    let defaultSubsidi = 0;
    let defaultPatient = 2600;

    if (patient) {
      if (patient.penaja === 'SOCSO') {
        defaultSubsidi = 2470;
        defaultPatient = 130;
      } else if (patient.penaja === 'JPA_KWAP' || patient.penaja.startsWith('ZAKAT')) {
        defaultSubsidi = 2600;
        defaultPatient = 0;
      } else if (patient.penaja === 'SENDIRI') {
        defaultSubsidi = 0;
        defaultPatient = 2600;
      }
    }

    setFormData({
      ...formData,
      patientId: pId,
      subsidiPenaja: defaultSubsidi,
      bayaranPesakit: defaultPatient,
      kaedah: (patient?.penaja as any) || 'FPX'
    });
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = safePatients.find((p) => p.id === formData.patientId);
    if (!patient) return;

    const invoisNo = `INV-2026-${(safeTransactions.length + 1).toString().padStart(4, '0')}`;
    const isPaidStatus = formData.status === 'PAID' || formData.status === 'Paid' || formData.status === 'LUNAS';
    const resitNo = isPaidStatus ? `REC-2026-${(safeTransactions.length + 1).toString().padStart(4, '0')}` : undefined;

    const newTx: TransactionPayment = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      invoisNo,
      patientId: patient.id,
      patientName: patient.nama,
      tarikh: formData.tarikh,
      perkara: formData.perkara,
      jumlahKasar: Number(formData.jumlahKasar),
      subsidiPenaja: Number(formData.subsidiPenaja),
      bayaranPesakit: Number(formData.bayaranPesakit),
      kaedah: formData.kaedah,
      status: formData.status,
      resitNo,
      rujukanTransaksi: `PAY-ONLINE-${Date.now().toString().slice(-6)}`,
      nota: formData.nota
    };

    onAddTransaction(newTx);
    setShowNewInvoiceModal(false);
    setStatusMessage(`Invois ${invoisNo} berjaya direkodkan bagi ${patient.nama}.`);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleSendWhatsAppReceipt = (tx: TransactionPayment) => {
    const patient = safePatients.find((p) => p.id === tx.patientId);
    if (!patient) return;

    onSendPaymentNotification(tx, patient);
    const msg = createPaymentReminderMessage(patient, tx);
    const waUrl = buildWhatsAppLink(patient.noTelefon, msg);

    window.open(waUrl, '_blank');
    setStatusMessage(`Penyata bayaran & invois dihantar ke WhatsApp ${patient.nama}.`);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleSendEmailReceipt = (tx: TransactionPayment) => {
    const patient = safePatients.find((p) => p.id === tx.patientId);
    if (!patient) return;

    const email = patient.emel || '';
    const subject = encodeURIComponent(`Invois & Resit Rawatan Dialisis #${tx.invoisNo} - Pusat Dialisis KaizenBros`);
    const body = encodeURIComponent(
      `Salam Sejahtera ${patient.nama},\n\n` +
      `Berikut adalah perincian Invois & Resit Rasmi Rawatan Dialisis anda:\n\n` +
      `--------------------------------------------------\n` +
      `No. Invois/Resit : ${tx.invoisNo} / ${tx.resitNo || 'DALAM PROSES'}\n` +
      `Pesakit          : ${patient.nama} (${patient.id})\n` +
      `Tarikh Rawatan   : ${formatMalayDate(tx.tarikh)}\n` +
      `Perkara Rawatan  : ${tx.perkara}\n` +
      `Jumlah Kasar     : RM ${tx.jumlahKasar.toFixed(2)}\n` +
      `Subsidi Penaja   : -RM ${tx.subsidiPenaja.toFixed(2)} (${patient.penaja})\n` +
      `Baki Pesakit     : RM ${tx.bayaranPesakit.toFixed(2)}\n` +
      `Status Bayaran   : ${tx.status}\n` +
      `--------------------------------------------------\n\n` +
      `Resit ini sah bagi urusan pelepasan cukai pendapatan LHDN & tuntutan penaja (PERKESO/JPA/Zakat).\n\n` +
      `Terima kasih,\nPusat Dialisis KaizenBros`
    );

    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    setStatusMessage(`Penyata bayaran & invois dihantar ke E-mel ${patient.nama}.`);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const filteredTransactions = filterMethod === 'ALL'
    ? safeTransactions
    : safeTransactions.filter((t) => t.kaedah === filterMethod);

  return (
    <div className="space-y-6 text-[#E2E8F0]">
      {/* Walkthrough Guide for New Staff / Nurse */}
      <NurseWalkthroughGuide tabId="kewangan" isAdminAuthenticated={true} />

      {/* Header */}
      <div className="bg-[#111827] p-6 rounded-xl border border-[#1F2937] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>Sistem Integrasi Pembayaran & Rekod Kewangan</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pengurusan invois rawatan, tuntutan subsidi penaja (PERKESO/JPA/Zakat), pembayaran DuitNow QR/FPX, dan resit digital automatik.
          </p>
        </div>

        <button
          onClick={() => setShowNewInvoiceModal(true)}
          id="btn-create-invoice"
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#10B981] hover:bg-emerald-400 text-[#0A0C10] font-bold rounded-lg text-sm shadow-md shadow-emerald-950 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Jana Invois / Transaksi Baru</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center space-x-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Jumlah Nilai Rawatan (Kasar)</span>
          <span className="text-2xl font-bold text-white font-mono">
            {formatCurrencyRM(totalGross)}
          </span>
          <span className="text-[11px] text-slate-500 block">13 sesi dialisis per pesakit/bulan</span>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl border border-emerald-800/50 bg-emerald-950/20 shadow-xl space-y-2">
          <span className="text-xs font-semibold text-emerald-400 block">Subsidi Ditanggung Penaja</span>
          <span className="text-2xl font-bold text-emerald-300 font-mono">
            {formatCurrencyRM(totalSponsorSubsidy)}
          </span>
          <span className="text-[11px] text-emerald-500/80 block">PERKESO, JPA & Zakat</span>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Kutipan Tunai / FPX / QR</span>
          <span className="text-2xl font-bold text-cyan-400 font-mono">
            {formatCurrencyRM(totalPatientPaid)}
          </span>
          <span className="text-[11px] text-slate-500 block">Bayaran co-payment pesakit</span>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937] shadow-xl space-y-2">
          <span className="text-xs font-semibold text-amber-400 block">Baki Menunggu Bayaran</span>
          <span className="text-2xl font-bold text-amber-300 font-mono">
            {formatCurrencyRM(pendingAmount)}
          </span>
          <span className="text-[11px] text-amber-500/80 block">Menunggu pengesahan FPX / Waris</span>
        </div>
      </div>

      {/* Filter and Transactions List */}
      <div className="bg-[#111827] rounded-xl border border-[#1F2937] shadow-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Senarai Transaksi & Invois Pusat Dialisis</h2>
            <p className="text-xs text-slate-400">Semak status pembayaran atau cetak resit rasmi pesakit</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Kaedah:</span>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="text-xs px-3 py-1.5 border border-[#374151] rounded-lg bg-[#0F172A] text-slate-200 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">Semua Kaedah Bayaran</option>
              <option value="SOCSO">PERKESO / SOCSO</option>
              <option value="JPA_KWAP">JPA / KWAP</option>
              <option value="ZAKAT">Zakat Selangor / MAIWP</option>
              <option value="DUITNOW_QR">DuitNow QR</option>
              <option value="FPX">FPX Online</option>
              <option value="TUNAI">Tunai</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0F172A] text-slate-300 font-bold border-b border-[#1F2937]">
              <tr>
                <th className="py-3 px-3">No. Invois / Tarikh</th>
                <th className="py-3 px-3">Pesakit</th>
                <th className="py-3 px-3">Perkara Rawatan</th>
                <th className="py-3 px-3 text-right">Kasar</th>
                <th className="py-3 px-3 text-right">Subsidi Penaja</th>
                <th className="py-3 px-3 text-right">Baki Pesakit</th>
                <th className="py-3 px-3">Kaedah & Status</th>
                <th className="py-3 px-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#1F2937]/50">
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-mono font-bold text-white block">{tx.invoisNo}</span>
                    <span className="text-[11px] text-slate-400">{formatMalayDate(tx.tarikh)}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-semibold text-white block">{tx.patientName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{tx.patientId}</span>
                  </td>
                  <td className="py-3 px-3 max-w-xs truncate text-slate-300">
                    {tx.perkara}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-200">
                    {formatCurrencyRM(tx.jumlahKasar)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    -{formatCurrencyRM(tx.subsidiPenaja)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    {formatCurrencyRM(tx.bayaranPesakit)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#1F2937] text-slate-300">
                        {tx.kaedah}
                      </span>
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'PAID' || tx.status === 'Paid' || tx.status === 'LUNAS' 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' 
                            : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                        }`}>
                          {tx.status === 'PAID' || tx.status === 'Paid' || tx.status === 'LUNAS' ? 'Paid' : tx.status === 'UNPAID' ? 'Unpaid' : tx.status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      {tx.bayaranPesakit > 0 && tx.status !== 'PAID' && tx.status !== 'Paid' && tx.status !== 'LUNAS' && (
                        <button
                          onClick={() => setShowQRModal(tx)}
                          title="Bayar DuitNow QR"
                          className="px-2 py-1 bg-pink-950/60 text-pink-400 border border-pink-800/40 rounded-md font-bold flex items-center space-x-1 hover:bg-pink-900/60 transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedReceipt(tx)}
                        id={`btn-open-a5-receipt-${tx.id}`}
                        title="Lihat & Hantar Resit Rasmi A5 (PDF / PNG)"
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1 transition shadow-xs cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Resit A5 (PDF/PNG)</span>
                      </button>

                      {/* WhatsApp 1-Click Send with Format Selection */}
                      <div className="inline-flex rounded-lg bg-[#1F2937] p-0.5 border border-[#374151]">
                        <button
                          onClick={() => {
                            setSelectedReceipt(tx);
                          }}
                          title="Hantar Invois/Resit ke WhatsApp"
                          className="px-2 py-0.5 text-emerald-400 font-bold text-xs flex items-center space-x-1 hover:text-emerald-300 transition cursor-pointer"
                        >
                          <Send className="w-3 h-3 text-emerald-400" />
                          <span>WA</span>
                        </button>
                      </div>

                      {/* Email 1-Click Send */}
                      <div className="inline-flex rounded-lg bg-[#1F2937] p-0.5 border border-[#374151]">
                        <button
                          onClick={() => {
                            setSelectedReceipt(tx);
                          }}
                          title="Hantar Invois/Resit ke E-mel Pesakit"
                          className="px-2 py-0.5 text-sky-400 font-bold text-xs flex items-center space-x-1 hover:text-sky-300 transition cursor-pointer"
                        >
                          <Mail className="w-3 h-3 text-sky-400" />
                          <span>E-mel</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DuitNow QR Payment Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-[#1F2937] animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Integrasi Pembayaran DuitNow QR
              </span>
              <button
                onClick={() => setShowQRModal(null)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-gradient-to-r from-pink-900 via-rose-900 to-pink-950 border border-pink-700/40 text-white p-3 rounded-xl shadow-inner">
              <h3 className="text-base font-bold text-white">Pusat Dialisis KaizenBros</h3>
              <p className="text-xs text-pink-200 font-mono">DuitNow ID: 202101008891 (Pusat Rawatan)</p>
            </div>

            {/* Generated QR Code Graphic */}
            <div className="p-4 bg-[#0F172A] rounded-xl border border-[#1F2937] flex flex-col items-center justify-center space-y-2">
              <div className="w-48 h-48 bg-white p-2 rounded-lg border-2 border-pink-600 flex items-center justify-center shadow-lg">
                {/* SVG Mock QR Code */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
                  <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 0h10v20H40zM50 20h10v20H50zM40 50h20v10H40zM70 40h10v10H70zM90 40h10v20H90zM70 70h20v10H70zM60 80h10v20H60zM80 90h20v10H80z" />
                  <rect x="42" y="42" width="16" height="16" fill="#be185d" rx="2" />
                </svg>
              </div>
              <span className="text-xs text-slate-400">Imbas menggunakan sebarang aplikasi perbankan atau e-dompet Malaysia</span>
            </div>

            <div className="text-sm font-semibold text-slate-300">
              Jumlah Bayaran: <span className="text-lg font-bold text-pink-400 font-mono">{formatCurrencyRM(showQRModal.bayaranPesakit)}</span>
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                onClick={() => {
                  showQRModal.status = 'PAID';
                  setShowQRModal(null);
                  setStatusMessage(`Pembayaran ${showQRModal.invoisNo} berjaya disahkan melalui DuitNow QR!`);
                  setTimeout(() => setStatusMessage(null), 5000);
                }}
                className="w-full py-2.5 bg-[#10B981] hover:bg-emerald-400 text-[#0A0C10] rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-950 cursor-pointer"
              >
                Sahkan Bayaran Diterima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official A5 Receipt Modal (for Claims, Tax, Print & WhatsApp PDF/Text) */}
      <OfficialA5ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        transaction={selectedReceipt}
        patient={patients.find((p) => p.id === selectedReceipt?.patientId) || null}
        centreInfo={centreInfo || INITIAL_CENTRE_INFO}
      />

      {/* New Invoice Modal */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateInvoice}
            className="bg-[#111827] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#1F2937] animate-fadeIn max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <h2 className="text-lg font-bold text-white">Jana Invois Rawatan Baru</h2>
              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(false)}
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
                  onChange={(e) => handlePatientSelectInForm(e.target.value)}
                  className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.penaja})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Perkara / Keterangan Rawatan</label>
                <input
                  type="text"
                  value={formData.perkara}
                  onChange={(e) => setFormData({ ...formData, perkara: e.target.value })}
                  className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jumlah Kasar (RM)</label>
                  <input
                    type="number"
                    value={formData.jumlahKasar}
                    onChange={(e) => setFormData({ ...formData, jumlahKasar: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subsidi Penaja (RM)</label>
                  <input
                    type="number"
                    value={formData.subsidiPenaja}
                    onChange={(e) => setFormData({ ...formData, subsidiPenaja: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Baki Pesakit (RM)</label>
                  <input
                    type="number"
                    value={formData.bayaranPesakit}
                    onChange={(e) => setFormData({ ...formData, bayaranPesakit: Number(e.target.value) })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Auto Malay Words Display Box */}
              <div className="p-3 bg-[#0F172A] border border-emerald-800/50 rounded-xl space-y-1">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Penulisan Dalam Perkataan (Auto-Generate):
                </div>
                <div className="text-xs font-bold text-white italic font-serif leading-relaxed">
                  {convertNumberToMalayWords(formData.bayaranPesakit > 0 ? formData.bayaranPesakit : formData.jumlahKasar)}
                </div>
                <div className="text-[10px] text-slate-400">
                  (Mengikut {formData.bayaranPesakit > 0 ? 'Baki Bayaran Pesakit RM ' + formData.bayaranPesakit : 'Jumlah Kasar RM ' + formData.jumlahKasar})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kaedah Bayaran</label>
                  <select
                    value={formData.kaedah}
                    onChange={(e) => setFormData({ ...formData, kaedah: e.target.value as any })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="SOCSO">PERKESO / SOCSO</option>
                    <option value="JPA_KWAP">JPA / KWAP</option>
                    <option value="ZAKAT">Zakat Selangor / MAIWP</option>
                    <option value="DUITNOW_QR">DuitNow QR KaizenBros</option>
                    <option value="FPX">FPX Online Banking</option>
                    <option value="TUNAI">Tunai di Kaunter</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="PAID">Paid (Selesai)</option>
                    <option value="UNPAID">Unpaid (Belum Bayar)</option>
                    <option value="MENUNGGU">Pending Tuntutan Penaja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nota</label>
                <input
                  type="text"
                  value={formData.nota}
                  onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                  placeholder="No. rujukan kelulusan penaja atau pesanan..."
                  className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#1F2937]">
              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(false)}
                className="px-4 py-2 border border-[#374151] text-slate-300 hover:bg-[#1F2937] rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#10B981] hover:bg-emerald-400 text-[#0A0C10] rounded-lg text-xs font-bold transition shadow-md shadow-emerald-950 cursor-pointer"
              >
                Keluarkan Invois
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
