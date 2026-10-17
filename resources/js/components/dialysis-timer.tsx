import { useEffect, useState } from 'react';

const DIALYSIS_SECONDS = 4 * 3600;

function formatClock(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export default function DialysisTimer({ startedAt, compact = false }: { startedAt: string; compact?: boolean }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(timer);
    }, []);

    const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
    const remaining = Math.max(0, DIALYSIS_SECONDS - elapsed);
    const overtime = elapsed > DIALYSIS_SECONDS;

    return (
        <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
            <p
                className={`font-mono font-black tabular-nums ${compact ? 'text-2xl' : 'text-3xl'} ${overtime ? 'text-amber-300' : 'text-cyan-200'}`}
                aria-live="polite"
            >
                {overtime ? formatClock(elapsed - DIALYSIS_SECONDS) : formatClock(remaining)}
            </p>
            <p className={`font-bold text-slate-300 ${compact ? 'text-xs' : 'text-sm'}`}>
                {overtime ? 'Melebihi 4 jam' : 'Baki daripada 4 jam'}
            </p>
        </div>
    );
}
