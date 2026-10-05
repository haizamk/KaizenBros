'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-950 text-rose-300 border border-rose-600 flex items-center justify-center text-2xl font-black mb-2">
        !
      </div>
      <h2 className="text-3xl font-black text-rose-400">Ralat Sistem Dikesan</h2>
      <p className="text-slate-300 max-w-md text-sm leading-relaxed">
        Sistem menghadapi masalah memuatkan halaman. Sila klik butang di bawah untuk memuat semula.
      </p>
      <button
        onClick={() => reset()}
        className="mt-4 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl cursor-pointer transition-all"
      >
        Muat Semula Halaman
      </button>
    </div>
  );
}
