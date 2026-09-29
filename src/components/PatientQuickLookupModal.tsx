import React, { useState } from 'react';
import { 
  Patient, 
  TreatmentSession, 
  BloodTestRecord, 
  DoctorVisit 
} from '../types';
import { 
  Search, 
  Calendar, 
  Clock, 
  Activity, 
  Stethoscope, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { formatMalayDate, buildWhatsAppLink } from '../utils/whatsappHelper';

interface PatientQuickLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  sessions: TreatmentSession[];
  bloodTests: BloodTestRecord[];
  doctorVisits: DoctorVisit[];
}

export const PatientQuickLookupModal: React.FC<PatientQuickLookupModalProps> = ({
  isOpen,
  onClose,
  patients,
  sessions,
  bloodTests,
  doctorVisits
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const safePatients = Array.isArray(patients) ? patients : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeBloodTests = Array.isArray(bloodTests) ? bloodTests : [];
  const safeDoctorVisits = Array.isArray(doctorVisits) ? doctorVisits : [];

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchTerm.trim().toLowerCase();
    if (!clean) return;

    const found = safePatients.find(
      (p) => 
        p.noIC.replace(/[^0-9]/g, '').includes(clean.replace(/[^0-9]/g, '')) ||
        p.nama.toLowerCase().includes(clean) ||
        p.id.toLowerCase() === clean
    );

    setSelectedPatient(found || null);
  };

  const patientSession = selectedPatient 
    ? safeSessions.find((s) => s.patientId === selectedPatient.id) 
    : null;

  const patientBloodTest = selectedPatient 
    ? safeBloodTests.find((b) => b.patientId === selectedPatient.id) 
    : null;

  const patientDoctorVisit = selectedPatient 
    ? safeDoctorVisits.find((d) => d.patientId === selectedPatient.id) 
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif">Semakan Status & Jadual Pesakit</h2>
            <p className="text-xs text-slate-500">Masukkan No. IC atau Nama Pesakit untuk semak janji temu terkini</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Contoh: 680412-10-5431 atau Rosli"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold transition"
          >
            Cari Rekod
          </button>
        </form>

        {/* Result Area */}
        {selectedPatient ? (
          <div className="space-y-4 pt-2 animate-fadeIn text-xs">
            <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider block">
                  Fail Pesakit Ditemui
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedPatient.nama}</h3>
                <p className="text-slate-600 font-mono">No. IC: {selectedPatient.noIC} | ID: {selectedPatient.id}</p>
                <p className="text-slate-600">Penaja: <strong>{selectedPatient.penaja}</strong> | Akses: {selectedPatient.jenisAkses} ({selectedPatient.lokasiAkses})</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                {selectedPatient.status}
              </span>
            </div>

            {/* 3 cards: Session, Blood Test, Doctor */}
            <div className="space-y-2.5">
              {/* Sesi */}
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-cyan-800">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Sesi Rawatan Hemodialisis Seterusnya</span>
                </div>
                <div className="flex justify-between text-slate-700 pt-1">
                  <span>Hari & Waktu:</span>
                  <span className="font-semibold">
                    {selectedPatient.sesiJadual.corakHari === 'ISNIN_RABU_JUMAAT' ? 'Isnin/Rabu/Jumaat' : 'Selasa/Khamis/Sabtu'} ({selectedPatient.sesiJadual.shift})
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Stesen Mesin:</span>
                  <span className="font-bold text-cyan-700">Stesen #{selectedPatient.sesiJadual.stesenNo}</span>
                </div>
                <div className="text-[11px] text-slate-500 italic pt-0.5">
                  * Sila hadir 15 minit awal sebelum masa rawatan.
                </div>
              </div>

              {/* Blood Test */}
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-rose-800">
                  <Activity className="w-3.5 h-3.5 text-rose-600" />
                  <span>Tarikh Ambil Test Darah Bulanan</span>
                </div>
                <div className="flex justify-between text-slate-700 pt-1">
                  <span>Tarikh Dijadualkan:</span>
                  <span className="font-bold text-rose-700">
                    {formatMalayDate(selectedPatient.tarikhUjianDarahSeterusnya)}
                  </span>
                </div>
                {patientBloodTest && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Keputusan Hb / K terakhir:</span>
                    <span>Hb {patientBloodTest.hb} g/dL | Kalium {patientBloodTest.potassium} mmol/L</span>
                  </div>
                )}
              </div>

              {/* Doctor Visit */}
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-indigo-800">
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Lawatan Pakar Nefrologi Bulanan</span>
                </div>
                <div className="flex justify-between text-slate-700 pt-1">
                  <span>Tarikh Lawatan:</span>
                  <span className="font-bold text-indigo-800">
                    {formatMalayDate(selectedPatient.tarikhLawatanDoktorSeterusnya)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Doktor Bertugas:</span>
                  <span>Dr. Azman bin Khairuddin</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href={buildWhatsAppLink('60193389922', `Salam KaizenBros, saya waris/pesakit ${selectedPatient.nama} (IC: ${selectedPatient.noIC}). Saya ingin bertanya mengenai janji temu kami.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Kaunter KaizenBros</span>
              </a>

              <button
                onClick={() => setSelectedPatient(null)}
                className="px-3 py-2 text-slate-500 hover:text-slate-700"
              >
                Cari Pesakit Lain
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 space-y-2">
            <Search className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs">Sila masukkan No. IC (cth: 680412-10-5431) untuk semakan pantas.</p>
          </div>
        )}
      </div>
    </div>
  );
};
