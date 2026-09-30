'use client';

import React, { useState } from 'react';
import { 
  Send, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Sparkles,
  MessageSquareQuote,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { Patient, ShiftSlot } from '@/types';
import { VERIFIED_CENTRE_INFO } from '@/lib/mock-data';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  defaultShift?: ShiftSlot;
  defaultTime?: string;
  defaultDate?: string;
  onLogAudit?: (action: string, details: string) => void;
  onNavigateToSettings?: () => void;
}

export function WhatsAppReminderModal({
  isOpen,
  onClose,
  patient,
  defaultShift = 'PAGI',
  defaultTime,
  defaultDate,
  onLogAudit,
  onNavigateToSettings
}: WhatsAppReminderModalProps) {
  const [sessionDate, setSessionDate] = useState<string>(() => {
    return defaultDate || new Date().toISOString().slice(0, 10);
  });
  const [selectedShift, setSelectedShift] = useState<ShiftSlot>(() => {
    return patient?.preferred_shift || defaultShift;
  });
  const [sessionTime, setSessionTime] = useState<string>(() => {
    if (defaultTime) return defaultTime;
    const shift = patient?.preferred_shift || defaultShift;
    return shift === 'PAGI' ? '5:30 AM - 3:00 PM' : '12:00 PM - 8:00 PM';
  });
  const [customNote, setCustomNote] = useState<string>('Sila hadir 15 minit awal untuk penimbangan berat badan.');
  const [fonnteToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kaizenbros_fonnte_token') || '';
    }
    return '';
  });
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !patient) return null;

  const formattedDate = new Date(sessionDate).toLocaleDateString('ms-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const shiftLabel = selectedShift === 'PAGI' ? 'Syif 1 (Pagi: 5:30 AM - 3:00 PM)' : 'Syif 2 (Petang: 12:00 PM - 8:00 PM)';

  // Malaysian Dialysis Centre Notification Template
  const messageText = `🏥 *PERINGATAN SESI HEMODIALISIS*
*${VERIFIED_CENTRE_INFO.name.toUpperCase()}*
------------------------------------------------
Salam sejahtera *${patient.name}* (${patient.patient_id_code}),

Ini adalah peringatan rasmi bagi jadual rawatan hemodialisis anda:

📅 *Tarikh:* ${formattedDate}
⏰ *Waktu / Syif:* ${shiftLabel}
⏱️ *Masa Rawatan:* ${sessionTime}
💺 *Stesen Kerusi:* Fleksibel (First Come, First Served / FCFS)
📍 *Lokasi:* ${VERIFIED_CENTRE_INFO.address}

📌 *Arahan & Peringatan Pesakit:*
• ${customNote}
• Ambil ubat harian anda mengikut panduan pakar nefrologi.
• Sekiranya terdapat kecemasan atau kelewatan, sila hubungi kami segera di *${VERIFIED_CENTRE_INFO.hotline_24h}*.

Terima kasih atas kerjasama anda.
_Klinik Hemodialisis KaizenBros Semenyih (KKM/BPP/2023/HD-8491)_`;

  // Direct WhatsApp Link (wa.me)
  let cleanPhone = patient.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '6' + cleanPhone;
  } else if (!cleanPhone.startsWith('60') && cleanPhone.length >= 9) {
    cleanPhone = '60' + cleanPhone;
  }
  const waDirectUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  const handleSendViaFonnte = async () => {
    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: cleanPhone,
          message: messageText,
          token: fonnteToken.trim() || undefined
        })
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setSendResult({
          success: true,
          message: `✓ Peringatan WhatsApp berjaya dihantar ke nombor ${patient.phone} melalui Fonnte API!`
        });
        if (onLogAudit) {
          onLogAudit(
            'HANTAR_WHATSAPP_FONNTE',
            `Peringatan sesi dialisis dihantar ke ${patient.name} (${patient.phone}) untuk tarikh ${sessionDate} (${selectedShift}) melalui Fonnte.`
          );
        }
      } else {
        setSendResult({
          success: false,
          message: resData.error || 'Gagal menghantar melalui Fonnte API. Sila semak token atau gunakan pautan WhatsApp Web terus.'
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || 'Ralat sambungan ke pelayan.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-950 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-800 uppercase tracking-wider">
                  WhatsApp Gateway (Fonnte API)
                </span>
                <span className="text-xs text-slate-400 font-mono">{patient.patient_id_code}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Hantar Peringatan Sesi Dialisis
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Summary Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Penerima Pesakit</span>
            <strong className="text-white text-sm block font-bold">{patient.name}</strong>
            <p className="text-slate-400 font-mono">{patient.ic_number}</p>
          </div>

          <div className="bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center space-x-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-500 block">No. Telefon WhatsApp</span>
              <strong className="text-emerald-300 font-mono text-xs">{patient.phone}</strong>
            </div>
          </div>

          <div className="bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Corak Jadual Tetap</span>
            <strong className="text-cyan-400 text-xs">{patient.schedule_pattern.replace(/_/g, ' ')}</strong>
          </div>
        </div>

        {/* Session Time & Shift Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-300 font-bold block mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tarikh Rawatan:</span>
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1.5 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Syif Klinikal Rawatan:</span>
            </label>
            <select
              value={selectedShift}
              onChange={(e) => {
                const shift = e.target.value as ShiftSlot;
                setSelectedShift(shift);
                setSessionTime(shift === 'PAGI' ? '5:30 AM - 3:00 PM' : '12:00 PM - 8:00 PM');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="PAGI">Syif 1: Pagi (5:30 AM - 3:00 PM)</option>
              <option value="PETANG">Syif 2: Petang (12:00 PM - 8:00 PM)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1.5 text-xs">
            Nota Tambahan / Arahan Khas Kepada Pesakit:
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Contoh: Sila bawa ubat EPO, hadir 15 minit awal..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Message Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <MessageSquareQuote className="w-4 h-4 text-emerald-400" />
              <span>Pratonton Mesej WhatsApp (Fonnte):</span>
            </span>
            <button
              onClick={handleCopyMessage}
              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 px-2.5 py-1 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Disalin' : 'Salin Mesej'}</span>
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border-l-4 border-l-emerald-500">
            {messageText}
          </div>
        </div>

        {/* Fonnte API Token Status */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${fonnteToken ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
            <div>
              <span className="font-bold text-white block">Penyedia: Fonnte WhatsApp API Gateway</span>
              <span className="text-[11px] text-slate-400">
                {fonnteToken 
                  ? `Token aktif (${fonnteToken.slice(0, 6)}...${fonnteToken.slice(-4)})`
                  : 'Token Fonnte belum dimasukkan (Boleh guna pautan web terus / tetapkan di admin)'}
              </span>
            </div>
          </div>

          {onNavigateToSettings && !fonnteToken && (
            <button
              onClick={() => {
                onClose();
                onNavigateToSettings();
              }}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>Tetapan Admin</span>
            </button>
          )}
        </div>

        {/* Status result alert */}
        {sendResult && (
          <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-start space-x-2.5 ${
            sendResult.success 
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' 
              : 'bg-rose-950/80 border-rose-700 text-rose-300'
          }`}>
            {sendResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div className="flex-1 leading-relaxed">
              {sendResult.message}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>

          {/* Direct WhatsApp Web / App link */}
          <a
            href={waDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (onLogAudit) {
                onLogAudit(
                  'BUKA_WHATSAPP_LANGSUNG',
                  `Pautan WhatsApp dibuka untuk pesakit ${patient.name} (${patient.phone}) bagi tarikh ${sessionDate}.`
                );
              }
            }}
            className="px-5 py-3 bg-slate-800 hover:bg-emerald-950 text-emerald-400 hover:text-emerald-300 border border-emerald-800/80 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka di WhatsApp Web / App</span>
          </a>

          {/* Fonnte API Direct Dispatch */}
          <button
            type="button"
            disabled={isSending}
            onClick={handleSendViaFonnte}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Sedang Menghantar...' : 'Hantar WhatsApp (Fonnte API)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
