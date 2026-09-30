/**
 * Utility functions for parsing Malaysian MyKad (IC) numbers
 * and calculating precise age in Years and Days.
 */

export interface ICParsedData {
  isValid: boolean;
  birthDate: Date | null;
  birthDateFormatted: string;
  years: number;
  days: number;
  ageDisplay: string; // e.g., "46 Tahun 106 Hari"
  gender: 'LELAKI' | 'PEREMPUAN' | null;
  formattedIC: string;
}

export function parseMalaysianIC(icInput: string): ICParsedData {
  if (!icInput) {
    return {
      isValid: false,
      birthDate: null,
      birthDateFormatted: '',
      years: 0,
      days: 0,
      ageDisplay: '',
      gender: null,
      formattedIC: ''
    };
  }

  // Remove non-digit characters
  const clean = icInput.replace(/[^0-9]/g, '');

  if (clean.length < 6) {
    return {
      isValid: false,
      birthDate: null,
      birthDateFormatted: '',
      years: 0,
      days: 0,
      ageDisplay: '',
      gender: null,
      formattedIC: icInput
    };
  }

  const yy = parseInt(clean.substring(0, 2), 10);
  const mm = parseInt(clean.substring(2, 4), 10);
  const dd = parseInt(clean.substring(4, 6), 10);

  // Determine full year based on reference year 2026
  const currentYear = 2026;
  const currentYY = currentYear % 100; // 26
  const fullYear = yy > currentYY ? 1900 + yy : 2000 + yy;

  // Validate month and day
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return {
      isValid: false,
      birthDate: null,
      birthDateFormatted: '',
      years: 0,
      days: 0,
      ageDisplay: '',
      gender: null,
      formattedIC: icInput
    };
  }

  const birthDate = new Date(fullYear, mm - 1, dd);
  const today = new Date(2026, 8, 29); // Reference runtime date 29 September 2026

  // Calculate age in years and days
  let years = today.getFullYear() - birthDate.getFullYear();
  const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  let lastBirthday: Date;
  if (today < thisYearBirthday) {
    years -= 1;
    lastBirthday = new Date(today.getFullYear() - 1, birthDate.getMonth(), birthDate.getDate());
  } else {
    lastBirthday = thisYearBirthday;
  }

  const diffMs = today.getTime() - lastBirthday.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const ageDisplay = `${years} Tahun ${days} Hari`;

  // Determine gender if 12 digits are present
  let gender: 'LELAKI' | 'PEREMPUAN' | null = null;
  if (clean.length >= 12) {
    const lastDigit = parseInt(clean.charAt(11), 10);
    gender = lastDigit % 2 === 1 ? 'LELAKI' : 'PEREMPUAN';
  }

  // Format IC as XXXXXX-XX-XXXX
  let formattedIC = clean;
  if (clean.length > 6 && clean.length <= 8) {
    formattedIC = `${clean.slice(0, 6)}-${clean.slice(6)}`;
  } else if (clean.length > 8) {
    formattedIC = `${clean.slice(0, 6)}-${clean.slice(6, 8)}-${clean.slice(8, 12)}`;
  }

  const birthDateFormatted = birthDate.toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return {
    isValid: true,
    birthDate,
    birthDateFormatted,
    years: Math.max(0, years),
    days,
    ageDisplay,
    gender,
    formattedIC
  };
}
