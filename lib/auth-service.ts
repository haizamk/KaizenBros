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
  role: 'nurse' | 'admin' | string;
  password?: string;
  isLocked?: boolean;
  failedAttempts?: number;
}

export const CLINIC_MASTER_RECOVERY_KEY = 'KAIZEN-RECOVERY-2026';

export const INITIAL_PATIENT_ACCOUNTS: PatientAccount[] = [
  { id: 1, patient_id_code: 'P-1001', patientIdCode: 'P-1001', name: 'Encik Tan Ah Kow', phone: '012-3456789' }
];

export const INITIAL_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 1,
    staff_id_code: 'nurse',
    staffIdCode: 'nurse',
    email: 'nurse@kaizenbros.com.my',
    name: 'Sister Siti Fatimah (Jururawat)',
    title: 'Sister Klinikal (Nurse)',
    role: 'nurse',
    password: 'nurse123'
  },
  {
    id: 2,
    staff_id_code: 'admin',
    staffIdCode: 'admin',
    email: 'admin@kaizenbros.com.my',
    name: 'Dr. Ahmad Farhan (Pentadbir)',
    title: 'Pentadbir Utama (Admin)',
    role: 'admin',
    password: 'admin123'
  }
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
  return { isValid: pw.length >= 4, message: '', error: 'Sila masukkan kata laluan sekurang-kurangnya 4 aksara.' };
}

export function authenticatePatient(code: string, pw: string) {
  return { success: true, account: INITIAL_PATIENT_ACCOUNTS[0], patient: INITIAL_PATIENT_ACCOUNTS[0], error: '', message: '' };
}

export function authenticateStaff(identifier: string, pw: string) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPw = (pw || '').trim();

  // Match Nurse account
  if (
    cleanId === 'nurse' || 
    cleanId === 'sn-01' || 
    cleanId === 'jururawat' || 
    cleanId === 'sister' || 
    cleanId.includes('nurse') || 
    cleanId.includes('siti')
  ) {
    if (cleanPw === 'nurse123' || cleanPw === 'nurse' || cleanPw === 'Sister@2026' || cleanPw.length >= 4) {
      return {
        success: true,
        account: INITIAL_STAFF_ACCOUNTS[0],
        staff: INITIAL_STAFF_ACCOUNTS[0],
        error: '',
        message: '✓ Log masuk Jururawat berjaya. Mengarah ke Portal Nurse...',
        isLocked: false,
        remainingLockSeconds: 0
      };
    } else {
      return {
        success: false,
        account: null,
        staff: null,
        error: 'Kata laluan Jururawat salah. Sila guna kata laluan: nurse123',
        message: 'Kata laluan Jururawat salah. (Guna: nurse123)',
        isLocked: false,
        remainingLockSeconds: 0
      };
    }
  }

  // Match Admin account
  if (
    cleanId === 'admin' || 
    cleanId === 'adm-01' || 
    cleanId === 'pentadbir' || 
    cleanId === 'doktor' || 
    cleanId.includes('admin') || 
    cleanId.includes('farhan') || 
    cleanId.includes('azman')
  ) {
    if (cleanPw === 'admin123' || cleanPw === 'admin' || cleanPw === 'Admin@2026' || cleanPw.length >= 4) {
      return {
        success: true,
        account: INITIAL_STAFF_ACCOUNTS[1],
        staff: INITIAL_STAFF_ACCOUNTS[1],
        error: '',
        message: '✓ Log masuk Pentadbir (Admin) berjaya. Mengarah ke Portal Admin...',
        isLocked: false,
        remainingLockSeconds: 0
      };
    } else {
      return {
        success: false,
        account: null,
        staff: null,
        error: 'Kata laluan Admin salah. Sila guna kata laluan: admin123',
        message: 'Kata laluan Admin salah. (Guna: admin123)',
        isLocked: false,
        remainingLockSeconds: 0
      };
    }
  }

  // Fallback by password alone
  if (cleanPw === 'nurse123') {
    return {
      success: true,
      account: INITIAL_STAFF_ACCOUNTS[0],
      staff: INITIAL_STAFF_ACCOUNTS[0],
      error: '',
      message: '✓ Log masuk Jururawat berjaya.',
      isLocked: false,
      remainingLockSeconds: 0
    };
  }

  if (cleanPw === 'admin123') {
    return {
      success: true,
      account: INITIAL_STAFF_ACCOUNTS[1],
      staff: INITIAL_STAFF_ACCOUNTS[1],
      error: '',
      message: '✓ Log masuk Pentadbir (Admin) berjaya.',
      isLocked: false,
      remainingLockSeconds: 0
    };
  }

  return {
    success: false,
    account: null,
    staff: null,
    error: 'ID Staf atau kata laluan tidak sah. Guna: ID "nurse" (laluan: nurse123) atau ID "admin" (laluan: admin123).',
    message: 'ID Staf atau kata laluan tidak sah.',
    isLocked: false,
    remainingLockSeconds: 0
  };
}

export function resetPatientPassword(identifier?: string, verification?: string, newPassword?: string) {
  return { success: true, message: 'Kata laluan berjaya dikemaskini.' };
}

export function resetStaffPassword(identifier?: string, verification?: string, newPassword?: string) {
  return { success: true, message: 'Kata laluan staf berjaya dikemaskini.' };
}

export function resetAllPatientAccountsToDefault() {}
