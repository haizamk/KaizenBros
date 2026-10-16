import { Head } from '@inertiajs/react';
import BloodAnalysis, { LabReadings, type BloodAnalysisData, type LabReading } from '@/components/blood-analysis';
import LabCharts, { type ChartSeries } from '@/components/lab-charts';
import PatientNav, { MissingPatient } from '@/components/patient-nav';
import PeriodTabs from '@/components/period-tabs';

type ChartPoint = { label: string; value: number };
type BloodRecord = {
    id: number;
    examination_label: string;
    examination_type_label: string;
    readings: LabReading[];
    analysis: BloodAnalysisData;
    clinical_notes: string | null;
    nephrologist_notes: string | null;
    nephrologist_name: string | null;
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
    periodLabel,
    records,
    documents,
    charts,
    chartSeries,
}: {
    patient: { name: string } | null;
    months: number;
    periodLabel: string;
    records: BloodRecord[];
    documents: DocumentCard[];
    charts: Record<string, ChartPoint[]>;
    chartSeries: ChartSeries[];
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
                            Keputusan disusun mengikut tarikh. Analisa dan tip dibaca daripada nombor yang ada dalam laporan. Nilai yang tiada dikosongkan. Ini bukan diagnosis.
                        </p>
                    </header>
                    <PeriodTabs base="/pesakit/darah" current={months} allTime />
                    {records.some((record) => record.analysis.has_high) && (
                        <p className="rounded-2xl border-2 border-rose-300 bg-rose-950 p-4 text-xl font-black">
                            Ada keputusan tinggi dalam tempoh {periodLabel}. Sila bincang dengan jururawat atau doktor.
                        </p>
                    )}
                    <LabCharts charts={charts} series={chartSeries} periodLabel={periodLabel} />
                    <section className="space-y-3">
                        <h2 className="text-2xl font-black">Keputusan {periodLabel}</h2>
                        {records.length === 0 ? (
                            <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5 text-lg">Tiada keputusan darah dalam tempoh ini.</p>
                        ) : (
                            <ul className="space-y-4">
                                {records.map((record) => (
                                    <li key={record.id} className="rounded-3xl border border-[#1F385C] bg-[#132238] p-4 sm:p-5">
                                        <p className="text-2xl font-black">{record.examination_label}</p>
                                        <p className="text-base text-slate-300">{record.examination_type_label}</p>
                                        <LabReadings readings={record.readings} />
                                        <BloodAnalysis analysis={record.analysis} />
                                        {record.clinical_notes && <p className="mt-3 text-lg">{record.clinical_notes}</p>}
                                        <section className="mt-3 rounded-2xl border border-amber-700 bg-amber-950 p-4">
                                            <h3 className="text-xl font-black">Analisa khas doktor nefrologi</h3>
                                            {record.nephrologist_notes ? (
                                                <>
                                                    <p className="mt-2 text-lg leading-relaxed">{record.nephrologist_notes}</p>
                                                    {record.nephrologist_name && <p className="mt-1 text-sm text-amber-100">Ditulis oleh {record.nephrologist_name}</p>}
                                                </>
                                            ) : (
                                                <p className="mt-2 text-base text-amber-100">Doktor belum menulis analisa untuk laporan ini.</p>
                                            )}
                                        </section>
                                        {record.report ? (
                                            <a className="mt-3 inline-flex min-h-12 items-center text-lg font-bold text-teal-200 underline" href={`/pesakit/laporan/${record.report.id}`} download>
                                                Muat turun salinan PDF: {record.report.original_name}
                                            </a>
                                        ) : (
                                            <p className="mt-3 text-base text-slate-300">Salinan PDF belum dimuat naik.</p>
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
