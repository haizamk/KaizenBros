import React, { useState } from 'react';
import { NurseWalkthroughGuide } from './NurseWalkthroughGuide';
import { 
  DoctorVisit, 
  Patient, 
  StaffMember,
  ShiftType 
} from '../types';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Send, 
  UserCheck, 
  FileCheck,
  BellRing,
  Users,
  Trash2,
  Lock
} from 'lucide-react';
import { 
  createDoctorVisitMessage, 
  buildWhatsAppLink, 
  formatMalayDate 
} from '../utils/whatsappHelper';
import { AdminPasswordConfirmModal } from './AdminPasswordConfirmModal';

interface DoctorVisitsViewProps {
  doctorVisits: DoctorVisit[];
  patients: Patient[];
  staff: StaffMember[];
  onAddDoctorVisit: (visit: DoctorVisit) => void;
  onDeleteDoctorVisit?: (visitId: string) => void;
  onSendDoctorVisitReminder: (visit: DoctorVisit, patient: Patient) => void;
}

export const DoctorVisitsView: React.FC<DoctorVisitsViewProps> = ({
  doctorVisits = [],
  patients = [],
  staff = [],
  onAddDoctorVisit,
  onDeleteDoctorVisit = (_id: string) => {},
  onSendDoctorVisitReminder
}) => {
  const safeDoctorVisits = Array.isArray(doctorVisits) ? doctorVisits : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeStaff = Array.isArray(staff) ? staff : [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password Confirm Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [passwordActionTitle, setPasswordActionTitle] = useState('');

  const doctors = safeStaff.filter((s) => s.kategori === 'DOKTOR');

  const [formData, setFormData] = useState({
    sesiTarget: 'PAGI' as ShiftType | 'SEMUA_SESI',
    namaDoktor: doctors[0]?.nama || 'Dr. Azman bin Khairuddin',
    jawatanDoktor: doctors[0]?.jawatan || 'Pakar Perunding Kanan Nefrologi',
    tarikhLawatan: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    masa: '09:30 Pagi',
    tujuan: 'Rounds Pakar 3 Bulan' as DoctorVisit['tujuan'],
    catatanPakar: 'Rounds pakar nefrologi berkala mengikut sesi rawatan, semakan ujian darah suku tahunan & pelarasan ubat'
  });

  const triggerPasswordProtection = (title: string, action: () => void) => {
    setPasswordActionTitle(title);
    setPendingAction(() => action);
    setPasswordModalOpen(true);
  };

  const handleCreateVisitRound = (e: React.FormEvent) => {
    e.preventDefault();

    // Find patients matching target session
    const targetPatients = formData.sesiTarget === 'SEMUA_SESI'
      ? safePatients.filter((p) => p.status === 'AKTIF')
      : safePatients.filter((p) => p.status === 'AKTIF' && (p.sesiJadual?.shift === formData.sesiTarget || !p.sesiJadual?.shift));

    const totalCount = targetPatients.length > 0 ? targetPatients.length : 1;

    // Create doctor visit entry for target session / patients
    if (targetPatients.length > 0) {
      targetPatients.forEach((pt) => {
        const newVisit: DoctorVisit = {
          id: `DOC-${Date.now().toString().slice(-4)}-${pt.id.slice(-3)}`,
          patientId: pt.id,
          patientName: pt.nama,
          sesiTarget: formData.sesiTarget === 'SEMUA_SESI' ? pt.sesiJadual?.shift || 'PAGI' : formData.sesiTarget,
          namaDoktor: formData.namaDoktor,
          jawatanDoktor: formData.jawatanDoktor,
          tarikhLawatan: formData.tarikhLawatan,
          masa: formData.masa,
          status: 'TERJADUAL',
          tujuan: formData.tujuan,
          catatanPakar: formData.catatanPakar,
          notifikasiDihantar: true
        };
        onAddDoctorVisit(newVisit);
        onSendDoctorVisitReminder(newVisit, pt);
      });

      // Automatically trigger WhatsApp notification link for the first patient in group
      const firstPatient = targetPatients[0];
      const mockVisit: DoctorVisit = {
        id: `DOC-${Date.now()}`,
        patientId: firstPatient.id,
        patientName: firstPatient.nama,
        namaDoktor: formData.namaDoktor,
        jawatanDoktor: formData.jawatanDoktor,
        tarikhLawatan: formData.tarikhLawatan,
        masa: formData.masa,
        status: 'TERJADUAL',
        tujuan: formData.tujuan,
        catatanPakar: formData.catatanPakar,
        notifikasiDihantar: true
      };
      const msg = createDoctorVisitMessage(firstPatient, mockVisit);
      const waUrl = buildWhatsAppLink(firstPatient.noTelefon, msg);
      window.open(waUrl, '_blank');

      setSuccessMsg(`Rounds Pakar berjaya dijadualkan & disebarkan automatik menerusi WhatsApp/Emel untuk ${totalCount} pesakit (${formData.sesiTarget})!`);
    } else {
      // General session visit entry
      const newVisit: DoctorVisit = {
        id: `DOC-${Date.now().toString().slice(-4)}`,
        sesiTarget: formData.sesiTarget === 'SEMUA_SESI' ? 'PAGI' : formData.sesiTarget,
        namaDoktor: formData.namaDoktor,
        jawatanDoktor: formData.jawatanDoktor,
        tarikhLawatan: formData.tarikhLawatan,
        masa: formData.masa,
        status: 'TERJADUAL',
        tujuan: formData.tujuan,
        catatanPakar: formData.catatanPakar,
        notifikasiDihantar: true
      };
      onAddDoctorVisit(newVisit);
      setSuccessMsg(`Jadual rounds pakar ${formData.namaDoktor} bagi sesi ${formData.sesiTarget} berjaya dicipta!`);
    }

    setShowAddModal(false);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleSendReminder = (visit: DoctorVisit) => {
    const patient = safePatients.find((p) => p.id === visit.patientId);
    if (!patient) return;

    onSendDoctorVisitReminder(visit, patient);
    const msg = createDoctorVisitMessage(patient, visit);
    const waUrl = buildWhatsAppLink(patient.noTelefon, msg);

    window.open(waUrl, '_blank');
    setSuccessMsg(`Peringatan lawatan doktor dihantar ke WhatsApp ${patient.nama} (${patient.noTelefon}).`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6 text-[#E2E8F0]">
      {/* Walkthrough Guide for New Staff / Nurse */}
      <NurseWalkthroughGuide tabId="doktor" isAdminAuthenticated={true} />

      {/* Password Confirm Modal */}
      <AdminPasswordConfirmModal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setPendingAction(null);
        }}
        onConfirm={() => {
          if (pendingAction) pendingAction();
        }}
        title={passwordActionTitle}
        description="Sila sahkan kata laluan pentadbir untuk memadam atau mengedit jadual pusingan doktor ini."
      />

      {/* Header */}
      <div className="bg-[#111827] p-6 rounded-xl border border-[#1F2937] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Stethoscope className="w-6 h-6 text-cyan-400" />
            <span>Jadual Rounds Pakar Nefrologi Mengikut Sesi</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Penjadualan pusingan pakar buah pinggang mengikut Sesi Rawatan (Pagi/Tengahari/Petang). Notifikasi automatik dihantar terus ke semua pesakit dalam sesi berkenaan.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          id="btn-add-doctor-visit"
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-950 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Jadualkan Rounds Pakar Sesi</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center space-x-3 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Doctor Summary Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-[#111827] to-teal-950 rounded-2xl p-5 border border-cyan-800/50 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-900/60 border border-cyan-700/60 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Rounds Pakar & Pemantauan Sesi Rawatan (Auto-Notifikasi)</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Pakar nefrologi (Dr. Azman / Dr. Sarah) memantau pesakit mengikut sesi rawatan (Pagi, Tengahari, Petang). Jadual automatik dipadankan untuk semua pesakit sesi berkenaan.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-3.5 py-2 rounded-xl border border-cyan-800/60 whitespace-nowrap">
          {safeDoctorVisits.length} Rekod Rounds Berjadual
        </div>
      </div>

      {/* Doctor Visit Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {safeDoctorVisits.map((visit) => {
          const patient = safePatients.find((p) => p.id === visit.patientId);

          return (
            <div
              key={visit.id}
              id={`doctor-visit-card-${visit.id}`}
              className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 shadow-xl hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                    {visit.tujuan}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    visit.status === 'TERJADUAL' 
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/50' 
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                  }`}>
                    {visit.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {visit.patientName ? visit.patientName : `Sesi Pusingan: ${visit.sesiTarget || 'Semua Sesi'}`}
                  </h3>
                  {visit.patientId && (
                    <p className="text-xs text-slate-400 font-mono">ID Pesakit: {visit.patientId}</p>
                  )}
                </div>

                <div className="p-3 bg-[#0F172A] rounded-xl text-xs space-y-1.5 border border-[#1F2937]">
                  <div className="flex items-center space-x-2 text-slate-200">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span><strong className="text-white">{visit.namaDoktor}</strong> ({visit.jawatanDoktor})</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tarikh Rounds: <strong className="text-white">{formatMalayDate(visit.tarikhLawatan)}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Masa / Sesi: <strong className="text-cyan-300">{visit.masa} ({visit.sesiTarget || 'Sesi Rawatan'})</strong></span>
                  </div>
                </div>

                {visit.catatanPakar && (
                  <p className="text-xs text-slate-400 italic bg-[#0F172A]/60 p-2.5 rounded-lg border border-[#1F2937]">
                    "{visit.catatanPakar}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#1F2937] flex items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Notifikasi Disah & Hantar</span>
                </span>

                <div className="flex items-center space-x-2">
                  {visit.patientId && (
                    <button
                      onClick={() => handleSendReminder(visit)}
                      id={`btn-wa-doc-${visit.id}`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      triggerPasswordProtection('Padam Jadual Rounds Doktor', () => {
                        onDeleteDoctorVisit(visit.id);
                        setSuccessMsg('Rekod rounds doktor telah dipadamkan.');
                        setTimeout(() => setSuccessMsg(null), 4000);
                      });
                    }}
                    title="Padam Jadual Rounds (Perlu Password)"
                    className="p-1.5 bg-rose-950/60 text-rose-400 hover:bg-rose-900 border border-rose-800/40 rounded-lg text-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Visit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0A0C10]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateVisitRound}
            className="bg-[#111827] rounded-2xl border border-[#1F2937] max-w-lg w-full p-6 space-y-4 shadow-2xl text-[#E2E8F0] animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-cyan-400" />
                <span>Tetapkan Rounds Pakar Mengikut Sesi Rawatan</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-xl text-xs text-cyan-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-cyan-400" />
                <span>Sistem Penjadualan Rounds Auto-Sesi</span>
              </div>
              <p className="text-[#CBD5E1] text-[11px]">
                Doktor memantau pesakit mengikut sesi rawatan. Memilih sesi akan memasukkan rounds secara automatik bagi SEMUA pesakit sesi tersebut dan menghantar makluman WhatsApp/Emel serta-merta.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Pilih Sesi Target Pemantauan Doktor</label>
                <select
                  value={formData.sesiTarget}
                  onChange={(e) => setFormData({ ...formData, sesiTarget: e.target.value as any })}
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-xs text-white focus:border-cyan-500 font-bold"
                >
                  <option value="PAGI">Sesi 1 (Pagi - 06:00 / 07:00 Pagi)</option>
                  <option value="TENGAHARI">Sesi 2 (Tengahari - 10:00 / 11:00 Pagi)</option>
                  <option value="PETANG">Sesi 3 (Petang - 02:00 / 03:00 Petang)</option>
                  <option value="SEMUA_SESI">Semua Sesi Rawatan (Rounds Penuh Semua Pesakit)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Doktor Pakar Bertugas</label>
                <select
                  value={formData.namaDoktor}
                  onChange={(e) => {
                    const doc = doctors.find((d) => d.nama === e.target.value);
                    setFormData({
                      ...formData,
                      namaDoktor: e.target.value,
                      jawatanDoktor: doc ? doc.jawatan : formData.jawatanDoktor
                    });
                  }}
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-xs text-white focus:border-cyan-500 font-medium"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.nama}>{d.nama} ({d.jawatan})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tarikh Rounds</label>
                  <input
                    type="date"
                    value={formData.tarikhLawatan}
                    onChange={(e) => setFormData({ ...formData, tarikhLawatan: e.target.value })}
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-xs text-white focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Waktu / Masa Rounds</label>
                  <input
                    type="text"
                    value={formData.masa}
                    onChange={(e) => setFormData({ ...formData, masa: e.target.value })}
                    placeholder="Contoh: 09:30 Pagi"
                    className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-xs text-white focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tujuan Rounds Pakar</label>
                <select
                  value={formData.tujuan}
                  onChange={(e) => setFormData({ ...formData, tujuan: e.target.value as any })}
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-xs text-white focus:border-cyan-500"
                >
                  <option value="Rounds Pakar 3 Bulan">Rounds Pakar 3 Bulan (Quarterly Review)</option>
                  <option value="Rounds Bulanan">Rounds Bulanan Rutin</option>
                  <option value="Konsultasi Khas">Konsultasi Khas</option>
                  <option value="Kaji Semula Vaskular">Kaji Semula Akses Vaskular (AVF/Permacath)</option>
                  <option value="Pelarasan Ubat">Pelarasan Ubat & Anemia (EPO/Iron)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Catatan / Arahan Klinikal Pakar</label>
                <textarea
                  rows={2}
                  value={formData.catatanPakar}
                  onChange={(e) => setFormData({ ...formData, catatanPakar: e.target.value })}
                  className="w-full p-2.5 bg-[#0F172A] border border-[#374151] rounded-xl text-xs text-white focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#1F2937]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition shadow-lg flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Sahkan & Hantar Auto-Notifikasi Sesi</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

