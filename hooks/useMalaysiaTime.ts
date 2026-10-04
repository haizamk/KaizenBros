import { useState, useEffect } from 'react';

export function useMalaysiaTime() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      effectiveDate: now,
      formattedTime: now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true }),
      formattedTime12: now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true }),
      formattedDate: now.toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      isAfter7pm: now.getHours() >= 19,
      isMounted: true,
      isSimulating: false,
      toggleSimulation: (mode?: string) => {}
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime({
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        effectiveDate: now,
        formattedTime: now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true }),
        formattedTime12: now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true }),
        formattedDate: now.toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        isAfter7pm: now.getHours() >= 19,
        isMounted: true,
        isSimulating: false,
        toggleSimulation: (mode?: string) => {}
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
}
