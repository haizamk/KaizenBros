import React, { useState } from 'react';
import { JobVacancy, JobApplication } from '../types';
import { 
  Briefcase, 
  X, 
  User, 
  Phone, 
  Mail, 
  Award, 
  Calendar, 
  FileText, 
  Paperclip, 
  Send, 
  CheckCircle2, 
  Info, 
  MessageSquare,
  Building2,
  Clock,
  Trash2
} from 'lucide-react';
import { buildWhatsAppLink } from '../utils/whatsappHelper';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacancies: JobVacancy[];
  onAddJobApplication: (app: JobApplication) => void;
  selectedVacancy?: JobVacancy | null;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  vacancies,
  onAddJobApplication,
  selectedVacancy
}) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submittedApp, setSubmittedApp] = useState<JobApplication | null>(null);

  const initialVacancy = selectedVacancy || vacancies[0];

  const [formData, setFormData] = useState({
    namaPenuh: '',
    noIC: '',
    noTelefon: '',
    emel: '',
    vacancyId: initialVacancy?.id || 'JV-001',
    jawatanDipohon: initialVacancy?.tajukJawatan || 'Jururawat Terlatih Dialisis (Post-Basic Renal)',
    kelayakanPendidikan: 'Diploma Kejururawatan (LJM Berdaftar) + Sijil Pos Basik Renal',
    noPendaftaranLJM: '',
    pengalamanTahun: 3,
    tarikhBolehMula: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notaCalon: '',
    failResumeName: ''
  });

  React.useEffect(() => {
    if (selectedVacancy) {
      setFormData(prev => ({
        ...prev,
        vacancyId: selectedVacancy.id,
        jawatanDipohon: selectedVacancy.tajukJawatan
      }));
    }
  }, [selectedVacancy]);

  const [resumeDataUrl, setResumeDataUrl] = useState<string>('');

  if (!isOpen) return null;

  const handleVacancyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vId = e.target.value;
    const found = vacancies.find((v) => v.id === vId);
    setFormData({
      ...formData,
      vacancyId: vId,
      jawatanDipohon: found ? found.tajukJawatan : 'Jururawat Dialisis'
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      setResumeDataUrl(event.target?.result as string);
      setFormData({
        ...formData,
        failResumeName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.namaPenuh.trim() || !formData.noIC.trim() || !formData.noTelefon.trim()) {
      alert('Sila lengkapkan Nama Penuh, No. Kad Pengenalan dan No. Telefon.');
      return;
    }

    const newApp: JobApplication = {
      id: `JA-${Date.now().toString().slice(-4)}`,
      vacancyId: formData.vacancyId,
      namaPenuh: formData.namaPenuh,
      noIC: formData.noIC,
      noTelefon: formData.noTelefon,
      emel: formData.emel || `${formData.namaPenuh.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      jawatanDipohon: formData.jawatanDipohon,
      kelayakanPendidikan: formData.kelayakanPendidikan,
      noPendaftaranLJM: formData.noPendaftaranLJM,
      pengalamanTahun: Number(formData.pengalamanTahun),
      tarikhBolehMula: formData.tarikhBolehMula,
      statusPermohonan: 'DALAM_SEMAKAN',
      notaCalon: formData.notaCalon,
      tarikhMohon: new Date().toISOString().split('T')[0],
      failResume: formData.failResumeName || 'Resume_Permohonan_Kerjaya.pdf',
      fileDataUrl: resumeDataUrl
    };

    onAddJobApplication(newApp);
    setSubmittedApp(newApp);
    setStep('success');
  };

  const handleNotifyHRViaWhatsApp = () => {
    if (!submittedApp) return;

    const msg = `*PERMOHONAN KERJAYA / JAWATAN KOSONG* 🏥
*Pusat Dialisis KaizenBros*

Salam Pasukan Sumber Manusia / Admin,
Saya ingin mengemukakan permohonan kerja:

👤 *Nama Calon:* ${submittedApp.namaPenuh}
🪪 *No. K/P:* ${submittedApp.noIC}
💼 *Jawatan Dipohon:* ${submittedApp.jawatanDipohon}
🎓 *Kelayakan:* ${submittedApp.kelayakanPendidikan}
🆔 *No. LJM / Pendaftaran:* ${submittedApp.noPendaftaranLJM || 'N/A'}
⏱ *Pengalaman:* ${submittedApp.pengalamanTahun} Tahun
📅 *Tarikh Boleh Mula:* ${submittedApp.tarikhBolehMula}
📞 *Telefon WhatsApp:* ${submittedApp.noTelefon}
📁 *Resume:* ${submittedApp.failResume}

Mohon pihak pentadbiran menyemak resume & permohonan saya. Terima kasih.`;

    const link = buildWhatsAppLink('0193389922', msg);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-2xl bg-[#111827] text-slate-100 rounded-2xl border border-emerald-500/40 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0A0C10] border-b border-[#1F2937]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Borang Permohonan Kerjaya & Jururawat</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold">
                  Pusat Dialisis KaizenBros
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Lengkapkan maklumat peribadi, kelayakan kejururawatan & muat naik resume anda.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1F2937] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Vacancy Selector */}
            <div className="p-3.5 bg-[#0F172A] rounded-xl border border-emerald-500/30 space-y-2">
              <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>Pilih Jawatan Kosong Dipohon *</span>
              </label>
              <select
                value={formData.vacancyId}
                onChange={handleVacancyChange}
                className="w-full px-3 py-2 bg-[#111827] border border-[#374151] rounded-lg text-sm text-white font-medium focus:border-emerald-500 focus:outline-hidden"
              >
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.tajukJawatan} ({v.kekosongan} Kekosongan) - {v.gajiAtauFaedah}
                  </option>
                ))}
              </select>
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Penuh Calon (Di Kad Pengenalan) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaPenuh}
                  onChange={(e) => setFormData({ ...formData, namaPenuh: e.target.value })}
                  placeholder="Contoh: Nurul Aina binti Rosli"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  No. Kad Pengenalan (MyKad) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.noIC}
                  onChange={(e) => setFormData({ ...formData, noIC: e.target.value })}
                  placeholder="Contoh: 950412-10-5822"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  No. Telefon WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.noTelefon}
                  onChange={(e) => setFormData({ ...formData, noTelefon: e.target.value })}
                  placeholder="017-XXXXXXX"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Emel Rasmi</label>
                <input
                  type="email"
                  value={formData.emel}
                  onChange={(e) => setFormData({ ...formData, emel: e.target.value })}
                  placeholder="calon@gmail.com"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Qualifications & Nursing Registration */}
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kelayakan Akademik & Sijil Kepakaran *
                </label>
                <input
                  type="text"
                  required
                  value={formData.kelayakanPendidikan}
                  onChange={(e) => setFormData({ ...formData, kelayakanPendidikan: e.target.value })}
                  placeholder="Contoh: Diploma Kejururawatan + Sijil Pos Basik Renal (LJM)"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    No. Pendaftaran LJM (Jururawat)
                  </label>
                  <input
                    type="text"
                    value={formData.noPendaftaranLJM}
                    onChange={(e) => setFormData({ ...formData, noPendaftaranLJM: e.target.value })}
                    placeholder="Contoh: LJM-84920-RN"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pengalaman (Tahun)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.pengalamanTahun}
                    onChange={(e) => setFormData({ ...formData, pengalamanTahun: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tarikh Boleh Mula Work</label>
                  <input
                    type="date"
                    value={formData.tarikhBolehMula}
                    onChange={(e) => setFormData({ ...formData, tarikhBolehMula: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nota / Ringkasan Pengalaman Kerja
                </label>
                <textarea
                  rows={2}
                  value={formData.notaCalon}
                  onChange={(e) => setFormData({ ...formData, notaCalon: e.target.value })}
                  placeholder="Ringkasan pengalaman di wad hemodialisis / cannulation AVF / penggunaan mesin dialisis..."
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#374151] rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Resume Upload Box */}
            <div className="bg-[#0F172A] p-4 rounded-xl border border-dashed border-[#374151] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Muat Naik Resume & Sijil LJM (PDF / JPG)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Maksimum 5MB</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <label className="w-full sm:w-auto cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition">
                  <Paperclip className="w-4 h-4" />
                  <span>Pilih Fail Resume</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {formData.failResumeName ? (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                    ✓ {formData.failResumeName}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">Belum ada fail dipilih</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1F2937]">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Pusat Dialisis KaizenBros • Sumber Manusia & Kerjaya KKM</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-job-application"
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm shadow-md transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Hantar Permohonan Kerja</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Confirmation Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl font-bold text-white">
                Permohonan Kerja Berjaya Dihantar!
              </h3>
              <p className="text-sm text-slate-300">
                Permohonan jawatan <strong className="text-white">{submittedApp?.jawatanDipohon}</strong> oleh <strong className="text-emerald-300">{submittedApp?.namaPenuh}</strong> (No. Rujukan: <span className="font-mono text-emerald-400">{submittedApp?.id}</span>) telah didaftarkan dalam sistem Sumber Manusia Pusat Dialisis KaizenBros.
              </p>
            </div>

            <div className="bg-[#0F172A] border border-[#374151] p-4 rounded-xl text-left text-xs text-slate-300 max-w-lg mx-auto space-y-2">
              <div className="font-bold text-emerald-400 text-sm">Status Permohonan: DALAM SEMAKAN HR</div>
              <p>Pasukan Pentadbiran Klinik akan menyemak sijil LJM & resume anda. Calon yang tersenarai pendek akan dipanggil untuk temuduga secara bersemuka.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleNotifyHRViaWhatsApp}
                id="btn-job-application-whatsapp"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm shadow-md transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Maklumkan HR via WhatsApp (019-338 9922)</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-slate-200 font-semibold rounded-lg text-sm transition cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
