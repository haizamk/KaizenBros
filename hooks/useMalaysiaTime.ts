'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { getMalaysiaDate, MalaysiaTimeData } from '@/lib/malaysia-time';

// Global store so all components share the identical synchronized tick & simulation mode
interface TimeStoreState {
  offsetMs: number; // Server vs client clock skew offset
  simulatedHour: number | null; // null = real live time, number = simulated hour (e.g. 19 for 7:00 PM)
  lastTick: number;
}

let storeState: TimeStoreState = {
  offsetMs: 0,
  simulatedHour: null,
  lastTick: 0
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let intervalStarted = false;
function ensureTimerStarted() {
  if (typeof window === 'undefined' || intervalStarted) return;
  intervalStarted = true;
  storeState.lastTick = Date.now();

  // Sync with server once on start
  fetch('/api/server-time')
    .then(r => r.json())
    .then(data => {
      if (data?.serverTimestampMs) {
        const clientNow = Date.now();
        storeState.offsetMs = data.serverTimestampMs - clientNow;
        notify();
      }
    })
    .catch(() => {});

  // Tick every second
  setInterval(() => {
    storeState.lastTick = Date.now();
    notify();
  }, 1000);
}

export function setSimulatedHour(hour: number | null) {
  storeState.simulatedHour = hour;
  notify();
}

export function useMalaysiaTime() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    ensureTimerStarted();
    return () => clearTimeout(timer);
  }, []);

  // Subscribe to ticking
  useSyncExternalStore(
    subscribe,
    () => storeState.lastTick + '_' + storeState.simulatedHour + '_' + storeState.offsetMs,
    () => '0'
  );

  // During SSR and initial client hydration, use fixed deterministic baseline
  const tick = isMounted && storeState.lastTick ? storeState.lastTick : 1790700565000;
  let effectiveDate = new Date(tick + (isMounted ? storeState.offsetMs : 0));

  if (storeState.simulatedHour !== null && isMounted) {
    // Override the hour for simulation
    const myt = getMalaysiaDate(effectiveDate);
    effectiveDate = new Date(myt.date);
    effectiveDate.setHours(storeState.simulatedHour, 15, 0, 0);
  }

  const myt = getMalaysiaDate(effectiveDate);

  const toggleSimulation = useCallback((mode: 'live' | 'after7pm' | 'morning') => {
    if (mode === 'live') {
      setSimulatedHour(null);
    } else if (mode === 'after7pm') {
      setSimulatedHour(19); // 7:15 PM
    } else if (mode === 'morning') {
      setSimulatedHour(9); // 9:15 AM
    }
  }, []);

  return {
    ...myt,
    effectiveDate,
    isMounted,
    formattedTime12: isMounted ? myt.formattedTime12 : '--:--:--',
    formattedTime24: isMounted ? myt.formattedTime24 : '--:--',
    formattedDate: isMounted ? myt.formattedDate : 'Waktu Malaysia',
    isSimulating: storeState.simulatedHour !== null,
    simulatedHour: storeState.simulatedHour,
    toggleSimulation,
    setSimulatedHour
  };
}
