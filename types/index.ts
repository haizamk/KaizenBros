export type UserRole = 'ADMIN' | 'NEPHROLOGIST' | 'HEAD_NURSE' | 'STAFF_NURSE' | 'PATIENT';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  ic_number: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export type SchedulePattern = 'ISNIN_RABU_JUMAAT' | 'SELASA_KHAMIS_SABTU';
export type ShiftSlot = 'PAGI' | 'TENGAHARI' | 'PETANG'; // 6-10am, 10am-2pm, 2-6pm
export type SessionStatus = 'BELUM_HADIR' | 'SUDAH_HADIR' | 'SEDANG_DIALISIS' | 'SUDAH_SELESAI' | 'BATAL' | 'TIDAK_HADIR';
export type VascularAccess = 'AVF' | 'AVG' | 'PERMACATH' | 'CVC_TEMPORARY';
export type SponsorType = 'PERKESO_SOCSO' | 'JPA_KWAP' | 'ZAKAT_SELANGOR' | 'BAITULMAL_MAIWP' | 'NKF' | 'INSURANS_SWASTA' | 'PERSENDIRIAN';

export interface DialysisChair {
  id: number;
  chair_number: string; // e.g., 'B-01' through 'B-12'
  bay: string; // 'BAY_A', 'BAY_B', 'ISOLATION'
  is_active: boolean;
  notes?: string;
}

export interface DialysisMachine {
  id: number;
  serial_number: string;
  brand_model: string; // e.g., 'Fresenius 4008S NG', 'Fresenius 5008S CorDiax'
  chair_id: number;
  chair_number?: string;
  online_hdf_capable: boolean;
  status: 'OPERATIONAL' | 'IN_USE' | 'MAINTENANCE';
  last_service_date: string;
  next_service_date: string;
}

export interface Patient {
  id: number;
  patient_id_code: string; // e.g., 'P00123'
  name: string;
  ic_number: string;
  phone: string;
  email?: string;
  age: number;
  gender: 'LELAKI' | 'PEREMPUAN';
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  next_of_kin_relation: string;
  dry_weight_kg: number;
  latest_weight_kg?: number;
  latest_bp?: string;
  vascular_access: VascularAccess;
  access_location: string;
  sponsor: SponsorType;
  sponsor_ref_no?: string;
  schedule_pattern: SchedulePattern;
  preferred_shift: ShiftSlot;
  assigned_chair: string;
  allergies?: string;
  comorbidities: string[];
  hepatitis_status: {
    hbs_ag: 'NEGATIF' | 'POSITIF';
    anti_hcv: 'NEGATIF' | 'POSITIF';
    hiv: 'NEGATIF' | 'POSITIF';
  };
  is_active: boolean;
  created_at: string;
}

export interface Nurse {
  id: number;
  user_id: number;
  staff_id_code: string; // 'N-101'
  name: string;
  title: string; // 'Ketua Jururawat (Sister)' or 'Jururawat Terlatih'
  nursing_board_no: string; // LJM Registration
  phone: string;
  assigned_bay?: string;
  shift_today: ShiftSlot;
  is_on_duty: boolean;
}

export interface VitalSign {
  id: number;
  dialysis_session_id: number;
  recorded_at: string;
  phase: 'PRE_DIALYSIS' | 'HOURLY' | 'POST_DIALYSIS';
  systolic_bp: number;
  diastolic_bp: number;
  pulse_rate: number;
  respiratory_rate?: number;
  temperature?: number;
  uf_rate_ml_hr?: number;
  blood_flow_rate_qb?: number;
  dialysate_flow_rate_qd?: number;
  venous_pressure?: number;
  transmembrane_pressure?: number;
  nurse_name: string;
}

export interface DialysisSession {
  id: number;
  session_code: string; // 'SES-20260925-01'
  patient_id: number;
  patient_id_code: string;
  patient_name: string;
  chair_id: number;
  chair_number: string;
  machine_id: number;
  machine_model: string;
  scheduled_date: string;
  scheduled_shift: ShiftSlot;
  scheduled_time: string; // '06:00', '10:00', '14:00'
  actual_start_time?: string;
  actual_end_time?: string;
  status: SessionStatus;
  
  // Weights (kg)
  pre_weight_kg?: number;
  post_weight_kg?: number;
  dry_weight_kg: number;
  target_uf_litres?: number;
  actual_uf_litres?: number;
  
  // Blood Pressure
  pre_bp?: string; // '148/82'
  current_bp?: string;
  post_bp?: string;
  
  dialyzer_type?: string; // e.g. 'Fresenius FX80 Cordiax'
  anticoagulant?: string; // e.g. 'Heparin 2000 IU bolus, 1000 IU/hr'
  nurse_in_charge: string;
  notes?: string;
  vital_signs: VitalSign[];
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: number;
  name: string; // e.g. 'Erythropoietin (EPO)', 'Venofer (Iron Sucrose)', 'Amlodipine'
  type: 'DIALYSIS_IV' | 'ORAL_DAILY' | 'PHOSPHATE_BINDER' | 'VITAMIN';
  dosage: string;
  instructions: string;
}

export interface PatientMedication {
  id: number;
  patient_id: number;
  medication_id: number;
  medication_name: string;
  dosage: string;
  frequency: string; // 'Setiap sesi dialisis', '1x sehari pagi', 'Bersama makanan'
  route: 'IV' | 'ORAL' | 'SUBCUTANEOUS';
  is_active: boolean;
}

export interface ClinicalNote {
  id: number;
  patient_id: number;
  dialysis_session_id?: number;
  author_name: string;
  author_role: string;
  note_type: 'ROUTINE' | 'INCIDENT' | 'VASCULAR_ACCESS' | 'DOCTOR_ORDER';
  content: string;
  created_at: string;
}

export interface ActionableAlert {
  id: number;
  patient_id: number;
  patient_name: string;
  chair_number?: string;
  session_id?: number;
  alert_type: 'BP_INCOMPLETE' | 'POST_WEIGHT_MISSING' | 'HIGH_PRE_WEIGHT' | 'HYPOTENSION' | 'MACHINE_ALERT';
  message: string;
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  is_resolved: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: number | string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface DailyReportSummary {
  date: string;
  total_patients: number;
  attended: number;
  in_progress: number;
  completed: number;
  pending: number;
  no_show: number;
  cancelled: number;
  total_fluid_removed_litres: number;
}

export interface PatientRegistrationDoc {
  name: string;
  type: string;
  size: string;
  data_url?: string;
}

export interface NewRegistration {
  id: string; // e.g. 'KB-REG-847291'
  full_name: string;
  ic_number: string;
  phone_number: string;
  email?: string;
  age: number | string;
  gender: string;
  address: string;
  city: string;
  state: string;
  patient_category: string;
  medical_notes?: string;
  document?: PatientRegistrationDoc;
  sponsor_type?: string;
  preferred_days?: string;
  preferred_shift?: string;
  assigned_chair?: string;
  status: 'BARU' | 'DISEMAK' | 'DILULUSKAN' | 'DITOLAK';
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}
