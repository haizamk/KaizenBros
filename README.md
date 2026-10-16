# KaizenBros Dialisis

Sistem pengurusan pusat dialisis KaizenBros, fasa pembangunan baharu. Aplikasi ini menggunakan Laravel 13, React, TypeScript, Inertia.js, Tailwind CSS, dan MariaDB. Data demo disemai semula. Firebase tidak digunakan.

Fasa ini merangkumi laman awam, permohonan pesakit baru, log masuk berperanan, papan sesi jururawat, rekod darah, carta berat dan tekanan darah, pautan peringatan WhatsApp, portal pesakit, dan senarai pentadbir. Halaman depan ada paparan gelap (lalai) dan cerah, empat saiz teks dengan lalai sederhana, peta Google pusat di Semenyih, dan banner promosi pesakit baru, van percuma, serta jawatan jururawat. Borang pesakit baru mengira umur dan jantina daripada nombor kad pengenalan, menerima salinan kad pengenalan, surat doktor, dan dokumen lain, kemudian menghantar permohonan kepada pentadbir untuk diluluskan atau ditolak. Pemasangan VPS belum dibuat.

Dokumen pesakit (PDF dan gambar) disimpan dalam folder peribadi `storage/app/patient-documents`. Laporan darah PDF, paling besar 100 MB, disimpan dalam `storage/app/medical-reports/pesakit/{id}` dan tidak dipadam. Kedua-dua folder tidak dibuka dari internet. Muat turun hanya melalui portal yang dibenarkan. Sistem membaca nombor yang tercetak dalam PDF. Nilai yang tiada dikosongkan dan tiada angka diandaikan. Analisa serta tip dikira di pelayan daripada nombor yang ada sahaja. Doktor nefrologi menulis analisa khas secara berasingan. Fail tidak dihantar ke perkhidmatan luar. Analisa automatik itu bukan diagnosis. Halaman pesakit memaparkan graf setiap bacaan yang ada, untuk 6, 12, 24 bulan, dan sepanjang masa.

## Jalankan secara tempatan

Perlu PHP 8.3, Composer, Node.js 20, dan MariaDB.

```bash
composer install
npm install
npm run build
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8421
```

Buka http://127.0.0.1:8421

`DB_*` dalam `.env.example` ialah tetapan pembangunan tempatan. Tukar kata laluan pangkalan data sebelum sebarang pelayan sebenar.

## Akaun demo

Akaun ini hanya untuk pembangunan.

| Peranan | Emel | Kata laluan |
| --- | --- | --- |
| Jururawat | nurse@kaizenbros.com.my | Nurse@2026 |
| Pentadbir | admin@kaizenbros.com.my | Admin@2026 |
| Pesakit | tan.ahkow@demo.kaizenbros.my | Pesakit@2026 |

Pesakit log masuk dengan nombor telefon, nombor pesakit, atau nombor kad pengenalan. Jururawat log masuk dengan emel, nombor telefon, atau nombor kad pengenalan. Pentadbir yang meluluskan permohonan menetapkan kata laluan awal dan nombor pesakit. Arahan `php artisan clinic:clear-patients` mengosongkan data pesakit dan mengekalkan akaun jururawat serta pentadbir. Portal pesakit dipecahkan kepada sesi, jadual, ubat, timbang, rekod dialisis, dan rekod darah. Graf darah boleh dibanding selama 6, 12, 24 bulan, dan sepanjang masa. Graf berat serta tekanan darah boleh dibanding selama 6, 12, atau 24 bulan. Berat dan tekanan darah, termasuk bacaan semasa dialisis, hanya direkodkan oleh jururawat atau pentadbir. Jururawat boleh daftar masuk, mula, dan tamat sesi, serta menyimpan rekod darah. Butang WhatsApp hanya membuka perbualan. Ia tidak menghantar mesej sendiri. Pesakit hanya melihat rekod sendiri.

## Ujian

```bash
php artisan test
```
