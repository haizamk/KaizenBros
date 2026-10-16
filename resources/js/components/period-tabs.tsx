import { Link } from '@inertiajs/react';

export default function PeriodTabs({ base, current, allTime = false }: { base: string; current: number; allTime?: boolean }) {
    const tabs = allTime
        ? [
              { months: 6, label: '6 bulan' },
              { months: 12, label: '12 bulan' },
              { months: 24, label: '24 bulan' },
              { months: 0, label: 'Sepanjang masa' },
          ]
        : [
              { months: 6, label: '6 bulan' },
              { months: 12, label: '12 bulan' },
              { months: 24, label: '24 bulan' },
          ];

    return (
        <div className={`grid gap-2 ${allTime ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`} role="group" aria-label="Tempoh perbandingan">
            {tabs.map((tab) => (
                <Link
                    key={tab.months}
                    href={tab.months === 0 ? `${base}?tempoh=semua` : `${base}?tempoh=${tab.months}`}
                    aria-current={current === tab.months ? 'page' : undefined}
                    className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-2 text-center text-base font-black sm:text-lg ${
                        current === tab.months ? 'bg-teal-500 text-slate-950' : 'border border-[#1F385C] bg-[#132238]'
                    }`}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    );
}
