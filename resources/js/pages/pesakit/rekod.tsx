import { Head, Link } from '@inertiajs/react';
import PatientNav, { MissingPatient } from '@/components/patient-nav';
import PeriodTabs from '@/components/period-tabs';

type SessionCard = {
    id: number;
    date_label: string;
    status_label: string;
    queue_label?: string | null;
    chair_number: string | null;
    chair_visible: boolean;
    pre_weight_kg: string | null;
    post_weight_kg: string | null;
    pre_bp: string | null;
    intra_bp: string | null;
    post_bp: string | null;
};

export default function RekodPesakit({
    patient,
    months,
    sessions,
}: {
    patient: { dry_weight_kg: string } | null;
    months: number;
    sessions: SessionCard[];
}) {
    return (
        <>
            <Head title="Rekod dialisis dahulu" />
            {!patient ? (
                <MissingPatient />
            ) : (
                <div className="space-y-4">
                    <PatientNav />
                    <header>
                        <h1 className="text-3xl font-black sm:text-4xl">Rekod dialisis dahulu</h1>
                        <p className="mt-2 text-lg leading-relaxed text-slate-200">
                            Setiap baris menunjukkan berat sebelum dan selepas, serta tekanan darah sebelum, semasa, dan selepas. Berat kering semasa ialah {patient.dry_weight_kg} kg. Maklumat ini hanya direkodkan oleh jururawat atau pentadbir.
                        </p>
                    </header>
                    <PeriodTabs base="/pesakit/rekod" current={months} />
                    <Link href="/pesakit/timbang" className="inline-flex min-h-12 items-center text-lg font-black text-teal-200 underline">
                        Lihat graf perbandingan
                    </Link>
                    {sessions.length === 0 ? (
                        <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5 text-lg">Tiada rekod dalam tempoh {months} bulan ini.</p>
                    ) : (
                        <ul className="space-y-3">
                            {sessions.map((session) => (
                                <li key={session.id} className="rounded-3xl border border-[#1F385C] bg-[#132238] p-4 sm:p-5">
                                    <p className="text-2xl font-black">{session.date_label}</p>
                                    <p className="text-base text-slate-300">{session.status_label}{session.chair_visible && session.chair_number ? ` · Kerusi ${session.chair_number}` : ''}</p>
                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <Cell title="Sebelum" weight={session.pre_weight_kg} pressure={session.pre_bp} />
                                        <Cell title="Semasa" weight={null} pressure={session.intra_bp} />
                                        <Cell title="Selepas" weight={session.post_weight_kg} pressure={session.post_bp} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </>
    );
}

function Cell({ title, weight, pressure }: { title: string; weight: string | null; pressure: string | null }) {
    return (
        <div className="rounded-2xl border border-[#1F385C] p-3">
            <p className="text-base font-bold text-slate-300">{title}</p>
            <p className="text-xl font-black">{weight ? `${weight} kg` : '—'}</p>
            <p className="text-lg">{pressure ?? '—'}</p>
        </div>
    );
}
