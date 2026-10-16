import { Head, Link } from '@inertiajs/react';
import { NursePage } from '@/components/nurse-nav';
import { statusClass, type SessionCard, type ShiftCounts } from '@/components/session-actions';

const cards = [
    { key: 'total' as const, label: 'Jumlah pesakit', detail: 'Jadual hari ini' },
    { key: 'hadir' as const, label: 'Sudah hadir', detail: 'Check-in selesai' },
    { key: 'sedang' as const, label: 'Sedang dialisis', detail: 'Aktif di mesin' },
    { key: 'selesai' as const, label: 'Sudah selesai', detail: 'Sesi tamat dan discaj' },
    { key: 'belum' as const, label: 'Belum hadir', detail: 'Menunggu kedatangan' },
];

export default function Ringkasan({ sessions, counts }: { sessions: SessionCard[]; counts: ShiftCounts }) {
    return (
        <>
            <Head title="Ringkasan syif" />
            <NursePage
                title="Ringkasan syif"
                intro={`${counts.date_label}. Angka ini sama dengan papan pesakit dan papan pentadbir kerana semua portal membaca rekod sesi yang sama.`}
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <article key={card.key} className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                            <p className="text-sm font-bold text-slate-300">{card.label}</p>
                            <p className="text-4xl font-black">{counts[card.key]}</p>
                            <p className="text-base text-slate-200">{card.detail}</p>
                        </article>
                    ))}
                </div>
                <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                    <h2 className="text-2xl font-black">Kemajuan syif {counts.percent}%</h2>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#0B132B]">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${counts.percent}%` }} />
                    </div>
                </section>
                <section className="space-y-3">
                    <h2 className="text-2xl font-black">Nama dalam syif ini</h2>
                    {sessions.length === 0 ? (
                        <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5 text-lg">Tiada sesi pada hari ini.</p>
                    ) : (
                        <ul className="grid gap-3">
                            {sessions.map((session) => (
                                <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1F385C] bg-[#132238] p-4">
                                    <div>
                                        <p className="text-xl font-black">{session.patient.name}</p>
                                        <p className="text-base text-slate-200">{session.patient.patient_id_code} · {session.shift_label} · Stesen {session.chair_number}</p>
                                    </div>
                                    <span className={`rounded-full border px-3 py-2 text-sm font-black ${statusClass(session.status)}`}>{session.status_label}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link href="/jururawat" className="inline-flex min-h-12 items-center rounded-2xl bg-teal-500 px-4 font-black text-slate-950">
                        Buka papan hari ini
                    </Link>
                </section>
            </NursePage>
        </>
    );
}
