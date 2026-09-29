import React, { useState } from 'react';
import { TransactionPayment, Patient, CentreInfo } from '../types';
import { KaizenBrosLogo } from './KaizenBrosLogo';
import { formatCurrencyRM, formatMalayDate, buildWhatsAppLink, createOfficialReceiptWhatsAppMessage } from '../utils/whatsappHelper';
import { convertNumberToMalayWords } from '../utils/numberToWords';
import { Printer, MessageCircle, X, CheckCircle, ShieldCheck, FileText, Download, Image, Mail, Send, FileCode } from 'lucide-react';
import { sendReceiptDocument, generateElementAsPdf, generateElementAsPng } from '../utils/pdfGenerator';

interface OfficialA5ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionPayment | null;
  patient: Patient | null;
  centreInfo: CentreInfo;
}

export const OfficialA5ReceiptModal: React.FC<OfficialA5ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  patient,
  centreInfo
}) => {
  if (!isOpen || !transaction || !patient) return null;

  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [docFeedbackMsg, setDocFeedbackMsg] = useState<string | null>(null);

  const receiptNo = transaction.resitNo || `KB-RCP-2026-${transaction.id.replace(/\D/g, '').padStart(4, '0')}`;
  const amountStr = (transaction.bayaranPesakit > 0 ? transaction.bayaranPesakit : transaction.jumlahKasar).toFixed(2);
  const isPaid = transaction.status === 'PAID' || transaction.status === 'Paid' || transaction.status === 'LUNAS';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsProcessingDoc(true);
    setDocFeedbackMsg('Menjana fail PDF A5...');
    const res = await generateElementAsPdf('printable-a5-receipt', `Resit_A5_KaizenBros_${receiptNo}.pdf`);
    setIsProcessingDoc(false);
    if (res) {
      const link = document.createElement('a');
      link.href = res.dataUrl;
      link.download = `Resit_A5_KaizenBros_${receiptNo}.pdf`;
      link.click();
      setDocFeedbackMsg('✓ Fail PDF A5 berjaya dimuat turun!');
      setTimeout(() => setDocFeedbackMsg(null), 4000);
    } else {
      setDocFeedbackMsg('❌ Gagal menjana PDF.');
      setTimeout(() => setDocFeedbackMsg(null), 4000);
    }
  };

  const handleDownloadPng = async () => {
    setIsProcessingDoc(true);
    setDocFeedbackMsg('Menjana fail imej PNG...');
    const res = await generateElementAsPng('printable-a5-receipt', `Resit_A5_KaizenBros_${receiptNo}.png`);
    setIsProcessingDoc(false);
    if (res) {
      const link = document.createElement('a');
      link.href = res.dataUrl;
      link.download = `Resit_A5_KaizenBros_${receiptNo}.png`;
      link.click();
      setDocFeedbackMsg('✓ Fail PNG berjaya dimuat turun!');
      setTimeout(() => setDocFeedbackMsg(null), 4000);
    } else {
      setDocFeedbackMsg('❌ Gagal menjana PNG.');
      setTimeout(() => setDocFeedbackMsg(null), 4000);
    }
  };

  const handleSendDoc = async (format: 'pdf' | 'png', target: 'whatsapp' | 'email') => {
    setIsProcessingDoc(true);
    setDocFeedbackMsg(`Menjana resit ${format.toUpperCase()} & menghantar ke ${target === 'whatsapp' ? 'WhatsApp' : 'E-mel'}...`);
    
    const res = await sendReceiptDocument({
      elementId: 'printable-a5-receipt',
      format,
      target,
      patientName: patient.nama,
      phoneNumber: patient.noTelefon,
      emailAddress: patient.emel,
      receiptNo,
      amountStr,
      tarikhStr: formatMalayDate(transaction.tarikh),
      perkara: transaction.perkara,
      isPaid,
      penaja: transaction.penaja || patient.penaja
    });

    setIsProcessingDoc(false);
    setDocFeedbackMsg(res.message);
    setTimeout(() => setDocFeedbackMsg(null), 6000);
  };

  // Convert amount to Malay words representation
  const amountToWordsText = convertNumberToMalayWords(transaction.bayaranPesakit > 0 ? transaction.bayaranPesakit : transaction.jumlahKasar);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      {/* Container - constrained to A5 aspect ratio preview */}
      <div className="relative w-full max-w-3xl bg-[#111827] text-slate-100 rounded-2xl border border-[#1F2937] shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none print:text-black print:bg-white">
        
        {/* Modal Header & Actions (Hidden during print) */}
        <div className="px-6 py-4 bg-[#0A0C10] border-b border-[#1F2937] print:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">Resit Rasmi Rawatan Hemodialisis (Saiz A5)</h2>
                <p className="text-xs text-slate-400">Pilih format PDF atau PNG untuk dihantar terus ke WhatsApp atau E-mel pesakit</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1F2937] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar for 1-Click Send & Download */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            {/* Download PDF & PNG */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isProcessingDoc}
                id="btn-download-pdf-a5"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF A5</span>
              </button>

              <button
                onClick={handleDownloadPng}
                disabled={isProcessingDoc}
                id="btn-download-png-a5"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Image className="w-3.5 h-3.5" />
                <span>Imej PNG</span>
              </button>

              <button
                onClick={handlePrint}
                id="btn-print-a5-receipt"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cetak A5</span>
              </button>
            </div>

            {/* 1-Click WhatsApp & Email Buttons with PDF/PNG format selection */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* WhatsApp PDF & PNG Buttons */}
              <div className="inline-flex rounded-lg shadow-xs bg-[#1F2937] p-0.5 border border-[#374151]">
                <span className="px-2 py-1 text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3 text-emerald-400" />
                  <span>WA:</span>
                </span>
                <button
                  onClick={() => handleSendDoc('pdf', 'whatsapp')}
                  disabled={isProcessingDoc}
                  id="btn-wa-pdf-a5"
                  title="Hantar Resit PDF ke WhatsApp"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-md text-[11px] transition cursor-pointer disabled:opacity-50"
                >
                  📄 PDF
                </button>
                <button
                  onClick={() => handleSendDoc('png', 'whatsapp')}
                  disabled={isProcessingDoc}
                  id="btn-wa-png-a5"
                  title="Hantar Resit PNG ke WhatsApp"
                  className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold rounded-md text-[11px] transition cursor-pointer ml-0.5 disabled:opacity-50"
                >
                  🖼️ PNG
                </button>
              </div>

              {/* Email PDF & PNG Buttons */}
              <div className="inline-flex rounded-lg shadow-xs bg-[#1F2937] p-0.5 border border-[#374151]">
                <span className="px-2 py-1 text-[10px] font-bold text-sky-400 flex items-center space-x-1">
                  <Mail className="w-3 h-3 text-sky-400" />
                  <span>Emel:</span>
                </span>
                <button
                  onClick={() => handleSendDoc('pdf', 'email')}
                  disabled={isProcessingDoc}
                  id="btn-email-pdf-a5"
                  title="Hantar Resit PDF ke E-mel"
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-slate-950 font-black rounded-md text-[11px] transition cursor-pointer disabled:opacity-50"
                >
                  📄 PDF
                </button>
                <button
                  onClick={() => handleSendDoc('png', 'email')}
                  disabled={isProcessingDoc}
                  id="btn-email-png-a5"
                  title="Hantar Resit PNG ke E-mel"
                  className="px-2.5 py-1 bg-sky-800 hover:bg-sky-700 text-sky-100 font-bold rounded-md text-[11px] transition cursor-pointer ml-0.5 disabled:opacity-50"
                >
                  🖼️ PNG
                </button>
              </div>
            </div>
          </div>

          {docFeedbackMsg && (
            <div className="p-2 bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs font-semibold rounded-lg animate-fadeIn flex items-center justify-between">
              <span>{docFeedbackMsg}</span>
            </div>
          )}
        </div>

        {/* Printable A5 Document Body */}
        <div 
          id="printable-a5-receipt"
          className="relative p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-2 text-xs leading-relaxed overflow-hidden"
          style={{ minHeight: '620px' }}
        >
          {/* Centered Watermark 'PAID' (low opacity / faint) when status is paid */}
          {isPaid && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="text-7xl sm:text-8xl md:text-9xl font-black font-sans text-emerald-600/15 border-8 border-emerald-600/15 px-8 py-3 rounded-3xl -rotate-12 select-none tracking-widest uppercase opacity-75">
                PAID
              </div>
            </div>
          )}

          {/* Document Content with relative z-10 wrapper */}
          <div className="relative z-10">
            {/* Clinic Header with Clear Vector Logo & Full Clinic Details */}
            <div className="border-b-2 border-slate-900 pb-3.5 mb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3.5">
                  <KaizenBrosLogo size={62} />
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase font-serif">
                      {centreInfo.nama || 'PUSAT DIALISIS KAIZENBROS'}
                    </h1>
                    <p className="text-[10px] text-slate-800 font-semibold mt-0.5 max-w-lg leading-tight">
                      {centreInfo.alamat || '27 & 29G, Jalan 5/10, Seksyen 5 Bandar Rinching, 43500 Semenyih, Selangor'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9.5px] text-slate-700 mt-1 font-medium">
                      <span>📞 Tel Kaunter: <strong className="text-slate-950 font-bold">{centreInfo.telefonUtama || '03-87270791'}</strong></span>
                      <span>•</span>
                      <span>🆘 Kecemasan 24/7: <strong className="text-rose-700 font-bold">{centreInfo.talianKecemasan24Jam || '019-338 9922'}</strong></span>
                      <span>•</span>
                      <span>💬 WA: <strong className="text-emerald-700 font-bold">+{centreInfo.whatsappRasmi || '60193389922'}</strong></span>
                      <span>•</span>
                      <span>✉️ Emel: <strong className="text-slate-900">{centreInfo.emel || 'admin@kaizenbrosdialysis.com.my'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <div className="inline-block bg-slate-900 text-white font-mono text-[9.5px] font-extrabold px-2.5 py-1 rounded shadow-xs">
                    LESEN KKM: {centreInfo.noPendaftaranKKM || 'KKM/HD/2023/8892'}
                  </div>
                  <p className="text-[9px] text-slate-700 font-mono font-bold mt-1">
                    NO. SSM: 202101008891 (1410921-X)
                  </p>
                  <p className="text-[9px] text-emerald-800 font-extrabold mt-0.5">
                    Akta Kemudahan Swasta 1998
                  </p>
                </div>
              </div>
            </div>

            {/* Document Title (Invoice vs Receipt) & Verification Banner */}
            <div className="my-2.5 flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              <div>
                <h2 className="text-sm font-extrabold uppercase text-slate-900 tracking-wide">
                  {isPaid 
                    ? 'RESIT RASMI RAWATAN HEMODIALISIS' 
                    : 'INVOIS RASMI RAWATAN HEMODIALISIS'}
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  {isPaid
                    ? 'OFFICIAL MEDICAL RECEIPT FOR HEMODIALYSIS SERVICES'
                    : 'OFFICIAL MEDICAL INVOICE FOR HEMODIALYSIS SERVICES'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900">
                  {isPaid ? 'No. Resit: ' : 'No. Invois: '}
                  <span className="text-emerald-700">{isPaid ? receiptNo : transaction.invoisNo}</span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono">
                  Tarikh Dikeluarkan: {formatMalayDate(transaction.tarikh)}
                </div>
              </div>
            </div>

            {/* Patient Details & Sponsor Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50/60 p-3 rounded-lg border border-slate-200">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Maklumat Pesakit / Patient Details</div>
                <div className="font-bold text-slate-950 text-sm mt-0.5">{patient.nama}</div>
                <div className="text-[11px] text-slate-700 mt-0.5">
                  No. K/P: <span className="font-mono font-semibold">{patient.noIC}</span>
                </div>
                <div className="text-[11px] text-slate-700">
                  MRN / ID Pesakit: <span className="font-mono font-semibold">{patient.id}</span>
                </div>
                <div className="text-[11px] text-slate-700">
                  Jenis Akses Vaskular: <span className="font-semibold">{patient.jenisAkses} ({patient.lokasiAkses})</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Status Penaja & Invois / Sponsorship</div>
                <div className="text-[11px] text-slate-800 mt-0.5">
                  Penaja Diiktiraf: <span className="font-bold text-slate-950">{patient.penaja}</span>
                </div>
                <div className="text-[11px] text-slate-700">
                  No. Rujukan Penaja (GL): <span className="font-mono">{patient.noRujukanPenaja || 'GL-PERKESO-2026/891'}</span>
                </div>
                <div className="text-[11px] text-slate-700">
                  No. Invois Rawatan: <span className="font-mono font-semibold">{transaction.invoisNo}</span>
                </div>
                <div className="text-[11px] text-slate-700">
                  Kaedah Bayaran: <span className="font-semibold">{transaction.kaedah}</span>
                </div>
              </div>
            </div>

            {/* Itemized Table of Medical Services */}
            <table className="w-full border-collapse mb-4 text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-white text-left font-bold">
                  <th className="py-1.5 px-2.5 rounded-l text-[10px]">BIL</th>
                  <th className="py-1.5 px-2.5 text-[10px]">PERKARA / BUTIRAN RAWATAN PERUBATAN</th>
                  <th className="py-1.5 px-2.5 text-center text-[10px]">UNIT</th>
                  <th className="py-1.5 px-2.5 text-right rounded-r text-[10px]">JUMLAH (RM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-2.5 font-mono text-slate-500">1</td>
                  <td className="py-2 px-2.5">
                    <div className="font-bold text-slate-900">{transaction.perkara}</div>
                    <div className="text-[10px] text-slate-600">
                      Sesi Hemodialisis Bikarbonat 4 Jam, Mesin Fresenius 4008S/5008S CorDiax, Air RO Standard AAMI/ISO
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-center font-mono">1</td>
                  <td className="py-2 px-2.5 text-right font-mono font-semibold">
                    {formatCurrencyRM(transaction.jumlahKasar)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 font-mono text-slate-500">2</td>
                  <td className="py-2 px-2.5">
                    <div className="font-semibold text-slate-900">Bahan Pakai Habis & Dialyzer High-Flux Single-Use</div>
                    <div className="text-[10px] text-slate-600">Blood tubing lines, AV fistula needle sets, dialysate concentrate</div>
                  </td>
                  <td className="py-2 px-2.5 text-center font-mono">1 set</td>
                  <td className="py-2 px-2.5 text-right font-mono text-slate-500">Termasuk</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 font-mono text-slate-500">3</td>
                  <td className="py-2 px-2.5">
                    <div className="font-semibold text-slate-900">Penjagaan Kejururawatan Renal Berkelayakan (LJM)</div>
                    <div className="text-[10px] text-slate-600">Pemantauan tanda vital pra/intra/pasca dialisis & kecemasan</div>
                  </td>
                  <td className="py-2 px-2.5 text-center font-mono">1 sesi</td>
                  <td className="py-2 px-2.5 text-right font-mono text-slate-500">Termasuk</td>
                </tr>
              </tbody>
            </table>

            {/* Financial Calculation Box */}
            <div className="flex justify-between items-start border-t border-b border-slate-300 py-3 mb-3">
              <div className="max-w-xs space-y-1">
                <div className="text-[10px] font-bold text-slate-700 uppercase">Jumlah Dalam Perkataan:</div>
                <div className="text-[11px] font-bold italic text-slate-950 font-serif">
                  {amountToWordsText}
                </div>
                <div className="text-xs font-bold text-slate-950 mt-2 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                  <span>*STATUS TRANSAKSI:</span>
                  <strong className={`px-2 py-0.5 rounded text-xs font-black tracking-wider ${isPaid ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-amber-100 text-amber-900 border border-amber-300"}`}>
                    {isPaid ? 'PAID & DIJELASKAN SEPENUHNYA' : 'UNPAID / MENUNGGU BAYARAN'}
                  </strong>
                </div>
              </div>

              <div className="w-56 space-y-1 text-right text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Jumlah Kasar Rawatan:</span>
                  <span className="font-mono">{formatCurrencyRM(transaction.jumlahKasar)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>Tolak Subsidi Penaja ({patient.penaja}):</span>
                  <span className="font-mono">-{formatCurrencyRM(transaction.subsidiPenaja)}</span>
                </div>
                <div className="flex justify-between text-slate-950 font-black text-sm pt-1 border-t border-slate-300">
                  <span>Baki Perlu Dibayar:</span>
                  <span className="font-mono text-emerald-700">{formatCurrencyRM(transaction.bayaranPesakit)}</span>
                </div>
              </div>
            </div>

            {/* Statutory Tax & Claim Endorsement */}
            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded text-[9px] text-emerald-950 mb-3 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>PENGESAHAN TUNTUTAN & PELEPASAN CUKAI LHDN:</strong> Resit ini adalah perakuan perbelanjaan rawatan perubatan sah bagi penyakit serius (Kegagalan Buah Pinggang Tahap Akhir / ESRD) mengikut peruntukan <strong>Seksyen 46(1)(g) Akta Cukai Pendapatan 1967</strong> dan diiktiraf bagi tuntutan subsidi SOCSO/PERKESO serta JPA/KWAP.
              </div>
            </div>

            {/* Signatures & Official Stamp */}
            <div className="flex items-end justify-between pt-2 border-t border-slate-200">
              <div className="text-[9px] text-slate-400 font-serif italic">
                Resit Rasmi Pusat Dialisis KaizenBros
              </div>

              {/* Official Stamp (Low Opacity for physical stamping visibility) & Sign */}
              <div className="flex items-center space-x-8 text-center">
                <div className="opacity-30">
                  <div className="w-22 h-13 border border-dashed border-emerald-700 rounded flex flex-col items-center justify-center text-[8px] text-emerald-900 font-bold uppercase p-1">
                    <span>PUSAT DIALISIS</span>
                    <span className="text-[9px] text-emerald-950 font-black">KAIZENBROS</span>
                    <span className="text-[7px]">COP RASMI KKM</span>
                  </div>
                  <div className="text-[7.5px] text-slate-500 mt-0.5">Ruang Cap Rasmi Klinik</div>
                </div>

                <div>
                  <div className="w-28 border-b border-slate-800 mb-1 pt-6 text-[10px] font-serif font-bold text-slate-800">
                    Hanim Othman
                  </div>
                  <div className="text-[8px] text-slate-600 font-semibold">Sister-in-Charge / Pentadbir</div>
                  <div className="text-[7px] text-slate-500">b/p Pusat Dialisis KaizenBros</div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-[8px] text-center text-slate-400 mt-4 border-t border-slate-200 pt-1">
              Ini adalah resit cetakan berkomputer rasmi. Sebarang pertanyaan berkenaan tuntutan, hubungi 03-87270791.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
