import { NextResponse } from 'next/server';
import { getMalaysiaDate } from '@/lib/malaysia-time';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();
  const myt = getMalaysiaDate(now);

  return NextResponse.json({
    success: true,
    serverTimestampMs: now.getTime(),
    serverIsoUtc: now.toISOString(),
    timezone: 'Asia/Kuala_Lumpur',
    timezoneOffsetHours: 8,
    malaysia: {
      dateIso: myt.dateIso,
      year: myt.year,
      month: myt.month,
      day: myt.day,
      hour: myt.hour,
      minute: myt.minute,
      second: myt.second,
      dayOfWeek: myt.dayOfWeek,
      dayName: myt.dayName,
      formattedDate: myt.formattedDate,
      formattedTime12: myt.formattedTime12,
      formattedTime24: myt.formattedTime24,
      isAfter7pm: myt.isAfter7pm,
      timeSlotStatus: myt.timeSlotStatus
    }
  });
}
