import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';

export type SessionCard = {
    id: number;
    queue_label: string | null;
    chair_number: string | null;
    scheduled_time: string;
    shift_label: string;
    status: string;
    status_label: string;
    pre_weight_kg: string | null;
    post_weight_kg: string | null;
    pre_bp: string | null;
    intra_bp: string | null;
    post_bp: string | null;
    started_at: string | null;
    nurse_notes: string | null;
    whatsapp_url?: string | null;
    patient: {
        name: string;
        patient_id_code: string;
        dry_weight_kg: string;
        sponsor: string;
        allergies: string | null;
        phone?: string;
    };
};

export type ShiftCounts = {
    total: number;
    belum: number;
    menunggu: number;
    hadir: number;
    kerusi_kosong: number;
    sedang: number;
    selesai: number;
    percent: number;
    clinic_closed: boolean;
    date_label: string;
};

const fieldClass = 'min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-3 text-base text-white';

function formStatus(errors: object): string | undefined {
    if ('status' in errors && typeof errors.status === 'string') {
        return errors.status;
    }

    return undefined;
}

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

export function statusClass(status: string): string {
    if (status === 'MENUNGGU') return 'bg-cyan-950 text-cyan-200 border-cyan-700';
    if (status === 'SEDANG_DIALISIS') return 'bg-emerald-950 text-emerald-200 border-emerald-700';
    if (status === 'SUDAH_HADIR') return 'bg-cyan-950 text-cyan-200 border-cyan-700';
    if (status === 'SUDAH_SELESAI') return 'bg-slate-800 text-slate-200 border-slate-600';
    return 'bg-amber-950 text-amber-100 border-amber-700';
}

export default function SessionActions({ session }: { session: SessionCard }) {
    const arrive = useForm({});
    const call = useForm({});
    const checkIn = useForm({ pre_weight_kg: '', pre_bp: '' });
    const during = useForm({ intra_bp: session.intra_bp ?? '' });
    const complete = useForm({ post_weight_kg: '', post_bp: '', nurse_notes: '' });
    const start = useForm({});

    if (session.status === 'BELUM_HADIR') {
        return (
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    arrive.post(`/jururawat/sesi/${session.id}/tiba`);
                }}
            >
                <button type="submit" disabled={arrive.processing} className="inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-amber-400 px-4 text-xl font-black text-slate-950">
                    Daftar ketibaan
                </button>
                <InputError message={formStatus(arrive.errors)} />
            </form>
        );
    }

    if (session.status === 'MENUNGGU' && !session.chair_number) {
        return (
            <form
                className="space-y-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    call.post(`/jururawat/sesi/${session.id}/panggil`);
                }}
            >
                <p className="text-3xl font-black text-amber-200">Giliran {session.queue_label}</p>
                <button type="submit" disabled={call.processing} className="inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 text-xl font-black text-slate-950">
                    Panggil ke kerusi kosong
                </button>
                <InputError message={formStatus(call.errors)} />
            </form>
        );
    }

    if (session.status === 'MENUNGGU') {
        return (
            <form
                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                onSubmit={(event) => {
                    event.preventDefault();
                    checkIn.post(`/jururawat/sesi/${session.id}/daftar-masuk`);
                }}
            >
                <p className="sm:col-span-3 text-lg font-black">Giliran {session.queue_label} · Kerusi {session.chair_number}</p>
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
                <button type="submit" className="inline-flex min-h-12 items-center justify-center self-end rounded-xl bg-amber-400 px-4 font-black text-slate-950">
                    Simpan di kerusi
                </button>
                <InputError message={formStatus(checkIn.errors)} />
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
                <InputError message={formStatus(start.errors)} />
            </form>
        );
    }

    if (session.status === 'SEDANG_DIALISIS' && session.started_at) {
        return (
            <div className="space-y-4">
                <DialysisTimer startedAt={session.started_at} />
                <form
                    className="grid gap-3 sm:grid-cols-[1fr_auto]"
                    onSubmit={(event) => {
                        event.preventDefault();
                        during.post(`/jururawat/sesi/${session.id}/tekanan-semasa`);
                    }}
                >
                    <label className="space-y-1">
                        <span className="text-sm font-bold">BP semasa dialisis</span>
                        <input className={fieldClass} placeholder="120/80" value={during.data.intra_bp} onChange={(event) => during.setData('intra_bp', event.target.value)} required />
                        <InputError message={during.errors.intra_bp} />
                    </label>
                    <button type="submit" className="inline-flex min-h-12 items-center justify-center self-end rounded-xl border border-cyan-600 px-4 font-black text-cyan-100">
                        Simpan BP semasa
                    </button>
                </form>
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
                    <InputError message={formStatus(complete.errors)} />
                </form>
            </div>
        );
    }

    return (
        <p className="text-base text-slate-200">
            Berat {session.pre_weight_kg} kg ke {session.post_weight_kg} kg. Tekanan darah {session.pre_bp}, semasa {session.intra_bp ?? 'belum direkod'}, selepas {session.post_bp}.
            {session.nurse_notes ? ` Nota: ${session.nurse_notes}` : ''}
        </p>
    );
}
