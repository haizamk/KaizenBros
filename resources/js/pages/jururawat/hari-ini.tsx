import { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';

type SessionCard = {
    id: number;
    chair_number: string;
    scheduled_time: string;
    shift_label: string;
    status: string;
    status_label: string;
    pre_weight_kg: string | null;
    post_weight_kg: string | null;
    pre_bp: string | null;
    post_bp: string | null;
    started_at: string | null;
    nurse_notes: string | null;
    patient: {
        name: string;
        patient_id_code: string;
        dry_weight_kg: string;
        sponsor: string;
        allergies: string | null;
    };
};

const fieldClass = 'min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-3 text-base text-white';

function formatClock(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function DialysisTimer({ startedAt }: { startedAt: string }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
    const remaining = Math.max(0, 4 * 3600 - elapsed);

    return (
        <p className="font-mono text-3xl font-black text-cyan-200" aria-live="polite">
            {formatClock(remaining)}
            <span className="ml-2 text-sm font-bold text-slate-300">baki daripada 4 jam</span>
        </p>
    );
}

function statusClass(status: string): string {
    if (status === 'SEDANG_DIALISIS') return 'bg-emerald-950 text-emerald-200 border-emerald-700';
    if (status === 'SUDAH_HADIR') return 'bg-cyan-950 text-cyan-200 border-cyan-700';
    if (status === 'SUDAH_SELESAI') return 'bg-slate-800 text-slate-200 border-slate-600';
    return 'bg-amber-950 text-amber-100 border-amber-700';
}

function SessionActions({ session }: { session: SessionCard }) {
    const checkIn = useForm({ pre_weight_kg: '', pre_bp: '' });
    const complete = useForm({ post_weight_kg: '', post_bp: '', nurse_notes: '' });
    const start = useForm({});

    if (session.status === 'BELUM_HADIR') {
        return (
            <form
                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                onSubmit={(event) => {
                    event.preventDefault();
                    checkIn.post(`/jururawat/sesi/${session.id}/daftar-masuk`);
                }}
            >
                <label className="space-y-1">
                    <span className="text-sm font-bold">Berat sebelum (kg)</span>
                    <input className={fieldClass} inputMode="decimal" value={checkIn.data.pre_weight_kg} onChange={(event) => checkIn.setData('pre_weight_kg', event.target.value)} required />
                    <InputError message={checkIn.errors.pre_weight_kg} />
                </label>
                <label className="space-y-1">
                    <span className="text-sm font-bold">BP sebelum</span>
                    <input className={fieldClass} placeholder="120/80" value={checkIn.data.pre_bp} onChange={(event) => checkIn.setData('pre_bp', event.target.value)} required />
                    <InputError message={checkIn.errors.pre_bp} />
                </label>
                <button type="submit" className="inline-flex min-h-12 items-center justify-center self-end rounded-xl bg-cyan-500 px-4 font-black text-slate-950">
                    Daftar masuk
                </button>
                <InputError message={checkIn.errors.status} />
            </form>
        );
    }

    if (session.status === 'SUDAH_HADIR') {
        return (
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    start.post(`/jururawat/sesi/${session.id}/mula`);
                }}
            >
                <button type="submit" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-emerald-500 px-5 text-lg font-black text-slate-950">
                    Mula dialisis
                </button>
                <InputError message={start.errors.status} />
            </form>
        );
    }

    if (session.status === 'SEDANG_DIALISIS' && session.started_at) {
        return (
            <div className="space-y-4">
                <DialysisTimer startedAt={session.started_at} />
                <form
                    className="grid gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        complete.post(`/jururawat/sesi/${session.id}/selesai`);
                    }}
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1">
                            <span className="text-sm font-bold">Berat selepas (kg)</span>
                            <input className={fieldClass} inputMode="decimal" value={complete.data.post_weight_kg} onChange={(event) => complete.setData('post_weight_kg', event.target.value)} required />
                            <InputError message={complete.errors.post_weight_kg} />
                        </label>
                        <label className="space-y-1">
                            <span className="text-sm font-bold">BP selepas</span>
                            <input className={fieldClass} placeholder="120/80" value={complete.data.post_bp} onChange={(event) => complete.setData('post_bp', event.target.value)} required />
                            <InputError message={complete.errors.post_bp} />
                        </label>
                    </div>
                    <label className="space-y-1">
                        <span className="text-sm font-bold">Nota jururawat</span>
                        <input className={fieldClass} value={complete.data.nurse_notes} onChange={(event) => complete.setData('nurse_notes', event.target.value)} />
                    </label>
                    <button type="submit" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-teal-500 px-5 text-lg font-black text-slate-950">
                        Tamat sesi
                    </button>
                    <InputError message={complete.errors.status} />
                </form>
            </div>
        );
    }

    return (
        <p className="text-base text-slate-200">
            Berat {session.pre_weight_kg} kg → {session.post_weight_kg} kg · BP {session.pre_bp} → {session.post_bp}
            {session.nurse_notes ? ` · ${session.nurse_notes}` : ''}
        </p>
    );
}

export default function HariIni({ sessions, today }: { sessions: SessionCard[]; today: string }) {
    return (
        <>
            <Head title="Hari ini" />
            <div className="space-y-5">
                <div>
                    <p className="text-sm font-bold text-teal-300">Portal jururawat</p>
                    <h1 className="text-3xl font-black">Sesi hari ini</h1>
                    <p className="text-lg text-slate-200">{today}</p>
                </div>
                {sessions.length === 0 && (
                    <p className="rounded-2xl border border-[#1F385C] bg-[#132238] p-6 text-lg">Tiada sesi dijadualkan untuk hari ini.</p>
                )}
                <div className="grid gap-4">
                    {sessions.map((session) => (
                        <article key={session.id} className="space-y-4 rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl font-black">{session.patient.name}</h2>
                                    <p className="text-base text-slate-200">
                                        {session.patient.patient_id_code} · Kerusi {session.chair_number} · {session.scheduled_time} · {session.shift_label}
                                    </p>
                                    <p className="text-sm text-slate-300">
                                        Berat kering {session.patient.dry_weight_kg} kg · {session.patient.sponsor}
                                        {session.patient.allergies ? ` · Alahan: ${session.patient.allergies}` : ''}
                                    </p>
                                </div>
                                <span className={`rounded-full border px-3 py-2 text-sm font-black ${statusClass(session.status)}`}>
                                    {session.status_label}
                                </span>
                            </div>
                            {session.pre_weight_kg && session.status !== 'SUDAH_SELESAI' && (
                                <p className="text-base">Sebelum: {session.pre_weight_kg} kg · {session.pre_bp}</p>
                            )}
                            <SessionActions session={session} />
                        </article>
                    ))}
                </div>
            </div>
        </>
    );
}
