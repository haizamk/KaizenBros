import { Patient } from '@/types';

export function getMalaysiaDate(input?: number | Date): { dateIso: string; dayName: string; formattedDate: string; dayOfWeek: number } {
  const d = input instanceof Date ? new Date(input) : new Date();
  if (typeof input === 'number') {
    d.setDate(d.getDate() + input);
  }
  const dateIso = d.toISOString().slice(0, 10);
  const dayName = d.toLocaleDateString('ms-MY', { weekday: 'long' });
  const formattedDate = d.toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const dayOfWeek = d.getDay();
  return { dateIso, dayName, formattedDate, dayOfWeek };
}

export function syncPatientsWithMalaysiaSchedule(patients: Patient[], effectiveDate?: Date): Patient[] {
  return patients;
}

export function normalizeShift(s?: string): { id: 'SYIF_1' | 'SYIF_2' | 'SYIF_3'; title: string; timeRange: string; shortTime: string } {
  if (!s) {
    return { id: 'SYIF_1', title: 'Syif 1: Sesi Pagi', timeRange: '6:00 AM - 10:00 AM', shortTime: '6-10am' };
  }
  const str = s.toUpperCase();
  if (str.includes('3') || str.includes('PETANG') || str.includes('15:00') || str.includes('3-7') || str.includes('3:00')) {
    return { id: 'SYIF_3', title: 'Syif 3: Sesi Petang', timeRange: '3:00 PM - 7:00 PM', shortTime: '3-7pm' };
  }
  if (str.includes('2') || str.includes('TENGAH') || str.includes('10.30') || str.includes('10:30')) {
    return { id: 'SYIF_2', title: 'Syif 2: Sesi Tengah Hari', timeRange: '10:30 AM - 2:30 PM', shortTime: '10:30am-2:30pm' };
  }
  return { id: 'SYIF_1', title: 'Syif 1: Sesi Pagi', timeRange: '6:00 AM - 10:00 AM', shortTime: '6-10am' };
}

export function calculateNextDialysis(patient: Patient, effectiveDate?: Date) {
  const baseDate = effectiveDate instanceof Date ? new Date(effectiveDate) : new Date();
  
  // Schedule pattern check:
  // Tuesday, Thursday, Saturday: target days = [2, 4, 6]
  // Monday, Wednesday, Friday: target days = [1, 3, 5]
  const pattern = (patient?.schedule_pattern || '').toUpperCase();
  const isTuesdayGroup = pattern.includes('SELASA') || pattern.includes('KHAMIS') || pattern.includes('SABTU') || pattern === 'TTS';
  const targetDays = isTuesdayGroup ? [2, 4, 6] : [1, 3, 5];

  const shiftInfo = normalizeShift(patient?.preferred_shift || patient?.next_dialysis_shift);

  // Find next upcoming date (including today if current time is before shift end)
  let targetDate = new Date(baseDate);
  let found = false;

  for (let offset = 0; offset < 8; offset++) {
    const candidate = new Date(baseDate);
    candidate.setDate(baseDate.getDate() + offset);
    const dayOfWeek = candidate.getDay(); // 0 = Ahad, 1 = Isnin, 2 = Selasa, 3 = Rabu, 4 = Khamis, 5 = Jumaat, 6 = Sabtu

    if (targetDays.includes(dayOfWeek)) {
      if (offset === 0) {
        // Today - check if time has passed
        const currentHour = candidate.getHours();
        const maxShiftHour = shiftInfo.id === 'SYIF_3' ? 19 : shiftInfo.id === 'SYIF_2' ? 15 : 11;
        if (currentHour < maxShiftHour) {
          targetDate = candidate;
          found = true;
          break;
        }
      } else {
        targetDate = candidate;
        found = true;
        break;
      }
    }
  }

  if (!found) {
    targetDate.setDate(baseDate.getDate() + 1);
  }

  const mytDate = getMalaysiaDate(targetDate);
  const baseMytIso = getMalaysiaDate(baseDate).dateIso;
  
  const diffTime = new Date(mytDate.dateIso).getTime() - new Date(baseMytIso).getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  
  let relativeText = 'Hari Ini';
  if (diffDays === 1) relativeText = 'Esok';
  else if (diffDays > 1) relativeText = 'Akan Datang';

  const dayNameMalay = mytDate.dayName; // "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu", "Ahad"
  
  // Format requested e.g. "Seterusnya Selasa 3-7pm"
  const displayString = `Seterusnya ${dayNameMalay} ${shiftInfo.shortTime}`;

  return {
    dayName: dayNameMalay,
    formattedDate: mytDate.formattedDate,
    relativeText,
    timeRange: shiftInfo.timeRange,
    shortTime: shiftInfo.shortTime,
    shiftTitle: shiftInfo.title,
    shiftId: shiftInfo.id,
    displayString,
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
  };
}
