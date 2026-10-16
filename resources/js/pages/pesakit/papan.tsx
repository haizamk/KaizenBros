import { Head, Link } from '@inertiajs/react';
import DialysisTimer from '@/components/dialysis-timer';
import PatientNav, { MissingPatient } from '@/components/patient-nav';
import QueueTicket from '@/components/queue-ticket';

type PatientCard = {
    patient_id_code: string;
    name: string;
    schedule_label: string;
    shift_label: string;
    time_range: string;
    dry_weight_kg: string;
};

type SessionCard = {
    date_label: string;
    scheduled_time: string;
    queue_label: string | null;
    queue_turn: number | null;
    queue_position: number | null;
    ahead_count: number | null;
    chair_number: string | null;
    chair_visible: boolean;
    status: string;
    status_label: string;
    shift_label: string;
    time_range: string;
    pre_weight_kg: string | null;
    post_weight_kg: string | null;
    pre_bp: string | null;
    post_bp: string | null;
    started_at: string | null;
};

type Visit = {
    date_label: string;
    relative: string;
    shift_label: string;
    time_range: string;
    schedule_label: string;
};

const cards = [
    { href: '/pesakit/sesi', title: 'Sesi dialisis saya', detail: 'Kerusi dipapar selepas daftar di kaunter', tone: 'border-emerald-700' },
    { href: '/pesakit/jadual', title: 'Jadual temujanji', detail: 'Rutin rawatan dan sesi seterusnya', tone: 'border-cyan-700' },
    { href: '/pesakit/timbang', title: 'Timbang dan tekanan darah', detail: 'Berat kering, sebelum, semasa, dan selepas', tone: 'border-teal-700' },
    { href: '/pesakit/ubat', title: 'Senarai ubat', detail: 'Ubat aktif yang direkodkan oleh kakitangan', tone: 'border-amber-700' },
    { href: '/pesakit/rekod', title: 'Rekod dialisis dahulu', detail: 'Sejarah berat dan tekanan darah setiap sesi', tone: 'border-indigo-700' },
    { href: '/pesakit/darah', title: 'Rekod perubatan dan darah', detail: 'Analisa serta perbandingan 6, 12, dan 24 bulan', tone: 'border-rose-700' },
];

export default function PapanPesakit({
    patient,
    todaySession,
    nextVisit,
    medicationCount,
    todayLabel,
}: {
    patient: PatientCard | null;
    todaySession: SessionCard | null;
    nextVisit: Visit | null;
    medicationCount: number;
    todayLabel: string;
}) {
    return (
        <>
            <Head title="Portal pesakit" />
            {!patient ? (
                <MissingPatient />
            ) : (
                <div className="space-y-4">
                    <PatientNav />
                    <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-4 sm:p-6">
                        <p className="text-sm font-black tracking-wide text-teal-300">Pusat Dialisis KaizenBros</p>
                        <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">Selamat datang, {patient.name}</h1>
                        <p className="mt-3 inline-flex min-h-12 items-center rounded-2xl border border-[#1F385C] px-4 text-lg font-black">
                            No. ID pesakit {patient.patient_id_code}
                        </p>
                        <p className="mt-3 text-base text-slate-300">{todayLabel}</p>
                    </section>

                    {todaySession ? (
                        <TodayCard session={todaySession} />
                    ) : nextVisit ? (
                        <NextCard visit={nextVisit} />
                    ) : (
                        <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5 text-lg">Tiada sesi dijadualkan.</p>
                    )}

                    {todaySession && nextVisit && (
                        <p className="rounded-2xl border border-cyan-800 bg-[#102033] p-4 text-lg">
                            Sesi seterusnya: <strong>{nextVisit.date_label}</strong>. {nextVisit.time_range}.
                        </p>
                    )}

                    <section className="space-y-3">
                        <h2 className="text-lg font-black tracking-wide text-slate-300">Fungsi utama portal pesakit</h2>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {cards.map((card) => (
                                <Link key={card.href} href={card.href} className={`flex min-h-24 items-center gap-4 rounded-3xl border-2 bg-[#102033] p-4 ${card.tone}`}>
                                    <span>
                                        <span className="block text-xl font-black leading-tight">{card.title}</span>
                                        <span className="mt-1 block text-base leading-snug text-slate-200">
                                            {card.href === '/pesakit/jadual' ? `${patient.schedule_label} · ${patient.time_range}` : card.href === '/pesakit/ubat' ? `${medicationCount} jenis ubat aktif` : card.href === '/pesakit/timbang' ? `Berat kering ${patient.dry_weight_kg} kg` : card.detail}
                                        </span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <a href="tel:0193889922" className="flex min-h-16 items-center justify-center rounded-3xl bg-rose-700 px-4 text-center text-xl font-black text-white">
                        Panggil pusat dialisis 019-388 9922
                    </a>
                    <p className="text-center text-base text-slate-300">Hubungi jika mengalami pening teruk, sesak nafas, atau kecemasan di rumah.</p>
                </div>
            )}
        </>
    );
}

function TodayCard({ session }: { session: SessionCard }) {
    return (
        <section className="space-y-4 rounded-3xl border-2 border-cyan-700 bg-[#102033] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-black tracking-wide text-cyan-200">Status rawatan hari ini</h2>
                <span className="rounded-full border border-amber-600 px-3 py-1 text-sm font-black text-amber-100">{session.shift_label}</span>
            </div>
            <p className="text-2xl font-black leading-snug">{session.status_label}</p>
            <QueueTicket ticket={session} />
            <p className="text-lg">{session.date_label} · {session.time_range}</p>
            {session.status === 'SEDANG_DIALISIS' && session.started_at && <DialysisTimer startedAt={session.started_at} />}
            <Chair session={session} />
            {(session.pre_weight_kg || session.post_weight_kg) && (
                <p className="text-lg">
                    Sebelum: {session.pre_weight_kg ?? '—'} kg · {session.pre_bp ?? '—'}
                    {session.post_weight_kg ? ` · Selepas: ${session.post_weight_kg} kg · ${session.post_bp ?? '—'}` : ''}
                </p>
            )}
            <Link href="/pesakit/sesi" className="inline-flex min-h-12 items-center text-lg font-black text-teal-200 underline">
                Lihat sesi dialisis
            </Link>
        </section>
    );
}

function NextCard({ visit }: { visit: Visit }) {
    return (
        <section className="space-y-4 rounded-3xl border-2 border-cyan-700 bg-[#102033] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-black tracking-wide text-cyan-200">Sesi rawatan dialisis seterusnya</h2>
                <span className="rounded-full border border-cyan-600 px-3 py-1 text-sm font-black text-cyan-100">{visit.relative}</span>
            </div>
            <p className="text-3xl font-black leading-tight sm:text-4xl">{visit.date_label}</p>
            <p className="text-lg">Seterusnya {visit.shift_label}. Waktu rawatan: {visit.time_range}.</p>
            <div className="rounded-2xl border border-[#1F385C] p-4 text-lg leading-relaxed">
                <p className="font-black text-cyan-200">Panduan ketibaan pesakit</p>
                <p>Sila tiba 15 minit lebih awal di kaunter jururawat.</p>
                <p>Rutin tetap anda: {visit.schedule_label}.</p>
            </div>
            <Chair session={null} />
        </section>
    );
}

function Chair({ session }: { session: SessionCard | null }) {
    if (session?.chair_visible && session.chair_number) {
        return (
            <div className="rounded-2xl border-2 border-teal-700 p-4">
                <p className="text-lg font-black text-teal-200">Kerusi {session.chair_number}</p>
                <p className="text-base leading-relaxed">Jururawat telah memanggil nombor anda kerana ada kerusi kosong.</p>
            </div>
        );
    }

    if (session?.queue_label) {
        return (
            <p className="text-base leading-relaxed">Kerusi akan dipaparkan di sini selepas jururawat memanggil nombor anda.</p>
        );
    }

    return (
        <div className="rounded-2xl border-2 border-amber-600 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-black text-amber-200">Lokasi dan kerusi dialisis</p>
                <span className="rounded-full border border-amber-600 px-3 py-1 text-sm font-black">Belum daftar kaunter</span>
            </div>
            <p className="mt-2 text-xl font-black leading-snug text-amber-100">Kerusi dan mesin dialisis akan dipapar selepas daftar di kaunter pada hari dialisis.</p>
            <p className="mt-2 text-base leading-relaxed">Setiap kerusi tidak tetap. Jururawat memilih kerusi mengikut giliran ketibaan.</p>
        </div>
    );
}
