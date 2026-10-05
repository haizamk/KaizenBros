export type SessionStatus = 
  | 'BELUM_HADIR' 
  | 'SUDAH_HADIR' 
  | 'SEDANG_DIALISIS' 
  | 'SELESAI' 
  | 'SUDAH_SELESAI' 
  | 'GAGAL_HABIS_DIALISIS'
  | 'TAMAT_AWAL'
  | 'BATAL' 
  | 'MENUNGGU_GILIRAN';

export type ShiftSlot = 'PAGI' | 'PETANG' | 'MALAM' | 'SYIF_1' | 'SYIF_2' | 'SYIF_3' | string;

export type SponsorType = 
  | 'PERKESO_SOCSO' 
  | 'JPA_KWAP' 
  | 'ZAKAT_SELANGOR' 
  | 'BAITULMAL_MAIWP' 
  | 'NKF' 
  | 'INSURANS_SWASTA' 
  | 'PERSENDIRIAN' 
  | string;

export interface VitalSign {
  id: number;
  dialysis_session_id?: number;
  recorded_at: string;
  phase: 'PRE_DIALYSIS' | 'HOURLY_1' | 'HOURLY_2' | 'HOURLY_3' | 'POST_DIALYSIS' | string;
  systolic_bp: number;
  diastolic_bp: number;
  pulse_rate: number;
  nurse_name?: string;
  notes?: string;
}

export interface DialysisSession {
  id: number;
  session_code?: string;
  patient_id: number;
  patient_id_code: string;
  patient_name: string;
  chair_id?: number;
  chair_number?: string;
  machine_id?: number;
  machine_model?: string;
  scheduled_date: string;
  scheduled_shift?: string;
  shift?: string;
  scheduled_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  start_timestamp?: number;
  auto_completed?: boolean;
  status_reason?: string;
  status: SessionStatus;
  dry_weight_kg: number;
  pre_weight_kg?: number;
  post_weight_kg?: number;
  target_uf_litres?: number;
  actual_uf_litres?: number;
  pre_bp?: string;
  post_bp?: string;
  current_bp?: string;
  dialyzer_type?: string;
  anticoagulant?: string;
  nurse_in_charge?: string;
  nurse_name?: string;
  vital_signs?: VitalSign[];
  doctor_notes?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Patient {
  id: number;
  user_id?: number;
  patient_id_code: string;
  name: string;
  ic_number: string;
  phone: string;
  email?: string;
  age: number | string;
  gender: 'LELAKI' | 'PEREMPUAN' | string;
  blood_group: string;
  address: string;
  emergency_contact?: string;
  registered_date?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relation?: string;
  dry_weight_kg: number;
  latest_weight_kg: number;
  latest_bp: string;
  vascular_access: string;
  access_location: string;
  sponsor: string;
  sponsor_ref_no?: string;
  schedule_pattern: string;
  preferred_shift: string;
  allergies?: string;
  comorbidities?: string[];
  hepatitis_status?: {
    hbs_ag: string;
    anti_hcv: string;
    hiv: string;
  };
  is_active: boolean;
  created_at: string;
  assigned_chair?: string;
  next_dialysis_date?: string;
  next_dialysis_day?: string;
  next_dialysis_time?: string;
  next_dialysis_shift?: string;
  next_dialysis_iso?: string;
  next_dialysis_status?: string;
}

export interface DialysisChair {
  id: number;
  chair_number: string;
  bay: 'BAY_A' | 'BAY_B' | 'ISOLATION' | string;
  is_active: boolean;
  notes?: string;
}

export interface DialysisMachine {
  id: number;
  serial_number: string;
  brand_model: string;
  chair_id: number;
  chair_number: string;
  online_hdf_capable: boolean;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE' | string;
  last_service_date?: string;
  next_service_date?: string;
  notes?: string;
}

export interface Nurse {
  id: number;
  user_id: number;
  staff_id_code: string;
  name: string;
  title: string;
  nursing_board_no: string;
  phone: string;
  assigned_bay: string;
  shift_today: string;
  is_on_duty: boolean;
}

export interface ActionableAlert {
  id: number | string;
  patient_name: string;
  chair_number: string;
  message: string;
  session_id?: number;
  alert_type?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at?: string;
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

export interface PatientMedication {
  id: number;
  patient_id: number;
  medication_id?: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  route: string;
  is_active: boolean;
  notes?: string;
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
  dataUrl?: string;
  data_url?: string;
  category?: string;
  uploaded_at?: string;
}

export interface NewRegistration {
  id: string;
  full_name: string;
  ic_number: string;
  phone_number: string;
  email: string;
  age: number | string;
  gender: string;
  address: string;
  city: string;
  state: string;
  patient_category: string;
  medical_notes?: string;
  nok_name?: string;
  nok_relationship?: string;
  nok_phone?: string;
  nok_email?: string;
  document?: PatientRegistrationDoc;
  sponsor_type?: string;
  preferred_days?: string;
  preferred_shift?: string;
  assigned_chair?: string;
  status: 'BARU' | 'DISEMAK' | 'DITERIMA' | 'DITOLAK' | string;
  admin_notes?: string;
  created_at: string;
}

export interface PatientCheckIn {
  id: string;
  patient_id: number;
  patient_id_code: string;
  patient_name: string;
  queue_number: string;
  check_in_time: string;
  check_in_timestamp: number;
  shift: string;
  status: 'MENUNGGU_GILIRAN' | 'SEDANG_RAWATAN' | 'SEDANG_DIALISIS' | 'SELESAI' | string;
  assigned_chair?: string;
  assigned_machine_model?: string;
  pre_weight_kg: number;
  post_weight_kg?: number;
  dry_weight_kg: number;
  pre_bp: string;
  post_bp?: string;
  notes: string;
}

export interface CentreProfile {
  name: string;
  brand: string;
  slogan: string;
  kkm_license: string;
  established_date: string;
  address: string;
  city: string;
  postcode: string;
  state: string;
  phone_main: string;
  hotline_24h: string;
  whatsapp_number: string;
  email: string;
  medical_director: string;
  head_nurse: string;
  operating_hours: Array<{ days: string; time: string }>;
  capacity_machines: number;
  machine_model: string;
  water_system: string;
  panels: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'HEAD_NURSE' | 'STAFF_NURSE' | 'NEPHROLOGIST' | 'STAFF' | string;
  phone: string;
  ic_number: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface BloodResults {
  hematology?: {
    hemoglobin?: string | number;
    wbc?: string | number;
    platelet?: string | number;
  };
  renal?: {
    urea?: string | number;
    creatinine?: string | number;
    egfr?: string | number;
    calcium?: string | number;
    phosphate?: string | number;
    potassium?: string | number;
    sodium?: string | number;
  };
  diabetes?: {
    glucose?: string | number;
    hba1c?: string | number;
  };
  lipid?: {
    cholesterol?: string | number;
    ldl?: string | number;
    hdl?: string | number;
    triglycerides?: string | number;
  };
  other_tests?: Array<{
    test_name: string;
    result: string;
    unit: string;
    range?: string;
    status?: 'NORMAL' | 'HIGH' | 'LOW' | 'NEEDS_REVIEW' | string;
  }>;
}

export interface MedicalRecord {
  id: string | number;
  patient_id: number;
  patient_id_code: string;
  patient_name: string;
  examination_date: string;
  examination_type: 'Pemeriksaan Berkala 3 Bulan' | 'Pemeriksaan Tahunan' | 'Pemeriksaan Khas' | string;
  status: 'Keputusan Tersedia' | 'Menunggu Keputusan' | 'Perlu Tindakan' | string;
  clinical_notes?: string;
  doctor_comments?: string;
  ai_analysis_notes?: string;
  report_document?: PatientRegistrationDoc;
  blood_results: BloodResults;
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

