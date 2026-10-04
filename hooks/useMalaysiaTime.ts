import { useState, useEffect, useCallback } from 'react';

export type SimulationMode = 'live' | 'after7pm' | 'morning';

export interface MalaysiaTimeState {
  hour: number;
  minute: number;
  second: number;
  effectiveDate: Date;
  formattedTime: string;
  formattedTime12: string;
  formattedDate: string;
  isAfter7pm: boolean;
  isMounted: boolean;
  isSimulating: boolean;
  toggleSimulation: (mode?: SimulationMode | string) => void;
}

function getMytDateParts(d: Date) {
  // Use Intl to safely resolve Asia/Kuala_Lumpur timezone (UTC+8)
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour12: false,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
    const parts = formatter.formatToParts(d);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') {
        map[p.type] = parseInt(p.value, 10);
      }
    }
    return {
      year: map.year ?? d.getFullYear(),
      month: (map.month ?? (d.getMonth() + 1)) - 1,
      day: map.day ?? d.getDate(),
      hour: map.hour ?? d.getHours(),
      minute: map.minute ?? d.getMinutes(),
      second: map.second ?? d.getSeconds()
    };
  } catch {
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes(),
      second: d.getSeconds()
    };
  }
}

export function useMalaysiaTime(): MalaysiaTimeState {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('live');
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSimulation = useCallback((mode?: SimulationMode | string) => {
    if (!mode || mode === 'live') {
      setSimulationMode('live');
    } else if (mode === 'after7pm') {
      setSimulationMode('after7pm');
    } else if (mode === 'morning') {
      setSimulationMode('morning');
    }
  }, []);

  const now = new Date();
  const mytParts = getMytDateParts(now);

  let hour = mytParts.hour;
  let minute = mytParts.minute;
  let second = mytParts.second;
  let isSimulating = false;

  if (simulationMode === 'after7pm') {
    hour = 19;
    minute = 15;
    second = 0;
    isSimulating = true;
  } else if (simulationMode === 'morning') {
    hour = 9;
    minute = 15;
    second = 0;
    isSimulating = true;
  }

  const effectiveDate = new Date(mytParts.year, mytParts.month, mytParts.day, hour, minute, second);
  const isAfter7pm = hour >= 19;

  let formattedDate = 'Hari Ini';
  let formattedTime = '00:00';
  let formattedTime12 = '12:00:00 AM';

  try {
    formattedDate = effectiveDate.toLocaleDateString('ms-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    formattedDate = `${effectiveDate.getDate()}/${effectiveDate.getMonth() + 1}/${effectiveDate.getFullYear()}`;
  }

  try {
    formattedTime = effectiveDate.toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    formattedTime12 = effectiveDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    const pad = (n: number) => n.toString().padStart(2, '0');
    formattedTime = `${pad(hour)}:${pad(minute)}`;
    formattedTime12 = `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  }

  return {
    hour,
    minute,
    second,
    effectiveDate,
    formattedTime,
    formattedTime12,
    formattedDate,
    isAfter7pm,
    isMounted,
    isSimulating,
    toggleSimulation
  };
}
