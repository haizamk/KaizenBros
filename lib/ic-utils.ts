/**
 * Utility functions for parsing Malaysian MyKad (IC) numbers
 * and calculating precise age in Years, Months, and Days,
 * as well as extracting Gender strictly according to MyKad specification.
 */

export interface ICParsedData {
  isValid: boolean;
  errorMessage?: string;
  birthDate: Date | null;
  birthDateFormatted: string;
  years: number;
  months: number;
  days: number;
  ageYears?: number;
  ageDisplay: string; // e.g., "54 Tahun 3 Bulan 12 Hari"
  gender: 'LELAKI' | 'PEREMPUAN' | null;
  genderDisplay: 'Lelaki' | 'Perempuan' | '';
  formattedIC: string;
}

export function parseMalaysianIC(icInput: string): ICParsedData {
  if (!icInput) {
    return {
      isValid: false,
      birthDate: null,
      birthDateFormatted: '',
      years: 0,
      months: 0,
      days: 0,
      ageDisplay: '',
      gender: null,
      genderDisplay: '',
      formattedIC: ''
    };
  }

  // Remove non-digit characters
  const clean = icInput.replace(/[^0-9]/g, '');

  if (clean.length < 6) {
    return {
      isValid: false,
      errorMessage: 'Sila masukkan sekurang-kurangnya 6 digit pertama MyKad (YYMMDD).',
      birthDate: null,
      birthDateFormatted: '',
      years: 0,
      months: 0,
      days: 0,
      ageDisplay: '',
      gender: null,
      genderDisplay: '',
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

  // Validate month and day basic ranges
  if (isNaN(mm) || mm < 1 || mm > 12 || isNaN(dd) || dd < 1 || dd > 31) {
    return {
      isValid: false,
      errorMessage: `Tarikh lahir (${clean.substring(0, 6)}) tidak sah! Bulan (01-12) atau Hari (01-31) salah. Contoh sah: 781129.`,
      birthDate: null,
      birthDateFormatted: '',
      years: 0,
      months: 0,
      days: 0,
      ageDisplay: '',
      gender: null,
      genderDisplay: '',
      formattedIC: icInput
    };
  }

  const birthDate = new Date(fullYear, mm - 1, dd);

  // Strict check that Date did not overflow (e.g. 781135 -> month 11 becomes month 12 date 5)
  if (birthDate.getFullYear() !== fullYear || birthDate.getMonth() !== (mm - 1) || birthDate.getDate() !== dd) {
    return {
      isValid: false,
      errorMessage: `Tarikh ${dd}/${mm}/${fullYear} (dari IC ${clean.substring(0,6)}) bukan tarikh yang sah dalam kalendar (contoh salah: 781135).`,
      birthDate: null,
      birthDateFormatted: '',
      years: 0,
      months: 0,
      days: 0,
      ageDisplay: '',
      gender: null,
      genderDisplay: '',
      formattedIC: icInput
    };
  }

  const today = new Date(2026, 8, 29); // Reference runtime date 29 September 2026

  // Calculate precise age in Years, Months, and Days
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  years = Math.max(0, years);
  months = Math.max(0, months);
  days = Math.max(0, days);

  // Build human readable age display: "54 Tahun 3 Bulan 12 Hari"
  const ageDisplay = `${years} Tahun ${months} Bulan ${days} Hari`;

  // Determine gender strictly from 12th digit (digit terakhir 4-digit belakang)
  // Ganjil (1,3,5,7,9) = LELAKI
  // Genap (0,2,4,6,8) = PEREMPUAN
  let gender: 'LELAKI' | 'PEREMPUAN' | null = null;
  let genderDisplay: 'Lelaki' | 'Perempuan' | '' = '';

  if (clean.length >= 12) {
    const lastDigit = parseInt(clean.charAt(11), 10);
    if (!isNaN(lastDigit)) {
      gender = lastDigit % 2 === 1 ? 'LELAKI' : 'PEREMPUAN';
      genderDisplay = gender === 'LELAKI' ? 'Lelaki' : 'Perempuan';
    }
  } else if (clean.length > 6) {
    // If partial digits typed beyond 6, extract from last typed digit for preview
    const lastDigit = parseInt(clean.charAt(clean.length - 1), 10);
    if (!isNaN(lastDigit)) {
      gender = lastDigit % 2 === 1 ? 'LELAKI' : 'PEREMPUAN';
      genderDisplay = gender === 'LELAKI' ? 'Lelaki' : 'Perempuan';
    }
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
    years,
    months,
    days,
    ageYears: years,
    ageDisplay,
    gender,
    genderDisplay,
    formattedIC
  };
}

export function getAgeDisplayFromIC(icInput?: string, fallbackAgeYears?: number | string): string {
  if (icInput) {
    const parsed = parseMalaysianIC(icInput);
    if (parsed.isValid && parsed.ageDisplay) {
      return parsed.ageDisplay;
    }
  }
  if (fallbackAgeYears) {
    return `${fallbackAgeYears} Tahun 0 Bulan 0 Hari`;
  }
  return 'Sila Masukkan MyKad';
}
