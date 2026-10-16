import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { NursePage } from '@/components/nurse-nav';
import { statusClass, type SessionCard, type ShiftCounts } from '@/components/session-actions';

const stages = [
    { key: 'BELUM_HADIR', count: 'belum' as const, step: '1', title: 'Tiba di klinik', detail: 'Dijadualkan dan belum daftar masuk di kaunter.' },
    { key: 'SUDAH_HADIR', count: 'hadir' as const, step: '2', title: 'Check-in dan triage', detail: 'Sudah timbang dan BP. Menunggu mesin.' },
    { key: 'SEDANG_DIALISIS', count: 'sedang' as const, step: '3', title: 'Sedang dialisis', detail: 'Rawatan aktif. Pemasa 4 jam berjalan.' },
    { key: 'SUDAH_SELESAI', count: 'selesai' as const, step: '4', title: 'Tamat dan discaj', detail: 'Berat selepas dan BP sudah direkod.' },
];

const filters = [
    { key: 'SEMUA', label: 'Semua' },
    { key: 'BELUM_HADIR', label: 'Belum hadir' },
    { key: 'SUDAH_HADIR', label: 'Sudah hadir' },
    { key: 'SEDANG_DIALISIS', label: 'Sedang dialisis' },
    { key: 'SUDAH_SELESAI', label: 'Selesai' },
];

function actionLabel(status: string): string {
    if (status === 'BELUM_HADIR') return 'Daftar masuk / Check-in';
    if (status === 'SUDAH_HADIR') return 'Mula sesi';
    if (status === 'SEDANG_DIALISIS') return 'Pantau stesen';
    return 'Lihat rekod';
}

export default function HariIni({
    sessions,
    counts,
    today,
    nurseName,
}: {
    sessions: SessionCard[];
    counts: ShiftCounts;
    today: string;
    nurseName: string;
}) {
    const [stage, setStage] = useState<string | null>(null);
    const [filter, setFilter] = useState('SEMUA');
    const [query, setQuery] = useState('');

    const visible = useMemo(() => {
        const selected = stage ?? (filter === 'SEMUA' ? null : filter);
        const needle = query.trim().toLowerCase();

        return sessions.filter((session) => {
            if (selected && session.status !== selected) return false;
            if (!needle) return true;
            return `${session.patient.name} ${session.patient.patient_id_code}`.toLowerCase().includes(needle);
        });
    }, [sessions, stage, filter, query]);

    return (
        <>
            <Head title="Hari ini" />
            <NursePage title={`Selamat datang, ${nurseName}`} intro={today}>
                {counts.clinic_closed ? (
                    <section className="rounded-3xl border border-indigo-700 bg-indigo-950 p-5">
                        <h2 className="text-xl font-black">Pemberitahuan klinikal automatik, lepas jam 7:00 petang</h2>
                        <p className="mt-2 text-lg leading-relaxed">
                            Waktu rawatan hemodialisis bagi syif hari ini telah tamat pada jam 7:00 petang. Sesi yang belum selesai kekal pada papan ini. Jadual seterusnya ada di halaman Jadual Rawatan.
                        </p>
                    </section>
                ) : null}

                <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-teal-300">Sistem giliran fleksibel, yang awal datang didahulukan</p>
                            <h2 className="text-2xl font-black">Papan giliran ketibaan hari ini</h2>
                        </div>
                        <p className="text-lg font-black text-teal-200">{counts.percent}% selesai</p>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#0B132B]">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${counts.percent}%` }} />
                    </div>
                    <p className="mt-3 text-base text-slate-200">
                        Klik satu peringkat untuk tapis senarai. Rekod berat dan tekanan darah dibuat di halaman Sesi Dialisis supaya data tidak bercampur di sini.
                    </p>
                </section>

                <div className="grid gap-3 md:grid-cols-2">
                    {stages.map((item) => {
                        const active = stage === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() => {
                                    setStage(active ? null : item.key);
                                    setFilter(active ? 'SEMUA' : item.key);
                                }}
                                className={`rounded-3xl border p-4 text-left ${active ? 'border-teal-400 bg-[#17304F]' : 'border-[#1F385C] bg-[#132238]'}`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-black text-teal-200">{item.step}</p>
                                    <p className="text-2xl font-black">{counts[item.count]}</p>
                                </div>
                                <h3 className="mt-2 text-xl font-black">{item.title}</h3>
                                <p className="mt-1 text-base text-slate-200">{item.detail}</p>
                            </button>
                        );
                    })}
                </div>

                <label className="block">
                    <span className="sr-only">Cari pesakit</span>
                    <input
                        className="min-h-14 w-full rounded-2xl border border-[#1F385C] bg-[#132238] px-4 text-lg"
                        placeholder="Cari nama atau ID pesakit"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </label>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {filters.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            aria-pressed={filter === item.key && stage === null}
                            onClick={() => {
                                setFilter(item.key);
                                setStage(null);
                            }}
                            className={`inline-flex min-h-12 shrink-0 items-center rounded-2xl px-4 font-black ${
                                filter === item.key && stage === null ? 'bg-teal-500 text-slate-950' : 'border border-[#1F385C] bg-[#132238]'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {visible.length === 0 ? (
                    <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6 text-lg">Tiada pesakit dalam giliran ini.</p>
                ) : (
                    <div className="grid gap-4">
                        {visible.map((session) => (
                            <article key={session.id} className="space-y-4 rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-2xl font-black">{session.patient.name}</h2>
                                        <p className="text-base text-slate-200">{session.patient.patient_id_code} · Stesen {session.chair_number}</p>
                                    </div>
                                    <span className={`rounded-full border px-3 py-2 text-sm font-black ${statusClass(session.status)}`}>{session.status_label}</span>
                                </div>
                                <div className="grid gap-2 text-base sm:grid-cols-3">
                                    <p>Masa temujanji<br /><span className="font-black">{session.scheduled_time}</span></p>
                                    <p>Berat kering<br /><span className="font-black">{session.patient.dry_weight_kg} kg</span></p>
                                    <p>Tekanan darah<br /><span className="font-black">{session.pre_bp ?? 'Belum direkod'}</span></p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Link
                                        href={`/jururawat/sesi?fokus=${session.id}`}
                                        className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-amber-400 px-4 text-lg font-black text-slate-950"
                                    >
                                        {actionLabel(session.status)}
                                    </Link>
                                    {session.whatsapp_url ? (
                                        <a
                                            href={session.whatsapp_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-lg font-black text-slate-950"
                                        >
                                            WhatsApp
                                        </a>
                                    ) : null}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </NursePage>
        </>
    );
}
