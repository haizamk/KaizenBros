import { Link, usePage } from '@inertiajs/react';
import { useAppearance } from '@/hooks/use-appearance';
import { useTextSize, type TextSize } from '@/hooks/use-text-size';

type Centre = {
    name: string;
    kkm_license: string;
    hotline_24h: string;
};

const textSizes: Array<{ id: TextSize; label: string }> = [
    { id: 'sm', label: 'Kecil' },
    { id: 'md', label: 'Sederhana' },
    { id: 'lg', label: 'Besar' },
    { id: 'xl', label: 'Sangat besar' },
];

function digits(phone: string): string {
    return phone.replace(/\s+/g, '');
}

function ThemeChoice() {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Pilihan paparan">
            <span className="text-base font-bold">Paparan</span>
            <button
                type="button"
                aria-pressed={resolvedAppearance === 'dark'}
                onClick={() => updateAppearance('dark')}
                className={`inline-flex min-h-12 items-center rounded-xl px-4 text-base font-black ${
                    resolvedAppearance === 'dark' ? 'bg-primary text-primary-foreground' : 'border-2 border-border bg-card text-foreground'
                }`}
            >
                Gelap
            </button>
            <button
                type="button"
                aria-pressed={resolvedAppearance === 'light'}
                onClick={() => updateAppearance('light')}
                className={`inline-flex min-h-12 items-center rounded-xl px-4 text-base font-black ${
                    resolvedAppearance === 'light' ? 'bg-primary text-primary-foreground' : 'border-2 border-border bg-card text-foreground'
                }`}
            >
                Cerah
            </button>
        </div>
    );
}

function TextSizeChoice() {
    const { textSize, updateTextSize } = useTextSize();

    return (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Saiz teks">
            <span className="text-base font-bold">Saiz teks</span>
            {textSizes.map((size) => (
                <button
                    key={size.id}
                    type="button"
                    aria-pressed={textSize === size.id}
                    onClick={() => updateTextSize(size.id)}
                    className={`inline-flex min-h-12 items-center rounded-xl px-4 text-base font-black ${
                        textSize === size.id ? 'bg-primary text-primary-foreground' : 'border-2 border-border bg-card text-foreground'
                    }`}
                >
                    {size.label}
                </button>
            ))}
        </div>
    );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const { centre } = usePage<{ centre: Centre }>().props;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
                    <Link href="/" className="min-h-12 text-left">
                        <span className="block text-base font-bold text-primary">{centre.kkm_license}</span>
                        <span className="block text-xl font-black leading-tight">{centre.name}</span>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3">
                        <ThemeChoice />
                        <TextSizeChoice />
                        <a
                            href={`tel:${digits(centre.hotline_24h)}`}
                            className="inline-flex min-h-14 items-center rounded-2xl bg-rose-700 px-5 text-lg font-black text-white"
                        >
                            Kecemasan {centre.hotline_24h}
                        </a>
                    </div>
                </div>
            </header>
            {children}
        </div>
    );
}
