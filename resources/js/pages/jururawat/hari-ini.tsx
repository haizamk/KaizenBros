import { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { NursePage } from '@/components/nurse-nav';
import type { ShiftCounts } from '@/components/session-actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Arrival = {
    id: number;
    name: string;
    patient_id_code: string;
    dry_weight_kg: string;
    scheduled_time: string;
    shift_label: string;
    status_label: string;
    queue_label: string | null;
    can_register: boolean;
};

const stages = [
    { key: 'belum' as const, step: '1', title: 'Belum tiba', detail: 'Masukkan berat badan semasa daftar. Tekanan darah adalah pilihan.' },
    { key: 'menunggu' as const, step: '2', title: 'Menunggu panggilan', detail: 'Yang sampai dahulu dipanggil dulu. Kerusi automatik, atau pilih kerusi lain.' },
    { key: 'hadir' as const, step: '3', title: 'Di kerusi', detail: 'Pesakit sudah duduk. Tekan mula dialisis.' },
    { key: 'sedang' as const, step: '4', title: 'Sedang dialisis', detail: 'Rawatan aktif. Pemasa 4 jam berjalan.' },
    { key: 'selesai' as const, step: '5', title: 'Selesai', detail: 'Kerusi ini kosong semula untuk pesakit yang sampai dahulu.' },
];

const fieldClass = 'min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-3 text-base text-white';

export default function HariIni({
    counts,
    arrivals,
    today,
    nurseName,
    status,
}: {
    counts: ShiftCounts;
    arrivals: Arrival[];
    today: string;
    nurseName: string;
    status?: string | null;
}) {
    return (
        <>
            <Head title="Hari ini" />
            <NursePage title={`Selamat datang, ${nurseName}`} intro={today}>
                {status ? <p className="rounded-2xl border border-teal-700 bg-teal-950 p-4 text-lg font-bold text-teal-100" role="status">{status}</p> : null}

                <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                    <ArrivalButton arrivals={arrivals} />
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Link
                            href="/jururawat/sesi?tapisan=DAFTAR"
                            className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-teal-500 px-4 text-center text-lg font-black text-slate-950"
                        >
                            Daftar sesi dialisis
                        </Link>
                        <Link
                            href="/jururawat/sesi?tapisan=SEDANG_DIALISIS"
                            className="inline-flex min-h-16 items-center justify-center rounded-2xl border-2 border-teal-400 bg-[#0B132B] px-4 text-center text-lg font-black text-teal-100"
                        >
                            Tamat rawatan
                        </Link>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                        Daftar sesi membuka papan kerusi untuk panggil pesakit, simpan di kerusi, dan mula dialisis. Tamat rawatan membuka senarai pesakit yang sedang dialisis untuk isi berat selepas, tekanan darah, dan nota.
                    </p>
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                        <h2 className="text-2xl font-black">Papan giliran ketibaan hari ini</h2>
                        <p className="text-lg font-black text-teal-200">{counts.percent}% selesai</p>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#0B132B]">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${counts.percent}%` }} />
                    </div>
                    <p className="mt-3 text-base text-slate-200">
                        Syif 1 ialah 6:00 pagi hingga 10:00 pagi. Syif 2 ialah 10:30 pagi hingga 2:30 petang. Syif 3 ialah 3:00 petang hingga 7:00 malam. Kerusi yang boleh digunakan sekarang: {counts.kerusi_kosong}. Kerusi ditanda rosak atau tidak sesuai: {counts.kerusi_rosak}.
                    </p>
                </section>

                <div className="grid gap-3 md:grid-cols-2">
                    {stages.map((item) => (
                        <article key={item.key} className="rounded-3xl border border-[#1F385C] bg-[#132238] p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-black text-teal-200">{item.step}</p>
                                <p className="text-2xl font-black">{counts[item.key]}</p>
                            </div>
                            <h3 className="mt-2 text-xl font-black">{item.title}</h3>
                            <p className="mt-1 text-base text-slate-200">{item.detail}</p>
                        </article>
                    ))}
                </div>
            </NursePage>
        </>
    );
}

function ArrivalButton({ arrivals }: { arrivals: Arrival[] }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const form = useForm({ pre_weight_kg: '', pre_bp: '' });

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return arrivals
            .filter((patient) => {
                if (!needle) return true;
                return `${patient.name} ${patient.patient_id_code}`.toLowerCase().includes(needle);
            })
            .sort((left, right) => Number(right.can_register) - Number(left.can_register));
    }, [arrivals, query]);

    const selected = arrivals.find((patient) => patient.id === selectedId && patient.can_register) ?? null;

    function choose(patient: Arrival) {
        if (!patient.can_register) return;
        setSelectedId(patient.id);
        form.clearErrors();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button type="button" className="inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-amber-400 px-4 text-center text-xl font-black text-slate-950">
                    Daftar Ketibaan Pesakit Hadir
                </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F385C] bg-[#132238] text-white sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-white">Daftar ketibaan pesakit hadir</DialogTitle>
                    <DialogDescription className="text-base text-slate-200">
                        Cari nama pesakit yang baru tiba. Berat badan wajib diisi. Tekanan darah boleh dibiarkan kosong. Nombor giliran diberi mengikut siapa sampai dahulu.
                    </DialogDescription>
                </DialogHeader>
                <label className="space-y-1">
                    <span className="text-sm font-bold">Nama pesakit</span>
                    <input
                        className={fieldClass}
                        value={query}
                        placeholder="Taip nama atau ID pesakit"
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </label>
                <div className="grid max-h-56 gap-2 overflow-y-auto">
                    {visible.length === 0 ? (
                        <p className="rounded-2xl border border-[#1F385C] p-4 text-base">Tiada pesakit yang sepadan dengan nama ini pada jadual hari ini.</p>
                    ) : (
                        visible.map((patient) => (
                            <button
                                key={patient.id}
                                type="button"
                                disabled={!patient.can_register}
                                onClick={() => choose(patient)}
                                className={`rounded-2xl border p-3 text-left ${selected?.id === patient.id ? 'border-amber-400 bg-[#17304F]' : 'border-[#1F385C]'} ${patient.can_register ? '' : 'opacity-70'}`}
                            >
                                <p className="text-lg font-black">{patient.name}</p>
                                <p className="text-sm text-slate-200">
                                    {patient.patient_id_code} · {patient.scheduled_time} · {patient.shift_label}
                                    {patient.can_register ? ' · Belum tiba' : ` · ${patient.status_label}`}
                                    {patient.queue_label ? ` · Giliran ${patient.queue_label}` : ''}
                                </p>
                            </button>
                        ))
                    )}
                </div>
                {selected ? (
                    <form
                        className="grid gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(`/jururawat/sesi/${selected.id}/tiba`, {
                                preserveScroll: true,
                                onSuccess: () => {
                                    setOpen(false);
                                    setSelectedId(null);
                                    setQuery('');
                                    form.reset();
                                },
                            });
                        }}
                    >
                        <p className="text-base text-slate-200">Berat kering {selected.name} ialah {selected.dry_weight_kg} kg.</p>
                        <label className="space-y-1">
                            <span className="text-sm font-bold">Berat badan semasa tiba (kg)</span>
                            <input className={fieldClass} inputMode="decimal" value={form.data.pre_weight_kg} onChange={(event) => form.setData('pre_weight_kg', event.target.value)} required />
                            <InputError message={form.errors.pre_weight_kg} />
                        </label>
                        <label className="space-y-1">
                            <span className="text-sm font-bold">Tekanan darah (pilihan)</span>
                            <input className={fieldClass} placeholder="120/80" value={form.data.pre_bp} onChange={(event) => form.setData('pre_bp', event.target.value)} />
                            <InputError message={form.errors.pre_bp} />
                        </label>
                        <button type="submit" disabled={form.processing} className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-amber-400 px-4 text-lg font-black text-slate-950">
                            Beri nombor giliran
                        </button>
                    </form>
                ) : (
                    <p className="text-base text-slate-300">Pilih pesakit yang belum tiba untuk mengisi berat dan tekanan darah.</p>
                )}
            </DialogContent>
        </Dialog>
    );
}
