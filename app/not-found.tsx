import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-950 text-amber-300 border border-amber-600 flex items-center justify-center text-2xl font-black mb-2">
        404
      </div>
      <h2 className="text-3xl font-black text-white">Halaman Tidak Ditemui</h2>
      <p className="text-slate-300 max-w-md text-sm leading-relaxed">
        Halaman yang anda cari tidak wujud atau telah dipindahkan. Sila kembali ke papan pemuka utama Pusat Dialisis KaizenBros.
      </p>
      <Link
        href="/"
        className="mt-4 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl transition-all cursor-pointer"
      >
        Kembali ke Halaman Utama
      </Link>
    </div>
  );
}
