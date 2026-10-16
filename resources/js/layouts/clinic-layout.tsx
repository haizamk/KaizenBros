import { Link, usePage } from '@inertiajs/react';
import { home, logout } from '@/routes';
import type { Auth } from '@/types';

type Centre = {
    name: string;
    hotline_24h: string;
};

export default function ClinicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { auth, name } = usePage<{ auth: Auth; name: string; centre?: Centre }>().props;
    const user = auth.user;
    const homeHref = user?.role === 'admin' ? '/admin' : user?.role === 'nurse' ? '/jururawat' : user?.role === 'patient' ? '/pesakit' : home.url();

    return (
        <div className="min-h-screen bg-[#0B132B] text-slate-100">
            <header className="sticky top-0 z-40 border-b border-[#1F385C] bg-[#070D1F]/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <Link href={homeHref} className="min-h-12 text-left">
                        <span className="block text-xs font-bold tracking-wide text-teal-300">{name}</span>
                        <span className="block text-base font-black text-white">Pusat Dialisis Semenyih</span>
                    </Link>
                    <nav className="flex flex-wrap items-center gap-2">
                        <a
                            href="tel:0193889922"
                            className="inline-flex min-h-12 items-center rounded-xl border border-rose-700 bg-rose-950 px-4 text-sm font-bold text-rose-100"
                        >
                            SOS 019-388 9922
                        </a>
                        {user ? (
                            <>
                                <span className="hidden text-sm text-slate-300 sm:inline">
                                    {user.name}
                                    <span className="ml-2 rounded-full bg-teal-950 px-2 py-1 text-xs font-bold text-teal-200 uppercase">
                                        {user.role}
                                    </span>
                                </span>
                                {user.role === 'admin' && (
                                    <Link href="/jururawat" className="inline-flex min-h-12 items-center rounded-xl border border-[#1F385C] px-4 text-sm font-bold">
                                        Papan jururawat
                                    </Link>
                                )}
                                <Link
                                    href={logout.url()}
                                    method="post"
                                    as="button"
                                    className="inline-flex min-h-12 items-center rounded-xl bg-[#132238] px-4 text-sm font-bold text-slate-100"
                                >
                                    Log keluar
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" className="inline-flex min-h-12 items-center rounded-xl bg-teal-500 px-4 text-sm font-black text-slate-950">
                                Log masuk
                            </Link>
                        )}
                    </nav>
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
    );
}
