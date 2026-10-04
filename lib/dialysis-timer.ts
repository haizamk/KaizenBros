import { DialysisSession, SessionStatus } from '@/types';

export const STANDARD_DIALYSIS_DURATION_SECONDS = 4 * 3600; // 4 Hours (14,400 seconds)
export const AUTO_COMPLETE_THRESHOLD_SECONDS = 5 * 3600; // 5 Hours (18,000 seconds = 1 hour post 4h)

export interface SessionTimerInfo {
  status: SessionStatus;
  isOngoing: boolean;
  elapsedSeconds: number;
  remainingSeconds: number;
  progressPercent: number;
  formattedRemaining: string;
  formattedElapsed: string;
  isOverStandard: boolean;
  isOverGracePeriod: boolean;
  autoShouldComplete: boolean;
}

/**
 * Calculates live 4-hour countdown timer and auto-complete state for a dialysis session
 */
export function getSessionTimerInfo(session: DialysisSession, nowMs: number = Date.now()): SessionTimerInfo {
  const isOngoing = session.status === 'SEDANG_DIALISIS';
  
  if (!isOngoing) {
    return {
      status: session.status,
      isOngoing: false,
      elapsedSeconds: 0,
      remainingSeconds: STANDARD_DIALYSIS_DURATION_SECONDS,
      progressPercent: 0,
      formattedRemaining: '04:00:00',
      formattedElapsed: '00:00:00',
      isOverStandard: false,
      isOverGracePeriod: false,
      autoShouldComplete: false
    };
  }

  // Derive start timestamp
  let startMs = session.start_timestamp;
  if (!startMs && session.actual_start_time) {
    startMs = parseTimeStringToTodayMs(session.actual_start_time);
  }
  if (!startMs) {
    startMs = nowMs - 1800 * 1000; // default 30 mins ago if not set
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const remainingSeconds = Math.max(0, STANDARD_DIALYSIS_DURATION_SECONDS - elapsedSeconds);
  const progressPercent = Math.min(100, Math.floor((elapsedSeconds / STANDARD_DIALYSIS_DURATION_SECONDS) * 100));

  const isOverStandard = elapsedSeconds >= STANDARD_DIALYSIS_DURATION_SECONDS;
  const isOverGracePeriod = elapsedSeconds >= AUTO_COMPLETE_THRESHOLD_SECONDS;

  return {
    status: session.status,
    isOngoing: true,
    elapsedSeconds,
    remainingSeconds,
    progressPercent,
    formattedRemaining: formatSecondsToHms(remainingSeconds),
    formattedElapsed: formatSecondsToHms(elapsedSeconds),
    isOverStandard,
    isOverGracePeriod,
    autoShouldComplete: isOverGracePeriod
  };
}

export function formatSecondsToHms(totalSec: number): string {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseTimeStringToTodayMs(timeStr: string): number {
  try {
    const today = new Date();
    const clean = timeStr.trim().toUpperCase();
    const isPm = clean.includes('PM');
    const isAm = clean.includes('AM');
    const numPart = clean.replace(/[^0-9:]/g, '');
    const parts = numPart.split(':');
    let hours = parseInt(parts[0] || '8', 10);
    const minutes = parseInt(parts[1] || '0', 10);

    if (isPm && hours < 12) hours += 12;
    if (isAm && hours === 12) hours = 0;

    today.setHours(hours, minutes, 0, 0);
    return today.getTime();
  } catch {
    return Date.now() - 3600 * 1000;
  }
}
