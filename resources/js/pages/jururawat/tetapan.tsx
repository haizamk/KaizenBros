import { Head } from '@inertiajs/react';
import { NursePage } from '@/components/nurse-nav';
import { useAppearance } from '@/hooks/use-appearance';
import { useTextSize, type TextSize } from '@/hooks/use-text-size';

type Centre = {
    name: string;
    kkm_license: string;
    address: string;
    phone_main: string;
    hotline_24h: string;
    capacity_machines: number;
    operating_hours: Array<{ days: string; time: string }>;
};

const sizes: Array<{ id: TextSize; label: string }> = [
    { id: 'sm', label: 'A' },
    { id: 'md', label: 'A+' },
    { id: 'lg', label: 'A++' },
    { id: 'xl', label: 'A+++' },
];

export default function Tetapan({
    nurseName,
    role,
    centre,
}: {
    nurseName: string;
    role: string;
    centre: Centre;
}) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { textSize, updateTextSize } = useTextSize();

    return (
        <>
            <Head title="Tetapan" />
            <NursePage title="Tetapan" intro="Tetapan paparan ini disimpan pada peranti anda. Rekod klinikal tidak diubah di halaman ini.">
                <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                    <h2 className="text-2xl font-black">{nurseName}</h2>
                    <p className="text-lg text-slate-200">{role}</p>
                </section>
                <section className="space-y-3 rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                    <h2 className="text-2xl font-black">Saiz tulisan</h2>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                            <button
                                key={size.id}
                                type="button"
                                aria-pressed={textSize === size.id}
                                onClick={() => updateTextSize(size.id)}
                                className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl px-4 font-black ${
                                    textSize === size.id ? 'bg-teal-500 text-slate-950' : 'border border-[#1F385C]'
                                }`}
                            >
                                {size.label}
                            </button>
                        ))}
                    </div>
                </section>
                <section className="space-y-3 rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                    <h2 className="text-2xl font-black">Paparan</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <button type="button" aria-pressed={resolvedAppearance === 'dark'} onClick={() => updateAppearance('dark')} className={`min-h-12 rounded-xl font-black ${resolvedAppearance === 'dark' ? 'bg-teal-500 text-slate-950' : 'border border-[#1F385C]'}`}>
                            Gelap
                        </button>
                        <button type="button" aria-pressed={resolvedAppearance === 'light'} onClick={() => updateAppearance('light')} className={`min-h-12 rounded-xl font-black ${resolvedAppearance === 'light' ? 'bg-teal-500 text-slate-950' : 'border border-[#1F385C]'}`}>
                            Cerah
                        </button>
                    </div>
                </section>
                <section className="space-y-2 rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                    <h2 className="text-2xl font-black">Maklumat pusat</h2>
                    <p className="text-lg font-bold">{centre.name}</p>
                    <p className="text-base text-slate-200">{centre.kkm_license}</p>
                    <p className="text-base text-slate-200">{centre.address}</p>
                    <p className="text-base text-slate-200">Telefon {centre.phone_main} · SOS {centre.hotline_24h}</p>
                    <p className="text-base text-slate-200">{centre.capacity_machines} mesin</p>
                    {centre.operating_hours.map((row) => (
                        <p key={row.days} className="text-base text-slate-200">{row.days}: {row.time}</p>
                    ))}
                    <p className="text-base leading-relaxed text-slate-200">
                        Berat, tekanan darah, jadual, dan rekod darah dikongsi dengan portal pesakit dan portal pentadbir. Tiada salinan berasingan.
                    </p>
                </section>
            </NursePage>
        </>
    );
}
