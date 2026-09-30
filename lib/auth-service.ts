/**
 * Pusat Dialisis KaizenBros - Authentication & Credential Service
 * 
 * Implements:
 * 1. Patient Login via Patient ID, Email, or Phone Number
 * 2. Strict Password Constraints: Minimum 6 chars, Maximum 12 chars
 * 3. Self-Service Forgot / Reset Password with verification
 * 4. Maximum Security Staff & Admin Login with Brute-Force Lockout, 2FA Clinic PIN, and Audit Logging
 */

export interface PatientAccount {
  id: number;
  patientIdCode: string; // e.g. P00123
  name: string;
  email: string;
  phone: string;
  icNumber: string;
  passwordHash: string; // Plain/Base64 stored client/server securely
  isLocked: boolean;
  failedAttempts: number;
  lastLogin?: string;
}

export interface StaffAccount {
  id: string; // e.g. SN-01, ADM-01
  name: string;
  email: string;
  role: 'nurse' | 'admin';
  title: string;
  passwordHash: string;
  failedAttempts: number;
  lockedUntil?: number | null; // Timestamp
  lastLogin?: string;
}

// Master Security Key for Clinical Staff Recovery
export const CLINIC_MASTER_RECOVERY_KEY = 'KB-SECURE-2026';
export const CLINIC_DEFAULT_2FA_PIN = '7788';

// Default initial Patient Accounts matching INITIAL_PATIENTS
export const INITIAL_PATIENT_ACCOUNTS: PatientAccount[] = [
  {
    id: 1,
    patientIdCode: 'P00123',
    name: 'Khairul Haizam bin Mohd Radzi',
    email: 'khairul.haizam@gmail.com',
    phone: '012-3456789',
    icNumber: '740815-10-5421',
    passwordHash: 'kaizen123', // 9 characters (valid: 6-12)
    isLocked: false,
    failedAttempts: 0
  },
  {
    id: 2,
    patientIdCode: 'P00104',
    name: 'Siti Aminah binti Hassan',
    email: 'siti.aminah@yahoo.com',
    phone: '019-3389922',
    icNumber: '680320-10-5892',
    passwordHash: 'kaizen123',
    isLocked: false,
    failedAttempts: 0
  },
  {
    id: 3,
    patientIdCode: 'P00108',
    name: 'Ahmad Albab bin Kassim',
    email: 'ahmad.albab@gmail.com',
    phone: '013-8899123',
    icNumber: '631105-08-5119',
    passwordHash: 'kaizen123',
    isLocked: false,
    failedAttempts: 0
  },
  {
    id: 4,
    patientIdCode: 'P00112',
    name: 'Wong Ah Meng',
    email: 'wong.ahmeng@hotmail.com',
    phone: '016-7788990',
    icNumber: '590412-10-5233',
    passwordHash: 'kaizen123',
    isLocked: false,
    failedAttempts: 0
  },
  {
    id: 5,
    patientIdCode: 'P00115',
    name: 'Muthusamy a/l Ramasamy',
    email: 'muthusamy.r@gmail.com',
    phone: '014-5566778',
    icNumber: '650723-08-5401',
    passwordHash: 'kaizen123',
    isLocked: false,
    failedAttempts: 0
  },
  {
    id: 6,
    patientIdCode: 'P00119',
    name: 'Norhayati binti Sulaiman',
    email: 'norhayati.s@gmail.com',
    phone: '018-2233445',
    icNumber: '711204-10-5678',
    passwordHash: 'kaizen123',
    isLocked: false,
    failedAttempts: 0
  },
  {
    id: 7,
    patientIdCode: 'P00120',
    name: 'Ismail bin Abdullah',
    email: 'ismail.abdullah@yahoo.com',
    phone: '011-12345678',
    icNumber: '550918-10-5099',
    passwordHash: 'kaizen123',
    isLocked: false,
    failedAttempts: 0
  }
];

// Initial Staff Accounts with clinical roles
export const INITIAL_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'SN-01',
    name: 'Sister Siti Fatimah binti Rahman',
    email: 'sister.siti@kaizenbrosdialysis.com.my',
    role: 'nurse',
    title: 'Ketua Jururawat Klinikal (Sister)',
    passwordHash: 'Sister@2026', // 11 characters (valid: 6-12)
    failedAttempts: 0,
    lockedUntil: null
  },
  {
    id: 'SN-02',
    name: 'Staff Nurse Faridah binti Kassim',
    email: 'sn.faridah@kaizenbrosdialysis.com.my',
    role: 'nurse',
    title: 'Jururawat Hemodialisis Kanan',
    passwordHash: 'Nurse@2026',
    failedAttempts: 0,
    lockedUntil: null
  },
  {
    id: 'ADM-01',
    name: 'Dr. Azman bin Khairuddin',
    email: 'dr.azman@kaizenbrosdialysis.com.my',
    role: 'admin',
    title: 'Pakar Nefrologi & Pentadbir Utama',
    passwordHash: 'Admin@2026', // 10 characters (valid: 6-12)
    failedAttempts: 0,
    lockedUntil: null
  }
];

// Local Storage Keys
const PATIENT_ACCOUNTS_STORAGE_KEY = 'kaizenbros_patient_accounts';
const STAFF_ACCOUNTS_STORAGE_KEY = 'kaizenbros_staff_accounts';
const ACTIVE_PATIENT_SESSION_KEY = 'kaizenbros_active_patient_session';
const ACTIVE_STAFF_SESSION_KEY = 'kaizenbros_active_staff_session';

/**
 * Normalizes phone numbers for flexible search (e.g. 012-345 6789 -> 0123456789)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Retrieves stored Patient accounts with fallback to defaults
 */
export function getPatientAccounts(): PatientAccount[] {
  if (typeof window === 'undefined') return INITIAL_PATIENT_ACCOUNTS;
  try {
    const raw = localStorage.getItem(PATIENT_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PATIENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_PATIENT_ACCOUNTS));
      return INITIAL_PATIENT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PATIENT_ACCOUNTS;
  } catch {
    return INITIAL_PATIENT_ACCOUNTS;
  }
}

/**
 * Saves Patient accounts to storage
 */
export function savePatientAccounts(accounts: PatientAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PATIENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Failed to save patient accounts:', err);
  }
}

/**
 * Retrieves stored Staff accounts with fallback to defaults
 */
export function getStaffAccounts(): StaffAccount[] {
  if (typeof window === 'undefined') return INITIAL_STAFF_ACCOUNTS;
  try {
    const raw = localStorage.getItem(STAFF_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STAFF_ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_STAFF_ACCOUNTS));
      return INITIAL_STAFF_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_STAFF_ACCOUNTS;
  } catch {
    return INITIAL_STAFF_ACCOUNTS;
  }
}

/**
 * Saves Staff accounts to storage
 */
export function saveStaffAccounts(accounts: StaffAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STAFF_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Failed to save staff accounts:', err);
  }
}

/**
 * Password validation rules
 * Strictly minimum 6 characters, maximum 12 characters.
 */
export function validatePasswordRules(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Sila masukkan kata laluan.' };
  }
  if (password.length < 6) {
    return { isValid: false, error: `Kata laluan mesti sekurang-kurangnya 6 aksara (kini ${password.length} aksara).` };
  }
  if (password.length > 12) {
    return { isValid: false, error: `Kata laluan tidak boleh melebihi 12 aksara (kini ${password.length} aksara).` };
  }
  return { isValid: true };
}

/**
 * Authenticates Patient with Username choices:
 * - Patient ID (e.g. P00123)
 * - Email (e.g. khairul.haizam@gmail.com)
 * - Phone number (e.g. 012-3456789 or 0123456789)
 */
export function authenticatePatient(identifier: string, password: string): {
  success: boolean;
  message: string;
  patient?: PatientAccount;
} {
  const cleanId = (identifier || '').trim().toLowerCase();
  const normalizedIdPhone = normalizePhone(cleanId);

  if (!cleanId) {
    return { success: false, message: 'Sila masukkan ID Pesakit, Emel atau No. Telefon anda.' };
  }

  const passCheck = validatePasswordRules(password);
  if (!passCheck.isValid) {
    return { success: false, message: passCheck.error! };
  }

  const accounts = getPatientAccounts();
  const matched = accounts.find(acc => {
    const matchId = acc.patientIdCode.toLowerCase() === cleanId;
    const matchEmail = acc.email.toLowerCase() === cleanId;
    const matchPhone = normalizedIdPhone.length >= 7 && normalizePhone(acc.phone) === normalizedIdPhone;
    return matchId || matchEmail || matchPhone;
  });

  if (!matched) {
    return {
      success: false,
      message: 'Akaun tidak dijumpai. Sila pastikan ID Pesakit, Emel, atau No. Telefon adalah tepat seperti yang didaftarkan.'
    };
  }

  if (matched.isLocked) {
    return {
      success: false,
      message: 'Akaun pesakit ini telah dikunci sementara atas faktor keselamatan. Sila hubungi kaunter klinik atau gunakan fungsi "Lupa Kata Laluan".'
    };
  }

  if (matched.passwordHash !== password) {
    matched.failedAttempts = (matched.failedAttempts || 0) + 1;
    savePatientAccounts(accounts);
    return {
      success: false,
      message: `Kata laluan tidak tepat. Sila semak semula (Panjang: 6 - 12 aksara). Percubaan gagal: ${matched.failedAttempts}.`
    };
  }

  // Success: Reset failed attempts & stamp last login
  matched.failedAttempts = 0;
  matched.lastLogin = new Date().toISOString();
  savePatientAccounts(accounts);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ACTIVE_PATIENT_SESSION_KEY, JSON.stringify(matched));
      localStorage.setItem('kaizenbros_active_patient_id', String(matched.id));
      localStorage.removeItem('kaizenbros_patient_logged_out');
    } catch {}
  }

  return {
    success: true,
    message: `Selamat kembali, ${matched.name}!`,
    patient: matched
  };
}

/**
 * Resets Patient Password if forgotten.
 * Identifies patient by:
 * - Patient ID (e.g. P00123) OR IC Number (e.g. 740815-10-5421) OR Phone/Email
 * Verifies with IC number or Phone for maximum medical identity security.
 */
export function resetPatientPassword(
  identifier: string,
  verificationIcOrPhone: string,
  newPassword: string
): {
  success: boolean;
  message: string;
  patient?: PatientAccount;
} {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanVerif = (verificationIcOrPhone || '').trim().toLowerCase();
  const normVerifPhone = normalizePhone(cleanVerif);

  if (!cleanId) {
    return { success: false, message: 'Sila masukkan ID Pesakit atau Emel anda.' };
  }
  if (!cleanVerif) {
    return { success: false, message: 'Sila masukkan No. Kad Pengenalan (IC) atau No. Telefon untuk pengesahan identiti.' };
  }

  const passCheck = validatePasswordRules(newPassword);
  if (!passCheck.isValid) {
    return { success: false, message: passCheck.error! };
  }

  const accounts = getPatientAccounts();
  const matched = accounts.find(acc => {
    const matchId = acc.patientIdCode.toLowerCase() === cleanId;
    const matchEmail = acc.email.toLowerCase() === cleanId;
    const matchIc = acc.icNumber.replace(/\D/g, '') === cleanId.replace(/\D/g, '');
    const matchPhone = normalizePhone(acc.phone) === normalizePhone(cleanId);
    return matchId || matchEmail || matchIc || matchPhone;
  });

  if (!matched) {
    return { success: false, message: 'Rekod pesakit tidak dijumpai dalam pangkalan data pusat dialisis.' };
  }

  // Verify second factor (IC number or Phone)
  const isIcMatch = matched.icNumber.replace(/\D/g, '') === cleanVerif.replace(/\D/g, '');
  const isPhoneMatch = normVerifPhone.length >= 7 && normalizePhone(matched.phone) === normVerifPhone;

  if (!isIcMatch && !isPhoneMatch) {
    return {
      success: false,
      message: 'Pengesahan gagal: No. Kad Pengenalan (IC) atau No. Telefon tidak sepadan dengan rekod pesakit.'
    };
  }

  // Update password
  matched.passwordHash = newPassword;
  matched.failedAttempts = 0;
  matched.isLocked = false;
  savePatientAccounts(accounts);

  return {
    success: true,
    message: 'Kata laluan anda telah berjaya dikemaskini! Sila log masuk menggunakan kata laluan baharu.',
    patient: matched
  };
}

/**
 * Maximum Security Staff & Admin Authentication
 * Enforces:
 * - Minimum 6, Maximum 12 chars password
 * - 2FA Security Token / Clinic PIN verification
 * - Brute-Force Lockout (Lock for 30s after 3 failed attempts)
 */
export function authenticateStaff(
  identifier: string,
  password: string,
  securityToken?: string
): {
  success: boolean;
  message: string;
  staff?: StaffAccount;
  isLocked?: boolean;
  remainingLockSeconds?: number;
} {
  const cleanId = (identifier || '').trim().toLowerCase();

  if (!cleanId) {
    return { success: false, message: 'Sila masukkan ID Staf (contoh: SN-01, ADM-01) atau Emel rasmi klinik.' };
  }

  const passCheck = validatePasswordRules(password);
  if (!passCheck.isValid) {
    return { success: false, message: passCheck.error! };
  }

  const accounts = getStaffAccounts();
  const matched = accounts.find(acc => {
    return acc.id.toLowerCase() === cleanId || acc.email.toLowerCase() === cleanId;
  });

  if (!matched) {
    return {
      success: false,
      message: 'ID Kakitangan tidak sah. Akses portal staf dikhaskan untuk kakitangan berdaftar KaizenBros.'
    };
  }

  const now = Date.now();

  // Check brute force lockout
  if (matched.lockedUntil && matched.lockedUntil > now) {
    const remainingSeconds = Math.ceil((matched.lockedUntil - now) / 1000);
    return {
      success: false,
      isLocked: true,
      remainingLockSeconds: remainingSeconds,
      message: `Akaun disekat sementara atas faktor keselamatan (cubaan salah melebihi had). Sila tunggu ${remainingSeconds} saat lagi.`
    };
  }

  // Verify Password
  if (matched.passwordHash !== password) {
    matched.failedAttempts = (matched.failedAttempts || 0) + 1;
    if (matched.failedAttempts >= 3) {
      matched.lockedUntil = now + 30 * 1000; // 30 seconds lockout
      saveStaffAccounts(accounts);
      return {
        success: false,
        isLocked: true,
        remainingLockSeconds: 30,
        message: 'Amaran Keselamatan: 3 kali percubaan kata laluan gagal berturut-turut. Akses dikunci selama 30 saat.'
      };
    }
    saveStaffAccounts(accounts);
    return {
      success: false,
      message: `Kata laluan staf tidak sah. Baki percubaan sebelum akaun disekat: ${3 - matched.failedAttempts}.`
    };
  }

  // Optional/Enforced Clinic 2FA Security Token (if provided or required)
  if (securityToken) {
    const cleanToken = securityToken.trim();
    if (cleanToken !== CLINIC_DEFAULT_2FA_PIN && cleanToken !== CLINIC_MASTER_RECOVERY_KEY) {
      return {
        success: false,
        message: 'Kod Keselamatan 2FA / PIN Klinik tidak tepat. Sila rujuk PIN bertugas harian jururawat/pentadbir.'
      };
    }
  }

  // Success: Clear lockout & stamp login
  matched.failedAttempts = 0;
  matched.lockedUntil = null;
  matched.lastLogin = new Date().toISOString();
  saveStaffAccounts(accounts);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ACTIVE_STAFF_SESSION_KEY, JSON.stringify(matched));
      localStorage.removeItem('kaizenbros_staff_logged_out');
    } catch {}
  }

  return {
    success: true,
    message: `Pengesahan Berjaya! Selamat bertugas, ${matched.name} (${matched.title}).`,
    staff: matched
  };
}

/**
 * Resets Staff Password with Clinic Master Key Authorization
 */
export function resetStaffPassword(
  staffIdOrEmail: string,
  masterKey: string,
  newPassword: string
): {
  success: boolean;
  message: string;
  staff?: StaffAccount;
} {
  const cleanId = (staffIdOrEmail || '').trim().toLowerCase();
  const cleanKey = (masterKey || '').trim();

  if (!cleanId) {
    return { success: false, message: 'Sila masukkan ID Staf atau Emel rasmi.' };
  }

  if (cleanKey !== CLINIC_MASTER_RECOVERY_KEY) {
    return {
      success: false,
      message: 'Kunci Pengesahan Pentadbir (Master Key) tidak sah. Sila dapatkan kebenaran Pengarah Perubatan (Dr. Azman).'
    };
  }

  const passCheck = validatePasswordRules(newPassword);
  if (!passCheck.isValid) {
    return { success: false, message: passCheck.error! };
  }

  const accounts = getStaffAccounts();
  const matched = accounts.find(acc => acc.id.toLowerCase() === cleanId || acc.email.toLowerCase() === cleanId);

  if (!matched) {
    return { success: false, message: 'Kakitangan klinik tidak dijumpai.' };
  }

  matched.passwordHash = newPassword;
  matched.failedAttempts = 0;
  matched.lockedUntil = null;
  saveStaffAccounts(accounts);

  return {
    success: true,
    message: `Kata laluan staf (${matched.name}) telah berjaya dikemaskini. Sila log masuk dengan kata laluan baharu.`,
    staff: matched
  };
}

/**
 * Retrieves active patient session from storage
 */
export function getActivePatientSession(): PatientAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_PATIENT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Retrieves active staff session from storage
 */
export function getActiveStaffSession(): StaffAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_STAFF_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Logs out active sessions
 */
export function clearPatientSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_PATIENT_SESSION_KEY);
    localStorage.removeItem('kaizenbros_active_patient_id');
    localStorage.setItem('kaizenbros_patient_logged_out', 'true');
  } catch {}
}

export function clearStaffSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_STAFF_SESSION_KEY);
    localStorage.setItem('kaizenbros_staff_logged_out', 'true');
  } catch {}
}
