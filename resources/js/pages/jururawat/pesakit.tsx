import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { NursePage } from '@/components/nurse-nav';

type PatientRow = {
    id: number;
    name: string;
    patient_id_code: string;
    phone: string;
    sponsor: string;
    dry_weight_kg: string;
    vascular_access: string;
    access_location: string;
    allergies: string | null;
    schedule_label: string;
    shift_label: string;
    whatsapp_url: string | null;
};

export default function Pesakit({ patients }: { patients: PatientRow[] }) {
    const [query, setQuery] = useState('');
    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return patients;
        return patients.filter((patient) => `${patient.name} ${patient.patient_id_code} ${patient.phone}`.toLowerCase().includes(needle));
    }, [patients, query]);

    return (
        <>
            <Head title="Pesakit" />
            <NursePage title="Pesakit" intro="Senarai ini sama dengan senarai pesakit aktif di portal pentadbir.">
                <label className="block">
                    <span className="sr-only">Cari pesakit</span>
                    <input
                        className="min-h-14 w-full rounded-2xl border border-[#1F385C] bg-[#132238] px-4 text-lg"
                        placeholder="Cari nama, ID, atau telefon"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </label>
                {visible.length === 0 ? (
                    <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6 text-lg">Tiada pesakit yang sepadan.</p>
                ) : (
                    <div className="grid gap-4">
                        {visible.map((patient) => (
                            <article key={patient.id} className="space-y-3 rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                                <h2 className="text-2xl font-black">{patient.name}</h2>
                                <p className="text-base text-slate-200">{patient.patient_id_code} · {patient.phone}</p>
                                <p className="text-lg">Berat kering {patient.dry_weight_kg} kg · {patient.sponsor}</p>
                                <p className="text-base text-slate-200">{patient.schedule_label} · {patient.shift_label}</p>
                                <p className="text-base text-slate-200">Akses {patient.vascular_access}, {patient.access_location}</p>
                                <p className="text-base text-slate-200">Alahan: {patient.allergies || 'Tiada diketahui'}</p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <Link href="/jururawat/jadual" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#1F385C] font-black">Jadual</Link>
                                    <Link href={`/jururawat/darah?pesakit=${patient.id}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#1F385C] font-black">Rekod darah</Link>
                                    {patient.whatsapp_url ? (
                                        <a href={patient.whatsapp_url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-500 font-black text-slate-950">WhatsApp</a>
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
