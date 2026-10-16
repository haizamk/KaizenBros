import { Head } from '@inertiajs/react';

type PatientRow = {
    id: number;
    patient_id_code: string;
    name: string;
    phone: string;
    sponsor: string;
    schedule_label: string;
    shift_label: string;
    dry_weight_kg: string;
};

type RegistrationRow = {
    id: number;
    reference: string;
    full_name: string;
    ic_number: string;
    phone_number: string;
    status: string;
    created_at: string;
};

type NurseApplicationRow = {
    id: number;
    reference: string;
    full_name: string;
    phone_number: string;
    nursing_board_no: string;
    preferred_shift: string | null;
    status: string;
    created_at: string;
};

export default function PapanAdmin({
    patients,
    registrations,
    nurseApplications,
}: {
    patients: PatientRow[];
    registrations: RegistrationRow[];
    nurseApplications: NurseApplicationRow[];
}) {
    return (
        <>
            <Head title="Portal pentadbir" />
            <div className="space-y-8">
                <div>
                    <p className="text-sm font-bold text-teal-300">Portal pentadbir</p>
                    <h1 className="text-3xl font-black">Pesakit dan permohonan</h1>
                </div>

                <section className="space-y-3">
                    <h2 className="text-2xl font-black">Pesakit aktif ({patients.length})</h2>
                    <div className="overflow-x-auto rounded-3xl border border-[#1F385C]">
                        <table className="min-w-full text-left text-base">
                            <thead className="bg-[#102033] text-sm text-slate-300">
                                <tr>
                                    <th className="px-4 py-3">Pesakit</th>
                                    <th className="px-4 py-3">Jadual</th>
                                    <th className="px-4 py-3">Penaja</th>
                                    <th className="px-4 py-3">Berat kering</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((patient) => (
                                    <tr key={patient.id} className="border-t border-[#1F385C] bg-[#132238]">
                                        <td className="px-4 py-4">
                                            <p className="font-black">{patient.name}</p>
                                            <p className="text-sm text-slate-300">{patient.patient_id_code} · {patient.phone}</p>
                                        </td>
                                        <td className="px-4 py-4">{patient.schedule_label}<br />{patient.shift_label}</td>
                                        <td className="px-4 py-4">{patient.sponsor}</td>
                                        <td className="px-4 py-4">{patient.dry_weight_kg} kg</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-2xl font-black">Permohonan baru</h2>
                    {registrations.length === 0 ? (
                        <p className="rounded-2xl border border-[#1F385C] bg-[#132238] p-5">Tiada permohonan.</p>
                    ) : (
                        <ul className="grid gap-3">
                            {registrations.map((registration) => (
                                <li key={registration.id} className="rounded-2xl border border-[#1F385C] bg-[#132238] p-4">
                                    <p className="text-xl font-black">{registration.full_name}</p>
                                    <p className="text-base text-slate-200">
                                        {registration.reference} · {registration.ic_number} · {registration.phone_number}
                                    </p>
                                    <p className="text-sm text-teal-200">{registration.status} · {registration.created_at}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="text-2xl font-black">Permohonan jururawat</h2>
                    {nurseApplications.length === 0 ? (
                        <p className="rounded-2xl border border-[#1F385C] bg-[#132238] p-5">Tiada permohonan jururawat.</p>
                    ) : (
                        <ul className="grid gap-3">
                            {nurseApplications.map((application) => (
                                <li key={application.id} className="rounded-2xl border border-[#1F385C] bg-[#132238] p-4">
                                    <p className="text-xl font-black">{application.full_name}</p>
                                    <p className="text-base text-slate-200">
                                        {application.reference} · {application.phone_number} · Lembaga {application.nursing_board_no}
                                    </p>
                                    <p className="text-sm text-teal-200">{application.preferred_shift} · {application.status} · {application.created_at}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}
