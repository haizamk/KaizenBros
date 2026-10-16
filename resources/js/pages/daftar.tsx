import { Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { parseMalaysianIc } from '@/lib/malaysian-ic';

type Option = {
    value: string;
    label: string;
};

const fieldClass = 'min-h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg text-foreground outline-none focus:border-primary';

export default function Daftar({
    today,
    categories,
    relationships,
}: {
    today: string;
    categories: Option[];
    relationships: Option[];
}) {
    const reference = usePage().props.reference as string | null;
    const form = useForm({
        full_name: '',
        ic_number: '',
        phone_number: '',
        email: '',
        address: '',
        patient_category: '',
        medical_notes: '',
        nok_name: '',
        nok_relationship: '',
        nok_phone: '',
        nok_email: '',
        kad_pengenalan: null as File | null,
        surat_doktor: null as File | null,
        lain: null as File | null,
    });
    const identity = parseMalaysianIc(form.data.ic_number, today);

    return (
        <>
            <Head title="Daftar pesakit baru" />
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
                <div>
                    <p className="text-lg font-black text-primary">Permohonan pesakit baru</p>
                    <h1 className="text-4xl font-black leading-tight">Borang pendaftaran kemasukan dialisis</h1>
                    <p className="mt-3 text-xl leading-relaxed">
                        Sila isi maklumat mengikut kad pengenalan. Permohonan dihantar kepada pentadbir untuk pengesahan. Akaun portal hanya dibuka selepas permohonan diluluskan.
                    </p>
                </div>

                {reference && (
                    <div className="space-y-2 rounded-3xl border-2 border-primary bg-accent p-5" role="status">
                        <p className="text-2xl font-black">Permohonan telah dihantar</p>
                        <p className="text-xl">Nombor rujukan anda ialah <span className="font-mono font-bold">{reference}</span>.</p>
                        <p className="text-lg leading-relaxed">Pentadbir akan menyemak permohonan ini. Pegawai pusat akan menghubungi anda selepas semakan selesai.</p>
                    </div>
                )}

                <form
                    className="space-y-8 rounded-3xl border-2 border-border bg-card p-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/daftar', { forceFormData: true });
                    }}
                >
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black">1. Data peribadi pesakit</h2>
                        <Field label="Nama penuh mengikut kad pengenalan" required error={form.errors.full_name}>
                            <input className={fieldClass} autoComplete="name" value={form.data.full_name} onChange={(event) => form.setData('full_name', event.target.value)} required />
                        </Field>
                        <Field label="Nombor kad pengenalan" required error={form.errors.ic_number || (form.data.ic_number.replace(/\D/g, '').length === 12 ? identity.message || undefined : undefined)}>
                            <input
                                className={fieldClass}
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="580101-10-1231"
                                value={form.data.ic_number}
                                onChange={(event) => form.setData('ic_number', parseMalaysianIc(event.target.value, today).formatted)}
                                required
                            />
                        </Field>
                        {identity.message && form.data.ic_number.replace(/\D/g, '').length < 12 && (
                            <p className="text-lg leading-relaxed">{identity.message}</p>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Readout label="Umur" value={identity.ageLabel} empty="Umur dikira selepas tarikh lahir pada kad pengenalan dikenal pasti." />
                            <Readout label="Jantina" value={identity.genderLabel} empty="Jantina dikira selepas 12 digit kad pengenalan diisi." />
                        </div>
                        <p className="text-lg leading-relaxed">Umur dipaparkan dalam tahun dan bulan. Jantina diambil daripada digit terakhir kad pengenalan.</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Nombor telefon" required error={form.errors.phone_number}>
                                <input className={fieldClass} type="tel" autoComplete="tel" placeholder="012-3456789" value={form.data.phone_number} onChange={(event) => form.setData('phone_number', event.target.value)} required />
                            </Field>
                            <Field label="Emel" hint="Tidak wajib" error={form.errors.email}>
                                <input className={fieldClass} type="email" autoComplete="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />
                            </Field>
                        </div>
                        <Field label="Alamat kediaman" required error={form.errors.address}>
                            <textarea className={`${fieldClass} min-h-28 py-3`} autoComplete="street-address" value={form.data.address} onChange={(event) => form.setData('address', event.target.value)} required />
                        </Field>
                    </section>

                    <section className="space-y-4 border-t border-border pt-6">
                        <h2 className="text-2xl font-black">2. Maklumat waris</h2>
                        <p className="text-lg leading-relaxed">Nama waris dan nombor telefon waris wajib diisi.</p>
                        <Field label="Nama penuh waris" required error={form.errors.nok_name}>
                            <input className={fieldClass} value={form.data.nok_name} onChange={(event) => form.setData('nok_name', event.target.value)} required />
                        </Field>
                        <Field label="Hubungan dengan pesakit" required error={form.errors.nok_relationship}>
                            <select className={fieldClass} value={form.data.nok_relationship} onChange={(event) => form.setData('nok_relationship', event.target.value)} required>
                                <option value="">Pilih hubungan</option>
                                {relationships.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Nombor telefon waris" required error={form.errors.nok_phone}>
                                <input className={fieldClass} type="tel" placeholder="012-3456789" value={form.data.nok_phone} onChange={(event) => form.setData('nok_phone', event.target.value)} required />
                            </Field>
                            <Field label="Emel waris" hint="Tidak wajib" error={form.errors.nok_email}>
                                <input className={fieldClass} type="email" value={form.data.nok_email} onChange={(event) => form.setData('nok_email', event.target.value)} />
                            </Field>
                        </div>
                    </section>

                    <section className="space-y-4 border-t border-border pt-6">
                        <h2 className="text-2xl font-black">3. Kategori dan catatan</h2>
                        <Field label="Kategori pesakit" required error={form.errors.patient_category}>
                            <select className={fieldClass} value={form.data.patient_category} onChange={(event) => form.setData('patient_category', event.target.value)} required>
                                <option value="">Pilih kategori</option>
                                {categories.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </Field>
                        <p className="text-lg leading-relaxed">Penaja, hari rawatan, dan syif akan ditetapkan oleh pentadbir selepas pengesahan.</p>
                        <Field label="Catatan kesihatan" hint="Tidak wajib" error={form.errors.medical_notes}>
                            <textarea className={`${fieldClass} min-h-28 py-3`} value={form.data.medical_notes} onChange={(event) => form.setData('medical_notes', event.target.value)} />
                        </Field>
                    </section>

                    <section className="space-y-4 border-t border-border pt-6">
                        <h2 className="text-2xl font-black">4. Dokumen sokongan</h2>
                        <p className="text-lg leading-relaxed">
                            Muat naik salinan kad pengenalan, surat doktor, atau dokumen lain. Setiap fail mestilah PDF atau gambar, dan saiznya tidak melebihi 8 MB. Dokumen ini disimpan di pelayan pusat dan hanya dibuka oleh pentadbir.
                        </p>
                        <FileField
                            label="Salinan kad pengenalan"
                            error={form.errors.kad_pengenalan}
                            onChange={(file) => form.setData('kad_pengenalan', file)}
                        />
                        <FileField
                            label="Surat doktor"
                            error={form.errors.surat_doktor}
                            onChange={(file) => form.setData('surat_doktor', file)}
                        />
                        <FileField
                            label="Dokumen lain"
                            error={form.errors.lain}
                            onChange={(file) => form.setData('lain', file)}
                        />
                    </section>

                    <button type="submit" disabled={form.processing || !identity.valid} className="inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground disabled:opacity-60">
                        {form.processing ? 'Menghantar...' : 'Hantar kepada pentadbir'}
                    </button>
                </form>
            </div>
        </>
    );
}

function Field({
    label,
    required = false,
    hint,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block space-y-1">
            <span className="text-lg font-bold">
                {label}
                {required ? <span className="text-rose-700 dark:text-rose-300"> (Wajib)</span> : null}
                {hint ? <span className="font-medium"> ({hint})</span> : null}
            </span>
            {children}
            <InputError message={error} />
        </label>
    );
}

function FileField({
    label,
    error,
    onChange,
}: {
    label: string;
    error?: string;
    onChange: (file: File | null) => void;
}) {
    return (
        <Field label={label} hint="Tidak wajib. PDF atau gambar" error={error}>
            <input
                className={`${fieldClass} py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-base file:font-bold file:text-primary-foreground`}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            />
        </Field>
    );
}

function Readout({ label, value, empty }: { label: string; value: string | null; empty: string }) {
    return (
        <div className="rounded-2xl border-2 border-border bg-background p-4">
            <p className="text-lg font-bold">{label}</p>
            <p className="mt-1 text-2xl font-black text-primary">{value ?? 'Belum dikira'}</p>
            {!value && <p className="mt-1 text-base leading-relaxed">{empty}</p>}
        </div>
    );
}
