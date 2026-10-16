import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';

type PatientRow = {
    id: number;
    patient_id_code: string;
    name: string;
    phone: string;
    sponsor: string;
    schedule_label: string;
    preferred_shift: string;
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
    documents: DocumentRow[];
};

type DocumentRow = {
    id: number;
    category_label: string;
    original_name: string;
    size_label: string;
    created_at: string;
};

type Option = {
    value: string;
    label: string;
};

type TodayCounts = {
    date_label: string;
    total: number;
    belum: number;
    menunggu: number;
    hadir: number;
    sedang: number;
    selesai: number;
    kerusi_kosong: number;
    percent: number;
};

type ShiftOption = {
    value: string;
    label: string;
    time_range: string;
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

const sections = [
    { id: 'ringkasan', label: 'Ringkasan' },
    { id: 'pesakit', label: 'Pesakit' },
    { id: 'dokumen', label: 'Dokumen' },
    { id: 'permohonan', label: 'Permohonan' },
    { id: 'jururawat', label: 'Jururawat' },
] as const;

export default function PapanAdmin({
    today,
    patients,
    registrations,
    nurseApplications,
    patientDocuments,
    documentCategories,
    shifts,
    notice,
}: {
    today: TodayCounts;
    shifts: ShiftOption[];
    patients: PatientRow[];
    registrations: RegistrationRow[];
    nurseApplications: NurseApplicationRow[];
    patientDocuments: Array<DocumentRow & { patient_name: string | null }>;
    documentCategories: Option[];
    notice?: string | null;
}) {
    const [section, setSection] = useState<(typeof sections)[number]['id']>('ringkasan');

    return (
        <>
            <Head title="Portal pentadbir" />
            <div className="space-y-8">
                <div>
                    <p className="text-sm font-bold text-teal-300">Portal pentadbir</p>
                    <h1 className="text-3xl font-black">Pesakit dan permohonan</h1>
                </div>
                <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Bahagian pentadbir">
                    {sections.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            aria-pressed={section === item.id}
                            onClick={() => setSection(item.id)}
                            className={`inline-flex min-h-12 shrink-0 items-center rounded-2xl px-4 font-black ${
                                section === item.id ? 'bg-teal-500 text-slate-950' : 'border border-[#1F385C] bg-[#132238]'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                    <Link href="/jururawat/darah" className="inline-flex min-h-12 shrink-0 items-center rounded-2xl border border-[#1F385C] bg-[#132238] px-4 font-black">
                        Rekod darah
                    </Link>
                    <Link href="/jururawat/tetapan" className="inline-flex min-h-12 shrink-0 items-center rounded-2xl border border-[#1F385C] bg-[#132238] px-4 font-black">
                        Tetapan
                    </Link>
                </nav>
                {notice && <p className="rounded-2xl border border-teal-700 bg-teal-950 p-4 text-lg font-bold text-teal-100" role="status">{notice}</p>}

                {section === 'ringkasan' && (
                    <section className="space-y-3 rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                        <h2 className="text-2xl font-black">Syif hari ini</h2>
                        <p className="text-lg text-slate-200">{today.date_label}. Angka ini sama dengan portal jururawat.</p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <p className="text-lg">Jumlah <span className="block text-3xl font-black">{today.total}</span></p>
                            <p className="text-lg">Belum tiba <span className="block text-3xl font-black">{today.belum}</span></p>
                            <p className="text-lg">Menunggu <span className="block text-3xl font-black">{today.menunggu}</span></p>
                            <p className="text-lg">Sudah hadir <span className="block text-3xl font-black">{today.hadir}</span></p>
                            <p className="text-lg">Sedang dialisis <span className="block text-3xl font-black">{today.sedang}</span></p>
                            <p className="text-lg">Selesai <span className="block text-3xl font-black">{today.selesai}</span></p>
                        </div>
                        <Link href="/jururawat" className="inline-flex min-h-12 items-center rounded-2xl bg-teal-500 px-4 font-black text-slate-950">
                            Buka papan jururawat
                        </Link>
                    </section>
                )}

                {section === 'pesakit' && <section className="space-y-3">
                    <h2 className="text-2xl font-black">Pesakit aktif ({patients.length})</h2>
                    <ul className="grid gap-2 sm:grid-cols-3">
                        {shifts.map((shift) => (
                            <li key={shift.value} className="rounded-2xl border border-[#1F385C] bg-[#132238] p-3">
                                <p className="font-black">{shift.label}</p>
                                <p className="text-base text-slate-200">{shift.time_range}</p>
                            </li>
                        ))}
                    </ul>
                    <p className="text-base text-slate-300 md:hidden">Leret jadual ke tepi jika lajur tidak muat pada skrin.</p>
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
                                        <td className="px-4 py-4">
                                            <p>{patient.schedule_label}</p>
                                            <p>{patient.shift_label}</p>
                                            <ShiftForm patientId={patient.id} value={patient.preferred_shift} shifts={shifts} />
                                        </td>
                                        <td className="px-4 py-4">{patient.sponsor}</td>
                                        <td className="px-4 py-4">{patient.dry_weight_kg} kg</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>}

                {section === 'dokumen' && <section className="space-y-3">
                    <h2 className="text-2xl font-black">Dokumen pesakit sedia ada</h2>
                    <p className="text-base text-slate-200">PDF dan gambar pesakit disimpan dalam folder dokumen pesakit. Fail ini tidak dipaparkan kepada umum.</p>
                    <PatientDocumentForm patients={patients} categories={documentCategories} />
                    {patientDocuments.length === 0 ? (
                        <p className="rounded-2xl border border-[#1F385C] bg-[#132238] p-5">Tiada dokumen pesakit lagi.</p>
                    ) : (
                        <ul className="grid gap-3">
                            {patientDocuments.map((document) => (
                                <li key={document.id} className="rounded-2xl border border-[#1F385C] bg-[#132238] p-4">
                                    <p className="text-lg font-black">{document.patient_name} · {document.category_label}</p>
                                    <a className="inline-flex min-h-12 items-center font-bold text-teal-200 underline" href={`/admin/dokumen/${document.id}`} download>
                                        {document.original_name}
                                    </a>
                                    <p className="text-sm text-slate-300">{document.size_label} · {document.created_at}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>}

                {section === 'permohonan' && <section className="space-y-3">
                    <h2 className="text-2xl font-black">Permohonan pesakit baru</h2>
                    <p className="text-base text-slate-200">Permohonan menunggu pengesahan pentadbir. Kelulusan tidak membuka akaun portal.</p>
                    {registrations.length === 0 ? (
                        <p className="rounded-2xl border border-[#1F385C] bg-[#132238] p-5">Tiada permohonan.</p>
                    ) : (
                        <ul className="grid gap-3">
                            {registrations.map((registration) => (
                                <RegistrationCard key={registration.id} registration={registration} categories={documentCategories} />
                            ))}
                        </ul>
                    )}
                </section>}

                {section === 'jururawat' && <section className="space-y-3">
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
                </section>}
            </div>
        </>
    );
}

function RegistrationCard({ registration, categories }: { registration: RegistrationRow; categories: Option[] }) {
    const approve = useForm({});
    const reject = useForm({});
    const upload = useForm<{ category: string; document: File | null }>({
        category: 'KAD_PENGENALAN',
        document: null,
    });

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
            <div className="space-y-2 rounded-2xl border border-[#1F385C] p-3">
                <p className="text-lg font-black">Dokumen sokongan</p>
                {registration.documents.length === 0 ? (
                    <p className="text-base text-slate-200">Tiada dokumen dimuat naik lagi.</p>
                ) : (
                    <ul className="space-y-1">
                        {registration.documents.map((document) => (
                            <li key={document.id}>
                                <a className="inline-flex min-h-12 items-center font-bold text-teal-200 underline" href={`/admin/dokumen/${document.id}`} download>
                                    {document.category_label}: {document.original_name}
                                </a>
                                <p className="text-sm text-slate-300">{document.size_label} · {document.created_at}</p>
                            </li>
                        ))}
                    </ul>
                )}
                <form
                    className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                    onSubmit={(event) => {
                        event.preventDefault();
                        upload.post(`/admin/permohonan/${registration.id}/dokumen`, { forceFormData: true });
                    }}
                >
                    <select className="min-h-12 rounded-xl border border-[#1F385C] bg-[#0B132B] px-3" value={upload.data.category} onChange={(event) => upload.setData('category', event.target.value)}>
                        {categories.map((category) => (
                            <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                    </select>
                    <input className="min-h-12 rounded-xl border border-[#1F385C] bg-[#0B132B] px-3 py-2" type="file" accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => upload.setData('document', event.target.files?.[0] ?? null)} />
                    <button type="submit" disabled={upload.processing} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-500 px-4 font-black text-slate-950">
                        Muat naik
                    </button>
                    <InputError className="sm:col-span-3" message={upload.errors.document || upload.errors.category} />
                </form>
            </div>
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

function PatientDocumentForm({ patients, categories }: { patients: PatientRow[]; categories: Option[] }) {
    const form = useForm<{ patient_id: string; category: string; document: File | null }>({
        patient_id: '',
        category: 'LAIN',
        document: null,
    });

    return (
        <form
            className="grid gap-3 rounded-2xl border border-[#1F385C] bg-[#132238] p-4 sm:grid-cols-2"
            onSubmit={(event) => {
                event.preventDefault();
                if (!form.data.patient_id) {
                    return;
                }
                form.post(`/admin/pesakit/${form.data.patient_id}/dokumen`, { forceFormData: true });
            }}
        >
            <label className="space-y-1">
                <span className="text-sm font-bold">Pesakit</span>
                <select className="min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-3" value={form.data.patient_id} onChange={(event) => form.setData('patient_id', event.target.value)} required>
                    <option value="">Pilih pesakit</option>
                    {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>{patient.name}</option>
                    ))}
                </select>
            </label>
            <label className="space-y-1">
                <span className="text-sm font-bold">Jenis dokumen</span>
                <select className="min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-3" value={form.data.category} onChange={(event) => form.setData('category', event.target.value)}>
                    {categories.map((category) => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                </select>
            </label>
            <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-bold">Fail PDF atau gambar</span>
                <input className="min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-3 py-2" type="file" accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => form.setData('document', event.target.files?.[0] ?? null)} required />
            </label>
            <button type="submit" disabled={form.processing} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-500 px-4 font-black text-slate-950 sm:col-span-2">
                Simpan dokumen pesakit
            </button>
            <InputError className="sm:col-span-2" message={form.errors.document || form.errors.category} />
        </form>
    );
}

function ShiftForm({ patientId, value, shifts }: { patientId: number; value: string; shifts: ShiftOption[] }) {
    const form = useForm({ preferred_shift: value });

    return (
        <form
            className="mt-2 grid gap-2"
            onSubmit={(event) => {
                event.preventDefault();
                form.post(`/admin/pesakit/${patientId}/syif`);
            }}
        >
            <select className="min-h-12 rounded-xl border border-[#1F385C] bg-[#0B132B] px-3" value={form.data.preferred_shift} onChange={(event) => form.setData('preferred_shift', event.target.value)}>
                {shifts.map((shift) => (
                    <option key={shift.value} value={shift.value}>{shift.time_range}</option>
                ))}
            </select>
            <button type="submit" disabled={form.processing} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-500 px-3 font-black text-slate-950">
                Simpan syif
            </button>
            <InputError message={form.errors.preferred_shift} />
        </form>
    );
}

function InputStatus({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-base font-bold text-rose-200 sm:col-span-2">{message}</p>;
}
