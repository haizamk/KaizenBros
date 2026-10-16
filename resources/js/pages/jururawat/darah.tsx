import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';

type PatientOption = {
    id: number;
    name: string;
    patient_id_code: string;
};

type ExaminationType = {
    value: string;
    label: string;
};

type RecordRow = {
    id: number;
    examination_label: string;
    examination_type_label: string;
    hemoglobin: string | null;
    potassium: string | null;
    phosphate: string | null;
    urea: string | null;
    creatinine: string | null;
    potassium_needs_attention: boolean;
    clinical_notes: string | null;
    patient_name: string;
    patient_id_code: string;
    recorded_by: string | null;
};

const fieldClass = 'min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-3 text-base text-white';

export default function Darah({
    patients,
    selectedPatientId,
    records,
    examinationTypes,
    status,
}: {
    patients: PatientOption[];
    selectedPatientId: number | null;
    records: RecordRow[];
    examinationTypes: ExaminationType[];
    status?: string | null;
}) {
    const form = useForm({
        patient_id: selectedPatientId ? String(selectedPatientId) : '',
        examination_date: '',
        examination_type: examinationTypes[0]?.value ?? 'BERKALA_3_BULAN',
        hemoglobin: '',
        potassium: '',
        phosphate: '',
        urea: '',
        creatinine: '',
        clinical_notes: '',
    });

    return (
        <>
            <Head title="Rekod darah" />
            <div className="space-y-6">
                <div>
                    <p className="text-sm font-bold text-teal-300">Portal jururawat</p>
                    <h1 className="text-3xl font-black">Rekod darah</h1>
                    <p className="text-base text-slate-200">Keputusan makmal disimpan di pelayan dan hanya pesakit berkenaan yang boleh melihatnya.</p>
                </div>

                {status && <p className="rounded-2xl border border-teal-700 bg-teal-950 p-4 text-base font-bold text-teal-100" role="status">{status}</p>}

                <form
                    className="space-y-4 rounded-3xl border border-[#1F385C] bg-[#132238] p-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/jururawat/darah');
                    }}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1">
                            <span className="text-sm font-bold">Pesakit</span>
                            <select className={fieldClass} value={form.data.patient_id} onChange={(event) => form.setData('patient_id', event.target.value)} required>
                                <option value="">Pilih pesakit</option>
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>{patient.name} ({patient.patient_id_code})</option>
                                ))}
                            </select>
                            <InputError message={form.errors.patient_id} />
                        </label>
                        <label className="space-y-1">
                            <span className="text-sm font-bold">Tarikh pemeriksaan</span>
                            <input type="date" className={fieldClass} value={form.data.examination_date} onChange={(event) => form.setData('examination_date', event.target.value)} required />
                            <InputError message={form.errors.examination_date} />
                        </label>
                    </div>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">Jenis pemeriksaan</span>
                        <select className={fieldClass} value={form.data.examination_type} onChange={(event) => form.setData('examination_type', event.target.value)}>
                            {examinationTypes.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <NumberField label="Hemoglobin (g/dL)" value={form.data.hemoglobin} error={form.errors.hemoglobin} onChange={(value) => form.setData('hemoglobin', value)} />
                        <NumberField label="Kalium (mmol/L)" value={form.data.potassium} error={form.errors.potassium} onChange={(value) => form.setData('potassium', value)} />
                        <NumberField label="Fosfat (mmol/L)" value={form.data.phosphate} error={form.errors.phosphate} onChange={(value) => form.setData('phosphate', value)} />
                        <NumberField label="Urea (mmol/L)" value={form.data.urea} error={form.errors.urea} onChange={(value) => form.setData('urea', value)} />
                        <NumberField label="Kreatinin (µmol/L)" value={form.data.creatinine} error={form.errors.creatinine} onChange={(value) => form.setData('creatinine', value)} />
                    </div>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">Nota klinikal</span>
                        <textarea className={`${fieldClass} min-h-24 py-3`} value={form.data.clinical_notes} onChange={(event) => form.setData('clinical_notes', event.target.value)} />
                    </label>
                    <button type="submit" disabled={form.processing} className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-teal-500 text-lg font-black text-slate-950 disabled:opacity-60">
                        {form.processing ? 'Menyimpan...' : 'Simpan rekod darah'}
                    </button>
                </form>

                <section className="space-y-3">
                    <h2 className="text-2xl font-black">Rekod terkini</h2>
                    {records.length === 0 ? (
                        <p className="rounded-2xl border border-[#1F385C] bg-[#132238] p-5">Tiada rekod lagi.</p>
                    ) : (
                        records.map((record) => (
                            <article key={record.id} className="rounded-2xl border border-[#1F385C] bg-[#132238] p-4">
                                <p className="text-lg font-black">{record.patient_name} · {record.patient_id_code}</p>
                                <p className="text-sm text-slate-300">{record.examination_label} · {record.examination_type_label}</p>
                                <p className="mt-2 text-base">
                                    Hb {record.hemoglobin ?? '—'} · K {record.potassium ?? '—'} · PO4 {record.phosphate ?? '—'} · Urea {record.urea ?? '—'} · Kreatinin {record.creatinine ?? '—'}
                                </p>
                                {record.potassium_needs_attention && <p className="mt-1 font-bold text-amber-200">Kalium 5.5 atau lebih tinggi. Perlu perhatian.</p>}
                                {record.clinical_notes && <p className="mt-1 text-slate-200">{record.clinical_notes}</p>}
                            </article>
                        ))
                    )}
                </section>
            </div>
        </>
    );
}

function NumberField({
    label,
    value,
    error,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="space-y-1">
            <span className="text-sm font-bold">{label}</span>
            <input inputMode="decimal" className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} />
            <InputError message={error} />
        </label>
    );
}
