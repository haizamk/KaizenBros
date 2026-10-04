export interface PatientAccount {
  id: number;
  patient_id_code?: string;
  patientIdCode?: string;
  email?: string;
  icNumber?: string;
  name: string;
  phone: string;
  passwordHash?: string;
  password_set?: boolean;
  isLocked?: boolean;
  failedAttempts?: number;
}

export interface StaffAccount {
  id: number;
  staff_id_code?: string;
  staffIdCode?: string;
  email?: string;
  name: string;
  title: string;
  role?: string;
  isLocked?: boolean;
  failedAttempts?: number;
}

export const CLINIC_DEFAULT_2FA_PIN = '889922';
export const CLINIC_MASTER_RECOVERY_KEY = 'KAIZEN-RECOVERY-2026';

export const INITIAL_PATIENT_ACCOUNTS: PatientAccount[] = [
  { id: 1, patient_id_code: 'P-1001', patientIdCode: 'P-1001', name: 'Encik Tan Ah Kow', phone: '012-3456789' }
];

export const INITIAL_STAFF_ACCOUNTS: StaffAccount[] = [
  { id: 1, staff_id_code: 'N-201', staffIdCode: 'N-201', name: 'Sister Siti Fatimah binti Rosli', title: 'Sister' }
];

export function getActivePatientSession(): PatientAccount | null {
  return INITIAL_PATIENT_ACCOUNTS[0];
}

export function getActiveStaffSession(): StaffAccount | null {
  return INITIAL_STAFF_ACCOUNTS[0];
}

export function clearPatientSession() {}
export function clearStaffSession() {}
export function getPatientAccounts(): PatientAccount[] { return INITIAL_PATIENT_ACCOUNTS; }
export function savePatientAccounts(accs?: PatientAccount[]) {}

export function validatePasswordRules(pw: string) {
  return { isValid: pw.length >= 4, message: '', error: 'Sila masukkan kata laluan yang sah.' };
}

export function authenticatePatient(code: string, pw: string) {
  return { success: true, account: INITIAL_PATIENT_ACCOUNTS[0], patient: INITIAL_PATIENT_ACCOUNTS[0], error: '', message: '' };
}

export function authenticateStaff(code: string, pw: string, pin?: string) {
  return { success: true, account: INITIAL_STAFF_ACCOUNTS[0], staff: INITIAL_STAFF_ACCOUNTS[0], error: '', message: '', isLocked: false, remainingLockSeconds: 0 };
}

export function resetPatientPassword(identifier?: string, verification?: string, newPassword?: string) {
  return { success: true, message: 'Kata laluan berjaya dikemaskini.' };
}

export function resetStaffPassword(identifier?: string, verification?: string, newPassword?: string) {
  return { success: true, message: 'Kata laluan berjaya dikemaskini.' };
}

export function resetAllPatientAccountsToDefault() {}
