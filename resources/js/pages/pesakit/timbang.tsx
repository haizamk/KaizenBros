import { Head } from '@inertiajs/react';
import PatientNav, { MissingPatient } from '@/components/patient-nav';
import PeriodTabs from '@/components/period-tabs';
import TrendChart from '@/components/trend-chart';

type Point = { label: string; value: number };
type PatientCard = { name: string; dry_weight_kg: string };

export default function TimbangPesakit({
    patient,
    months,
    charts,
}: {
    patient: PatientCard | null;
    months: number;
    charts: {
        preWeight: Point[];
        postWeight: Point[];
        dryWeight: Point[];
        preSystolic: Point[];
        intraSystolic: Point[];
        postSystolic: Point[];
        preDiastolic: Point[];
        intraDiastolic: Point[];
        postDiastolic: Point[];
    };
}) {
    return (
        <>
            <Head title="Timbang dan tekanan darah" />
            {!patient ? (
                <MissingPatient />
            ) : (
                <div className="space-y-4">
                    <PatientNav />
                    <header>
                        <h1 className="text-3xl font-black sm:text-4xl">Timbang dan tekanan darah</h1>
                        <p className="mt-2 text-lg leading-relaxed text-slate-200">
                            Berat kering anda ialah {patient.dry_weight_kg} kg. Graf membandingkan berat sebelum dialisis, berat selepas dialisis, dan tekanan darah sebelum, semasa, serta selepas. Bacaan ini hanya direkodkan oleh jururawat atau pentadbir.
                        </p>
                    </header>
                    <PeriodTabs base="/pesakit/timbang" current={months} />
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <TrendChart
                            title="Berat"
                            unit="kg"
                            empty="Belum ada bacaan berat dalam tempoh ini."
                            series={[
                                { name: 'Sebelum', color: '#22d3ee', points: charts.preWeight },
                                { name: 'Selepas', color: '#34d399', points: charts.postWeight },
                                { name: 'Kering', color: '#fbbf24', points: charts.dryWeight },
                            ]}
                        />
                        <TrendChart
                            title="Tekanan darah sistolik"
                            unit="mmHg"
                            empty="Belum ada bacaan sistolik dalam tempoh ini."
                            series={[
                                { name: 'Sebelum', color: '#fb7185', points: charts.preSystolic },
                                { name: 'Semasa', color: '#fbbf24', points: charts.intraSystolic },
                                { name: 'Selepas', color: '#14b8a6', points: charts.postSystolic },
                            ]}
                        />
                        <TrendChart
                            title="Tekanan darah diastolik"
                            unit="mmHg"
                            empty="Belum ada bacaan diastolik dalam tempoh ini."
                            series={[
                                { name: 'Sebelum', color: '#fb7185', points: charts.preDiastolic },
                                { name: 'Semasa', color: '#fbbf24', points: charts.intraDiastolic },
                                { name: 'Selepas', color: '#14b8a6', points: charts.postDiastolic },
                            ]}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
