import { Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';

const fieldClass = 'min-h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg text-foreground outline-none focus:border-primary';

const duties = [
    'Menjaga pesakit sepanjang sesi hemodialisis.',
    'Merekod berat, tekanan darah, dan pemerhatian rawatan.',
    'Bekerja mengikut syif pagi atau petang, Isnin hingga Sabtu.',
    'Kelayakan jururawat berdaftar. Pengalaman dialisis diberi keutamaan, tetapi bukan syarat mutlak.',
];

export default function Jururawat() {
    const reference = usePage().props.nurseReference as string | null;
    const form = useForm({
        full_name: '',
        ic_number: '',
        phone_number: '',
        email: '',
        nursing_board_no: '',
        years_experience: '',
        preferred_shift: 'PAGI',
        notes: '',
    });

    return (
        <>
            <Head title="Jawatan jururawat" />
            <article className="mx-auto max-w-3xl space-y-6 px-4 py-8">
                <img src="/images/promo/jururawat.jpg" alt="Jururawat di unit dialisis" className="h-64 w-full rounded-3xl object-cover sm:h-80" />
                <p className="text-lg font-black text-primary">Iklan jawatan</p>
                <h1 className="text-4xl font-black leading-tight">Jururawat dialisis, Semenyih</h1>
                <p className="text-xl leading-relaxed">
                    Pusat Dialisis KaizenBros mencari jururawat untuk unit hemodialisis. Permohonan ini disimpan untuk pentadbir. Ia tidak membuka akaun portal.
                </p>
                <ul className="space-y-3">
                    {duties.map((duty) => (
                        <li key={duty} className="rounded-2xl border-2 border-border bg-card p-4 text-xl leading-relaxed">
                            {duty}
                        </li>
                    ))}
                </ul>

                {reference && (
                    <div className="rounded-2xl border-2 border-primary bg-accent p-5" role="status">
                        <p className="text-2xl font-black">Permohonan diterima</p>
                        <p className="mt-2 text-xl">Nombor rujukan: <span className="font-mono font-bold">{reference}</span></p>
                        <p className="mt-2 text-lg">Pihak pusat akan menghubungi jika permohonan sesuai.</p>
                    </div>
                )}

                <form
                    className="space-y-4 rounded-3xl border-2 border-border bg-card p-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/promosi/jururawat');
                    }}
                >
                    <h2 className="text-2xl font-black">Borang permohonan</h2>
                    <label className="block space-y-1">
                        <span className="text-lg font-bold">Nama penuh</span>
                        <input className={fieldClass} value={form.data.full_name} onChange={(event) => form.setData('full_name', event.target.value)} required />
                        <InputError message={form.errors.full_name} />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-lg font-bold">No. kad pengenalan</span>
                        <input className={fieldClass} placeholder="580101-10-1231" value={form.data.ic_number} onChange={(event) => form.setData('ic_number', event.target.value)} required />
                        <InputError message={form.errors.ic_number} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-1">
                            <span className="text-lg font-bold">Telefon</span>
                            <input className={fieldClass} value={form.data.phone_number} onChange={(event) => form.setData('phone_number', event.target.value)} required />
                            <InputError message={form.errors.phone_number} />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-lg font-bold">Emel</span>
                            <input type="email" className={fieldClass} value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />
                            <InputError message={form.errors.email} />
                        </label>
                    </div>
                    <label className="block space-y-1">
                        <span className="text-lg font-bold">No. lembaga jururawat</span>
                        <input className={fieldClass} value={form.data.nursing_board_no} onChange={(event) => form.setData('nursing_board_no', event.target.value)} required />
                        <InputError message={form.errors.nursing_board_no} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-1">
                            <span className="text-lg font-bold">Tahun pengalaman</span>
                            <input inputMode="numeric" className={fieldClass} value={form.data.years_experience} onChange={(event) => form.setData('years_experience', event.target.value)} />
                            <InputError message={form.errors.years_experience} />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-lg font-bold">Syif pilihan</span>
                            <select className={fieldClass} value={form.data.preferred_shift} onChange={(event) => form.setData('preferred_shift', event.target.value)}>
                                <option value="PAGI">Pagi</option>
                                <option value="PETANG">Petang</option>
                                <option value="BERGILIR">Bergilir</option>
                            </select>
                        </label>
                    </div>
                    <label className="block space-y-1">
                        <span className="text-lg font-bold">Nota</span>
                        <textarea className={`${fieldClass} min-h-28 py-3`} value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} />
                        <InputError message={form.errors.notes} />
                    </label>
                    <button type="submit" disabled={form.processing} className="inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground disabled:opacity-60">
                        {form.processing ? 'Menghantar...' : 'Hantar permohonan jururawat'}
                    </button>
                </form>
            </article>
        </>
    );
}
