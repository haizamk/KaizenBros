// Utility for Malaysia Real-Time (UTC+8 / Asia/Kuala_Lumpur)
// Handles live clock, date formatting, and next dialysis calculation
// Rule: After 7:00 PM (19:00 MYT), all sessions for today are completed,
// and each patient's upcoming session automatically updates to their next scheduled dialysis day.

import { Patient, ShiftSlot } from '@/types';

export const MALAY_DAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
export const MALAY_MONTHS = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

export interface MalaysiaTimeData {
  date: Date;
  dateIso: string; // 'YYYY-MM-DD'
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
  dayName: string;
  formattedDate: string;
  formattedTime12: string;
  formattedTime24: string;
  isAfter7pm: boolean;
  timeSlotStatus: string;
}

/**
 * Returns current Date in Malaysia (UTC+8) regardless of host/client timezone
 */
export function getMalaysiaDate(baseDate = new Date()): MalaysiaTimeData {
  // Convert any date to Malaysia UTC+8
  const utcMs = baseDate.getTime() + (baseDate.getTimezoneOffset() * 60 * 1000);
  const mytMs = utcMs + (8 * 60 * 60 * 1000);
  const myt = new Date(mytMs);

  const year = myt.getFullYear();
  const month = myt.getMonth(); // 0-11
  const day = myt.getDate();
  const hour = myt.getHours();
  const minute = myt.getMinutes();
  const second = myt.getSeconds();
  const dayOfWeek = myt.getDay(); // 0 = Ahad, 1 = Isnin ...

  const dayName = MALAY_DAYS[dayOfWeek];
  const monthName = MALAY_MONTHS[month];

  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateIso = `${year}-${pad(month + 1)}-${pad(day)}`;
  const formattedDate = `${dayName}, ${day} ${monthName} ${year}`;

  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const formattedTime12 = `${pad(hour12)}:${pad(minute)}:${pad(second)} ${period}`;
  const formattedTime24 = `${pad(hour)}:${pad(minute)}:${pad(second)}`;

  const isAfter7pm = hour >= 19;

  let timeSlotStatus = 'Di Luar Waktu Operasi';
  if (hour >= 6 && hour < 10) {
    timeSlotStatus = 'Syif 1 Rawatan (6:00 AM - 10:00 AM)';
  } else if (hour >= 10 && hour < 15) {
    timeSlotStatus = 'Syif 2 Rawatan (10:30 AM - 2:30 PM)';
  } else if (hour >= 15 && hour < 19) {
    timeSlotStatus = 'Syif 3 Rawatan (3:00 PM - 7:00 PM)';
  } else if (isAfter7pm) {
    timeSlotStatus = 'Waktu Rawatan Selesai (Lepas 7:00 PM)';
  }

  return {
    date: myt,
    dateIso,
    year,
    month: month + 1,
    day,
    hour,
    minute,
    second,
    dayOfWeek,
    dayName,
    formattedDate,
    formattedTime12,
    formattedTime24,
    isAfter7pm,
    timeSlotStatus
  };
}

export const normalizePatientShift = (s?: string): 'SYIF_1' | 'SYIF_2' | 'SYIF_3' => {
  if (!s) return 'SYIF_1';
  if (s === 'SYIF_1' || s === 'PAGI' || s.includes('6.00') || s.includes('6:00')) return 'SYIF_1';
  if (s === 'SYIF_2' || s === 'TENGAH_HARI' || s.includes('10.30') || s.includes('10:30')) return 'SYIF_2';
  return 'SYIF_3';
};

export interface NextDialysisInfo {
  nextDateIso: string;
  formattedDate: string;
  dayName: string;
  dayOfWeek: number;
  shiftId: 'SYIF_1' | 'SYIF_2' | 'SYIF_3';
  shiftTitle: string;
  timeRange: string;
  shortTime: string;
  isToday: boolean;
  isPassedToday: boolean;
  isAfter7pmRollover: boolean;
  daysRemaining: number;
  relativeText: string;
  badgeColor: string;
  assignedChair?: string;
  explanation: string;
}

/**
 * Calculates the next dialysis session for a patient based on real Malaysia time.
 * If current time is after 7:00 PM (19:00 MYT), today's session has concluded,
 * and the next scheduled session is automatically calculated for the next cycle date.
 */
export function calculateNextDialysis(patient: Patient, customDate?: Date): NextDialysisInfo {
  const myt = getMalaysiaDate(customDate || new Date());
  const hour = myt.hour;
  const isAfter7pm = hour >= 19;
  const currentDayOfWeek = myt.dayOfWeek; // 0=Ahad, 1=Isnin, 2=Selasa, 3=Rabu, 4=Khamis, 5=Jumaat, 6=Sabtu

  // Target days based on schedule_pattern:
  const isTTS = patient.schedule_pattern === 'SELASA_KHAMIS_SABTU';
  const targetDays = isTTS ? [2, 4, 6] : [1, 3, 5]; // Selasa(2), Khamis(4), Sabtu(6) vs Isnin(1), Rabu(3), Jumaat(5)

  const isTodayScheduledDay = targetDays.includes(currentDayOfWeek);

  let targetDayOffset = 0;
  let isToday = false;
  let isPassedToday = false;
  let isAfter7pmRollover = false;

  if (isTodayScheduledDay) {
    if (!isAfter7pm) {
      // Sesi masih hari ini sebelum 7:00 PM
      targetDayOffset = 0;
      isToday = true;
    } else {
      // Sudah lepas jam 7:00 PM! Sesi hari ini tamat. Sila ubah ke next dialisis yang ditetapkan.
      isPassedToday = true;
      isAfter7pmRollover = true;
      for (let offset = 1; offset <= 7; offset++) {
        const nextDay = (currentDayOfWeek + offset) % 7;
        if (targetDays.includes(nextDay)) {
          targetDayOffset = offset;
          break;
        }
      }
    }
  } else {
    // Hari ini bukan hari rawatan pesakit, cari hari seterusnya yang terdekat
    for (let offset = 1; offset <= 7; offset++) {
      const nextDay = (currentDayOfWeek + offset) % 7;
      if (targetDays.includes(nextDay)) {
        targetDayOffset = offset;
        break;
      }
    }
  }

  // Tarikh sesi seterusnya
  const targetDate = new Date(myt.date);
  targetDate.setDate(targetDate.getDate() + targetDayOffset);
  const targetMyt = getMalaysiaDate(targetDate);

  // Butiran syif pesakit
  const shift = normalizePatientShift(patient.preferred_shift);
  let shiftTitle = 'Syif 1: Sesi Pagi Awal';
  let timeRange = '6:00 AM - 10:00 AM';
  let shortTime = '6:00 AM';

  if (shift === 'SYIF_2') {
    shiftTitle = 'Syif 2: Sesi Tengah Hari';
    timeRange = '10:30 AM - 2:30 PM';
    shortTime = '10:30 AM';
  } else if (shift === 'SYIF_3') {
    shiftTitle = 'Syif 3: Sesi Petang';
    timeRange = '3:00 PM - 7:00 PM';
    shortTime = '3:00 PM';
  }

  const relativeText = targetDayOffset === 0 
    ? 'Hari Ini' 
    : targetDayOffset === 1 
      ? 'Esok' 
      : targetDayOffset === 2 
        ? 'Lusa' 
        : `Dalam ${targetDayOffset} hari`;

  let explanation = '';
  if (isToday) {
    explanation = `Sesi rawatan anda dijadualkan HARI INI (${myt.dayName}) pada ${timeRange}. Sila hadir tepat pada masanya di kaunter jururawat.`;
  } else if (isAfter7pmRollover) {
    explanation = `Waktu rawatan hari ini (${myt.dayName}) telah tamat (Lepas jam 7:00 PM). Masa dan tarikh rawatan anda telah dikemaskini secara automatik ke sesi seterusnya: ${targetMyt.dayName}, ${targetMyt.formattedDate} (${timeRange}).`;
  } else {
    explanation = `Tiada sesi dialisis dijadualkan hari ini. Temujanji rawatan seterusnya adalah pada ${targetMyt.dayName}, ${targetMyt.formattedDate} (${timeRange}).`;
  }

  return {
    nextDateIso: targetMyt.dateIso,
    formattedDate: targetMyt.formattedDate,
    dayName: targetMyt.dayName,
    dayOfWeek: targetMyt.dayOfWeek,
    shiftId: shift,
    shiftTitle,
    timeRange,
    shortTime,
    isToday,
    isPassedToday,
    isAfter7pmRollover,
    daysRemaining: targetDayOffset,
    relativeText,
    badgeColor: isToday 
      ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
      : (targetDayOffset === 1 ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-800 text-slate-300 border-slate-700'),
    assignedChair: patient.assigned_chair,
    explanation
  };
}

/**
 * Updates an array of patients with their next dialysis date & time
 * according to the Malaysia Real-Time rules (including >7pm rollover).
 */
export function syncPatientsWithMalaysiaSchedule(patients: Patient[], customDate?: Date): Patient[] {
  return patients.map(p => {
    const next = calculateNextDialysis(p, customDate);
    return {
      ...p,
      next_dialysis_date: next.formattedDate,
      next_dialysis_day: next.dayName,
      next_dialysis_time: next.timeRange,
      next_dialysis_shift: next.shiftTitle,
      next_dialysis_iso: next.nextDateIso,
      next_dialysis_status: next.isToday 
        ? 'SESI_HARI_INI' 
        : (next.isAfter7pmRollover ? 'SESI_HARI_INI_TAMAT_NEXT_SESI' : 'BERJADUAL')
    };
  });
}
