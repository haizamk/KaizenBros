import { useEffect, useState } from 'react';

function formatClock(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export default function DialysisTimer({ startedAt }: { startedAt: string }) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);
    const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
    const remaining = Math.max(0, 4 * 3600 - elapsed);

    return (
        <div>
            <p className="text-sm font-bold text-slate-300">Masa baki</p>
            <p className="font-mono text-4xl font-black text-cyan-200 sm:text-5xl">{formatClock(remaining)}</p>
        </div>
    );
}
