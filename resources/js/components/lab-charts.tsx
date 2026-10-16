import TrendChart from '@/components/trend-chart';

type ChartPoint = { label: string; value: number };

export type ChartSeries = {
    key: string;
    title: string;
    unit: string;
    color: string;
};

export default function LabCharts({
    charts,
    series,
    periodLabel,
}: {
    charts: Record<string, ChartPoint[]>;
    series: ChartSeries[];
    periodLabel: string;
}) {
    const ready = series.filter((item) => (charts[item.key] ?? []).length > 0);
    const empty = series.filter((item) => (charts[item.key] ?? []).length === 0);

    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-black">Graf perbandingan {periodLabel}</h2>
            {ready.length === 0 ? (
                <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5 text-lg">Tiada nombor untuk digraf dalam tempoh ini.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {ready.map((item) => (
                        <TrendChart
                            key={item.key}
                            title={item.title}
                            unit={item.unit}
                            empty={`Tiada data ${item.title}.`}
                            series={[{ name: item.title, color: item.color, points: charts[item.key] ?? [] }]}
                        />
                    ))}
                </div>
            )}
            {empty.length > 0 ? (
                <p className="text-base leading-relaxed text-slate-300">
                    Tiada data untuk {empty.map((item) => item.title).join(', ')}. Ruang ini dikosongkan dan tiada angka diandaikan.
                </p>
            ) : null}
        </section>
    );
}
