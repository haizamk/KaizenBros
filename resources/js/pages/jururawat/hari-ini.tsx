import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { NursePage } from '@/components/nurse-nav';
import ChairBoard, { type ChairTile } from '@/components/chair-board';
import SessionActions, { statusClass, type SessionCard, type ShiftCounts } from '@/components/session-actions';

const stages = [
    { key: 'BELUM_HADIR', count: 'belum' as const, step: '1', title: 'Belum tiba', detail: 'Masukkan berat badan semasa daftar. Tekanan darah adalah pilihan.' },
    { key: 'MENUNGGU', count: 'menunggu' as const, step: '2', title: 'Menunggu panggilan', detail: 'Yang sampai dahulu dipanggil dulu. Kerusi automatik, atau pilih kerusi lain.' },
    { key: 'SUDAH_HADIR', count: 'hadir' as const, step: '3', title: 'Di kerusi', detail: 'Pesakit sudah duduk. Tekan mula dialisis.' },
    { key: 'SEDANG_DIALISIS', count: 'sedang' as const, step: '4', title: 'Sedang dialisis', detail: 'Rawatan aktif. Pemasa 4 jam berjalan.' },
    { key: 'SUDAH_SELESAI', count: 'selesai' as const, step: '5', title: 'Selesai', detail: 'Kerusi ini kosong semula untuk pesakit yang sampai dahulu.' },
];

const filters = [
    { key: 'SEMUA', label: 'Semua' },
    { key: 'BELUM_HADIR', label: 'Belum tiba' },
    { key: 'MENUNGGU', label: 'Menunggu' },
    { key: 'SUDAH_HADIR', label: 'Di kerusi' },
    { key: 'SEDANG_DIALISIS', label: 'Sedang dialisis' },
    { key: 'SUDAH_SELESAI', label: 'Selesai' },
];

function needsCounter(session: SessionCard): boolean {
    return session.status === 'BELUM_HADIR' || (session.status === 'MENUNGGU' && !session.chair_number);
}

export default function HariIni({
    sessions,
    counts,
    chairs,
    today,
    nurseName,
    status,
}: {
    sessions: SessionCard[];
    counts: ShiftCounts;
    chairs: ChairTile[];
    today: string;
    nurseName: string;
    status?: string | null;
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
                        Syif 1 ialah 6:00 pagi hingga 10:00 pagi. Syif 2 ialah 10:30 pagi hingga 2:30 petang. Syif 3 ialah 3:00 petang hingga 7:00 malam. Kerusi yang boleh digunakan sekarang: {counts.kerusi_kosong}. Kerusi ditanda rosak atau tidak sesuai: {counts.kerusi_rosak}.
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

                {status ? <p className="rounded-2xl border border-teal-700 bg-teal-950 p-4 text-lg font-bold text-teal-100" role="status">{status}</p> : null}

                <ChairBoard chairs={chairs} />

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
                                        <p className="text-base text-slate-200">
                                            {session.patient.patient_id_code}
                                            {session.queue_label ? ` · Giliran ${session.queue_label}` : ''}
                                            {session.chair_number ? ` · Kerusi ${session.chair_number}` : ' · Kerusi belum ditetapkan'}
                                        </p>
                                    </div>
                                    <span className={`rounded-full border px-3 py-2 text-sm font-black ${statusClass(session.status)}`}>{session.status_label}</span>
                                </div>
                                <div className="grid gap-2 text-base sm:grid-cols-3">
                                    <p>Masa temujanji<br /><span className="font-black">{session.scheduled_time}</span></p>
                                    <p>Berat semasa tiba<br /><span className="font-black">{session.pre_weight_kg ? `${session.pre_weight_kg} kg` : 'Belum direkod'}</span><span className="block text-sm text-slate-300">Kering {session.patient.dry_weight_kg} kg</span></p>
                                    <p>Tekanan darah<br /><span className="font-black">{session.pre_bp ?? 'Belum direkod'}</span></p>
                                </div>
                                {needsCounter(session) ? (
                                    <SessionActions session={session} />
                                ) : (
                                    <Link
                                        href={`/jururawat/sesi?fokus=${session.id}`}
                                        className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-teal-500 px-4 text-lg font-black text-slate-950"
                                    >
                                        Teruskan aliran sesi
                                    </Link>
                                )}
                                <div className="grid gap-3 sm:grid-cols-2">
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
