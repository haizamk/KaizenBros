import { Head, useForm } from '@inertiajs/react';
import BloodAnalysis, { LabReadings, type BloodAnalysisData, type LabReading } from '@/components/blood-analysis';
import InputError from '@/components/input-error';
import LabCharts, { type ChartSeries } from '@/components/lab-charts';
import NurseNav from '@/components/nurse-nav';

type PatientOption = {
    id: number;
    name: string;
    patient_id_code: string;
};

type ExaminationType = {
    value: string;
    label: string;
};

type ChartPoint = { label: string; value: number };

type RecordRow = {
    id: number;
    examination_label: string;
    examination_type_label: string;
    potassium_needs_attention: boolean;
    clinical_notes: string | null;
    nephrologist_notes: string | null;
    nephrologist_name: string | null;
    patient_name: string;
    patient_id_code: string;
    recorded_by: string | null;
    readings: LabReading[];
    analysis: BloodAnalysisData;
    report: { id: number; original_name: string } | null;
};

const fieldClass = 'min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-3 text-base text-white';

export default function Darah({
    patients,
    selectedPatientId,
    records,
    examinationTypes,
    status,
    canWriteDoctorNote,
    charts,
    chartSeries,
}: {
    patients: PatientOption[];
    selectedPatientId: number | null;
    records: RecordRow[];
    examinationTypes: ExaminationType[];
    status?: string | null;
    canWriteDoctorNote: boolean;
    charts: Record<string, ChartPoint[]>;
    chartSeries: ChartSeries[];
}) {
    const form = useForm({
        patient_id: selectedPatientId ? String(selectedPatientId) : '',
        examination_date: '',
        examination_type: examinationTypes[0]?.value ?? 'BERKALA_3_BULAN',
        clinical_notes: '',
        report: null as File | null,
    });

    return (
        <>
            <Head title="Rekod darah" />
            <div className="space-y-6">
                <NurseNav />
                <div>
                    <p className="text-sm font-bold text-teal-300">Portal jururawat</p>
                    <h1 className="text-3xl font-black">Rekod darah</h1>
                    <p className="text-base leading-relaxed text-slate-200">
                        Muat naik PDF laporan makmal. Sistem membaca setiap nombor yang ada dan menyusunnya mengikut tarikh. Jika sesuatu ujian tiada dalam PDF, ruangan itu dikosongkan. Fail disimpan dalam folder pesakit dan tidak dipadam.
                    </p>
                </div>

                {status && <p className="rounded-2xl border border-teal-700 bg-teal-950 p-4 text-base font-bold text-teal-100" role="status">{status}</p>}

                <form
                    className="space-y-4 rounded-3xl border border-[#1F385C] bg-[#132238] p-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/jururawat/darah', { forceFormData: true });
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
                            <span className="text-sm font-bold">Jenis pemeriksaan</span>
                            <select className={fieldClass} value={form.data.examination_type} onChange={(event) => form.setData('examination_type', event.target.value)}>
                                {examinationTypes.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">Tarikh jika tidak tercetak sebagai Tarikh Ujian dalam PDF</span>
                        <input type="date" className={fieldClass} value={form.data.examination_date} onChange={(event) => form.setData('examination_date', event.target.value)} />
                        <InputError message={form.errors.examination_date} />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">Nota kakitangan, jika ada</span>
                        <textarea className={`${fieldClass} min-h-24 py-3`} value={form.data.clinical_notes} onChange={(event) => form.setData('clinical_notes', event.target.value)} />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">PDF laporan darah</span>
                        <input
                            className={`${fieldClass} py-2`}
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(event) => form.setData('report', event.target.files?.[0] ?? null)}
                            required
                        />
                        <p className="text-sm leading-relaxed text-slate-300">PDF sahaja, paling besar 100 MB. Satu fail untuk satu pesakit, disimpan dalam folder pesakit itu.</p>
                        <InputError message={form.errors.report} />
                    </label>
                    <button type="submit" disabled={form.processing} className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-teal-500 text-lg font-black text-slate-950 disabled:opacity-60">
                        {form.processing ? 'Membaca PDF...' : 'Simpan rekod daripada PDF'}
                    </button>
                </form>

                {selectedPatientId ? <LabCharts charts={charts} series={chartSeries} periodLabel="rekod pesakit ini" /> : null}

                <section className="space-y-3">
                    <h2 className="text-2xl font-black">Rekod mengikut tarikh</h2>
                    {records.length === 0 ? (
                        <p className="rounded-2xl border border-[#1F385C] bg-[#132238] p-5">Tiada rekod lagi.</p>
                    ) : (
                        records.map((record) => (
                            <article key={record.id} className="space-y-3 rounded-2xl border border-[#1F385C] bg-[#132238] p-4">
                                <p className="text-lg font-black">{record.patient_name} · {record.patient_id_code}</p>
                                <p className="text-sm text-slate-300">{record.examination_label} · {record.examination_type_label}{record.recorded_by ? ` · ${record.recorded_by}` : ''}</p>
                                <LabReadings readings={record.readings} />
                                {record.potassium_needs_attention && <p className="font-bold text-amber-200">Kalium 5.5 atau lebih tinggi. Perlu perhatian.</p>}
                                {record.clinical_notes && <p className="text-slate-200">{record.clinical_notes}</p>}
                                <BloodAnalysis analysis={record.analysis} />
                                <DoctorNote record={record} canWrite={canWriteDoctorNote} />
                                {record.report && (
                                    <a className="inline-flex min-h-12 items-center font-bold text-teal-200 underline" href={`/jururawat/laporan/${record.report.id}`} download>
                                        Muat turun PDF: {record.report.original_name}
                                    </a>
                                )}
                            </article>
                        ))
                    )}
                </section>
            </div>
        </>
    );
}

function DoctorNote({ record, canWrite }: { record: RecordRow; canWrite: boolean }) {
    const form = useForm({ nephrologist_notes: record.nephrologist_notes ?? '' });

    return (
        <section className="rounded-2xl border border-amber-700 bg-amber-950 p-4">
            <h3 className="text-xl font-black">Analisa khas doktor nefrologi</h3>
            {canWrite ? (
                <form
                    className="mt-3 space-y-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(`/admin/darah/${record.id}/analisa`);
                    }}
                >
                    <textarea className={`${fieldClass} min-h-28 py-3`} value={form.data.nephrologist_notes} onChange={(event) => form.setData('nephrologist_notes', event.target.value)} required />
                    <InputError message={form.errors.nephrologist_notes} />
                    <button type="submit" disabled={form.processing} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-4 font-black text-slate-950">
                        Simpan analisa doktor
                    </button>
                </form>
            ) : record.nephrologist_notes ? (
                <div className="mt-2">
                    <p className="text-lg leading-relaxed">{record.nephrologist_notes}</p>
                    {record.nephrologist_name && <p className="mt-1 text-sm text-amber-100">Ditulis oleh {record.nephrologist_name}</p>}
                </div>
            ) : (
                <p className="mt-2 text-base text-amber-100">Analisa doktor belum ditulis.</p>
            )}
        </section>
    );
}
