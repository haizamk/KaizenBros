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

export function calculateNextDialysis(patient: Patient, effectiveDate?: Date) {
  const isMWF = patient.schedule_pattern?.includes('ISNIN') || patient.schedule_pattern === 'MWF';
  const dayName = isMWF ? 'Isnin' : 'Selasa';
  const relativeText = 'Hari Ini';
  const formattedDate = new Date().toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeRange = patient.preferred_shift === 'PETANG' ? '11:00 AM - 03:00 PM' : '07:00 AM - 11:00 AM';
  const badgeColor = 'bg-cyan-950 text-cyan-300 border-cyan-800';

  return {
    dayName,
    relativeText,
    formattedDate,
    timeRange,
    badgeColor
  };
}
