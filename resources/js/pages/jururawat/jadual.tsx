import { Head, Link } from '@inertiajs/react';
import { NursePage } from '@/components/nurse-nav';

type Visit = {
    date_label: string;
    relative: string;
    shift_label: string;
    time_range: string;
};

type PatientRow = {
    id: number;
    name: string;
    patient_id_code: string;
    schedule_label: string;
    shift_label: string;
    time_range: string;
    upcoming: Visit[];
};

export default function Jadual({ patients }: { patients: PatientRow[] }) {
    return (
        <>
            <Head title="Jadual rawatan" />
            <NursePage title="Jadual rawatan" intro="Rutin tetap setiap pesakit. Portal pesakit memaparkan jadual yang sama.">
                {patients.length === 0 ? (
                    <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6 text-lg">Tiada pesakit aktif.</p>
                ) : (
                    <div className="grid gap-4">
                        {patients.map((patient) => (
                            <article key={patient.id} className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                                <h2 className="text-2xl font-black">{patient.name}</h2>
                                <p className="text-base text-slate-200">{patient.patient_id_code} · {patient.schedule_label}</p>
                                <p className="text-lg font-bold">{patient.shift_label}</p>
                                <p className="text-base text-slate-200">{patient.time_range}</p>
                                <ul className="mt-4 grid gap-2">
                                    {patient.upcoming.map((visit) => (
                                        <li key={visit.date_label} className="rounded-2xl border border-[#1F385C] px-4 py-3">
                                            <p className="font-black">{visit.date_label}</p>
                                            <p className="text-base text-slate-200">{visit.relative} · {visit.time_range}</p>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                )}
                <Link href="/jururawat/pesakit" className="inline-flex min-h-12 items-center rounded-2xl border border-[#1F385C] px-4 font-black">
                    Lihat senarai pesakit
                </Link>
            </NursePage>
        </>
    );
}
