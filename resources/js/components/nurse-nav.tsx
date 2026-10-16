import { Link, usePage } from '@inertiajs/react';

const links = [
    { href: '/jururawat', label: 'Hari Ini' },
    { href: '/jururawat/sesi', label: 'Sesi Dialisis' },
    { href: '/jururawat/ringkasan', label: 'Ringkasan Syif' },
    { href: '/jururawat/jadual', label: 'Jadual Rawatan' },
    { href: '/jururawat/pesakit', label: 'Pesakit' },
    { href: '/jururawat/darah', label: 'Rekod Darah & Analisa' },
    { href: '/jururawat/tetapan', label: 'Tetapan' },
];

export default function NurseNav() {
    const url = usePage().url.split('?')[0];

    return (
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Halaman jururawat">
            {links.map((link) => {
                const active = link.href === '/jururawat' ? url === '/jururawat' : url.startsWith(link.href);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        className={`inline-flex min-h-12 shrink-0 items-center rounded-2xl px-4 text-sm font-black sm:text-base ${
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

export function NursePage({
    title,
    intro,
    children,
}: {
    title: string;
    intro?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-5">
            <NurseNav />
            <div>
                <p className="text-sm font-bold text-teal-300">Portal jururawat</p>
                <h1 className="text-3xl font-black">{title}</h1>
                {intro ? <p className="mt-2 text-lg leading-relaxed text-slate-200">{intro}</p> : null}
            </div>
            {children}
        </div>
    );
}
