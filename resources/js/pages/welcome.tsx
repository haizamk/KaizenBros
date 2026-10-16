import { Head, Link } from '@inertiajs/react';
import { useAppearance } from '@/hooks/use-appearance';

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
    map: {
        embed_url: string;
        google_url: string;
        waze_url: string;
    };
};

const whatsappMessage = 'Salam, saya ingin bertanya tentang rawatan dialisis di Pusat Dialisis KaizenBros Semenyih.';

function digits(phone: string): string {
    return phone.replace(/\s+/g, '');
}

function ThemeChoice() {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <div className="flex items-center gap-2" role="group" aria-label="Pilihan paparan">
            <span className="text-base font-bold">Paparan</span>
            <button
                type="button"
                aria-pressed={resolvedAppearance === 'dark'}
                onClick={() => updateAppearance('dark')}
                className={`inline-flex min-h-12 items-center rounded-xl px-4 text-base font-black ${
                    resolvedAppearance === 'dark'
                        ? 'bg-primary text-primary-foreground'
                        : 'border-2 border-border bg-card text-foreground'
                }`}
            >
                Gelap
            </button>
            <button
                type="button"
                aria-pressed={resolvedAppearance === 'light'}
                onClick={() => updateAppearance('light')}
                className={`inline-flex min-h-12 items-center rounded-xl px-4 text-base font-black ${
                    resolvedAppearance === 'light'
                        ? 'bg-primary text-primary-foreground'
                        : 'border-2 border-border bg-card text-foreground'
                }`}
            >
                Cerah
            </button>
        </div>
    );
}

export default function Welcome({ centre }: { centre: Centre }) {
    const whatsappHref = `https://wa.me/${centre.whatsapp_number}?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title="Pusat Dialisis" />
            <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
                    <div>
                        <p className="text-base font-bold text-primary">{centre.kkm_license}</p>
                        <p className="text-xl font-black leading-tight">{centre.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <ThemeChoice />
                        <a
                            href={`tel:${digits(centre.hotline_24h)}`}
                            className="inline-flex min-h-14 items-center rounded-2xl bg-rose-700 px-5 text-lg font-black text-white"
                        >
                            Kecemasan {centre.hotline_24h}
                        </a>
                    </div>
                </div>
            </header>

            <main>
                <section className="border-b border-border bg-card">
                    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.3fr_0.7fr] lg:py-14">
                        <div className="space-y-6">
                            <p className="inline-flex min-h-12 items-center rounded-full border-2 border-primary bg-accent px-4 text-base font-black text-accent-foreground">
                                Pusat hemodialisis berdaftar KKM
                            </p>
                            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
                                Pusat Dialisis KaizenBros
                            </h1>
                            <p className="max-w-3xl text-xl leading-relaxed sm:text-2xl">
                                {centre.slogan}. Semenyih, Selangor.
                            </p>
                            <div className="grid gap-3 sm:max-w-xl">
                                <Link
                                    href="/login"
                                    className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-primary px-6 text-xl font-black text-primary-foreground"
                                >
                                    Log masuk portal
                                </Link>
                                <Link
                                    href="/daftar"
                                    className="inline-flex min-h-16 items-center justify-center rounded-2xl border-2 border-primary bg-background px-6 text-xl font-black"
                                >
                                    Daftar pesakit baru
                                </Link>
                                <a
                                    href={whatsappHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-emerald-700 px-6 text-xl font-black text-white"
                                >
                                    WhatsApp pusat
                                </a>
                            </div>
                        </div>

                        <aside className="space-y-4 rounded-3xl border-2 border-border bg-background p-6">
                            <h2 className="text-2xl font-black">Waktu operasi</h2>
                            {centre.operating_hours.map((row) => (
                                <p key={row.days} className="flex flex-col gap-1 text-xl sm:flex-row sm:items-baseline sm:justify-between">
                                    <span>{row.days}</span>
                                    <span className="font-black text-primary">{row.time}</span>
                                </p>
                            ))}
                            <p className="text-lg leading-relaxed">Ahad hanya untuk panggilan kecemasan.</p>
                        </aside>
                    </div>
                </section>

                <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3" aria-label="Ringkasan pusat">
                    <article className="rounded-3xl border-2 border-border bg-card p-6">
                        <p className="text-5xl font-black text-primary">{centre.capacity_machines}</p>
                        <h2 className="mt-2 text-2xl font-black">Mesin dialisis</h2>
                        <p className="mt-2 text-lg leading-relaxed">{centre.machine_model}</p>
                    </article>
                    <article className="rounded-3xl border-2 border-border bg-card p-6">
                        <p className="text-5xl font-black text-primary">{centre.panels.length}</p>
                        <h2 className="mt-2 text-2xl font-black">Panel penaja</h2>
                        <p className="mt-2 text-lg leading-relaxed">PERKESO, JPA, Zakat, Baitulmal dan NKF.</p>
                    </article>
                    <article className="rounded-3xl border-2 border-border bg-card p-6">
                        <p className="text-5xl font-black text-primary">24j</p>
                        <h2 className="mt-2 text-2xl font-black">Talian kecemasan</h2>
                        <a className="mt-2 inline-flex min-h-12 items-center text-xl font-black text-primary" href={`tel:${digits(centre.hotline_24h)}`}>
                            {centre.hotline_24h}
                        </a>
                    </article>
                </section>

                <section id="rawatan" className="border-y border-border bg-card">
                    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-2">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black">Rawatan</h2>
                            <p className="text-xl leading-relaxed">{centre.water_system}.</p>
                            <p className="text-xl leading-relaxed">
                                Pengangkutan pergi dan balik disediakan secara percuma di kawasan Beranang dan Semenyih.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black">Panel</h2>
                            <ul className="space-y-2">
                                {centre.panels.map((panel) => (
                                    <li key={panel} className="rounded-2xl border-2 border-border bg-background px-4 py-3 text-xl font-bold">
                                        {panel}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section id="lokasi" className="mx-auto max-w-6xl space-y-6 px-4 py-10">
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black sm:text-4xl">Lokasi dan hubungan</h2>
                        <p className="max-w-3xl text-xl leading-relaxed">
                            Tempat letak kereta OKU dan laluan kerusi roda ada di pusat. Alamat ditulis di bawah supaya mudah dibaca tanpa peta.
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <article className="space-y-4 rounded-3xl border-2 border-border bg-card p-6">
                            <h3 className="text-2xl font-black">Alamat</h3>
                            <p className="text-xl leading-relaxed">{centre.address}</p>
                            <h3 className="text-2xl font-black">Telefon</h3>
                            <p className="text-xl">
                                Pejabat:{' '}
                                <a className="font-black text-primary" href={`tel:${digits(centre.phone_main)}`}>
                                    {centre.phone_main}
                                </a>
                            </p>
                            <p className="text-xl">
                                Kecemasan:{' '}
                                <a className="font-black text-rose-700 dark:text-rose-300" href={`tel:${digits(centre.hotline_24h)}`}>
                                    {centre.hotline_24h}
                                </a>
                            </p>
                            <p className="text-xl">
                                Emel:{' '}
                                <a className="font-black text-primary" href={`mailto:${centre.email}`}>
                                    {centre.email}
                                </a>
                            </p>
                        </article>
                        <article className="space-y-3 rounded-3xl border-2 border-border bg-card p-6">
                            <h3 className="text-2xl font-black">Pasukan</h3>
                            <p className="text-xl leading-relaxed">{centre.medical_director}</p>
                            <p className="text-xl leading-relaxed">{centre.head_nurse}</p>
                        </article>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <a
                            href={centre.map.google_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-primary px-6 text-xl font-black text-primary-foreground"
                        >
                            Buka di Google Maps
                        </a>
                        <a
                            href={centre.map.waze_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-16 items-center justify-center rounded-2xl border-2 border-primary bg-card px-6 text-xl font-black"
                        >
                            Pandu dengan Waze
                        </a>
                    </div>

                    <div className="overflow-hidden rounded-3xl border-2 border-border bg-card">
                        <iframe
                            title="Peta lokasi Pusat Dialisis KaizenBros Semenyih"
                            src={centre.map.embed_url}
                            className="h-[420px] w-full sm:h-[480px]"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                        />
                    </div>
                </section>
            </main>

            <footer className="border-t border-border bg-card">
                <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-lg leading-relaxed">
                    <p className="font-black">{centre.name}</p>
                    <p>No. pendaftaran KKM: {centre.kkm_license}</p>
                </div>
            </footer>
        </div>
    );
}
