type Point = {
    label: string;
    value: number;
};

type Series = {
    name: string;
    color: string;
    points: Point[];
};

export default function TrendChart({
    title,
    unit,
    series,
    empty,
}: {
    title: string;
    unit: string;
    series: Series[];
    empty: string;
}) {
    const usable = series.filter((item) => item.points.length > 0);
    const labels = usable[0]?.points.map((point) => point.label) ?? [];
    const values = usable.flatMap((item) => item.points.map((point) => point.value));

    if (usable.length === 0 || values.length === 0) {
        return (
            <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-3 text-base text-slate-200">{empty}</p>
            </section>
        );
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const width = 320;
    const height = 160;
    const pad = 16;

    const xFor = (index: number, count: number) => (count === 1 ? width / 2 : pad + (index * (width - pad * 2)) / (count - 1));
    const yFor = (value: number) => pad + ((max - value) / span) * (height - pad * 2);

    return (
        <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
            <h3 className="text-xl font-black">{title}</h3>
            <p className="text-sm text-slate-300">{unit}</p>
            <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-44 w-full" role="img" aria-label={title}>
                {usable.map((item) => {
                    const line = item.points.map((point, index) => `${xFor(index, item.points.length)},${yFor(point.value)}`).join(' ');
                    return (
                        <g key={item.name}>
                            <polyline fill="none" stroke={item.color} strokeWidth="3" points={line} />
                            {item.points.map((point, index) => (
                                <circle key={`${item.name}-${point.label}`} cx={xFor(index, item.points.length)} cy={yFor(point.value)} r="4" fill={item.color} />
                            ))}
                        </g>
                    );
                })}
            </svg>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
                {usable.map((item) => (
                    <span key={item.name} className="font-bold" style={{ color: item.color }}>
                        {item.name}
                    </span>
                ))}
            </div>
            <table className="mt-3 w-full text-left text-sm">
                <thead>
                    <tr className="text-slate-300">
                        <th className="py-1">Tarikh</th>
                        {usable.map((item) => (
                            <th key={item.name} className="py-1">{item.name}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {labels.map((label, index) => (
                        <tr key={label} className="border-t border-[#1F385C]">
                            <td className="py-2 font-bold">{label}</td>
                            {usable.map((item) => (
                                <td key={item.name} className="py-2">{item.points[index]?.value ?? '—'}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
