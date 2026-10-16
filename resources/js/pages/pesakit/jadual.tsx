import { Head } from '@inertiajs/react';
import PatientNav, { MissingPatient } from '@/components/patient-nav';

type PatientCard = {
    name: string;
    schedule_label: string;
    shift_label: string;
    time_range: string;
};

type Visit = {
    date: string;
    date_label: string;
    relative: string;
    time_range: string;
};

type PastSession = {
    id: number;
    date_label: string;
    status_label: string;
    time_range: string;
};

export default function JadualPesakit({
    patient,
    upcoming,
    past,
    todayLabel,
}: {
    patient: PatientCard | null;
    upcoming: Visit[];
    past: PastSession[];
    todayLabel: string;
}) {
    return (
        <>
            <Head title="Jadual rawatan" />
            {!patient ? (
                <MissingPatient />
            ) : (
                <div className="space-y-4">
                    <PatientNav />
                    <header>
                        <h1 className="text-3xl font-black sm:text-4xl">Jadual rawatan saya</h1>
                        <p className="mt-2 text-lg text-slate-200">Hari ini {todayLabel}.</p>
                    </header>
                    <section className="rounded-3xl border-2 border-cyan-800 bg-[#102033] p-4 sm:p-6">
                        <p className="text-sm font-black tracking-wide text-cyan-200">Rutin tetap rawatan</p>
                        <p className="mt-2 text-3xl font-black">{patient.schedule_label}</p>
                        <p className="mt-2 text-lg">{patient.shift_label}</p>
                        <p className="text-lg">Waktu rawatan: {patient.time_range}.</p>
                        <p className="mt-3 text-base leading-relaxed">Sila tiba 15 minit lebih awal di kaunter jururawat. Kerusi dipilih pada hari rawatan.</p>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-black">Sesi akan datang</h2>
                        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {upcoming.map((visit) => (
                                <li key={visit.date} className="rounded-2xl border border-[#1F385C] bg-[#132238] p-4">
                                    <p className="text-sm font-black text-cyan-200">{visit.relative}</p>
                                    <p className="text-xl font-black">{visit.date_label}</p>
                                    <p className="text-lg">{visit.time_range}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-black">Sesi yang sudah lepas</h2>
                        {past.length === 0 ? (
                            <p className="rounded-2xl border border-[#1F385C] bg-[#132238] p-5 text-lg">Tiada sesi lepas lagi.</p>
                        ) : (
                            <ul className="space-y-3">
                                {past.map((session) => (
                                    <li key={session.id} className="rounded-2xl border border-[#1F385C] bg-[#132238] p-4">
                                        <p className="text-xl font-black">{session.date_label}</p>
                                        <p className="text-lg">{session.status_label} · {session.time_range}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}
        </>
    );
}
