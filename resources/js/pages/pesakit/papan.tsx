import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import BloodAnalysis, { type BloodAnalysisData } from '@/components/blood-analysis';
import TrendChart from '@/components/trend-chart';

type PatientCard = {
    patient_id_code: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    dry_weight_kg: string;
    vascular_access: string;
    access_location: string;
    sponsor: string;
    schedule_label: string;
    shift_label: string;
    allergies: string | null;
};

type SessionCard = {
    id: number;
    scheduled_date: string;
    scheduled_time: string;
    chair_number: string;
    status: string;
    status_label: string;
    shift_label: string;
    pre_weight_kg: string | null;
    post_weight_kg: string | null;
    pre_bp: string | null;
    post_bp: string | null;
    started_at: string | null;
};

type Medication = {
    id: number;
    medication_name: string;
    dosage: string;
    frequency: string;
    route: string;
};

function formatClock(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function Remaining({ startedAt }: { startedAt: string }) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);
    const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
    const remaining = Math.max(0, 4 * 3600 - elapsed);
    return <p className="font-mono text-4xl font-black text-cyan-200">{formatClock(remaining)}</p>;
}

type ChartPoint = {
    label: string;
    value: number;
};

type BloodRecord = {
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
    analysis: BloodAnalysisData;
    report: { id: number; original_name: string } | null;
};

type PatientDocumentCard = {
    id: number;
    category_label: string;
    original_name: string;
    size_label: string;
    created_at: string;
};

export default function PapanPesakit({
    patient,
    sessions,
    medications,
    records,
    documents,
    charts,
    today,
}: {
    patient: PatientCard | null;
    sessions: SessionCard[];
    medications: Medication[];
    records: BloodRecord[];
    documents: PatientDocumentCard[];
    charts: {
        weight: ChartPoint[];
        systolic: ChartPoint[];
        diastolic: ChartPoint[];
        hemoglobin: ChartPoint[];
        potassium: ChartPoint[];
        phosphate: ChartPoint[];
        urea: ChartPoint[];
        creatinine: ChartPoint[];
    };
    today: string;
}) {
    const todaySession = sessions.find((session) => session.scheduled_date === today);

    return (
        <>
            <Head title="Portal pesakit" />
            {!patient ? (
                <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-8">
                    <h1 className="text-3xl font-black">Rekod pesakit belum dipautkan</h1>
                    <p className="mt-3 text-lg text-slate-200">Sila hubungi kaunter pusat untuk mengaktifkan portal anda.</p>
                </section>
            ) : (
                <div className="space-y-5">
                    <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6">
                        <p className="text-sm font-bold text-teal-300">{patient.patient_id_code}</p>
                        <h1 className="text-4xl font-black">{patient.name}</h1>
                        <p className="mt-2 text-lg text-slate-200">
                            {patient.gender === 'LELAKI' ? 'Lelaki' : 'Perempuan'}, {patient.age} tahun · {patient.schedule_label}
                        </p>
                        <p className="text-lg text-slate-200">{patient.shift_label} · {patient.sponsor}</p>
                        <p className="mt-3 text-base">Akses vaskular: {patient.vascular_access}, {patient.access_location}</p>
                        <p className="text-base">Berat kering: {patient.dry_weight_kg} kg · Alahan: {patient.allergies || 'Tiada diketahui'}</p>
                    </section>

                    <section className="rounded-3xl border border-teal-800 bg-[#102033] p-6">
                        <h2 className="text-2xl font-black">Sesi hari ini</h2>
                        {!todaySession ? (
                            <p className="mt-3 text-lg">Tiada sesi dijadualkan hari ini.</p>
                        ) : (
                            <div className="mt-3 space-y-2">
                                <p className="text-xl font-bold">{todaySession.status_label}</p>
                                <p className="text-lg">Kerusi {todaySession.chair_number} · {todaySession.scheduled_time} · {todaySession.shift_label}</p>
                                {todaySession.status === 'SEDANG_DIALISIS' && todaySession.started_at && (
                                    <div>
                                        <p className="text-sm font-bold text-slate-300">Masa baki</p>
                                        <Remaining startedAt={todaySession.started_at} />
                                    </div>
                                )}
                                {todaySession.pre_weight_kg && <p>Sebelum: {todaySession.pre_weight_kg} kg · {todaySession.pre_bp}</p>}
                                {todaySession.post_weight_kg && <p>Selepas: {todaySession.post_weight_kg} kg · {todaySession.post_bp}</p>}
                            </div>
                        )}
                    </section>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <TrendChart
                            title="Berat sebelum dialisis"
                            unit="kg"
                            empty="Belum ada bacaan berat."
                            series={[{ name: 'Berat (kg)', color: '#22d3ee', points: charts.weight }]}
                        />
                        <TrendChart
                            title="Tekanan darah sebelum dialisis"
                            unit="mmHg"
                            empty="Belum ada bacaan tekanan darah."
                            series={[
                                { name: 'Sistolik', color: '#fb7185', points: charts.systolic },
                                { name: 'Diastolik', color: '#14b8a6', points: charts.diastolic },
                            ]}
                        />
                    </div>

                    <h2 className="text-2xl font-black">Perbandingan keputusan darah</h2>
                    <p className="text-lg leading-relaxed text-slate-200">Graf ini membandingkan keputusan dari semasa ke semasa. Rekod darah disimpan dan tidak dipadam.</p>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <TrendChart
                            title="Hemoglobin"
                            unit="g/dL"
                            empty="Belum ada keputusan hemoglobin."
                            series={[{ name: 'Hb', color: '#fbbf24', points: charts.hemoglobin }]}
                        />
                        <TrendChart
                            title="Kalium"
                            unit="mmol/L"
                            empty="Belum ada keputusan kalium."
                            series={[{ name: 'K', color: '#a78bfa', points: charts.potassium }]}
                        />
                        <TrendChart
                            title="Fosfat"
                            unit="mmol/L"
                            empty="Belum ada keputusan fosfat."
                            series={[{ name: 'PO4', color: '#34d399', points: charts.phosphate }]}
                        />
                        <TrendChart
                            title="Urea"
                            unit="mmol/L"
                            empty="Belum ada keputusan urea."
                            series={[{ name: 'Urea', color: '#fb923c', points: charts.urea }]}
                        />
                        <TrendChart
                            title="Kreatinin"
                            unit="µmol/L"
                            empty="Belum ada keputusan kreatinin."
                            series={[{ name: 'Kreatinin', color: '#38bdf8', points: charts.creatinine }]}
                        />
                    </div>

                    <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6">
                        <h2 className="text-2xl font-black">Keputusan darah dan analisa</h2>
                        <p className="mt-2 text-lg leading-relaxed text-slate-200">
                            Analisa dibuat di pelayan pusat daripada nombor yang ditaip oleh kakitangan. Fail imbasan tidak dihantar keluar. Analisa ini bukan diagnosis.
                        </p>
                        {records.some((record) => record.analysis.has_high) && (
                            <p className="mt-4 rounded-2xl border-2 border-rose-300 bg-rose-950 p-4 text-xl font-black text-rose-50">
                                Ada keputusan tinggi. Sila baca analisa di bawah dan bincang dengan jururawat.
                            </p>
                        )}
                        {records.length === 0 ? (
                            <p className="mt-3 text-lg">Tiada keputusan darah lagi.</p>
                        ) : (
                            <ul className="mt-4 space-y-4">
                                {records.map((record) => (
                                    <li key={record.id} className="rounded-2xl border border-[#1F385C] p-4">
                                        <p className="text-2xl font-black">{record.examination_label}</p>
                                        <p className="text-base text-slate-300">{record.examination_type_label}</p>
                                        <BloodAnalysis analysis={record.analysis} />
                                        {record.clinical_notes && <p className="mt-3 text-lg text-slate-200">{record.clinical_notes}</p>}
                                        {record.report ? (
                                            <a className="mt-3 inline-flex min-h-12 items-center text-lg font-bold text-teal-200 underline" href={`/pesakit/laporan/${record.report.id}`} download>
                                                Muat turun salinan imbasan: {record.report.original_name}
                                            </a>
                                        ) : (
                                            <p className="mt-3 text-base text-slate-300">Salinan imbasan belum dimuat naik.</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6">
                        <h2 className="text-2xl font-black">Dokumen anda</h2>
                        {documents.length === 0 ? (
                            <p className="mt-3 text-lg">Tiada dokumen tambahan lagi.</p>
                        ) : (
                            <ul className="mt-4 space-y-3">
                                {documents.map((document) => (
                                    <li key={document.id} className="rounded-2xl border border-[#1F385C] p-4">
                                        <p className="text-xl font-black">{document.category_label}</p>
                                        <a className="mt-1 inline-flex min-h-12 items-center text-lg font-bold text-teal-200 underline" href={`/pesakit/dokumen/${document.id}`} download>
                                            {document.original_name}
                                        </a>
                                        <p className="text-base text-slate-300">{document.size_label} · {document.created_at}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6">
                        <h2 className="text-2xl font-black">Ubat aktif</h2>
                        {medications.length === 0 ? (
                            <p className="mt-3 text-lg">Tiada ubat aktif direkodkan.</p>
                        ) : (
                            <ul className="mt-4 space-y-3">
                                {medications.map((medication) => (
                                    <li key={medication.id} className="rounded-2xl border border-[#1F385C] p-4">
                                        <p className="text-xl font-black">{medication.medication_name}</p>
                                        <p className="text-base text-slate-200">{medication.dosage} · {medication.frequency} · {medication.route}</p>
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
