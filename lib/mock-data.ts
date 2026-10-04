import { Patient, DialysisSession, PatientMedication, AuditLog, PatientCheckIn, NewRegistration, Nurse, DialysisChair, DialysisMachine, ActionableAlert, CentreProfile, DailyReportSummary } from '@/types';

export const VERIFIED_CENTRE_INFO: CentreProfile = {
  name: 'Pusat Dialisis KaizenBros Semenyih',
  brand: 'KaizenBros Dialysis',
  slogan: 'Rawatan Hemodialisis Berkualiti & Mesra Pesakit',
  kkm_license: 'KKM/BPFK/78219/2024',
  established_date: '2020-01-01',
  address: 'No. 18-G & 20-G, Jalan Eco Hill 1/1A, Setia Ecohill',
  city: 'Semenyih',
  postcode: '43500',
  state: 'Selangor',
  phone_main: '03-8727 8899',
  hotline_24h: '019-388 9922',
  email: 'klinik@kaizenbros.com.my',
  whatsapp_number: '60193889922',
  operating_hours: [
    { days: 'Isnin - Sabtu', time: '5:30 AM - 8:00 PM' },
    { days: 'Ahad', time: 'Panggilan Kecemasan Sahaja' }
  ],
  capacity_machines: 12,
  machine_model: 'Fresenius 4008S NG / 5008S HDF',
  water_system: 'Double Pass Reverse Osmosis System',
  panels: ['PERKESO / SOCSO', 'JPA / KWAP', 'Zakat Selangor', 'BAITULMAL', 'NKF'],
  medical_director: 'Dr. Ahmad Farhan bin Mohamad (Nefrologi)',
  head_nurse: 'Sister Siti Fatimah binti Rosli (SRN)',
};

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 1,
    patient_id_code: 'P-1001',
    name: 'Encik Tan Ah Kow',
    ic_number: '580412-10-5231',
    phone: '012-3456789',
    email: 'tan.ahkow@gmail.com',
    age: 68,
    gender: 'LELAKI',
    blood_group: 'O+',
    address: 'No 45, Jalan Ecohill 2/3, Setia Ecohill, 43500 Semenyih, Selangor',
    emergency_contact: '012-9876543 (Tan Wei Ming - Anak)',
    next_of_kin_name: 'Tan Wei Ming',
    next_of_kin_phone: '012-9876543',
    next_of_kin_relation: 'Anak Lelaki',
    dry_weight_kg: 68.5,
    latest_weight_kg: 70.2,
    latest_bp: '138/82',
    vascular_access: 'AV Fistula (L Arm)',
    access_location: 'Limb Kiri - Brachiocephalic',
    sponsor: 'PERKESO_SOCSO',
    sponsor_ref_no: 'SOCSO-KL-2021-9982',
    schedule_pattern: 'ISNIN_RABU_JUMAAT',
    preferred_shift: 'PAGI',
    comorbidities: ['Hipertensi', 'Kencing Manis Type 2'],
    hepatitis_status: { hbs_ag: 'NEGATIF', anti_hcv: 'NEGATIF', hiv: 'NEGATIF' },
    is_active: true,
    created_at: '2022-03-15',
    assigned_chair: 'A-01',
    next_dialysis_date: '2026-10-05',
    next_dialysis_day: 'Isnin',
    next_dialysis_time: '07:00 AM - 11:00 AM',
    next_dialysis_shift: 'PAGI'
  },
  {
    id: 2,
    patient_id_code: 'P-1002',
    name: 'Puan Halimah binti Sidek',
    ic_number: '650821-08-5542',
    phone: '019-8765432',
    email: 'halimah.sidek@yahoo.com',
    age: 61,
    gender: 'PEREMPUAN',
    blood_group: 'A+',
    address: 'No 12, Jalan Bandar Rinching 5/2, 43500 Semenyih, Selangor',
    emergency_contact: '013-2211445 (Ahmad Rizal - Suami)',
    next_of_kin_name: 'Ahmad Rizal',
    next_of_kin_phone: '013-2211445',
    next_of_kin_relation: 'Suami',
    dry_weight_kg: 55.0,
    latest_weight_kg: 56.8,
    latest_bp: '124/78',
    vascular_access: 'AV Graft (R Forearm)',
    access_location: 'Limb Kanan - Loop Graft',
    sponsor: 'JPA_KWAP',
    sponsor_ref_no: 'JPA-PEN-5542',
    schedule_pattern: 'ISNIN_RABU_JUMAAT',
    preferred_shift: 'PAGI',
    comorbidities: ['Hipertensi'],
    hepatitis_status: { hbs_ag: 'NEGATIF', anti_hcv: 'NEGATIF', hiv: 'NEGATIF' },
    is_active: true,
    created_at: '2023-01-10',
    assigned_chair: 'A-02',
    next_dialysis_date: '2026-10-05',
    next_dialysis_day: 'Isnin',
    next_dialysis_time: '07:00 AM - 11:00 AM',
    next_dialysis_shift: 'PAGI'
  }
];

export const INITIAL_TODAY_SESSIONS: DialysisSession[] = [
  {
    id: 501,
    patient_id: 1,
    patient_id_code: 'P-1001',
    patient_name: 'Encik Tan Ah Kow',
    chair_id: 1,
    chair_number: 'A-01',
    scheduled_date: '2026-10-03',
    scheduled_time: '07:00 AM',
    actual_start_time: '07:15 AM',
    start_timestamp: Date.now() - (2.5 * 3600 * 1000),
    status: 'SEDANG_DIALISIS',
    dry_weight_kg: 68.5,
    pre_weight_kg: 70.2,
    target_uf_litres: 1.7,
    pre_bp: '138/82',
    current_bp: '132/80',
    dialyzer_type: 'Fresenius FX80 Cordiax',
    anticoagulant: 'Heparin 2000 IU',
    nurse_in_charge: 'Sister Siti Fatimah',
    created_at: '2026-10-03T07:00:00Z'
  }
];

export const INITIAL_PATIENT_MEDICATIONS: PatientMedication[] = [
  { id: 1, patient_id: 1, medication_name: 'Erythropoietin (EPO Injection)', dosage: '4000 IU', frequency: '2x Seminggu (Masa Dialisis)', route: 'Subcut/IV', is_active: true },
  { id: 2, patient_id: 1, medication_name: 'Calcium Carbonate (Phosphate Binder)', dosage: '500mg', frequency: '3x Sehari (Bersama Makanan)', route: 'Lisan', is_active: true }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_CHECK_INS: PatientCheckIn[] = [];

export const INITIAL_REGISTRATIONS: NewRegistration[] = [];

export const INITIAL_NURSES: Nurse[] = [
  { id: 1, user_id: 101, staff_id_code: 'N-201', name: 'Sister Siti Fatimah binti Rosli', title: 'Sister', nursing_board_no: 'RN-88219', phone: '019-3889922', assigned_bay: 'BAY_A', shift_today: 'PAGI', is_on_duty: true }
];

export const INITIAL_CHAIRS: DialysisChair[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  chair_number: i < 6 ? `A-0${i + 1}` : `B-0${i - 5}`,
  bay: i < 6 ? 'BAY_A' : 'BAY_B',
  is_active: true
}));

export const INITIAL_MACHINES: DialysisMachine[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  serial_number: `FRES-4008-${1000 + i}`,
  brand_model: 'Fresenius 4008S NG',
  chair_id: i + 1,
  chair_number: i < 6 ? `A-0${i + 1}` : `B-0${i - 5}`,
  online_hdf_capable: true,
  status: 'OPERATIONAL'
}));

export const INITIAL_ACTIONABLE_ALERTS: ActionableAlert[] = [];

export const INITIAL_DAILY_SUMMARY: DailyReportSummary = {
  date: '2026-10-03',
  total_patients: 12,
  attended: 12,
  in_progress: 2,
  completed: 10,
  pending: 0,
  no_show: 0,
  cancelled: 0,
  total_fluid_removed_litres: 28.4
};
