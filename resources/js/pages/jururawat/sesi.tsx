import { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { NursePage } from '@/components/nurse-nav';
import ChairBoard, { type ChairTile } from '@/components/chair-board';
import SessionActions, { statusClass, type SessionCard, type ShiftCounts } from '@/components/session-actions';

const steps = ['Daftar dan berat', 'Panggil kerusi', 'Mula dialisis', 'Tamat rawatan'];

const filters = [
    { key: 'SEMUA', label: 'Semua' },
    { key: 'DAFTAR', label: 'Daftar & mula' },
    { key: 'BELUM_HADIR', label: 'Belum tiba' },
    { key: 'MENUNGGU', label: 'Menunggu' },
    { key: 'SUDAH_HADIR', label: 'Di kerusi' },
    { key: 'SEDANG_DIALISIS', label: 'Sedang dialisis' },
    { key: 'SUDAH_SELESAI', label: 'Selesai' },
];

const filterKeys = new Set(filters.map((item) => item.key));

function initialFilterFromUrl(url: string): string {
    const tapisan = new URLSearchParams(url.split('?')[1] ?? '').get('tapisan');

    return tapisan && filterKeys.has(tapisan) ? tapisan : 'SEMUA';
}

function matchesFilter(session: SessionCard, filter: string, focus: number | null): boolean {
    if (session.id === focus) {
        return true;
    }

    if (filter === 'SEMUA') {
        return true;
    }

    if (filter === 'DAFTAR') {
        return session.status === 'MENUNGGU' || session.status === 'SUDAH_HADIR';
    }

    return session.status === filter;
}

export default function Sesi({
    sessions,
    counts,
    chairs,
    focus,
    status,
}: {
    sessions: SessionCard[];
    counts: ShiftCounts;
    chairs: ChairTile[];
    focus: number | null;
    status?: string | null;
}) {
    const pageUrl = usePage().url;
    const [filter, setFilter] = useState(() => initialFilterFromUrl(pageUrl));
    const visible = useMemo(
        () => sessions.filter((session) => matchesFilter(session, filter, focus)),
        [sessions, filter, focus],
    );

    useEffect(() => {
        setFilter(initialFilterFromUrl(pageUrl));
    }, [pageUrl]);

    useEffect(() => {
        if (!focus) {
            return;
        }

        document.getElementById(`sesi-${focus}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [focus]);

    return (
        <>
            <Head title="Sesi dialisis" />
            <NursePage
                title="Sesi dialisis"
                intro={`${counts.date_label}. Berat dan tekanan darah yang disimpan di sini terus muncul pada portal pesakit. Hanya jururawat dan pentadbir boleh merekodnya.`}
            >
                <ol className="grid gap-2 sm:grid-cols-4">
                    {steps.map((step, index) => (
                        <li key={step} className="rounded-2xl border border-[#1F385C] bg-[#132238] px-3 py-3 text-sm font-black">
                            {index + 1}. {step}
                        </li>
                    ))}
                </ol>
                <p className="text-base text-slate-200">Kerusi yang boleh digunakan: {counts.kerusi_kosong}. Kerusi rosak atau tidak sesuai: {counts.kerusi_rosak}. Syif 1 6:00–10:00 pagi, Syif 2 10:30 pagi–2:30 petang, Syif 3 3:00–7:00 petang. Yang sampai dahulu dipanggil dahulu.</p>
                {status ? <p className="rounded-2xl border border-teal-700 bg-teal-950 p-4 text-lg font-bold text-teal-100" role="status">{status}</p> : null}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {filters.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            aria-pressed={filter === item.key}
                            onClick={() => setFilter(item.key)}
                            className={`inline-flex min-h-12 shrink-0 items-center rounded-2xl px-4 font-black ${
                                filter === item.key ? 'bg-teal-500 text-slate-950' : 'border border-[#1F385C] bg-[#132238]'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                {visible.length === 0 ? (
                    <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6 text-lg">Tiada sesi untuk tapisan ini.</p>
                ) : (
                    <div className="grid gap-4">
                        {visible.map((session) => (
                            <article id={`sesi-${session.id}`} key={session.id} className={`space-y-4 rounded-3xl border bg-[#132238] p-5 ${session.id === focus ? 'border-amber-400' : 'border-[#1F385C]'}`}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-2xl font-black">{session.patient.name}</h2>
                                        <p className="text-base text-slate-200">
                                            {session.patient.patient_id_code}
                                            {session.queue_label ? ` · Giliran ${session.queue_label}` : ''}
                                            {session.chair_number ? ` · Kerusi ${session.chair_number}` : ''}
                                            {' · '}{session.scheduled_time} · {session.shift_label}
                                        </p>
                                        <p className="text-sm text-slate-300">
                                            Berat kering {session.patient.dry_weight_kg} kg · {session.patient.sponsor}
                                            {session.patient.allergies ? ` · Alahan: ${session.patient.allergies}` : ''}
                                        </p>
                                    </div>
                                    <span className={`rounded-full border px-3 py-2 text-sm font-black ${statusClass(session.status)}`}>{session.status_label}</span>
                                </div>
                                {session.whatsapp_url ? (
                                    <a href={session.whatsapp_url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center rounded-xl bg-emerald-500 px-4 font-black text-slate-950">
                                        WhatsApp
                                    </a>
                                ) : null}
                                {session.pre_weight_kg && session.status !== 'SUDAH_SELESAI' ? (
                                    <p className="text-base">Sebelum: {session.pre_weight_kg} kg · {session.pre_bp ?? 'Tekanan darah belum direkod'}</p>
                                ) : null}
                                <SessionActions session={session} />
                            </article>
                        ))}
                    </div>
                )}
                <section id="papan-kerusi" className="space-y-3 pt-2">
                    <h2 className="text-2xl font-black">Papan kerusi</h2>
                    <p className="text-base text-slate-200">Rujukan kerusi kosong, sedang digunakan, atau ditanda tidak sesuai. Tandakan rosak di sini jika kerusi tidak boleh dipakai.</p>
                    <ChairBoard chairs={chairs} />
                </section>
            </NursePage>
        </>
    );
}
