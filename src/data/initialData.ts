import { 
  CentreInfo, 
  StaffMember, 
  Patient, 
  TreatmentSession, 
  BloodTestRecord, 
  DoctorVisit, 
  TransactionPayment, 
  NotificationLog,
  PreRegisteredPatient,
  ShiftConfig,
  JobVacancy,
  JobApplication,
  TouristDialysisBooking
} from '../types';

export const INITIAL_SHIFTS: ShiftConfig[] = [
  {
    id: 'SHIFT-01',
    kod: 'PAGI',
    label: 'Sesi 1 (Pagi)',
    masaMula: '06:00',
    masaTamat: '10:00',
    aktif: true,
    keterangan: 'Sesi pertama hemodialisis rutin (4 jam)'
  },
  {
    id: 'SHIFT-02',
    kod: 'TENGAHARI',
    label: 'Sesi 2 (Tengahari)',
    masaMula: '10:00',
    masaTamat: '14:00',
    aktif: true,
    keterangan: 'Sesi kedua hemodialisis rutin (4 jam)'
  },
  {
    id: 'SHIFT-03',
    kod: 'PETANG',
    label: 'Sesi 3 (Petang)',
    masaMula: '14:00',
    masaTamat: '18:00',
    aktif: true,
    keterangan: 'Sesi ketiga hemodialisis rutin (4 jam)'
  }
];

export const INITIAL_NEARBY_HOSPITALS = [
  'Hospital Sultan Abdul Aziz Shah UPM (HPUPM Serdang)',
  'Hospital Kajang',
  'Hospital Serdang (Sultan Idris Shah - Jabatan Nefrologi)',
  'Hospital Putrajaya',
  'Hospital Ampang',
  'Hospital Canselor Tuanku Mukhriz UKM (HUKM Cheras)',
  'Hospital Kuala Lumpur (HKL)',
  'Hospital Selayang',
  'Hospital Tengku Ampuan Rahimah (HTAR Klang)',
  'Hospital Shah Alam',
  'Hospital Sungai Buloh',
  'Hospital Cyberjaya',
  'Hospital Banting',
  'KPJ Kajang Specialist Hospital',
  'Columbia Asia Hospital Cheras',
  'Columbia Asia Hospital Bukit Rimau',
  'Sunway Medical Centre Velocity',
  'Sunway Medical Centre Subang Jaya',
  'Subang Jaya Medical Centre (SJMC)',
  'Beacon Hospital Petaling Jaya',
  'Pantai Hospital Cheras',
  'Pantai Hospital Kuala Lumpur',
  'Gleneagles Hospital Kuala Lumpur',
  'KPJ Ampang Puteri Specialist Hospital',
  'KPJ Tawakkal KL Specialist Hospital',
  'Lain-lain (Hospital Swasta / Klinik Pakar Luar)'
];

export const calculateAgeFromDOB = (dobString: string): number => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age < 0 ? 0 : age;
};

export const extractDOBFromIC = (icNumber: string): string | null => {
  if (!icNumber) return null;
  const cleaned = icNumber.replace(/\D/g, '');
  if (cleaned.length < 6) return null;
  
  const yyStr = cleaned.substring(0, 2);
  const mmStr = cleaned.substring(2, 4);
  const ddStr = cleaned.substring(4, 6);
  
  const yy = parseInt(yyStr, 10);
  const mm = parseInt(mmStr, 10);
  const dd = parseInt(ddStr, 10);
  
  if (isNaN(yy) || isNaN(mm) || isNaN(dd) || mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return null;
  }
  
  const currentYearLastTwo = new Date().getFullYear() % 100;
  const fullYear = yy > currentYearLastTwo ? 1900 + yy : 2000 + yy;
  
  const formattedMM = mm.toString().padStart(2, '0');
  const formattedDD = dd.toString().padStart(2, '0');
  
  return `${fullYear}-${formattedMM}-${formattedDD}`;
};

export const INITIAL_CENTRE_INFO: CentreInfo = {
  nama: 'Pusat Dialisis KaizenBros',
  slogan: 'Kecemerlangan Rawatan Hemodialisis & Kasih Sayang Demi Kualiti Hidup Pesakit',
  noPendaftaranKKM: 'KKM/BPP/2023/HD-8491',
  tarikhDitubuhkan: '15 Januari 2021',
  alamat: '27 & 29G, Jalan 5/10, Seksyen 5 Bandar Rinching, 43500 Semenyih, Selangor',
  telefonUtama: '03-87270791',
  talianKecemasan24Jam: '019-338 9922',
  whatsappRasmi: '60193389922',
  emel: 'admin@kaizenbrosdialysis.com.my',
  waktuOperasi: [
    { hari: 'Isnin - Sabtu', masa: '6:00 Pagi - 6:00 Petang (3 Sesi Sehari)' },
    { hari: 'Ahad', masa: 'Tutup (Kecemasan On-Call Sahaja)' }
  ],
  kapasitiMesin: 12,
  jenamaMesin: 'Fresenius Medical Care 4008S NG & 5008S CorDiax (Online HDF Ready)',
  sistemAir: 'Sistem Rawatan Air Double Pass Reverse Osmosis (RO) Berstandard AAMI/ISO 23500',
  panelPenajaDiiktiraf: [
    'PERKESO / SOCSO (Panel Sah)',
    'JPA / KWAP (Pesara Kerajaan)',
    'Lembaga Zakat Selangor (LZS)',
    'Baitulmal MAIWP',
    'Yayasan Buah Pinggang Kebangsaan (NKF)',
    'Insurans Swasta (Prudential, Great Eastern, AIA, Allianz)'
  ]
};

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'WEBMASTER-ROOT',
    nama: 'Webmaster (System Root)',
    jawatan: 'System Webmaster & Lead Administrator',
    kategori: 'DOKTOR',
    adminLevel: 'WEBMASTER',
    kelayakan: 'System Master Access Level 0',
    noPendaftaran: 'SYS-ROOT-001',
    pengalamanTahun: 20,
    jadualBertugas: '24/7 Unlimited Access',
    emel: 'webmaster@kaizenbros.com',
    telefon: '010-0000000',
    tentang: 'Akses Penuh Webmaster Root Sistem.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'st-01',
    nama: 'Dr. Azman bin Khairuddin',
    jawatan: 'Pengarah Perubatan & Pentadbir Utama (Nephrologist)',
    kategori: 'DOKTOR',
    kelayakan: 'MBBS (Malaya), MRCP (UK), FRCP (Edin), Fellowship in Nephrology',
    noPendaftaran: 'MMC 38291 / NSR 130822',
    pengalamanTahun: 18,
    jadualBertugas: 'Setiap Hari Selasa & Khamis (Lawatan Klinikal Bulanan)',
    emel: 'dr.azman@kaizenbrosdialysis.com.my',
    telefon: '012-384 1902',
    tentang: 'Pakar nefrologi dan Pentadbir Utama Pusat Dialisis KaizenBros.',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    adminLevel: 'SUPER_ADMIN'
  },
  {
    id: 'st-02',
    nama: 'Dr. Sarah Nadira binti Kamal',
    jawatan: 'Pegawai Perubatan Residen & Pentadbir Klinikal',
    kategori: 'DOKTOR',
    kelayakan: 'MD (UKM), BLS, ACLS, Cert. Renal Dialysis Management',
    noPendaftaran: 'MMC 59402',
    pengalamanTahun: 8,
    jadualBertugas: 'Isnin - Jumaat (7:00 Pagi - 4:00 Petang)',
    emel: 'dr.sarah@kaizenbrosdialysis.com.my',
    telefon: '017-641 2309',
    tentang: 'Pentadbir Klinikal & Pegawai Perubatan Residen.',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    adminLevel: 'PENTADBIR'
  },
  {
    id: 'st-03',
    nama: 'Sister Hanim binti Othman',
    jawatan: 'Ketua Jururawat Renal & Pentadbir Operasi',
    kategori: 'JURURAWAT',
    kelayakan: 'Diploma in Nursing (KKM), Post-Basic Renal Care',
    noPendaftaran: 'LJM 48102',
    pengalamanTahun: 14,
    jadualBertugas: 'Isnin - Sabtu (Mengikut Giliran Sesi)',
    emel: 'sister.hanim@kaizenbrosdialysis.com.my',
    telefon: '013-902 4411',
    tentang: 'Pentadbir Operasi Jururawat dan Penjagaan Akses Vaskular.',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813689-f54249a15a81?w=300&auto=format&fit=crop&q=80',
    adminLevel: 'PENTADBIR'
  }
];

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_PRE_REGISTERED_PATIENTS: PreRegisteredPatient[] = [];

export const INITIAL_TREATMENT_SESSIONS: TreatmentSession[] = [];

export const INITIAL_BLOOD_TESTS: BloodTestRecord[] = [];

export const INITIAL_DOCTOR_VISITS: DoctorVisit[] = [];

export const INITIAL_TRANSACTIONS: TransactionPayment[] = [];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [];

export const INITIAL_JOB_VACANCIES: JobVacancy[] = [
  {
    id: 'JV-001',
    tajukJawatan: 'Jururawat Terlatih Dialisis (Post-Basic Renal)',
    kategori: 'JURURAWAT',
    kekosongan: 3,
    kelayakanSingkat: 'Diploma / Ijazah Kejururawatan + Sijil Pos Basik Renal (LJM Berdaftar)',
    gajiAtauFaedah: 'RM3,200 - RM4,800 + Elaun Syif / Perubatan & Bonus',
    lokasi: 'Pusat Dialisis KaizenBros, Semenyih',
    status: 'BUKA',
    keterangan: 'Mengendalikan rawatan hemodialisis pesakit, cannulation AVF/AVG, pemantauan mesin Fresenius RO, dan penyediaan cannulation steril mengikut standard KKM.'
  },
  {
    id: 'JV-002',
    tajukJawatan: 'Jururawat Am / Jururawat Masyarakat (SRN / JM)',
    kategori: 'JURURAWAT',
    kekosongan: 2,
    kelayakanSingkat: 'Sijil / Diploma Kejururawatan (Lembaga Jururawat Malaysia)',
    gajiAtauFaedah: 'RM2,400 - RM3,400 + Latihan Dalam Perkhidmatan Dialisis',
    lokasi: 'Pusat Dialisis KaizenBros, Semenyih',
    status: 'BUKA',
    keterangan: 'Membantu jururawat renal dalam persediaan pesakit, rekod Tanda Vital (BP/Pulse/SpO2), kebersihan stesen dialisis, dan bantuan logistik klinikal.'
  },
  {
    id: 'JV-003',
    tajukJawatan: 'Penolong Pegawai Perubatan (MA Dialisis)',
    kategori: 'PEMBANTU_PERUBATAN',
    kekosongan: 1,
    kelayakanSingkat: 'Diploma Pembantu Perubatan (PPP) Berdaftar Lembaga Pembantu Perubatan',
    gajiAtauFaedah: 'RM2,800 - RM4,000 + Elaun Khas',
    lokasi: 'Pusat Dialisis KaizenBros, Semenyih',
    status: 'BUKA',
    keterangan: 'Mengendalikan prosedur penukaran catheter kecemasan, bantuan penilaian vascular access, serta keselamatan klinikal rawatan harian.'
  },
  {
    id: 'JV-004',
    tajukJawatan: 'Pegawai Pentadbir & Khidmat Pelanggan Dialisis',
    kategori: 'PENTADBIR',
    kekosongan: 1,
    kelayakanSingkat: 'Diploma / SPM dengan Pengalaman Pentadbiran Klinik / Hospital',
    gajiAtauFaedah: 'RM2,000 - RM2,800 + Elaun KWSP/PERKESO',
    lokasi: 'Pusat Dialisis KaizenBros, Semenyih',
    status: 'BUKA',
    keterangan: 'Menguruskan tuntutan penaja PERKESO/JPA/Zakat, pendaftaran pesakit baru, khidmat kaunseling waris, dan sistem notifikasi WhatsApp pusat.'
  }
];

export const INITIAL_JOB_APPLICATIONS: JobApplication[] = [];

export const INITIAL_TOURIST_BOOKINGS: TouristDialysisBooking[] = [
  {
    id: 'TOUR-2026-001',
    nama: 'Datuk Ir. Hashim bin Abdullah',
    noICPasport: '580412-07-5123',
    warganegara: 'Malaysia',
    noTelefon: '012-421 9876',
    emel: 'hashim.abdullah@gmail.com',
    umur: 68,
    jantina: 'LELAKI',
    alamatAsal: 'Georgetown, Pulau Pinang',
    tempatMenginap: 'Bangi Resort Hotel (15 minit ke KaizenBros Semenyih)',
    pusatDialisisAsal: 'Pusat Hemodialisis Hospital Pulau Pinang & Renal Care Bayan Baru',
    namaDoktorPakar: 'Dr. Tan Choon Kiat (Pakar Nefrologi)',
    telefonPusatAsal: '04-644 2200',
    jenisAkses: 'AVF',
    lokasiAkses: 'Left Brachiocephalic (Lengan Kiri Atas)',
    beratKering: 67.5,
    tarikhDialisisTerakhir: '2026-09-06',
    tempohJam: 4.0,
    jenisDialyzer: 'Fresenius FX80 High-Flux',
    antikoagulanHeparin: 'Standard Bolus 2000 IU + 1000 IU/jam',
    statusSerologi: {
      hbsAg: 'NEGATIF',
      antiHCV: 'NEGATIF',
      hiv: 'NEGATIF',
      tarikhUjianSerologi: '2026-08-10'
    },
    tarikhMulaBercuti: '2026-09-12',
    tarikhTamatBercuti: '2026-09-18',
    tarikhSesiDiperlukan: ['2026-09-14', '2026-09-16'],
    pilihanShift: 'PAGI',
    keperluanKhas: 'Menghadiri majlis perkahwinan anak di Semenyih & melawat Bukit Broga. Perlu kerusi rehat dekat pintu.',
    dokumenLampiran: [
      {
        id: 'DOC-TOUR-01',
        namaDokumen: 'Surat_Rujukan_Nefrologi_DrTan_Penang.pdf',
        jenisDokumen: 'SURAT_RUJUKAN',
        tarikhMuatNaik: '2026-09-07',
        saizFile: '1.2 MB',
        nota: 'Surat rujukan rasmi menyatakan kondisi stabil'
      },
      {
        id: 'DOC-TOUR-02',
        namaDokumen: 'Ujian_Serologi_Hepatitis_HIV_Ogos2026.pdf',
        jenisDokumen: 'LAPORAN_DARAH',
        tarikhMuatNaik: '2026-09-07',
        saizFile: '840 KB',
        nota: 'Ujian serologi sah & negatif'
      }
    ],
    status: 'SLOT_DISAHKAN',
    tarikhDaftar: '2026-09-07',
    nomborRujukan: 'KAIZEN-HOLIDAY-2026-001',
    notaKlinikalAdmin: 'Dokumen lengkap & disahkan oleh Sister Hanim. Stesen 3 telah ditempah bagi Sesi Pagi 14 & 16 Sept.',
    stesenDitetapkan: 3,
    jururawatBertugas: 'Sister Hanim binti Othman',
    statusBayaran: 'DEPOSIT_DITERIMA',
    jumlahBayaran: 500
  },
  {
    id: 'TOUR-2026-002',
    nama: 'Puan Siti Rahmah binti Zubir',
    noICPasport: '640915-08-6224',
    warganegara: 'Malaysia',
    noTelefon: '019-552 1133',
    emel: 'sitirahmah.zubir@yahoo.com',
    umur: 62,
    jantina: 'PEREMPUAN',
    alamatAsal: 'Ipoh, Perak',
    tempatMenginap: 'Homestay Tiara Semenyih (5 minit dari pusat)',
    pusatDialisisAsal: 'Klinik Pakar Renal Perak, Ipoh',
    namaDoktorPakar: 'Dr. Roslan bin Jaafar',
    telefonPusatAsal: '05-528 8900',
    jenisAkses: 'AVF',
    lokasiAkses: 'Left Radiocephalic (Pergelangan Tangan Kiri)',
    beratKering: 58.0,
    tarikhDialisisTerakhir: '2026-09-08',
    tempohJam: 4.0,
    jenisDialyzer: 'High-Flux 1.8m2',
    antikoagulanHeparin: 'LMWH Clexane 40mg',
    statusSerologi: {
      hbsAg: 'NEGATIF',
      antiHCV: 'NEGATIF',
      hiv: 'NEGATIF',
      tarikhUjianSerologi: '2026-08-25'
    },
    tarikhMulaBercuti: '2026-09-20',
    tarikhTamatBercuti: '2026-09-24',
    tarikhSesiDiperlukan: ['2026-09-21', '2026-09-23'],
    pilihanShift: 'TENGAHARI',
    keperluanKhas: 'Bercuti bersama cucu di Semenyih & IOI City Mall. Memerlukan bantuan pengangkutan jika hujan.',
    dokumenLampiran: [
      {
        id: 'DOC-TOUR-03',
        namaDokumen: 'Ringkasan_Dialisis_Flowsheet_Perak.pdf',
        jenisDokumen: 'SURAT_RUJUKAN',
        tarikhMuatNaik: '2026-09-08',
        saizFile: '950 KB',
        nota: 'Preskripsi dialisis 3 kali seminggu'
      }
    ],
    status: 'BARU_MENUNGGU_SEMAKAN',
    tarikhDaftar: '2026-09-08',
    nomborRujukan: 'KAIZEN-HOLIDAY-2026-002',
    notaKlinikalAdmin: 'Permohonan baru diterima. Menunggu semakan surat rujukan oleh Pegawai Perubatan.',
    statusBayaran: 'MENUNGGU_PENGESAHAN',
    jumlahBayaran: 500
  }
];
