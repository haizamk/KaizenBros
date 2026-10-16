import { Link, usePage } from '@inertiajs/react';

const links = [
    { href: '/pesakit', label: 'Utama' },
    { href: '/pesakit/sesi', label: 'Sesi' },
    { href: '/pesakit/jadual', label: 'Jadual' },
    { href: '/pesakit/timbang', label: 'Timbang' },
    { href: '/pesakit/ubat', label: 'Ubat' },
    { href: '/pesakit/rekod', label: 'Rekod' },
    { href: '/pesakit/darah', label: 'Darah' },
];

export function MissingPatient() {
    return (
        <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-6">
            <h1 className="text-3xl font-black">Rekod pesakit belum dipautkan</h1>
            <p className="mt-3 text-lg">Sila hubungi kaunter pusat untuk mengaktifkan portal anda.</p>
        </section>
    );
}

export default function PatientNav() {
    const url = usePage().url.split('?')[0];

    return (
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Halaman pesakit">
            {links.map((link) => {
                const active = url === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        className={`inline-flex min-h-12 shrink-0 items-center rounded-2xl px-4 text-base font-black ${
                            active ? 'bg-teal-500 text-slate-950' : 'border border-[#1F385C] bg-[#132238] text-slate-100'
                        }`}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
