import { Head, Link, usePage } from '@inertiajs/react';

type Centre = {
    panels: string[];
    phone_main: string;
    whatsapp_number: string;
};

const steps = [
    'Sediakan kad pengenalan pesakit dan nombor telefon yang boleh dihubungi.',
    'Nyatakan alamat rumah dan nama waris.',
    'Beritahu panel penaja jika ada, contoh PERKESO, JPA, Zakat, Baitulmal atau NKF.',
    'Isi borang. Akaun portal dibuka selepas pentadbir mengesahkan permohonan.',
];

export default function PesakitBaru() {
    const { centre } = usePage<{ centre: Centre }>().props;
    const whatsapp = `https://wa.me/${centre.whatsapp_number}?text=${encodeURIComponent('Salam, saya ingin mendaftar sebagai pesakit baru di Pusat Dialisis KaizenBros Semenyih.')}`;

    return (
        <>
            <Head title="Pesakit baru" />
            <article className="mx-auto max-w-3xl space-y-6 px-4 py-8">
                <img src="/images/promo/pesakit-baru.jpg" alt="Jururawat menyambut pesakit di kaunter" className="h-64 w-full rounded-3xl object-cover sm:h-80" />
                <p className="text-lg font-black text-primary">Promosi pesakit baru</p>
                <h1 className="text-4xl font-black leading-tight">Daftar untuk rawatan dialisis</h1>
                <p className="text-xl leading-relaxed">
                    Pusat Dialisis KaizenBros Semenyih menerima pesakit hemodialisis baru. Halaman ini menerangkan apa yang perlu disediakan. Borang pendaftaran ada di butang bawah.
                </p>
                <ol className="space-y-3">
                    {steps.map((step, index) => (
                        <li key={step} className="rounded-2xl border-2 border-border bg-card p-4 text-xl leading-relaxed">
                            <span className="font-black text-primary">{index + 1}. </span>
                            {step}
                        </li>
                    ))}
                </ol>
                <section className="space-y-3">
                    <h2 className="text-2xl font-black">Panel yang diterima</h2>
                    <ul className="space-y-2">
                        {centre.panels.map((panel) => (
                            <li key={panel} className="rounded-2xl border-2 border-border bg-card px-4 py-3 text-xl font-bold">
                                {panel}
                            </li>
                        ))}
                    </ul>
                </section>
                <div className="grid gap-3">
                    <Link href="/daftar" className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-primary px-6 text-xl font-black text-primary-foreground">
                        Isi borang pendaftaran
                    </Link>
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-emerald-700 px-6 text-xl font-black text-white">
                        Tanya melalui WhatsApp
                    </a>
                    <a href={`tel:${centre.phone_main.replace(/\s+/g, '')}`} className="inline-flex min-h-16 items-center justify-center rounded-2xl border-2 border-primary px-6 text-xl font-black">
                        Telefon pejabat {centre.phone_main}
                    </a>
                </div>
            </article>
        </>
    );
}
