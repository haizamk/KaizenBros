import { Link, usePage } from '@inertiajs/react';
import { home, logout } from '@/routes';
import { useTextSize, type TextSize } from '@/hooks/use-text-size';
import type { Auth } from '@/types';

type Centre = {
    name: string;
    hotline_24h: string;
};

const textSizes: Array<{ id: TextSize; label: string; name: string }> = [
    { id: 'sm', label: 'A', name: 'Kecil' },
    { id: 'md', label: 'A+', name: 'Sederhana' },
    { id: 'lg', label: 'A++', name: 'Besar' },
    { id: 'xl', label: 'A+++', name: 'Sangat besar' },
];

export default function ClinicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { auth, name } = usePage<{ auth: Auth; name: string; centre?: Centre }>().props;
    const { textSize, updateTextSize } = useTextSize();
    const user = auth.user;
    const homeHref = user?.role === 'admin' ? '/admin' : user?.role === 'nurse' ? '/jururawat' : user?.role === 'patient' ? '/pesakit' : home.url();

    return (
        <div className="min-h-screen overflow-x-clip bg-[#0B132B] text-slate-100">
            <header className="sticky top-0 z-40 border-b border-[#1F385C] bg-[#070D1F]/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
                    <Link href={homeHref} className="min-h-12 min-w-0 text-left">
                        <span className="block text-xs font-bold tracking-wide text-teal-300">{name}</span>
                        <span className="block text-base font-black text-white sm:text-lg">Pusat Dialisis Semenyih</span>
                    </Link>
                    <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                        <a
                            href="tel:0193889922"
                            className="col-span-2 inline-flex min-h-12 items-center justify-center rounded-xl border border-rose-700 bg-rose-950 px-4 text-sm font-bold text-rose-100 sm:col-auto"
                        >
                            SOS 019-388 9922
                        </a>
                        {user ? (
                            <>
                                <span className="col-span-2 hidden text-sm text-slate-300 md:inline">
                                    {user.name}
                                </span>
                                {user.role === 'nurse' || user.role === 'admin' ? (
                                    <>
                                        <Link href="/jururawat" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#1F385C] px-3 text-sm font-bold">
                                            Hari ini
                                        </Link>
                                        <Link href="/jururawat/darah" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#1F385C] px-3 text-sm font-bold">
                                            Rekod darah
                                        </Link>
                                    </>
                                ) : null}
                                {user.role === 'admin' && (
                                    <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#1F385C] px-3 text-sm font-bold">
                                        Pentadbir
                                    </Link>
                                )}
                                <Link
                                    href={logout.url()}
                                    method="post"
                                    as="button"
                                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#132238] px-3 text-sm font-bold text-slate-100"
                                >
                                    Log keluar
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-500 px-4 text-sm font-black text-slate-950">
                                Log masuk
                            </Link>
                        )}
                    </nav>
                </div>
                <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-3 pb-3 sm:px-4" role="group" aria-label="Saiz teks">
                    <span className="text-sm font-bold text-slate-300">Saiz tulisan</span>
                    {textSizes.map((size) => (
                        <button
                            key={size.id}
                            type="button"
                            aria-label={size.name}
                            aria-pressed={textSize === size.id}
                            onClick={() => updateTextSize(size.id)}
                            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3 text-base font-black ${
                                textSize === size.id ? 'bg-teal-500 text-slate-950' : 'border border-[#1F385C] text-slate-100'
                            }`}
                        >
                            {size.label}
                        </button>
                    ))}
                </div>
            </header>
            <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-6">{children}</main>
        </div>
    );
}
