import { Head } from '@inertiajs/react';
import { NursePage } from '@/components/nurse-nav';
import type { ShiftCounts } from '@/components/session-actions';

const stages = [
    { key: 'belum' as const, step: '1', title: 'Belum tiba', detail: 'Masukkan berat badan semasa daftar. Tekanan darah adalah pilihan.' },
    { key: 'menunggu' as const, step: '2', title: 'Menunggu panggilan', detail: 'Yang sampai dahulu dipanggil dulu. Kerusi automatik, atau pilih kerusi lain.' },
    { key: 'hadir' as const, step: '3', title: 'Di kerusi', detail: 'Pesakit sudah duduk. Tekan mula dialisis.' },
    { key: 'sedang' as const, step: '4', title: 'Sedang dialisis', detail: 'Rawatan aktif. Pemasa 4 jam berjalan.' },
    { key: 'selesai' as const, step: '5', title: 'Selesai', detail: 'Kerusi ini kosong semula untuk pesakit yang sampai dahulu.' },
];

export default function HariIni({
    counts,
    today,
    nurseName,
}: {
    counts: ShiftCounts;
    today: string;
    nurseName: string;
}) {
    return (
        <>
            <Head title="Hari ini" />
            <NursePage title={`Selamat datang, ${nurseName}`} intro={today}>
                <section className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-teal-300">Sistem giliran fleksibel, yang awal datang didahulukan</p>
                            <h2 className="text-2xl font-black">Papan giliran ketibaan hari ini</h2>
                        </div>
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
