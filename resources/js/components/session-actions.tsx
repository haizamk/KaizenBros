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
    can_call?: boolean;
    suggested_chair?: string | null;
    free_chairs?: string[];
    ahead_label?: string | null;
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
    kerusi_rosak: number;
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
    const arrive = useForm({ pre_weight_kg: '', pre_bp: '' });
    const autoCall = useForm({});
    const manualCall = useForm({ chair_number: '' });
    const checkIn = useForm({ pre_weight_kg: session.pre_weight_kg ?? '', pre_bp: session.pre_bp ?? '' });
    const during = useForm({ intra_bp: session.intra_bp ?? '' });
    const complete = useForm({ post_weight_kg: '', post_bp: '', nurse_notes: '' });
    const start = useForm({});
    const otherChairs = (session.free_chairs ?? []).filter((chair) => chair !== session.suggested_chair);

    if (session.status === 'BELUM_HADIR') {
        return (
            <form
                className="grid gap-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    arrive.post(`/jururawat/sesi/${session.id}/tiba`);
                }}
            >
                <p className="text-base text-slate-200">Berat kering pesakit ini ialah {session.patient.dry_weight_kg} kg. Berat semasa tiba wajib diisi. Tekanan darah boleh dibiarkan kosong.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                        <span className="text-sm font-bold">Berat badan semasa tiba (kg)</span>
                        <input className={fieldClass} inputMode="decimal" value={arrive.data.pre_weight_kg} onChange={(event) => arrive.setData('pre_weight_kg', event.target.value)} required />
                        <InputError message={arrive.errors.pre_weight_kg} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-bold">Tekanan darah (pilihan)</span>
                        <input className={fieldClass} placeholder="120/80" value={arrive.data.pre_bp} onChange={(event) => arrive.setData('pre_bp', event.target.value)} />
                        <InputError message={arrive.errors.pre_bp} />
                    </label>
                </div>
                <button type="submit" disabled={arrive.processing} className="inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-amber-400 px-4 text-xl font-black text-slate-950">
                    Daftar ketibaan
                </button>
                <InputError message={formStatus(arrive.errors)} />
            </form>
        );
    }

    if (session.status === 'MENUNGGU' && !session.chair_number) {
        return (
            <div className="space-y-3">
                <p className="text-3xl font-black text-amber-200">Giliran {session.queue_label}</p>
                <p className="text-base text-slate-200">
                    Berat tiba {session.pre_weight_kg ?? 'belum direkod'} kg. Tekanan darah {session.pre_bp ?? 'belum direkod'}.
                </p>
                {session.can_call === false ? (
                    <p className="rounded-2xl border border-amber-700 bg-amber-950 p-4 text-lg font-bold text-amber-100">
                        Giliran {session.ahead_label} sampai lebih awal. Panggil nombor itu dahulu.
                    </p>
                ) : session.suggested_chair ? (
                    <>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                autoCall.post(`/jururawat/sesi/${session.id}/panggil`);
                            }}
                        >
                            <button type="submit" disabled={autoCall.processing} className="inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 text-xl font-black text-slate-950">
                                Panggil automatik ke {session.suggested_chair}
                            </button>
                            <InputError message={formStatus(autoCall.errors)} />
                        </form>
                        {otherChairs.length > 0 ? (
                            <form
                                className="grid gap-3 sm:grid-cols-[1fr_auto]"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    manualCall.post(`/jururawat/sesi/${session.id}/panggil`);
                                }}
                            >
                                <label className="space-y-1">
                                    <span className="text-sm font-bold">Pilih kerusi lain jika kerusi automatik rosak atau tidak sesuai</span>
                                    <select
                                        className={fieldClass}
                                        value={manualCall.data.chair_number}
                                        onChange={(event) => manualCall.setData('chair_number', event.target.value)}
                                        required
                                    >
                                        <option value="">Pilih kerusi</option>
                                        {otherChairs.map((chair) => (
                                            <option key={chair} value={chair}>{chair}</option>
                                        ))}
                                    </select>
                                    <InputError message={manualCall.errors.chair_number} />
                                </label>
                                <button type="submit" disabled={manualCall.processing} className="inline-flex min-h-12 items-center justify-center self-end rounded-xl border border-cyan-500 px-4 font-black text-cyan-100">
                                    Guna kerusi ini
                                </button>
                            </form>
                        ) : (
                            <p className="text-base text-slate-200">Hanya kerusi ini yang kosong. Tandai rosak pada papan kerusi jika ia tidak boleh digunakan.</p>
                        )}
                    </>
                ) : (
                    <p className="rounded-2xl border border-amber-700 bg-amber-950 p-4 text-lg font-bold text-amber-100">
                        Tiada kerusi kosong. Bila satu sesi selesai, kerusi itu boleh diambil oleh giliran seterusnya.
                    </p>
                )}
                <InputError message={formStatus(manualCall.errors) ?? formStatus(autoCall.errors)} />
            </div>
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
                    <span className="text-sm font-bold">Tekanan darah (pilihan)</span>
                    <input className={fieldClass} placeholder="120/80, pilihan" value={checkIn.data.pre_bp} onChange={(event) => checkIn.setData('pre_bp', event.target.value)} />
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
            Berat {session.pre_weight_kg} kg ke {session.post_weight_kg} kg. Tekanan darah {session.pre_bp ?? 'belum direkod'}, semasa {session.intra_bp ?? 'belum direkod'}, selepas {session.post_bp}.
            {session.nurse_notes ? ` Nota: ${session.nurse_notes}` : ''}
        </p>
    );
}
