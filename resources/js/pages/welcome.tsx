import { Head, Link } from '@inertiajs/react';

type Centre = {
    name: string;
    slogan: string;
    kkm_license: string;
    address: string;
    phone_main: string;
    hotline_24h: string;
    email: string;
    whatsapp_number: string;
    operating_hours: Array<{ days: string; time: string }>;
    capacity_machines: number;
    machine_model: string;
    water_system: string;
    panels: string[];
    medical_director: string;
    head_nurse: string;
};

export default function Welcome({ centre }: { centre: Centre }) {
    return (
        <div className="min-h-screen bg-[#0B132B] text-slate-100">
            <Head title="Pusat Dialisis" />
            <header className="border-b border-[#1F385C] bg-[#070D1F]">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
                    <div>
                        <p className="text-xs font-bold tracking-wide text-teal-300">{centre.kkm_license}</p>
                        <p className="text-lg font-black">{centre.name}</p>
                    </div>
                    <a href={`tel:${centre.hotline_24h.replace(/\s+/g, '')}`} className="inline-flex min-h-12 items-center rounded-full border border-rose-700 bg-rose-950 px-4 text-sm font-bold text-rose-100">
                        Kecemasan {centre.hotline_24h}
                    </a>
                </div>
            </header>

            <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.4fr_0.8fr]">
                <div className="space-y-6">
                    <p className="inline-flex rounded-full border border-teal-700 bg-teal-950 px-3 py-1 text-sm font-bold text-teal-200">
                        Hemodialisis berdaftar KKM
                    </p>
                    <h1 className="text-4xl font-black leading-tight sm:text-6xl">
                        Pusat Dialisis <span className="text-teal-300">KaizenBros</span>
                    </h1>
                    <p className="max-w-2xl text-xl leading-relaxed text-slate-200">{centre.slogan}. Semenyih, Selangor.</p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link href="/login" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-teal-500 px-6 text-lg font-black text-slate-950">
                            Log masuk portal
                        </Link>
                        <Link href="/daftar" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[#1F385C] bg-[#132238] px-6 text-lg font-bold">
                            Daftar pesakit baru
                        </Link>
                    </div>
                </div>
                <aside className="space-y-4 rounded-3xl border border-[#1F385C] bg-[#132238] p-6">
                    <h2 className="text-xl font-black">Waktu operasi</h2>
                    {centre.operating_hours.map((row) => (
                        <p key={row.days} className="flex justify-between gap-4 text-base">
                            <span>{row.days}</span>
                            <span className="font-bold text-teal-200">{row.time}</span>
                        </p>
                    ))}
                    <p className="text-base leading-relaxed text-slate-200">{centre.address}</p>
                    <p className="text-base">Telefon: <span className="font-bold">{centre.phone_main}</span></p>
                    <a className="inline-flex min-h-12 items-center font-bold text-emerald-300" href={`https://wa.me/${centre.whatsapp_number}`} target="_blank" rel="noreferrer">
                        WhatsApp pusat
                    </a>
                </aside>
            </section>

            <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-3">
                <article className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6">
                    <h2 className="text-lg font-black">Rawatan</h2>
                    <p className="mt-2 text-base text-slate-200">{centre.capacity_machines} mesin {centre.machine_model}.</p>
                    <p className="mt-2 text-base text-slate-200">{centre.water_system}.</p>
                </article>
                <article className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6">
                    <h2 className="text-lg font-black">Panel</h2>
                    <ul className="mt-2 space-y-1 text-base text-slate-200">
                        {centre.panels.map((panel) => (
                            <li key={panel}>{panel}</li>
                        ))}
                    </ul>
                </article>
                <article className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6">
                    <h2 className="text-lg font-black">Pasukan</h2>
                    <p className="mt-2 text-base text-slate-200">{centre.medical_director}</p>
                    <p className="mt-2 text-base text-slate-200">{centre.head_nurse}</p>
                </article>
            </section>
        </div>
    );
}
