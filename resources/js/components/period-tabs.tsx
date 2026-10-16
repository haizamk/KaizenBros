import { Link } from '@inertiajs/react';

export default function PeriodTabs({ base, current }: { base: string; current: number }) {
    return (
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tempoh perbandingan">
            {[6, 12, 24].map((months) => (
                <Link
                    key={months}
                    href={`${base}?tempoh=${months}`}
                    aria-current={current === months ? 'page' : undefined}
                    className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-2 text-center text-base font-black sm:text-lg ${
                        current === months ? 'bg-teal-500 text-slate-950' : 'border border-[#1F385C] bg-[#132238]'
                    }`}
                >
                    {months} bulan
                </Link>
            ))}
        </div>
    );
}
