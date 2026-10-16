import { Head } from '@inertiajs/react';
import DialysisTimer from '@/components/dialysis-timer';
import PatientNav, { MissingPatient } from '@/components/patient-nav';

type PatientCard = {
    name: string;
    patient_id_code: string;
    dry_weight_kg: string;
    vascular_access: string;
    access_location: string;
};

type SessionCard = {
    date_label: string;
    queue_label: string | null;
    chair_number: string | null;
    chair_visible: boolean;
    status: string;
    status_label: string;
    shift_label: string;
    time_range: string;
    pre_weight_kg: string | null;
    post_weight_kg: string | null;
    pre_bp: string | null;
    intra_bp: string | null;
    post_bp: string | null;
    started_at: string | null;
};

export default function SesiPesakit({
    patient,
    todaySession,
    todayLabel,
}: {
    patient: PatientCard | null;
    todaySession: SessionCard | null;
    todayLabel: string;
}) {
    return (
        <>
            <Head title="Sesi dialisis" />
            {!patient ? (
                <MissingPatient />
            ) : (
                <div className="space-y-4">
                    <PatientNav />
                    <header>
                        <p className="text-sm font-black text-teal-300">{patient.patient_id_code}</p>
                        <h1 className="text-3xl font-black sm:text-4xl">Sesi dialisis saya</h1>
                        <p className="mt-2 text-lg text-slate-200">{todayLabel}</p>
                    </header>
                    {!todaySession ? (
                        <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5 text-lg">Tiada sesi dijadualkan hari ini.</p>
                    ) : (
                        <section className="space-y-4 rounded-3xl border border-[#1F385C] bg-[#132238] p-4 sm:p-6">
                            <p className="text-2xl font-black leading-snug">{todaySession.status_label}</p>
                            {todaySession.queue_label ? <p className="text-4xl font-black text-amber-200">Giliran {todaySession.queue_label}</p> : null}
                            <p className="text-lg">{todaySession.date_label}</p>
                            <p className="text-lg">{todaySession.shift_label} · {todaySession.time_range}</p>
                            {todaySession.chair_visible && todaySession.chair_number ? (
                                <p className="text-2xl font-black text-teal-200">Kerusi {todaySession.chair_number}</p>
                            ) : (
                                <p className="text-lg leading-relaxed">Kerusi dan mesin akan dipapar selepas jururawat mendaftar kedatangan anda di kaunter.</p>
                            )}
                            {todaySession.status === 'SEDANG_DIALISIS' && todaySession.started_at && (
                                <DialysisTimer startedAt={todaySession.started_at} />
                            )}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <Reading label="Sebelum" weight={todaySession.pre_weight_kg} pressure={todaySession.pre_bp} />
                                <Reading label="Semasa" pressure={todaySession.intra_bp} />
                                <Reading label="Selepas" weight={todaySession.post_weight_kg} pressure={todaySession.post_bp} />
                            </div>
                            <p className="text-base leading-relaxed text-slate-300">
                                Berat kering anda {patient.dry_weight_kg} kg. Akses vaskular: {patient.vascular_access}, {patient.access_location}. Berat dan tekanan darah direkodkan oleh jururawat atau pentadbir.
                            </p>
                        </section>
                    )}
                </div>
            )}
        </>
    );
}

function Reading({ label, weight, pressure }: { label: string; weight?: string | null; pressure: string | null }) {
    return (
        <div className="rounded-2xl border border-[#1F385C] p-4">
            <p className="text-base font-bold text-slate-300">{label}</p>
            {weight !== undefined && <p className="text-2xl font-black">{weight ? `${weight} kg` : 'Berat belum diisi'}</p>}
            <p className="text-lg">{pressure ?? 'Tekanan darah belum diisi'}</p>
        </div>
    );
}
