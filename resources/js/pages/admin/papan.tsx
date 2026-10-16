import { Head, useForm } from '@inertiajs/react';

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
    email: string | null;
    gender_label: string;
    age_label: string | null;
    address: string | null;
    patient_category_label: string | null;
    medical_notes: string | null;
    nok_name: string | null;
    nok_relationship_label: string | null;
    nok_phone: string | null;
    status: string;
    status_label: string;
    can_review: boolean;
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
    notice,
}: {
    patients: PatientRow[];
    registrations: RegistrationRow[];
    nurseApplications: NurseApplicationRow[];
    notice?: string | null;
}) {
    return (
        <>
            <Head title="Portal pentadbir" />
            <div className="space-y-8">
                <div>
                    <p className="text-sm font-bold text-teal-300">Portal pentadbir</p>
                    <h1 className="text-3xl font-black">Pesakit dan permohonan</h1>
                </div>
                {notice && <p className="rounded-2xl border border-teal-700 bg-teal-950 p-4 text-lg font-bold text-teal-100" role="status">{notice}</p>}

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
                    <h2 className="text-2xl font-black">Permohonan pesakit baru</h2>
                    <p className="text-base text-slate-200">Permohonan menunggu pengesahan pentadbir. Kelulusan tidak membuka akaun portal.</p>
                    {registrations.length === 0 ? (
                        <p className="rounded-2xl border border-[#1F385C] bg-[#132238] p-5">Tiada permohonan.</p>
                    ) : (
                        <ul className="grid gap-3">
                            {registrations.map((registration) => (
                                <RegistrationCard key={registration.id} registration={registration} />
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

function RegistrationCard({ registration }: { registration: RegistrationRow }) {
    const approve = useForm({});
    const reject = useForm({});

    return (
        <li className="space-y-3 rounded-2xl border border-[#1F385C] bg-[#132238] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-2xl font-black">{registration.full_name}</p>
                    <p className="text-base text-slate-200">{registration.reference} · {registration.created_at}</p>
                </div>
                <p className="rounded-full border border-teal-700 px-3 py-2 text-sm font-black text-teal-100">{registration.status_label}</p>
            </div>
            <p className="text-lg">Kad pengenalan {registration.ic_number}</p>
            <p className="text-lg">{registration.gender_label}{registration.age_label ? ` · ${registration.age_label}` : ''}</p>
            <p className="text-lg">Telefon {registration.phone_number}{registration.email ? ` · ${registration.email}` : ''}</p>
            {registration.address && <p className="text-lg">Alamat: {registration.address}</p>}
            {registration.patient_category_label && <p className="text-lg">Kategori: {registration.patient_category_label}</p>}
            <p className="text-lg">
                Waris: {registration.nok_name ?? 'Tiada'}
                {registration.nok_relationship_label ? ` (${registration.nok_relationship_label})` : ''}
                {registration.nok_phone ? ` · ${registration.nok_phone}` : ''}
            </p>
            {registration.medical_notes && <p className="text-lg">Catatan: {registration.medical_notes}</p>}
            {registration.can_review && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        disabled={approve.processing}
                        onClick={() => approve.post(`/admin/permohonan/${registration.id}/lulus`)}
                        className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-teal-500 text-lg font-black text-slate-950"
                    >
                        Luluskan permohonan
                    </button>
                    <button
                        type="button"
                        disabled={reject.processing}
                        onClick={() => reject.post(`/admin/permohonan/${registration.id}/tolak`)}
                        className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-rose-700 text-lg font-black text-rose-100"
                    >
                        Tolak permohonan
                    </button>
                    <InputStatus message={approve.errors.status || reject.errors.status} />
                </div>
            )}
        </li>
    );
}

function InputStatus({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-base font-bold text-rose-200 sm:col-span-2">{message}</p>;
}
