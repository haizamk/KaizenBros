import { Head, Link, usePage } from '@inertiajs/react';

type Centre = {
    phone_main: string;
    whatsapp_number: string;
    hotline_24h: string;
};

const points = [
    'Van pergi dan balik disediakan tanpa caj untuk pesakit di kawasan Beranang dan Semenyih.',
    'Van ada ramp untuk kerusi roda.',
    'Beritahu alamat rumah dan waktu sesi dialisis anda apabila menghubungi pusat.',
    'Pesakit baru boleh daftar dahulu, kemudian minta van semasa kaunter mengesahkan slot.',
];

export default function Pengangkutan() {
    const { centre } = usePage<{ centre: Centre }>().props;
    const whatsapp = `https://wa.me/${centre.whatsapp_number}?text=${encodeURIComponent('Salam, saya ingin mengatur van percuma ke Pusat Dialisis KaizenBros Semenyih.')}`;

    return (
        <>
            <Head title="Van percuma" />
            <article className="mx-auto max-w-3xl space-y-6 px-4 py-8">
                <img src="/images/promo/van.jpg" alt="Van dengan ramp kerusi roda di hadapan klinik" className="h-64 w-full rounded-3xl object-cover sm:h-80" />
                <p className="text-lg font-black text-primary">Pengangkutan percuma</p>
                <h1 className="text-4xl font-black leading-tight">Van pergi dan balik</h1>
                <p className="text-xl leading-relaxed">
                    Pusat menyediakan van untuk pesakit yang tinggal di Beranang dan Semenyih. Hubungi kaunter untuk atur waktu jemputan.
                </p>
                <ul className="space-y-3">
                    {points.map((point) => (
                        <li key={point} className="rounded-2xl border-2 border-border bg-card p-4 text-xl leading-relaxed">
                            {point}
                        </li>
                    ))}
                </ul>
                <div className="grid gap-3">
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-emerald-700 px-6 text-xl font-black text-white">
                        Minta van melalui WhatsApp
                    </a>
                    <a href={`tel:${centre.phone_main.replace(/\s+/g, '')}`} className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-primary px-6 text-xl font-black text-primary-foreground">
                        Telefon pejabat {centre.phone_main}
                    </a>
                    <Link href="/daftar" className="inline-flex min-h-16 items-center justify-center rounded-2xl border-2 border-primary px-6 text-xl font-black">
                        Saya pesakit baru, daftar dahulu
                    </Link>
                </div>
                <p className="text-lg leading-relaxed">Kecemasan 24 jam: {centre.hotline_24h}. Van berjadual tidak menggantikan panggilan kecemasan.</p>
            </article>
        </>
    );
}
