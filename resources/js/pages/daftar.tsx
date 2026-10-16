import { Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';

const fieldClass = 'min-h-12 w-full rounded-xl border border-[#1F385C] bg-[#0B132B] px-4 text-base text-white outline-none focus:border-teal-400';

export default function Daftar() {
    const reference = usePage().props.reference as string | null;
    const form = useForm({
        full_name: '',
        ic_number: '',
        phone_number: '',
        email: '',
        gender: 'LELAKI',
        address: '',
        medical_notes: '',
        nok_name: '',
        nok_phone: '',
    });

    return (
        <>
            <Head title="Daftar pesakit baru" />
            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <p className="text-sm font-bold text-teal-300">Permohonan</p>
                    <h1 className="text-3xl font-black">Daftar pesakit baru</h1>
                    <p className="mt-2 text-base text-slate-200">
                        Borang ini disimpan di pelayan. Akaun portal hanya dibuka selepas pentadbir mengesahkan permohonan.
                    </p>
                </div>

                {reference && (
                    <div className="rounded-2xl border border-teal-600 bg-teal-950 p-5" role="status">
                        <p className="text-lg font-black text-teal-100">Permohonan diterima</p>
                        <p className="mt-1 text-base">Nombor rujukan: <span className="font-mono font-bold">{reference}</span></p>
                    </div>
                )}

                <form
                    className="space-y-4 rounded-3xl border border-[#1F385C] bg-[#132238] p-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/daftar');
                    }}
                >
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">Nama penuh</span>
                        <input className={fieldClass} value={form.data.full_name} onChange={(event) => form.setData('full_name', event.target.value)} required />
                        <InputError message={form.errors.full_name} />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">No. kad pengenalan</span>
                        <input className={fieldClass} placeholder="580101-10-1231" value={form.data.ic_number} onChange={(event) => form.setData('ic_number', event.target.value)} required />
                        <InputError message={form.errors.ic_number} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-1">
                            <span className="text-sm font-bold">Telefon</span>
                            <input className={fieldClass} value={form.data.phone_number} onChange={(event) => form.setData('phone_number', event.target.value)} required />
                            <InputError message={form.errors.phone_number} />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-sm font-bold">Jantina</span>
                            <select className={fieldClass} value={form.data.gender} onChange={(event) => form.setData('gender', event.target.value)}>
                                <option value="LELAKI">Lelaki</option>
                                <option value="PEREMPUAN">Perempuan</option>
                            </select>
                        </label>
                    </div>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">Emel</span>
                        <input type="email" className={fieldClass} value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />
                        <InputError message={form.errors.email} />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">Alamat</span>
                        <input className={fieldClass} value={form.data.address} onChange={(event) => form.setData('address', event.target.value)} />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-sm font-bold">Nota perubatan</span>
                        <textarea className={`${fieldClass} min-h-28 py-3`} value={form.data.medical_notes} onChange={(event) => form.setData('medical_notes', event.target.value)} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-1">
                            <span className="text-sm font-bold">Waris</span>
                            <input className={fieldClass} value={form.data.nok_name} onChange={(event) => form.setData('nok_name', event.target.value)} />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-sm font-bold">Telefon waris</span>
                            <input className={fieldClass} value={form.data.nok_phone} onChange={(event) => form.setData('nok_phone', event.target.value)} />
                        </label>
                    </div>
                    <button type="submit" disabled={form.processing} className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-teal-500 text-lg font-black text-slate-950 disabled:opacity-60">
                        {form.processing ? 'Menghantar...' : 'Hantar permohonan'}
                    </button>
                </form>
            </div>
        </>
    );
}
