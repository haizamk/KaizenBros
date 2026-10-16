# KaizenBros Dialisis

Sistem pengurusan pusat dialisis KaizenBros, fasa pembangunan baharu. Aplikasi ini menggunakan Laravel 13, React, TypeScript, Inertia.js, Tailwind CSS, dan MariaDB. Data demo disemai semula. Firebase tidak digunakan.

Fasa ini merangkumi laman awam, permohonan pesakit baru, log masuk berperanan, papan sesi jururawat, rekod darah, carta berat dan tekanan darah, pautan peringatan WhatsApp, portal pesakit, dan senarai pentadbir. Halaman depan ada paparan gelap (lalai) dan cerah, empat saiz teks dengan lalai sederhana, peta Google pusat di Semenyih, dan banner promosi pesakit baru, van percuma, serta jawatan jururawat. Borang pesakit baru mengira umur dan jantina daripada nombor kad pengenalan, kemudian menghantar permohonan kepada pentadbir untuk diluluskan atau ditolak. Pemasangan VPS belum dibuat.

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

Pesakit demo Tan Ah Kow mempunyai sesi hari ini, sejarah berat dan tekanan darah, dua keputusan darah, dan dua ubat aktif. Jururawat boleh daftar masuk, mula, dan tamat sesi, serta menyimpan rekod darah. Butang WhatsApp hanya membuka perbualan. Ia tidak menghantar mesej sendiri. Pesakit hanya melihat rekod sendiri.

## Ujian

```bash
php artisan test
```
