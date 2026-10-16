import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
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
    phone,
    icNumber,
    centre,
    status,
}: {
    nurseName: string;
    role: string;
    phone: string | null;
    icNumber: string | null;
    centre: Centre;
    status?: string | null;
}) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { textSize, updateTextSize } = useTextSize();
    const identity = useForm({
        phone: phone ?? '',
        ic_number: icNumber ?? '',
    });

    return (
        <>
            <Head title="Tetapan" />
            <NursePage title="Tetapan" intro="Simpan nombor telefon dan kad pengenalan supaya log masuk jururawat tidak bergantung pada emel sahaja.">
                {status && <p className="rounded-2xl border border-teal-700 bg-teal-950 p-4 text-lg font-bold text-teal-100" role="status">{status}</p>}
                <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                    <h2 className="text-2xl font-black">{nurseName}</h2>
                    <p className="text-lg text-slate-200">{role}</p>
                </section>
                <form
                    className="space-y-3 rounded-3xl border border-[#1F385C] bg-[#132238] p-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        identity.post('/jururawat/tetapan');
                    }}
                >
                    <h2 className="text-2xl font-black">Log masuk kakitangan</h2>
                    <p className="text-base leading-relaxed text-slate-200">Emel sedia ada masih boleh digunakan. Tambah nombor telefon dan kad pengenalan untuk pilihan lain.</p>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">Nombor telefon</span>
                        <input className="min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-3 text-lg" inputMode="tel" value={identity.data.phone} onChange={(event) => identity.setData('phone', event.target.value)} />
                        <InputError message={identity.errors.phone} />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">Nombor kad pengenalan</span>
                        <input className="min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-3 text-lg" inputMode="numeric" value={identity.data.ic_number} onChange={(event) => identity.setData('ic_number', event.target.value)} />
                        <InputError message={identity.errors.ic_number} />
                    </label>
                    <button type="submit" disabled={identity.processing} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-500 px-4 font-black text-slate-950">
                        Simpan maklumat log masuk
                    </button>
                </form>
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
