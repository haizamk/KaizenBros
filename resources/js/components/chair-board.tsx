import { Link, useForm } from '@inertiajs/react';
import DialysisTimer from '@/components/dialysis-timer';
import InputError from '@/components/input-error';

export type ChairTile = {
    number: string;
    state: 'kosong' | 'digunakan' | 'rosak';
    patient_name: string | null;
    reason: string | null;
    reason_label: string | null;
    session_id: number | null;
    session_status: string | null;
    dialysis_started_at: string | null;
};

const stateClass: Record<ChairTile['state'], string> = {
    kosong: 'border-teal-700 bg-teal-950',
    digunakan: 'border-amber-700 bg-amber-950',
    rosak: 'border-rose-700 bg-rose-950',
};

const stateLabel: Record<ChairTile['state'], string> = {
    kosong: 'Kosong',
    digunakan: 'Digunakan',
    rosak: 'Tidak digunakan',
};

function formStatus(errors: object): string | undefined {
    if ('chair_number' in errors && typeof errors.chair_number === 'string') {
        return errors.chair_number;
    }

    if ('status' in errors && typeof errors.status === 'string') {
        return errors.status;
    }

    return undefined;
}

export default function ChairBoard({ chairs }: { chairs: ChairTile[] }) {
    const block = useForm({ chair_number: '', reason: 'ROSAK' });
    const restore = useForm({ chair_number: '' });

    function mark(number: string, reason: 'ROSAK' | 'TIDAK_SESUAI') {
        block.transform(() => ({ chair_number: number, reason }));
        block.post('/jururawat/kerusi/rosak', { preserveScroll: true });
    }

    function restoreChair(number: string) {
        restore.transform(() => ({ chair_number: number }));
        restore.post('/jururawat/kerusi/pulih', { preserveScroll: true });
    }

    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-2xl font-black">Papan kerusi</h2>
                <p className="text-base text-slate-200">
                    Bila satu sesi selesai, kerusi itu kosong untuk pesakit yang sampai dahulu, termasuk syif seterusnya. Panggilan automatik mengambil kerusi kosong yang pertama. Tandai kerusi rosak atau tidak sesuai jika ia tidak boleh digunakan.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {chairs.map((chair) => (
                    <article key={chair.number} className={`space-y-2 rounded-2xl border p-3 ${stateClass[chair.state]}`}>
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-2xl font-black">{chair.number}</p>
                            <p className="text-sm font-bold">{chair.reason_label ?? stateLabel[chair.state]}</p>
                        </div>
                        <p className="min-h-12 text-base">{chair.patient_name ?? (chair.state === 'kosong' ? 'Sedia untuk giliran seterusnya' : 'Dilepaskan daripada giliran automatik')}</p>
                        {chair.session_status === 'SEDANG_DIALISIS' && chair.dialysis_started_at ? (
                            <DialysisTimer startedAt={chair.dialysis_started_at} compact />
                        ) : null}
                        {chair.state === 'kosong' ? (
                            <div className="grid gap-2">
                                <button type="button" disabled={block.processing} onClick={() => mark(chair.number, 'ROSAK')} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-500 px-3 font-black text-slate-950">
                                    Tandai rosak
                                </button>
                                <button type="button" disabled={block.processing} onClick={() => mark(chair.number, 'TIDAK_SESUAI')} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-rose-400 px-3 font-black">
                                    Tidak sesuai
                                </button>
                            </div>
                        ) : null}
                        {chair.state === 'digunakan' && chair.session_status === 'SEDANG_DIALISIS' && chair.session_id ? (
                            <Link
                                href={`/jururawat/sesi?tapisan=SEDANG_DIALISIS&fokus=${chair.session_id}`}
                                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-500 px-3 text-center font-black text-slate-950"
                            >
                                Tamatkan sesi
                            </Link>
                        ) : null}
                        {chair.state === 'rosak' ? (
                            <button type="button" disabled={restore.processing} onClick={() => restoreChair(chair.number)} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-500 px-3 font-black text-slate-950">
                                Pulihkan
                            </button>
                        ) : null}
                    </article>
                ))}
            </div>
            <InputError message={formStatus(block.errors) ?? formStatus(restore.errors)} />
        </section>
    );
}
