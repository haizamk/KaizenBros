'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Stethoscope, 
  UserCheck, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { DialysisSession, SessionStatus } from '@/types';

interface QuickStatusModalProps {
  isOpen: boolean;
  session: DialysisSession | null;
  onClose: () => void;
  onSaveStatus: (sessionId: number, newStatus: SessionStatus, reason?: string) => void;
}

export const STATUS_OPTIONS: {
  status: SessionStatus;
  label: string;
  sublabel: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  icon: React.ReactNode;
}[] = [
  {
    status: 'BELUM_HADIR',
    label: 'BELUM HADIR (Menunggu Ketibaan)',
    sublabel: 'Pesakit belum mendaftar masuk di kaunter atau tiba di pusat dialisis.',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-600/70',
    icon: <Clock className="w-5 h-5 text-amber-400" />
  },
  {
    status: 'SUDAH_HADIR',
    label: 'SUDAH HADIR (Di Ruang Menunggu)',
    sublabel: 'Pesakit telah mendaftar masuk & sedang menunggu panggilan ke stesen kerusi.',
    badgeBg: 'bg-blue-950/80',
    badgeText: 'text-blue-300',
    borderColor: 'border-blue-600/70',
    icon: <UserCheck className="w-5 h-5 text-blue-400" />
  },
  {
    status: 'SEDANG_DIALISIS',
    label: 'SEDANG DIALISIS (Mesin Berjalan)',
    sublabel: 'Proses dialisis sedang aktif berjalan di stesen. Memulakan Live Countdown 4 Jam!',
    badgeBg: 'bg-emerald-950/90',
    badgeText: 'text-emerald-300',
    borderColor: 'border-emerald-500',
    icon: <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
  },
  {
    status: 'SUDAH_SELESAI',
    label: 'SUDAH SELESAI (Discaj)',
    sublabel: 'Rawatan 4 jam telah tamat dengan selamat, jarum dicabut & pesakit di-discaj.',
    badgeBg: 'bg-teal-950/80',
    badgeText: 'text-teal-300',
    borderColor: 'border-teal-600/70',
    icon: <CheckCircle2 className="w-5 h-5 text-teal-400" />
  },
  {
    status: 'GAGAL_HABIS_DIALISIS',
    label: 'GAGAL HABIS DIALISIS (Tamat Awal / Masalah)',
    sublabel: 'Sesi terpaksa dihentikan awal disebabkan komplikasi klinikal / masalah mesin / talian darah.',
    badgeBg: 'bg-rose-950/90',
    badgeText: 'text-rose-300',
    borderColor: 'border-rose-600',
    icon: <AlertTriangle className="w-5 h-5 text-rose-400" />
  },
  {
    status: 'TAMAT_AWAL',
    label: 'TAMAT AWAL (Atas Permintaan Pesakit)',
    sublabel: 'Pesakit memohon untuk menghentikan rawatan lebih awal atas sebab peribadi / kurang selesa.',
    badgeBg: 'bg-orange-950/80',
    badgeText: 'text-orange-300',
    borderColor: 'border-orange-600/70',
    icon: <AlertCircle className="w-5 h-5 text-orange-400" />
  }
];

export function QuickStatusModal({
  isOpen,
  session,
  onClose,
  onSaveStatus
}: QuickStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<SessionStatus>('BELUM_HADIR');
  const [customReason, setCustomReason] = useState<string>('');
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>('');

  useEffect(() => {
    if (session) {
      setSelectedStatus(session.status);
      setCustomReason(session.status_reason || '');
      setSelectedPresetReason('');
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const PRESET_REASONS = [
    'Masalah Pembuluh Darah / Akses Tersekat',
    'Tekanan Darah Drop Teruk (Hypotension)',
    'Kejang Kaki Teruk (Severe Muscle Cramps)',
    'Pesakit Berasa Pening / Mual / Lemah',
    'Litar Tiub / Mesin Bermasalah',
    'Permohonan Pesakit Sendiri (Emergency Balik)'
  ];

  const handleSave = () => {
    const finalReason = selectedPresetReason || customReason;
    onSaveStatus(session.id, selectedStatus, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl max-w-xl w-full p-6 text-white space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-950 border-2 border-cyan-500 flex items-center justify-center text-cyan-300">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-cyan-400 tracking-wider">
                Kemasukan Status Sesi Pantas (Jururawat)
              </span>
              <h3 className="text-xl font-black text-white">
                {session.patient_name.toUpperCase()}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {/* Quick Context Strip */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center text-xs">
          <div>
            <span className="text-slate-400 block font-semibold">ID Pesakit</span>
            <strong className="text-cyan-300 font-mono font-bold">{session.patient_id_code}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Stesen Kerusi</span>
            <strong className="text-white font-black text-sm">{session.chair_number}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Masa Temujanji</span>
            <strong className="text-amber-300 font-bold">{session.scheduled_time}</strong>
          </div>
        </div>

        {/* Radio Options List (Matching Screenshot 2) */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase text-slate-300 tracking-wider block">
            Pilih Status Sesi Rawatan Terkini:
          </label>

          <div className="space-y-2">
            {STATUS_OPTIONS.map((option) => {
              const isSelected = selectedStatus === option.status;
              return (
                <div
                  key={option.status}
                  onClick={() => setSelectedStatus(option.status)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start space-x-3 ${
                    isSelected 
                      ? `${option.borderColor} bg-slate-950/90 shadow-md ring-1 ring-cyan-400/30` 
                      : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-cyan-400 bg-cyan-950' : 'border-slate-600 bg-slate-900'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${option.badgeBg} ${option.badgeText} ${option.borderColor}`}>
                          Aktif Dipilih
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {option.sublabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reason Selector when GAGAL_HABIS_DIALISIS or TAMAT_AWAL */}
        {(selectedStatus === 'GAGAL_HABIS_DIALISIS' || selectedStatus === 'TAMAT_AWAL') && (
          <div className="bg-rose-950/40 border-2 border-rose-500/70 rounded-2xl p-4 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Sebab / Sifat Kegagalan Dialisis:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {PRESET_REASONS.map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedPresetReason(reason);
                    setCustomReason(reason);
                  }}
                  className={`p-2 rounded-xl text-left font-bold transition-all border cursor-pointer ${
                    selectedPresetReason === reason 
                      ? 'bg-rose-900 text-white border-rose-400 shadow' 
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="pt-1">
              <label className="text-[11px] text-slate-300 font-bold block mb-1">Catatan Tambahan Jururawat:</label>
              <input
                type="text"
                placeholder="Contoh: Mesin clot pada jam ke-2.5, darah dipulangkan..."
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setSelectedPresetReason('');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-rose-400 outline-none"
              />
            </div>
          </div>
        )}

        {/* Auto-Timer Guidance */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
          <p className="font-bold text-cyan-300">💡 Logik Auto-Status Sistem:</p>
          <p>• Menukar ke <strong>SEDANG DIALISIS</strong> memulakan Live Countdown 4 Jam.</p>
          <p>• Sekiranya tiada tindakan dibuat selepas 1 jam dari waktu tamat (5 jam total), status akan ditukar automatik ke <strong>SUDAH SELESAI</strong>.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm rounded-xl cursor-pointer border border-slate-700"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[48px] bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-xl flex items-center justify-center space-x-2 cursor-pointer border-2 border-emerald-300"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>SIMPAN STATUS SESI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
