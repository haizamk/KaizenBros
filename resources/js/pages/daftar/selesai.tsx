import { Head, Link } from '@inertiajs/react';

type Hours = {
    days: string;
    time: string;
};

export default function DaftarSelesai({
    reference,
    centreName,
    address,
    phoneLabel,
    email,
    hours,
    whatsappUrl,
    callUrl,
    emailUrl,
}: {
    reference: string;
    centreName: string;
    address: string;
    phoneLabel: string;
    email: string;
    hours: Hours[];
    whatsappUrl: string;
    callUrl: string;
    emailUrl: string;
}) {
    return (
        <>
            <Head title="Permohonan dihantar" />
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
                <div className="space-y-3 rounded-3xl border-2 border-primary bg-accent p-5" role="status">
                    <p className="text-lg font-black text-primary">Permohonan pesakit baru</p>
                    <h1 className="text-4xl font-black leading-tight">Permohonan telah dihantar</h1>
                    <p className="text-xl leading-relaxed">
                        Nombor rujukan anda ialah <span className="font-mono font-black">{reference}</span>.
                    </p>
                    <p className="text-xl leading-relaxed">
                        Pentadbir {centreName} akan menyemak permohonan ini. Simpan nombor rujukan jika anda perlu menghubungi pusat.
                    </p>
                </div>

                <section className="space-y-4 rounded-3xl border-2 border-border bg-card p-5">
                    <h2 className="text-3xl font-black">Hubungi pusat dialisis</h2>
                    <p className="text-xl leading-relaxed">
                        Pilih satu cara di bawah. Butang WhatsApp hanya membuka mesej draf. Anda masih perlu menekan hantar di WhatsApp.
                    </p>
                    <div className="grid gap-3">
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-emerald-700 px-6 text-xl font-black text-white"
                        >
                            WhatsApp pusat
                        </a>
                        <a
                            href={callUrl}
                            className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-primary px-6 text-xl font-black text-primary-foreground"
                        >
                            Telefon pusat {phoneLabel}
                        </a>
                        <a
                            href={emailUrl}
                            className="inline-flex min-h-16 items-center justify-center rounded-2xl border-2 border-primary bg-background px-6 text-xl font-black"
                        >
                            Emel {email}
                        </a>
                    </div>
                </section>

                <section className="space-y-3 rounded-3xl border-2 border-border bg-card p-5">
                    <h2 className="text-2xl font-black">Alamat dan waktu operasi</h2>
                    <p className="text-xl leading-relaxed">{address}</p>
                    <ul className="space-y-2">
                        {hours.map((row) => (
                            <li key={row.days} className="text-xl">
                                <span className="font-black">{row.days}.</span> {row.time}
                            </li>
                        ))}
                    </ul>
                </section>

                <Link
                    href="/"
                    className="inline-flex min-h-16 w-full items-center justify-center rounded-2xl border-2 border-border bg-card text-xl font-black"
                >
                    Kembali ke halaman utama
                </Link>
            </div>
        </>
    );
}
