import { 
  Patient, 
  DialysisSession, 
  DialysisChair, 
  DialysisMachine, 
  Nurse, 
  ActionableAlert, 
  AuditLog, 
  PatientMedication, 
  DailyReportSummary, 
  NewRegistration, 
  PatientCheckIn,
  CentreProfile
} from '@/types';

export const INITIAL_REGISTRATIONS: NewRegistration[] = [
  {
    id: 'KB-REG-847291',
    full_name: 'Zulkifli bin Hashim',
    ic_number: '681120-10-5311',
    phone_number: '017-6543210',
    email: 'zulkifli68@gmail.com',
    age: 58,
    gender: 'Lelaki',
    address: 'No 45, Jalan Rinching Indah 3, 43500 Semenyih, Selangor',
    city: 'Semenyih',
    state: 'Selangor',
    patient_category: 'Pesakit Baru Dialisis',
    medical_notes: 'Mempunyai surat rujukan dari Hospital Kajang. AV Fistula di lengan kiri.',
    document: {
      name: 'Surat_Rujukan_Doctor_Hosp_Kajang.pdf',
      type: 'application/pdf',
      size: '1.2 MB'
    },
    sponsor_type: 'PERKESO / SOCSO',
    preferred_days: 'Isnin, Rabu, Jumaat',
    preferred_shift: 'Syif 1: Pagi (5:30 AM - 3:00 PM)',
    status: 'BARU',
    admin_notes: 'Menunggu pengesahan keputusan darah Hepatitis B/C. Stesen kerusi akan ditugaskan semasa tiba mengikut FCFS.',
    created_at: '2026-09-28 10:15:00'
  },
  {
    id: 'KB-REG-391024',
    full_name: 'Mariam binti Ahmad',
    ic_number: '750314-10-6022',
    phone_number: '012-9988776',
    email: 'mariam.ahmad@yahoo.com',
    age: 51,
    gender: 'Perempuan',
    address: 'No 12, Taman Pelangi Semenyih, 43500 Semenyih, Selangor',
    city: 'Semenyih',
    state: 'Selangor',
    patient_category: 'Pertukaran dari Pusat Dialisis Lain',
    medical_notes: 'Tukar dari pusat dialisis Seremban kerana berpindah rumah ke Semenyih.',
    document: {
      name: 'Keputusan_Darah_Hepatitis.jpg',
      type: 'image/jpeg',
      size: '850 KB'
    },
    sponsor_type: 'Lembaga Zakat Selangor (LZS)',
    preferred_days: 'Selasa, Khamis, Sabtu',
    preferred_shift: 'Syif 2: Petang (12:00 PM - 8:00 PM)',
    status: 'DISEMAK',
    admin_notes: 'Dokumen zakat disahkan lengkap oleh pegawai LZS.',
    created_at: '2026-09-27 14:40:00'
  }
];

export const VERIFIED_CENTRE_INFO: CentreProfile = {
  name: 'Pusat Dialisis KaizenBros',
  brand: 'KaizenBros Dialysis Centre',
  slogan: 'Kecemerlangan Rawatan Hemodialisis & Kasih Sayang Demi Kualiti Hidup Pesakit',
  kkm_license: 'KKM/BPP/2023/HD-8491',
  established_date: '15 Januari 2021',
  address: '27 & 29G, Jalan 5/10, Seksyen 5 Bandar Rinching, 43500 Semenyih, Selangor',
  city: 'Semenyih',
  postcode: '43500',
  state: 'Selangor',
  phone_main: '03-87270791',
  hotline_24h: '019-338 9922',
  whatsapp_number: '60193389922',
  email: 'admin@kaizenbrosdialysis.com.my',
  medical_director: 'Dr. Azman bin Khairuddin (Pakar Nefrologi)',
  head_nurse: 'Sister Siti Fatimah binti Rahman (LJM-34892)',
  operating_hours: [
    { days: 'Isnin - Sabtu', time: '5:30 Pagi - 8:00 Malam (2 Syif Klinikal: 5:30am - 3:00pm & 12:00pm - 8:00pm)' },
    { days: 'Ahad', time: 'Tutup (Kecemasan On-Call Sahaja)' }
  ],
  capacity_machines: 12,
  machine_model: 'Fresenius Medical Care 4008S NG & 5008S CorDiax (Online HDF Ready)',
  water_system: 'Sistem Rawatan Air Double Pass Reverse Osmosis (RO) Berstandard AAMI/ISO 23500',
  panels: [
    'PERKESO / SOCSO (Panel Berdaftar)',
    'JPA / KWAP (Pesara Kerajaan Malaysia)',
    'Lembaga Zakat Selangor (LZS)',
    'Baitulmal MAIWP',
    'Yayasan Buah Pinggang Kebangsaan (NKF)',
    'Insurans Swasta (Prudential, Great Eastern, AIA, Allianz, Etiqa)'
  ]
};

export const INITIAL_CHAIRS: DialysisChair[] = Array.from({ length: 12 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  const chairNo = `B-${num}`;
  const bay = i < 6 ? 'BAY_A' : i < 11 ? 'BAY_B' : 'ISOLATION';
  return {
    id: i + 1,
    chair_number: chairNo,
    bay,
    is_active: true,
    notes: i === 11 ? 'Bilik Pengasingan Khas (Hepatitis B/C Dedicated)' : `Stesen Hemodialisis ${chairNo}`
  };
});

export const INITIAL_MACHINES: DialysisMachine[] = Array.from({ length: 12 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  return {
    id: i + 1,
    serial_number: `FMC-2024-${8900 + i}`,
    brand_model: i % 3 === 0 ? 'Fresenius 5008S CorDiax (Online HDF)' : 'Fresenius 4008S NG',
    chair_id: i + 1,
    chair_number: `B-${num}`,
    online_hdf_capable: i % 3 === 0,
    status: 'OPERATIONAL',
    last_service_date: '2026-08-15',
    next_service_date: '2026-11-15'
  };
});

export const INITIAL_NURSES: Nurse[] = [
  {
    id: 1,
    user_id: 101,
    staff_id_code: 'SN-01',
    name: 'Sister Siti Fatimah binti Rahman',
    title: 'Ketua Jururawat Klinikal (Sister)',
    nursing_board_no: 'LJM-34892',
    phone: '012-3456789',
    assigned_bay: 'BAY_A',
    shift_today: 'PAGI',
    is_on_duty: true
  },
  {
    id: 2,
    user_id: 102,
    staff_id_code: 'SN-02',
    name: 'Staff Nurse Faridah binti Kassim',
    title: 'Jururawat Hemodialisis Kanan',
    nursing_board_no: 'LJM-41209',
    phone: '013-8899123',
    assigned_bay: 'BAY_B',
    shift_today: 'PETANG',
    is_on_duty: true
  },
  {
    id: 3,
    user_id: 103,
    staff_id_code: 'SN-03',
    name: 'Staff Nurse Mohd Razak bin Ismail',
    title: 'Jururawat Hemodialisis',
    nursing_board_no: 'LJM-55210',
    phone: '017-9921443',
    assigned_bay: 'BAY_A',
    shift_today: 'PAGI',
    is_on_duty: true
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 1,
    patient_id_code: 'P00123',
    name: 'Khairul Haizam bin Mohd Radzi',
    ic_number: '740815-10-5421',
    phone: '012-3456789',
    email: 'khairul.haizam@gmail.com',
    age: 52,
    gender: 'LELAKI',
    blood_group: 'O+',
    address: 'No. 18, Jalan TTS 2/4, Taman Tasik Semenyih, 43500 Semenyih, Selangor',
    next_of_kin_name: 'Noraini binti Yusof',
    next_of_kin_phone: '012-9876543',
    next_of_kin_relation: 'Isteri',
    dry_weight_kg: 68.5,
    latest_weight_kg: 70.2,
    latest_bp: '135/85',
    vascular_access: 'AVF',
    access_location: 'Lengan Kiri (Radiocephalic)',
    sponsor: 'PERKESO_SOCSO',
    sponsor_ref_no: 'SOCSO-892144-K',
    schedule_pattern: 'SELASA_KHAMIS_SABTU',
    preferred_shift: 'SYIF_3',
    allergies: 'Tiada',
    comorbidities: ['Hipertensi', 'Diabetes Mellitus Jenis 2'],
    hepatitis_status: {
      hbs_ag: 'NEGATIF',
      anti_hcv: 'NEGATIF',
      hiv: 'NEGATIF'
    },
    is_active: true,
    created_at: '2024-01-15'
  },
  {
    id: 2,
    patient_id_code: 'P00104',
    name: 'Siti Aminah binti Hassan',
    ic_number: '680320-10-5892',
    phone: '019-3389922',
    email: 'siti.aminah@yahoo.com',
    age: 58,
    gender: 'PEREMPUAN',
    blood_group: 'A+',
    address: 'No. 45, Jalan Semenyih Mewah 3, 43500 Semenyih, Selangor',
    next_of_kin_name: 'Mohd Faiz bin Razali',
    next_of_kin_phone: '019-4455667',
    next_of_kin_relation: 'Anak',
    dry_weight_kg: 54.0,
    latest_weight_kg: 55.6,
    latest_bp: '128/80',
    vascular_access: 'AVF',
    access_location: 'Lengan Kanan (Brachiocephalic)',
    sponsor: 'JPA_KERAJAAN',
    sponsor_ref_no: 'JPA-7721-P',
    schedule_pattern: 'SELASA_KHAMIS_SABTU',
    preferred_shift: 'SYIF_3',
    allergies: 'Penicillin',
    comorbidities: ['Hipertensi'],
    hepatitis_status: {
      hbs_ag: 'NEGATIF',
      anti_hcv: 'NEGATIF',
      hiv: 'NEGATIF'
    },
    is_active: true,
    created_at: '2024-02-10'
  },
  {
    id: 3,
    patient_id_code: 'P00108',
    name: 'Ahmad Albab bin Kassim',
    ic_number: '631105-08-5119',
    phone: '013-8899123',
    email: 'ahmad.albab@gmail.com',
    age: 63,
    gender: 'LELAKI',
    blood_group: 'B+',
    address: 'Lot 102, Kampung Rinching Ulu, 43500 Semenyih, Selangor',
    next_of_kin_name: 'Zainab binti Omar',
    next_of_kin_phone: '013-7711223',
    next_of_kin_relation: 'Isteri',
    dry_weight_kg: 72.0,
    latest_weight_kg: 74.2,
    latest_bp: '142/88',
    vascular_access: 'AVG',
    access_location: 'Lengan Kiri (Loop Graft)',
    sponsor: 'ZAKAT_MAIWP',
    sponsor_ref_no: 'ZKT-9012-S',
    schedule_pattern: 'SELASA_KHAMIS_SABTU',
    preferred_shift: 'SYIF_2',
    allergies: 'Tiada',
    comorbidities: ['Hipertensi', 'Penyakit Arteri Koronari'],
    hepatitis_status: {
      hbs_ag: 'NEGATIF',
      anti_hcv: 'NEGATIF',
      hiv: 'NEGATIF'
    },
    is_active: true,
    created_at: '2024-03-01'
  },
  {
    id: 4,
    patient_id_code: 'P00115',
    name: 'Tan Mei Ling',
    ic_number: '760512-14-5330',
    phone: '016-2233445',
    email: 'meiling.tan@hotmail.com',
    age: 50,
    gender: 'PEREMPUAN',
    blood_group: 'AB+',
    address: 'No. 8, Jalan Hillpark 2/1, Bandar Hillpark, 43500 Semenyih',
    next_of_kin_name: 'Tan Wei Kang',
    next_of_kin_phone: '016-9988776',
    next_of_kin_relation: 'Abang',
    dry_weight_kg: 51.5,
    latest_weight_kg: 53.0,
    latest_bp: '124/78',
    vascular_access: 'AVF',
    access_location: 'Lengan Kiri',
    sponsor: 'PERKESO_SOCSO',
    sponsor_ref_no: 'SOCSO-44512-T',
    schedule_pattern: 'ISNIN_RABU_JUMAAT',
    preferred_shift: 'SYIF_1',
    allergies: 'Tiada',
    comorbidities: ['Glomerulonefritis'],
    hepatitis_status: {
      hbs_ag: 'NEGATIF',
      anti_hcv: 'NEGATIF',
      hiv: 'NEGATIF'
    },
    is_active: true,
    created_at: '2024-04-12'
  }
];

export const INITIAL_TODAY_SESSIONS: DialysisSession[] = [];

export const INITIAL_ACTIONABLE_ALERTS: ActionableAlert[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    user_name: 'Staff Nurse Faridah',
    user_role: 'STAFF_NURSE',
    action: 'MULAKAN_SESI',
    entity_type: 'dialysis_sessions',
    entity_id: 1,
    details: 'Check-in pesakit Ahmad bin Ali (P00123) di kerusi B-08, Berat: 76.4kg, BP: 148/82',
    ip_address: '192.168.1.42',
    created_at: '2026-09-25 14:05:12'
  },
  {
    id: 2,
    user_name: 'Sister Siti Fatimah',
    user_role: 'HEAD_NURSE',
    action: 'TAMATKAN_SESI',
    entity_type: 'dialysis_sessions',
    entity_id: 2,
    details: 'Selesai sesi Siti Aminah (P00104) di kerusi B-02, UF: 1.8L',
    ip_address: '192.168.1.10',
    created_at: '2026-09-25 10:10:45'
  },
  {
    id: 3,
    user_name: 'Dr. Azman bin Khairuddin',
    user_role: 'NEPHROLOGIST',
    action: 'KEMASKINI_BERAT_KERING',
    entity_type: 'patients',
    entity_id: 1,
    details: 'Pelarasan berat kering Ahmad bin Ali dari 75.5kg ke 75.0kg selepas klinikal re-evaluation',
    ip_address: '192.168.1.5',
    created_at: '2026-09-24 16:30:00'
  },
  {
    id: 4,
    user_name: 'Admin Pentadbir',
    user_role: 'ADMIN',
    action: 'LOG_MASUK',
    entity_type: 'users',
    entity_id: 1,
    details: 'Log masuk pentadbir ke sistem KaizenBros Web Console',
    ip_address: '192.168.1.1',
    created_at: '2026-09-25 07:45:00'
  }
];

export const INITIAL_PATIENT_MEDICATIONS: PatientMedication[] = [
  {
    id: 1,
    patient_id: 1,
    medication_id: 1,
    medication_name: 'Erythropoietin (EPO / Recormon)',
    dosage: '4,000 IU',
    frequency: '1x seminggu (Sesi Jumaat)',
    route: 'SUBCUTANEOUS',
    is_active: true
  },
  {
    id: 2,
    patient_id: 1,
    medication_id: 2,
    medication_name: 'Venofer (Iron Sucrose)',
    dosage: '100 mg IV',
    frequency: '2 minggu sekali semasa dialisis',
    route: 'IV',
    is_active: true
  },
  {
    id: 3,
    patient_id: 1,
    medication_id: 3,
    medication_name: 'Calcium Carbonate',
    dosage: '500 mg',
    frequency: '3x sehari bersama hidangan utama (Phosphate Binder)',
    route: 'ORAL',
    is_active: true
  },
  {
    id: 4,
    patient_id: 1,
    medication_id: 4,
    medication_name: 'Amlodipine',
    dosage: '10 mg',
    frequency: '1x sehari setiap malam (Tekanan Darah)',
    route: 'ORAL',
    is_active: true
  },
  {
    id: 5,
    patient_id: 1,
    medication_id: 5,
    medication_name: 'B-Complex & Folic Acid',
    dosage: '1 tablet',
    frequency: '1x sehari pagi (Vitamin Buah Pinggang)',
    route: 'ORAL',
    is_active: true
  }
];

export const INITIAL_DAILY_SUMMARY: DailyReportSummary = {
  date: '2026-09-25',
  total_patients: 0,
  attended: 0,
  in_progress: 0,
  completed: 0,
  pending: 0,
  no_show: 0,
  cancelled: 0,
  total_fluid_removed_litres: 0
};

export const INITIAL_CHECK_INS: PatientCheckIn[] = [];
