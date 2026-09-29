export type VascularAccessType = 'AVF' | 'AVG' | 'CVC_TEMPORARY' | 'PERMACATH';
export type SponsorType = 'SOCSO' | 'JPA_KWAP' | 'ZAKAT_MAIWP' | 'ZAKAT_SELANGOR' | 'INSURANS_SWASTA' | 'SENDIRI';
export type ShiftType = 'PAGI' | 'TENGAHARI' | 'PETANG' | 'MALAM' | string;

export interface ShiftConfig {
  id: string;
  kod: string; // e.g. 'PAGI', 'TENGAHARI', 'PETANG', 'MALAM'
  label: string; // e.g. 'Sesi Pagi', 'Sesi Malam'
  masaMula: string; // e.g. '07:00'
  masaTamat: string; // e.g. '11:00'
  aktif: boolean;
  keterangan?: string;
  maxStesen?: number;
}
export type SchedulePattern = 'ISNIN_RABU_JUMAAT' | 'SELASA_KHAMIS_SABTU';
export type NotificationType = 'SESI_RAWATAN' | 'LAWATAN_DOKTOR' | 'TEST_DARAH' | 'PEMBAYARAN_INVOIS';
export type NotificationChannel = 'WHATSAPP' | 'EMAIL';
export type PaymentMethod = 'SOCSO' | 'JPA_KWAP' | 'ZAKAT' | 'FPX' | 'DUITNOW_QR' | 'KAD_KREDIT_DEBIT' | 'TUNAI';
export type PaymentStatus = 'PAID' | 'UNPAID' | 'Paid' | 'Unpaid' | 'LUNAS' | 'MENUNGGU' | 'TERTUNGGAK';

export type ReminderTimingConfig = '24_JAM_SEBELUM' | '48_JAM_SEBELUM' | '2_JAM_SEBELUM' | 'SERTA_MERTA';

export interface PreRegisteredDocument {
  id: string;
  namaDokumen: string;
  jenisDokumen: 'SURAT_RUJUKAN' | 'SALINAN_IC' | 'LAPORAN_DARAH' | 'SURAT_PENAJA' | 'LAIN_LAIN';
  tarikhMuatNaik: string;
  saizFile?: string;
  fileDataUrl?: string; // Base64 or URL for document preview
  nota?: string;
}

export interface PreRegisteredPatient {
  id: string;
  nama: string;
  noIC: string;
  noTelefon: string;
  emel: string;
  umur: number;
  jantina: 'LELAKI' | 'PEREMPUAN';
  alamat: string;
  namaWaris: string;
  telefonWaris: string;
  hubunganWaris: string;
  hospitalRujukan: string;
  doktorMerujuk?: string;
  peringkatPenyakit?: 'CKD_STAGE_4' | 'CKD_STAGE_5_ESRD' | 'AKUT_ON_CHRONIC';
  tarikhMulaDialisis?: string;
  jenisAksesSemasa?: VascularAccessType | 'BELUM_BEDAH_FISTULA';
  lokasiAkses?: string;
  statusSerologiHepatitis?: {
    hbsAg: 'NEGATIF' | 'POSITIF' | 'BELUM_UJIAN';
    antiHCV: 'NEGATIF' | 'POSITIF' | 'BELUM_UJIAN';
    hiv: 'NEGATIF' | 'POSITIF' | 'BELUM_UJIAN';
  };
  anggaranBeratKering?: number;
  kumpulanDarah?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  penajaPilihan: SponsorType;
  dokumenTersedia: string[];
  lampiranFail?: PreRegisteredDocument[];
  tarikhMohon: string;
  tarikhLahir?: string;
  statusPenilaian: 'DALAM_PENILAIAN' | 'LAYAK_DITERIMA' | 'PERLU_DOKUMEN' | 'TELAH_DIDAFTAR' | 'DITOLAK';
  alasanPenolakan?: string;
  nasihatKlinikalPakar?: string;
  cadanganJadual?: {
    corakHari: SchedulePattern;
    shift: ShiftType;
  };
}

export interface Patient {
  id: string;
  nama: string;
  noIC: string;
  noTelefon: string;
  emel: string;
  umur: number;
  jantina: 'LELAKI' | 'PEREMPUAN';
  alamat: string;
  namaWaris: string;
  telefonWaris: string;
  hubunganWaris: string;
  tarikhDaftar: string;
  status: 'AKTIF' | 'CUTI' | 'HOSPITAL';
  penaja: SponsorType;
  noRujukanPenaja?: string;
  jenisAkses: VascularAccessType;
  lokasiAkses: string;
  beratKering: number; // kg
  beratSemasa: number; // kg
  kumpulanDarah: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  alergi: string;
  komorbid: string[]; // e.g. ['Diabetes Mellitus (DM)', 'Hipertensi (HTN)', 'IHD']
  sesiJadual: {
    corakHari: SchedulePattern;
    shift: ShiftType;
    stesenNo: number;
  };
  tarikhUjianDarahSeterusnya: string;
  tarikhLawatanDoktorSeterusnya: string;
  jururawatPemantauTetap?: string; // Dedicated nurse in charge
  tarikhLahir?: string; // YYYY-MM-DD
  password?: string; // Default '123456'
  isFirstLogin?: boolean; // Default true for newly registered patients
}

export interface TreatmentSession {
  id: string;
  patientId: string;
  patientName: string;
  tarikh: string;
  corakHari: SchedulePattern;
  shift: ShiftType;
  masaMula: string;
  masaTamat: string;
  stesenNo: number; // 1 to 12
  status: 'AKAN_DATANG' | 'SEDANG_MENUNGGU' | 'SEDANG_BERJALAN' | 'SELESAI' | 'BATAL' | 'TIDAK_HADIR';
  jururawatBertugas: string;
  praTekananDarah?: string;
  pascaTekananDarah?: string;
  ultrafiltrationGoal?: number; // Litres
  notaKlinikal?: string;
}

export interface ComprehensiveBloodParameters {
  // Page 1: Full Blood Count & White Differential & Coronary Risk Profile
  rcc?: number; // 10^6/uL (Red Cell Count)
  pcv?: number; // % (Haematocrit)
  mcv?: number; // fL
  mch?: number; // pg
  mchc?: number; // g/dL
  rdw?: number; // %
  platelet?: number; // 10^3/uL
  wcc?: number; // 10^3/uL (White Cell Count)
  neutrophils?: number; // %
  lymphocytes?: number; // %
  monocytes?: number; // %
  eosinophils?: number; // %
  basophils?: number; // %
  totalCholesterol?: number; // mmol/L
  hdlCholesterol?: number; // mmol/L
  nonHdlCholesterol?: number; // mmol/L
  ldlCholesterol?: number; // mmol/L
  triglycerides?: number; // mmol/L
  cholHdlRatio?: number;

  // Page 2: Liver Function & Renal Function Profile
  alp?: number; // U/L (Alkaline Phosphatase)
  altSgpt?: number; // U/L
  glucose?: number; // mmol/L
  glucoseCategory?: string; // e.g. Fasting / Random
  sodium?: number; // mmol/L
  chloride?: number; // mmol/L
  uricAcid?: number; // mmol/L
  correctedCalcium?: number; // mmol/L

  // Page 3: Dialysis Pre & Post Urea, HbA1c & Iron Profile
  postUrea?: number; // mmol/L
  urr?: number; // % Urea Reduction Rate
  hbA1cPercent?: number; // %
  hbA1cMmolMol?: number; // mmol/mol
  serumIron?: number; // umol/L
  tibc?: number; // umol/L
  tsatPercent?: number; // %
  transferrin?: number; // g/L

  // Page 4: Hormone & Serology / Immunology
  iPTH?: number; // pmol/L (Intact Parathyroid Hormone)
  hivAgAb?: string; // e.g. Non Reactive
  hBsAg?: string; // e.g. Non Reactive
  hBsAb?: string | number; // e.g. 182 mIU/mL
  hepCAbIgG?: string; // e.g. Non Reactive
}

export interface BloodTestRecord {
  id: string;
  patientId: string;
  patientName: string;
  tarikhUjian: string;
  tarikhUjianSeterusnya: string;
  tahunUjian?: number; // E.g. 2022, 2023, 2024, 2025, 2026 for 5-year monitoring
  namaMakmal?: string; // E.g. Prima Lab Sdn. Bhd., Pathlab Malaysia, Gribbles Pathology
  namaFailPDF?: string; // E.g. Laporan_Darah_PrimaLab_2026.pdf
  diMuatNaikOleh?: string; // E.g. Sister Hanim binti Othman
  hb: number; // g/dL, normal target 10-12
  urea: number; // mmol/L
  creatinine: number; // umol/L
  potassium: number; // mmol/L, normal 3.5 - 5.5
  calcium: number; // mmol/L, normal 2.1 - 2.55
  phosphate: number; // mmol/L, normal 1.13 - 1.78
  albumin: number; // g/L, normal >= 40
  ktV: number; // Adequacy, target >= 1.2
  ferritin?: number; // ng/mL or ug/L
  detailedParameters?: ComprehensiveBloodParameters; // Complete 4-page lab parameters
  statusPeringatan: 'DIHANTAR' | 'BELUM_HANTAR' | 'AKAN_DATANG';
  catatan?: string;
  maklumatDrAI?: string; // Rumusan AI & Nota Doktor Pakar
}

export interface DoctorVisit {
  id: string;
  patientId?: string;
  patientName?: string;
  sesiTarget?: ShiftType; // e.g. PAGI, TENGAHARI, PETANG (Rounds mengikut sesi pesakit)
  namaDoktor: string;
  jawatanDoktor: string;
  tarikhLawatan: string;
  masa: string;
  status: 'TERJADUAL' | 'SELESAI' | 'TANGGUH';
  tujuan: 'Rounds Pakar 3 Bulan' | 'Rounds Bulanan' | 'Konsultasi Khas' | 'Kaji Semula Vaskular' | 'Pelarasan Ubat';
  catatanPakar?: string;
  notifikasiDihantar: boolean;
}

export interface NotificationLog {
  id: string;
  patientId: string;
  patientName: string;
  noTelefon: string;
  emel: string;
  jenis: NotificationType;
  saluran: NotificationChannel;
  tajuk: string;
  kandungan: string;
  tarikhMasaDihantar: string;
  status: 'BERJAYA' | 'MENUNGGU' | 'GAGAL';
  pautanWhatsApp?: string;
}

export interface TransactionPayment {
  id: string;
  invoisNo: string;
  patientId: string;
  patientName: string;
  tarikh: string;
  perkara: string;
  jumlahKasar: number; // RM
  subsidiPenaja: number; // RM (e.g. SOCSO pays RM150)
  bayaranPesakit: number; // RM
  kaedah: PaymentMethod;
  status: PaymentStatus;
  resitNo?: string;
  rujukanTransaksi?: string;
  nota?: string;
}

export type AdminRoleLevel = 'WEBMASTER' | 'SUPER_ADMIN' | 'PENTADBIR' | 'CUSTOM' | 'BIASA';

export interface CustomModulePermissions {
  profilPusat: boolean;
  pendaftaranPesakit: boolean;
  jadualRawatan: boolean;
  ujianDarah: boolean;
  lawatanDoktor: boolean;
  ringkasanKlinikal: boolean;
  permohonanStaf: boolean;
  jawatanKosong: boolean;
  whatsapp: boolean;
  kewangan: boolean;
  analitik: boolean;
  sandaranSystem: boolean;
  pengurusanAkses: boolean;
  urusWaktuShift?: boolean;
}

export interface AdminPageVisibility {
  ringkasan_klinikal: boolean;
  pendaftaran: boolean;
  pengurusan_staf: boolean;
  jadual: boolean;
  kewangan: boolean;
  perubatan: boolean;
  doktor: boolean;
  permohonan_kerjaya: boolean;
  whatsapp: boolean;
  analitik: boolean;
  profil?: boolean;
  portal_pesakit?: boolean;
  kerjaya?: boolean;
  dialisis_pelancong?: boolean;
}

export const DEFAULT_ADMIN_PAGE_VISIBILITY: AdminPageVisibility = {
  ringkasan_klinikal: true,
  pendaftaran: true,
  pengurusan_staf: true,
  jadual: true,
  kewangan: true,
  perubatan: true,
  doktor: true,
  permohonan_kerjaya: true,
  whatsapp: true,
  analitik: true,
  profil: true,
  portal_pesakit: true,
  kerjaya: true,
  dialisis_pelancong: true
};

export interface StaffMember {
  id: string;
  nama: string;
  jawatan: string;
  kategori: 'DOKTOR' | 'JURURAWAT' | 'PENTADBIR';
  kelayakan: string;
  noPendaftaran: string; // MMC or LJM
  pengalamanTahun: number;
  jadualBertugas: string;
  emel: string;
  telefon: string;
  tentang: string;
  avatarUrl: string;
  adminLevel?: AdminRoleLevel;
  customPermissions?: Partial<CustomModulePermissions>;
}

export interface CentreInfo {
  nama: string;
  slogan: string;
  noPendaftaranKKM: string;
  tarikhDitubuhkan: string;
  alamat: string;
  telefonUtama: string;
  talianKecemasan24Jam: string;
  whatsappRasmi: string;
  emel: string;
  waktuOperasi: {
    hari: string;
    masa: string;
  }[];
  kapasitiMesin: number;
  jenamaMesin: string;
  sistemAir: string;
  panelPenajaDiiktiraf: string[];
}

export interface DigitalSignatureData {
  signatureImage: string; // Base64 data URL
  signerName: string; // e.g. "Dr. Sarah binti Mohamad Noor"
  signerRole: string; // e.g. "Pakar Nefrologi (MMC 59402)"
  signedAt: string; // ISO string or formatted string
  signatureId: string; // e.g. "DS-2026-0905-8842"
  isVerified: boolean;
}

export interface JobVacancy {
  id: string;
  tajukJawatan: string;
  kategori: 'JURURAWAT' | 'DOKTOR' | 'PEMBANTU_PERUBATAN' | 'PENTADBIR';
  kekosongan: number;
  kelayakanSingkat: string;
  gajiAtauFaedah: string;
  lokasi: string;
  status: 'BUKA' | 'TUTUP';
  keterangan: string;
}

export interface JobApplication {
  id: string;
  vacancyId?: string;
  namaPenuh: string;
  noIC: string;
  noTelefon: string;
  emel: string;
  jawatanDipohon: string;
  kelayakanPendidikan: string;
  noPendaftaranLJM?: string;
  pengalamanTahun: number;
  tarikhBolehMula: string;
  statusPermohonan: 'DALAM_SEMAKAN' | 'PANGGIL_TEMUDUGA' | 'DITERIMA' | 'DITOLAK';
  notaCalon?: string;
  tarikhMohon: string;
  failResume?: string;
  fileDataUrl?: string;
  catatanAdmin?: string;
}

export type AppTheme = 'dark' | 'light-black-footer' | 'light-professional';

export type TouristDialysisStatus = 
  | 'BARU_MENUNGGU_SEMAKAN' 
  | 'DOKUMEN_LENGKAP' 
  | 'SLOT_DISAHKAN' 
  | 'SEDANG_DIRAWAT' 
  | 'SELESAI' 
  | 'DIBATALKAN';

export interface TouristDialysisBooking {
  id: string; // e.g. "TOUR-2026-001"
  nama: string;
  noICPasport: string;
  warganegara: string; // 'Malaysia' or international
  noTelefon: string;
  emel: string;
  umur: number;
  jantina: 'LELAKI' | 'PEREMPUAN';
  alamatAsal: string; // Bandar/Negeri/Negara asal
  tempatMenginap: string; // Hotel/Homestay di Kajang/Semenyih/Bangi/Putrajaya
  
  // Data Dialisis Terkini
  pusatDialisisAsal: string;
  namaDoktorPakar: string;
  telefonPusatAsal?: string;
  jenisAkses: VascularAccessType;
  lokasiAkses: string;
  beratKering: number; // kg
  tarikhDialisisTerakhir?: string;
  tempohJam?: number; // e.g. 4.0
  jenisDialyzer?: string; // e.g. 'High-Flux FX80 / Rexeed'
  antikoagulanHeparin?: string; // e.g. 'Standard Heparin' or 'LMWH Clexane'
  statusSerologi: {
    hbsAg: 'NEGATIF' | 'POSITIF' | 'BELUM_PASTI';
    antiHCV: 'NEGATIF' | 'POSITIF' | 'BELUM_PASTI';
    hiv: 'NEGATIF' | 'POSITIF' | 'BELUM_PASTI';
    tarikhUjianSerologi?: string;
  };
  
  // Keperluan Sesi Percutian di Kajang & Semenyih
  tarikhMulaBercuti: string;
  tarikhTamatBercuti: string;
  tarikhSesiDiperlukan: string[]; // e.g. ['2026-09-15', '2026-09-17']
  pilihanShift: ShiftType;
  keperluanKhas?: string; // e.g. Kerusi roda, alahan, bantuan kenderaan
  
  // Dokumen Dimuat Naik
  dokumenLampiran: PreRegisteredDocument[];
  
  // Status & Pengurusan Admin
  status: TouristDialysisStatus;
  tarikhDaftar: string;
  nomborRujukan: string; // e.g. "KAIZEN-HOLIDAY-2026-8812"
  notaKlinikalAdmin?: string;
  stesenDitetapkan?: number;
  jururawatBertugas?: string;
  statusBayaran?: 'MENUNGGU_PENGESAHAN' | 'DEPOSIT_DITERIMA' | 'LUNAS' | 'PENAJA_GL';
  jumlahBayaran?: number;
}

