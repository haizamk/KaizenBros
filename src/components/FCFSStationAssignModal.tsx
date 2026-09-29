import React, { useState } from 'react';
import { Patient, TreatmentSession } from '../types';
import { HeartPulse, CheckCircle2, ShieldCheck, Shuffle, Clock } from 'lucide-react';

interface FCFSStationAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  session: TreatmentSession | null;
  occupiedStations: number[]; // List of station numbers 1..12 that are currently occupied
  onAssignFCFS: (
    patientId: string,
    stationNo: number,
    praTekananDarah: string,
    ufGoal: number,
    waktuKetibaan: string
  ) => void;
}

export const FCFSStationAssignModal: React.FC<FCFSStationAssignModalProps> = ({
  isOpen,
  onClose,
  patient,
  session,
  occupiedStations = [],
  onAssignFCFS
}) => {
  if (!isOpen || !patient) return null;

  const totalStations = 12;
  const availableStations = Array.from({ length: totalStations }, (_, i) => i + 1).filter(
    (num) => !occupiedStations.includes(num)
  );

  // Auto pick first available station or random
  const initialPick = availableStations[0] || 1;
  const [selectedStation, setSelectedStation] = useState<number>(initialPick);
  const [praTekananDarah, setPraTekananDarah] = useState<string>('130/80 mmHg');
  const [ufGoal, setUfGoal] = useState<number>(session?.ultrafiltrationGoal || 2.0);
  const [waktuKetibaan, setWaktuKetibaan] = useState<string>(
    new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  const handleAutoRandomPick = () => {
    if (availableStations.length === 0) return;
    const randomIndex = Math.floor(Math.random() * availableStations.length);
    setSelectedStation(availableStations[randomIndex]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) return;
    onAssignFCFS(patient.id, selectedStation, praTekananDarah, ufGoal, waktuKetibaan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#111827] rounded-2xl border border-[#1F2937] max-w-lg w-full p-6 space-y-4 shadow-2xl text-[#E2E8F0] animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800/50">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Daftar Ketibaan & Agih Mesin FCFS</h2>
              <p className="text-xs text-slate-400 font-mono">
                {patient.nama} (IC: {patient.noIC})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* FCFS Banner info */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Prinsip First-Come First-Served (FCFS)</span>
            </span>
            <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 font-mono text-[10px] rounded">
              {availableStations.length} / 12 Stesen Kosong
            </span>
          </div>
          <p className="text-slate-300 text-[11px]">
            Mesin tidak dipraset secara tetap. Stesen mesin dialisis di-agihkan berdasarkan waktu ketibaan pesakit di kaunter saringan.
          </p>
        </div>

        {/* Available station selector grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-300">
              Pilih Stesen Mesin Dialisis Kosong ({availableStations.length} Tersedia)
            </label>
            <button
              type="button"
              onClick={handleAutoRandomPick}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Pilih Rawak FCFS</span>
            </button>
          </div>

          {availableStations.length === 0 ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300 text-center">
              Semua 12 stesen mesin sedang digunakan untuk sesi ini! Sila tunggu sesi seterusnya atau lepaskan stesen pesakit terdahulu.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((stNum) => {
                const isOccupied = occupiedStations.includes(stNum);
                const isSelected = selectedStation === stNum;

                return (
                  <button
                    key={stNum}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => setSelectedStation(stNum)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      isOccupied
                        ? 'bg-[#0A0C10] border-[#1F2937] text-slate-600 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-emerald-900/80 border-emerald-400 text-emerald-200 font-bold ring-2 ring-emerald-500/50 shadow-lg'
                        : 'bg-[#0F172A] border-[#374151] text-slate-300 hover:border-emerald-500/60 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold">Stesen #{stNum}</span>
                    <span className="text-[9px] mt-0.5">
                      {isOccupied ? 'DI-ISI' : isSelected ? 'DIPILIH' : 'KOSONG'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pre-dialysis clinical data inputs */}
        <div className="grid grid-cols-3 gap-3 text-xs pt-1">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Waktu Ketibaan</label>
            <div className="relative">
              <input
                type="text"
                value={waktuKetibaan}
                onChange={(e) => setWaktuKetibaan(e.target.value)}
                className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-slate-100 font-mono text-xs focus:border-emerald-500 focus:outline-hidden"
              />
              <Clock className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Pra-Tekanan Darah</label>
            <input
              type="text"
              value={praTekananDarah}
              onChange={(e) => setPraTekananDarah(e.target.value)}
              placeholder="130/80 mmHg"
              className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Sasaran UF (L)</label>
            <input
              type="number"
              step="0.1"
              value={ufGoal}
              onChange={(e) => setUfGoal(Number(e.target.value))}
              className="w-full p-2 bg-[#0F172A] border border-[#374151] rounded-lg text-slate-100 font-mono text-xs focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-[#1F2937]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={availableStations.length === 0}
            className="px-5 py-2 bg-[#10B981] hover:bg-emerald-400 text-[#0A0C10] rounded-lg text-xs font-bold transition shadow-md shadow-emerald-950 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Sahkan Registration & Mesin Stesen #{selectedStation}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
