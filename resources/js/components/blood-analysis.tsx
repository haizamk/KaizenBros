export type BloodAnalysisItem = {
    key: string;
    name: string;
    value: string;
    unit: string;
    status: 'TINGGI' | 'RENDAH' | 'BIASA' | 'PERHATIAN';
    status_label: string;
    sentence: string;
    change: string | null;
};

export type BloodAnalysisData = {
    summary: string;
    has_high: boolean;
    items: BloodAnalysisItem[];
};

const tone: Record<BloodAnalysisItem['status'], string> = {
    TINGGI: 'border-rose-300 bg-rose-950',
    RENDAH: 'border-sky-300 bg-sky-950',
    PERHATIAN: 'border-amber-300 bg-amber-950',
    BIASA: 'border-[#1F385C] bg-[#0B132B]',
};

export default function BloodAnalysis({ analysis }: { analysis: BloodAnalysisData }) {
    return (
        <div className="mt-3 space-y-3">
            <p className="text-lg font-bold leading-relaxed">{analysis.summary}</p>
            <ul className="space-y-2">
                {analysis.items.map((item) => (
                    <li key={item.key} className={`rounded-2xl border-2 p-4 ${tone[item.status]}`}>
                        <p className="text-xl font-black">
                            {item.name}: {item.value} {item.unit}
                            <span className="ml-2 text-lg">{item.status_label}</span>
                        </p>
                        <p className="mt-1 text-lg leading-relaxed">{item.sentence}</p>
                        {item.change && <p className="mt-1 text-lg font-bold">{item.change}</p>}
                    </li>
                ))}
            </ul>
        </div>
    );
}
