import React, { useState } from 'react';
import { Patient, SchedulePattern, ShiftType, ShiftConfig } from '../types';
import { Calendar, ArrowRightLeft, UserX, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

interface PatientShiftReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  currentPattern: SchedulePattern;
  currentShift: ShiftType;
  shifts: ShiftConfig[];
  onReassign: (patientId: string, newPattern: SchedulePattern, newShift: ShiftType, isMasterChange: boolean) => void;
  onMarkAbsent: (patientId: string, reason: string) => void;
}

export const PatientShiftReassignModal: React.FC<PatientShiftReassignModalProps> = ({
  isOpen,
  onClose,
  patient,
  currentPattern,
  currentShift,
  shifts,
  onReassign,
  onMarkAbsent
}) => {
  if (!isOpen || !patient) return null;

  const [targetPattern, setTargetPattern] = useState<SchedulePattern>(currentPattern);
  const [targetShift, setTargetShift] = useState<ShiftType>(currentShift);
  const [isMasterChange, setIsMasterChange] = useState<boolean>(false);
  const [absentReason, setAbsentReason] = useState<string>('Sakit / Cuti Sakit (MC)');
  const [activeTab, setActiveTab] = useState<'MOVE' | 'REMOVE'>('MOVE');

  const handleMoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReassign(patient.id, targetPattern, targetShift, isMasterChange);
    onClose();
  };

  const handleRemoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMarkAbsent(patient.id, absentReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] max-w-md w-full p-6 space-y-4 shadow-2xl text-[#E2E8F0]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
              <span>Pengurusan Sesi & Slot Pesakit</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {patient.nama} ({patient.id})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#0F172A] p-1 rounded-xl border border-[#1F2937]">
          <button
            type="button"
            onClick={() => setActiveTab('MOVE')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'MOVE'
                ? 'bg-[#1F2937] text-cyan-300 shadow-sm border border-cyan-800/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Pindah ke Sesi Kosong</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REMOVE')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'REMOVE'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Nyahaktif / Batal Sesi</span>
          </button>
        </div>

        {activeTab === 'MOVE' ? (
          <form onSubmit={handleMoveSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1F2937] space-y-1">
              <div className="text-slate-400 text-[11px]">Jadual Sesi Semasa:</div>
              <div className="text-slate-200 font-bold flex items-center justify-between">
                <span>
                  {currentPattern === 'ISNIN_RABU_JUMAAT' ? 'MWF (Isnin, Rabu, Jumaat)' : 'TTS (Selasa, Khamis, Sabtu)'}
                </span>
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 rounded font-mono text-[10px]">
                  {currentShift}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Kumpulan Hari Baharu (Corak)
              </label>
              <select
                value={targetPattern}
                onChange={(e) => setTargetPattern(e.target.value as SchedulePattern)}
                className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-cyan-500 focus:outline-hidden"
              >
                <option value="ISNIN_RABU_JUMAAT">Kumpulan 1: Isnin, Rabu, Jumaat (MWF)</option>
                <option value="SELASA_KHAMIS_SABTU">Kumpulan 2: Selasa, Khamis, Sabtu (TTS)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Shift Sesi Baharu</label>
              <select
                value={targetShift}
                onChange={(e) => setTargetShift(e.target.value as ShiftType)}
                className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-cyan-500 focus:outline-hidden"
              >
                {shifts.map((sh) => (
                  <option key={sh.id} value={sh.kod}>
                    {sh.label} ({sh.masaMula} - {sh.masaTamat})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-[#0F172A] border border-[#1F2937] rounded-xl flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="check-master-change"
                checked={isMasterChange}
                onChange={(e) => setIsMasterChange(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="check-master-change" className="text-[11px] text-slate-300 cursor-pointer">
                <span className="font-bold text-white block">Kemas kini Jadual Master Permanen Pesakit</span>
                Tanda kotak ini jika penukaran sesi ini adalah kekal untuk seterusnya (bukan sekadar pertukaran temporary 1 hari).
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1F2937]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-cyan-950 flex items-center space-x-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Sahkan Pertukaran Sesi</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRemoveSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-rose-300 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Nyahaktifkan Pesakit Bagi Sesi Ini</span>
              </div>
              <p className="text-[11px] text-rose-200/80">
                Tindakan ini akan mengosongkan slot rawatan pesakit ini bagi sesi semasa (pesakit bercuti / tahan wad / tidak hadir). Slot ini boleh diisi oleh pesakit ganti.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Sebab Ketidakhadiran / Batal</label>
              <select
                value={absentReason}
                onChange={(e) => setAbsentReason(e.target.value)}
                className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-xs text-slate-100 focus:border-rose-500 focus:outline-hidden"
              >
                <option value="Sakit / Cuti Sakit (MC)">Sakit / Cuti Sakit (MC)</option>
                <option value="Ditahan Wad Hospital (Admitted)">Ditahan Wad Hospital (Admitted)</option>
                <option value="Urusan Peribadi / Percutian Keluarga">Urusan Peribadi / Percutian Keluarga</option>
                <option value="Tukar Sesi Luar Dialisis">Tukar Sesi Luar Dialisis</option>
                <option value="Masalah Pengangkutan">Masalah Pengangkutan</option>
                <option value="Tidak Hadir Tanpa Notis">Tidak Hadir Tanpa Notis</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#1F2937]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-rose-950 flex items-center space-x-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Nyahaktif Slot Sesi</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
