'use client';

import React, { useState } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  FileText, 
  MapPin, 
  ArrowLeft, 
  Sparkles,
  HelpCircle,
  FileCheck,
  Upload,
  Paperclip,
  X,
  File,
  Image as ImageIcon
} from 'lucide-react';
import { VERIFIED_CENTRE_INFO } from '@/lib/mock-data';
import { NewRegistration, PatientRegistrationDoc } from '@/types';
import { parseMalaysianIC, ICParsedData } from '@/lib/ic-utils';

interface NewPatientRegistrationProps {
  onBackToPublic?: () => void;
  onSuccessRedirect?: () => void;
  onNewRegistrationSubmitted?: (newReg: NewRegistration) => void;
}

export function NewPatientRegistration({
  onBackToPublic,
  onSuccessRedirect,
  onNewRegistrationSubmitted
}: NewPatientRegistrationProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    icNumber: '',
    phoneNumber: '',
    email: '',
    age: '',
    gender: 'Lelaki',
    address: '',
    city: 'Semenyih',
    state: 'Selangor',
    patientType: 'Pesakit Baru Dialisis',
    medicalNotes: ''
  });

  const [icParsed, setIcParsed] = useState<ICParsedData | null>(null);

  const handleIcChange = (inputVal: string) => {
    const parsed = parseMalaysianIC(inputVal);
    if (parsed.isValid) {
      setFormData(prev => ({
        ...prev,
        icNumber: parsed.formattedIC,
        age: parsed.years.toString(),
        gender: parsed.gender === 'LELAKI' ? 'Lelaki' : 'Perempuan'
      }));
      setIcParsed(parsed);
    } else {
      setFormData(prev => ({
        ...prev,
        icNumber: inputVal
      }));
      setIcParsed(null);
    }
  };

  const [uploadedDoc, setUploadedDoc] = useState<PatientRegistrationDoc | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const reader = new FileReader();

    reader.onload = (event) => {
      setUploadedDoc({
        name: file.name,
        type: file.type,
        size: `${fileSizeMb} MB`,
        data_url: event.target?.result as string
      });
    };

    reader.readAsDataURL(file);
  };

  const removeDoc = () => {
    setUploadedDoc(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const refNum = `KB-REG-${Math.floor(100000 + Math.random() * 900000)}`;
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

      const newRegistrationRecord: NewRegistration = {
        id: refNum,
        full_name: formData.fullName,
        ic_number: formData.icNumber,
        phone_number: formData.phoneNumber,
        email: formData.email,
        age: formData.age,
        gender: formData.gender,
        address: `${formData.address}, ${formData.city}, ${formData.state}`,
        city: formData.city,
        state: formData.state,
        patient_category: formData.patientType,
        medical_notes: formData.medicalNotes,
        document: uploadedDoc || undefined,
        status: 'BARU',
        created_at: nowStr
      };

      // Save to localStorage
      try {
        const existing = localStorage.getItem('kaizenbros_registrations');
        const list = existing ? JSON.parse(existing) : [];
        list.unshift(newRegistrationRecord);
        localStorage.setItem('kaizenbros_registrations', JSON.stringify(list));
      } catch (err) {
        console.error('Failed to save registration to localStorage', err);
      }

      if (onNewRegistrationSubmitted) {
        onNewRegistrationSubmitted(newRegistrationRecord);
      }

      setIsSubmitting(false);
      setSubmittedRef(refNum);
    }, 800);
  };

  if (submittedRef) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 font-sans">
        <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center">
          <div className="w-20 h-20 bg-emerald-950 border border-emerald-500/50 rounded-full flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="inline-block bg-emerald-950 text-emerald-300 font-extrabold text-xs px-3.5 py-1 rounded-full border border-emerald-700">
              PENDAFTARAN BERJAYA DIHANTAR
            </span>
            <h2 className="text-3xl font-black text-white">Terima Kasih, {formData.fullName}</h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Permohonan pendaftaran pesakit baru anda telah selamat diterima dan didaftarkan ke dalam sistem pentadbiran Pusat Dialisis KaizenBros.
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs text-slate-400 font-semibold uppercase">No. Rujukan Pendaftaran</span>
              <span className="text-emerald-400 font-mono font-black text-lg">{submittedRef}</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p><strong className="text-white">Nama Pesakit:</strong> {formData.fullName}</p>
              <p><strong className="text-white">No. IC:</strong> {formData.icNumber}</p>
              <p><strong className="text-white">No. Telefon:</strong> {formData.phoneNumber}</p>
              <p><strong className="text-white">Kategori Pesakit:</strong> <span className="text-cyan-400 font-bold">{formData.patientType}</span></p>
              {uploadedDoc && (
                <p><strong className="text-white">Dokumen Dilampirkan:</strong> <span className="text-emerald-400">{uploadedDoc.name} ({uploadedDoc.size})</span></p>
              )}
            </div>
          </div>

          {/* Next Steps Card */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-left text-xs space-y-3 max-w-lg mx-auto">
            <h4 className="font-bold text-cyan-300 text-sm flex items-center">
              <FileCheck className="w-4 h-4 mr-2" />
              Langkah Seterusnya:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
              <li>Nurse / Admin KaizenBros akan semak permohonan anda dan menetapkan jadual syif, penaja (PERKESO/Zakat/JPA) dan stesen rawatan.</li>
              <li>Pegawai Kesihatan KaizenBros akan menghubungi anda melalui WhatsApp/Telefon (<span className="text-emerald-400 font-semibold">{formData.phoneNumber}</span>) dalam masa 24 jam.</li>
              <li>Sila bawa bersama kad pengenalan dan dokumen rujukan asal apabila dijemput melawat fasiliti.</li>
            </ol>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              onClick={() => {
                setSubmittedRef(null);
                if (onBackToPublic) onBackToPublic();
              }}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Laman Utama</span>
            </button>

            <a
              href={`https://wa.me/${VERIFIED_CENTRE_INFO.whatsapp_number}?text=Salam%20KaizenBros,%20saya%20telah%20menghantar%20pendaftaran%20pesakit%20baru%20(No.%20Rujukan:%20${submittedRef}).`}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg flex items-center space-x-2"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>WhatsApp Pegawai Pengambilan</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-sans">
      {/* Top Banner */}
      <div className="mb-8 space-y-4">
        {onBackToPublic && (
          <button
            onClick={onBackToPublic}
            className="inline-flex items-center text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            <span>Kembali ke Laman Utama</span>
          </button>
        )}

        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-emerald-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-emerald-950 border border-emerald-700 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
            <UserPlus className="w-3.5 h-3.5" />
            <span>PENDAFTARAN PESAKIT BARU</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Borang Pendaftaran Kemasukan Dialisis
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            Sila lengkapkan maklumat ringkas di bawah. Pilihan penaja, jadual syif dan stesen akan diaturkan oleh Nurse / Admin KaizenBros.
          </p>
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl">
        {/* Section 1: Data Peribadi Pesakit */}
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-lg font-black text-white">Data Peribadi Pesakit</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Nama Penuh Pesakit (mengikut MyKad) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Contoh: Ahmad bin Ali"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Nombor Kad Pengenalan (MyKad) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.icNumber}
                onChange={(e) => handleIcChange(e.target.value)}
                placeholder="Contoh: 700512-10-5432"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {icParsed && icParsed.isValid && (
                <div className="mt-2 bg-emerald-950/80 border border-emerald-800/80 rounded-xl p-2.5 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Umur Pesakit (Auto):</span>
                    <strong className="text-emerald-300 font-black">{icParsed.ageDisplay}</strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">Tarikh Lahir MyKad:</span>
                    <span className="text-slate-200">{icParsed.birthDateFormatted}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Nombor Telefon / WhatsApp <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="Contoh: 019-3389922"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Alamat E-mel (Pilihan)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Contoh: pesakit@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Umur Pesakit (Tahun) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Contoh: 54"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Jantina <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="Lelaki">Lelaki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Alamat Kediaman Terkini <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Contoh: No 12, Jalan Semenyih Indah, 43500 Semenyih, Selangor"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Section 2: Kategori Pesakit (Disederhanakan - Pilihan penaja, hari, syif akan ditentukan oleh Nurse/Admin) */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="pb-2 flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-950 text-teal-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-lg font-black text-white">Kategori Pesakit & Catatan Kesihatan</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Kategori Pesakit <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.patientType}
              onChange={(e) => setFormData({ ...formData, patientType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors font-bold text-cyan-300"
            >
              <option value="Pesakit Baru Dialisis">Pesakit Baru Dialisis (Baru Didiagnos / Belum Pernah Dialisis)</option>
              <option value="Pertukaran dari Pusat Dialisis Lain">Pertukaran dari Pusat Dialisis Lain</option>
              <option value="Pesakit Percutian / Transit">Pesakit Percutian / Transit (Holiday Patient)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              * Nota: Maklumat penaja (PERKESO/Zakat/JPA/Insurans), pilihan syif dan hari rawatan akan ditentukan dan diproses oleh Nurse / Admin Pusat Dialisis.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Catatan Kesihatan / Sejarah Ringkas Doktor (Pilihan)
            </label>
            <textarea
              rows={3}
              value={formData.medicalNotes}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              placeholder="Contoh: Ada AV Fistula di tangan kiri / Ada masalah darah tinggi / Menghidap kencing manis..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Section 3: Muat Naik Surat / Dokumen Berkaitan */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="pb-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-black text-white">Muat Naik Surat / Dokumen Rujukan (Jika Ada)</h3>
            </div>
            <span className="text-xs bg-slate-800 text-amber-300 border border-amber-800/60 px-2.5 py-0.5 rounded-full font-bold">
              Pilihan / Optional
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Anda boleh memuat naik <strong>Surat Rujukan Doktor</strong>, <strong>Keputusan Ujian Darah</strong> atau <strong>Surat Kelulusan Penaja</strong> (Boleh guna muat naik <strong>Gambar Camera/Gallery</strong> atau <strong>Fail PDF</strong>).
          </p>

          {!uploadedDoc ? (
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-2xl p-6 text-center bg-slate-950/60 transition-all group relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Klik di sini untuk pilih fail atau muat naik foto</p>
                  <p className="text-xs text-slate-400 mt-1">Format disokong: PNG, JPG, JPEG, atau PDF (Maksimum 10MB)</p>
                </div>
                <div className="flex items-center space-x-3 text-xs text-amber-400 font-semibold pt-1">
                  <span className="flex items-center"><ImageIcon className="w-3.5 h-3.5 mr-1" /> Gambar Foto</span>
                  <span>•</span>
                  <span className="flex items-center"><File className="w-3.5 h-3.5 mr-1" /> Dokumen PDF</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border-2 border-emerald-500/60 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex flex-shrink-0 items-center justify-center">
                  {uploadedDoc.type.includes('pdf') ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm truncate">{uploadedDoc.name}</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded uppercase">
                      {uploadedDoc.type.includes('pdf') ? 'PDF' : 'Imej'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Saiz fail: {uploadedDoc.size}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeDoc}
                className="p-2 text-rose-400 hover:text-white hover:bg-rose-950 rounded-xl transition-colors cursor-pointer ml-2 flex-shrink-0"
                title="Padam Dokumen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Form Submission Button */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Maklumat peribadi & dokumen dijamin sulit mengikut Akta PDPA.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 min-h-[52px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-base rounded-2xl transition-all shadow-xl shadow-emerald-950/60 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>SEDANG MENGHANTAR...</span>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>HANTAR PENDAFTARAN SEKARANG</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
