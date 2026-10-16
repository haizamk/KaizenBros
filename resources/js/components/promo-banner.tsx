import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type Slide = {
    href: string;
    image: string;
    alt: string;
    kicker: string;
    title: string;
    text: string;
};

const slides: Slide[] = [
    {
        href: '/promosi/pesakit-baru',
        image: '/images/promo/pesakit-baru.jpg',
        alt: 'Jururawat menyambut pesakit di kaunter pusat dialisis',
        kicker: 'Pesakit baru',
        title: 'Mula rawatan di KaizenBros',
        text: 'Lihat maklumat pendaftaran, kemudian isi borang.',
    },
    {
        href: '/promosi/pengangkutan',
        image: '/images/promo/van.jpg',
        alt: 'Van dengan ramp kerusi roda di hadapan klinik',
        kicker: 'Van percuma',
        title: 'Pengangkutan pergi dan balik',
        text: 'Untuk kawasan Beranang dan Semenyih.',
    },
    {
        href: '/promosi/jururawat',
        image: '/images/promo/jururawat.jpg',
        alt: 'Jururawat di unit dialisis',
        kicker: 'Jawatan jururawat',
        title: 'Sertai pasukan rawatan',
        text: 'Baca iklan jawatan dan hantar permohonan.',
    },
];

export default function PromoBanner() {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const slide = slides[index];

    useEffect(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (paused || reduceMotion) {
            return;
        }

        const timer = window.setInterval(() => {
            setIndex((current) => (current + 1) % slides.length);
        }, 8000);

        return () => window.clearInterval(timer);
    }, [paused]);

    const show = (next: number) => {
        setIndex((next + slides.length) % slides.length);
    };

    return (
        <section
            className="mx-auto max-w-6xl space-y-3 px-4 py-6"
            aria-roledescription="carousel"
            aria-label="Promosi pusat"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
        >
            <p className="text-lg font-bold">Promosi {index + 1} daripada {slides.length}</p>
            <Link href={slide.href} className="block overflow-hidden rounded-3xl border-2 border-border focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-primary">
                <span className="relative block min-h-72 sm:min-h-96">
                    <img src={slide.image} alt={slide.alt} className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-[#0B132B]/55 to-[#0B132B]/10" />
                    <span className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-white sm:p-8">
                        <span className="block text-lg font-black text-teal-200">{slide.kicker}</span>
                        <span className="block text-3xl font-black leading-tight sm:text-5xl">{slide.title}</span>
                        <span className="block max-w-2xl text-xl leading-relaxed">{slide.text}</span>
                    </span>
                </span>
            </Link>
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => show(index - 1)} className="inline-flex min-h-14 items-center rounded-2xl border-2 border-border bg-card px-4 text-lg font-black">
                    Sebelum
                </button>
                {slides.map((item, itemIndex) => (
                    <button
                        key={item.href}
                        type="button"
                        aria-label={item.kicker}
                        aria-current={itemIndex === index}
                        onClick={() => show(itemIndex)}
                        className={`inline-flex min-h-14 min-w-14 items-center justify-center rounded-2xl px-4 text-lg font-black ${
                            itemIndex === index ? 'bg-primary text-primary-foreground' : 'border-2 border-border bg-card'
                        }`}
                    >
                        {itemIndex + 1}
                    </button>
                ))}
                <button type="button" onClick={() => show(index + 1)} className="inline-flex min-h-14 items-center rounded-2xl border-2 border-border bg-card px-4 text-lg font-black">
                    Seterusnya
                </button>
            </div>
        </section>
    );
}
