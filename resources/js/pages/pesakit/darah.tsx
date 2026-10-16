import { Head } from '@inertiajs/react';
import BloodAnalysis, { type BloodAnalysisData } from '@/components/blood-analysis';
import PatientNav, { MissingPatient } from '@/components/patient-nav';
import PeriodTabs from '@/components/period-tabs';
import TrendChart from '@/components/trend-chart';

type ChartPoint = { label: string; value: number };
type BloodRecord = {
    id: number;
    examination_label: string;
    examination_type_label: string;
    analysis: BloodAnalysisData;
    clinical_notes: string | null;
    report: { id: number; original_name: string } | null;
};
type DocumentCard = {
    id: number;
    category_label: string;
    original_name: string;
    size_label: string;
};

export default function DarahPesakit({
    patient,
    months,
    records,
    documents,
    charts,
}: {
    patient: { name: string } | null;
    months: number;
    records: BloodRecord[];
    documents: DocumentCard[];
    charts: {
        hemoglobin: ChartPoint[];
        potassium: ChartPoint[];
        phosphate: ChartPoint[];
        urea: ChartPoint[];
        creatinine: ChartPoint[];
    };
}) {
    return (
        <>
            <Head title="Rekod darah" />
            {!patient ? (
                <MissingPatient />
            ) : (
                <div className="space-y-4">
                    <PatientNav />
                    <header>
                        <h1 className="text-3xl font-black sm:text-4xl">Rekod perubatan dan darah</h1>
                        <p className="mt-2 text-lg leading-relaxed text-slate-200">
                            Analisa dikira di pelayan daripada nombor yang ditaip oleh kakitangan. Pilih 6 bulan, 12 bulan, atau 24 bulan untuk membandingkan keputusan lama. Analisa ini bukan diagnosis.
                        </p>
                    </header>
                    <PeriodTabs base="/pesakit/darah" current={months} />
                    {records.some((record) => record.analysis.has_high) && (
                        <p className="rounded-2xl border-2 border-rose-300 bg-rose-950 p-4 text-xl font-black">
                            Ada keputusan tinggi dalam tempoh {months} bulan ini. Sila bincang dengan jururawat.
                        </p>
                    )}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <TrendChart title="Hemoglobin" unit="g/dL" empty="Belum ada keputusan hemoglobin dalam tempoh ini." series={[{ name: 'Hb', color: '#fbbf24', points: charts.hemoglobin }]} />
                        <TrendChart title="Kalium" unit="mmol/L" empty="Belum ada keputusan kalium dalam tempoh ini." series={[{ name: 'K', color: '#a78bfa', points: charts.potassium }]} />
                        <TrendChart title="Fosfat" unit="mmol/L" empty="Belum ada keputusan fosfat dalam tempoh ini." series={[{ name: 'PO4', color: '#34d399', points: charts.phosphate }]} />
                        <TrendChart title="Urea" unit="mmol/L" empty="Belum ada keputusan urea dalam tempoh ini." series={[{ name: 'Urea', color: '#fb923c', points: charts.urea }]} />
                        <TrendChart title="Kreatinin" unit="µmol/L" empty="Belum ada keputusan kreatinin dalam tempoh ini." series={[{ name: 'Kreatinin', color: '#38bdf8', points: charts.creatinine }]} />
                    </div>
                    <section className="space-y-3">
                        <h2 className="text-2xl font-black">Keputusan dalam {months} bulan</h2>
                        {records.length === 0 ? (
                            <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5 text-lg">Tiada keputusan darah dalam tempoh ini.</p>
                        ) : (
                            <ul className="space-y-4">
                                {records.map((record) => (
                                    <li key={record.id} className="rounded-3xl border border-[#1F385C] bg-[#132238] p-4 sm:p-5">
                                        <p className="text-2xl font-black">{record.examination_label}</p>
                                        <p className="text-base text-slate-300">{record.examination_type_label}</p>
                                        <BloodAnalysis analysis={record.analysis} />
                                        {record.clinical_notes && <p className="mt-3 text-lg">{record.clinical_notes}</p>}
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
                    <section className="space-y-3">
                        <h2 className="text-2xl font-black">Dokumen anda</h2>
                        {documents.length === 0 ? (
                            <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5 text-lg">Tiada dokumen tambahan lagi.</p>
                        ) : (
                            <ul className="space-y-3">
                                {documents.map((document) => (
                                    <li key={document.id} className="rounded-2xl border border-[#1F385C] bg-[#132238] p-4">
                                        <p className="text-xl font-black">{document.category_label}</p>
                                        <a className="inline-flex min-h-12 items-center text-lg font-bold text-teal-200 underline" href={`/pesakit/dokumen/${document.id}`} download>
                                            {document.original_name}
                                        </a>
                                        <p className="text-base text-slate-300">{document.size_label}</p>
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
