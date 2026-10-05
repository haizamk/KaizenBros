import { Patient, DialysisSession, PatientMedication, AuditLog, PatientCheckIn, NewRegistration, Nurse, DialysisChair, DialysisMachine, ActionableAlert, CentreProfile, DailyReportSummary } from '@/types';

export const VERIFIED_CENTRE_INFO: CentreProfile = {
  name: 'Pusat Dialisis KaizenBros Semenyih',
  brand: 'KaizenBros Dialysis',
  slogan: 'Rawatan Hemodialisis Berkualiti & Mesra Pesakit',
  kkm_license: 'KKM/BPFK/78219/2024',
  established_date: '2020-01-01',
  address: 'No. 27 & 29G, Jalan 5/10, Seksyen 5, Bandar Rinching, 43500 Semenyih, Selangor, Malaysia',
  city: 'Semenyih',
  postcode: '43500',
  state: 'Selangor, Malaysia',
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

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_TODAY_SESSIONS: DialysisSession[] = [];

export const INITIAL_PATIENT_MEDICATIONS: PatientMedication[] = [];

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

export const INITIAL_MEDICAL_RECORDS: any[] = [];

