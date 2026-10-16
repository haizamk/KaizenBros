<?php

namespace App\Support;

use App\Models\MedicalRecord;
use Illuminate\Support\Collection;

class BloodReportAnalysis
{
    /**
     * @param  array<string, float|null>  $values
     * @param  array<string, float|null>  $previous
     * @return array<string, mixed>
     */
    public static function fromValues(array $values, array $previous = []): array
    {
        $items = [];

        foreach (LabCatalog::fields() as $key => $meta) {
            $value = $values[$key] ?? null;

            if ($value === null) {
                continue;
            }

            $status = self::status($key, $value);
            $prior = $previous[$key] ?? null;
            $items[] = [
                'key' => $key,
                'name' => $meta['name'],
                'value' => self::format($value, $meta['decimals']),
                'unit' => $meta['unit'],
                'status' => $status,
                'status_label' => self::statusLabel($status),
                'sentence' => self::sentence($key, $status),
                'tip' => self::tip($key, $status),
                'change' => $prior === null ? null : self::change($value, $prior, $meta['decimals']),
            ];
        }

        usort($items, fn (array $left, array $right): int => self::rank($left['status']) <=> self::rank($right['status']));

        $statuses = [];
        $changes = [];

        foreach ($items as $item) {
            $statuses[$item['key']] = $item['status'];

            if ($item['change'] !== null) {
                $changes[$item['key']] = $item['change'];
            }
        }

        $high = array_values(array_map(
            fn (array $item): string => $item['name'],
            array_filter($items, fn (array $item): bool => $item['status'] === 'TINGGI'),
        ));
        $watch = array_values(array_map(
            fn (array $item): string => $item['name'],
            array_filter($items, fn (array $item): bool => in_array($item['status'], ['RENDAH', 'PERHATIAN'], true)),
        ));

        return [
            'items' => $items,
            'statuses' => $statuses,
            'changes' => $changes,
            'has_high' => $high !== [],
            'summary' => self::summary($items, $high, $watch),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function forRecord(MedicalRecord $record, ?MedicalRecord $previous = null): array
    {
        $values = [];
        $prior = [];

        foreach (array_keys(LabCatalog::fields()) as $field) {
            $values[$field] = $record->{$field} === null ? null : (float) $record->{$field};
            $prior[$field] = $previous?->{$field} === null ? null : (float) $previous->{$field};
        }

        return self::fromValues($values, $prior);
    }

    /**
     * @param  Collection<int, MedicalRecord>  $records
     * @return Collection<int, array<string, mixed>>
     */
    public static function present(Collection $records): Collection
    {
        /** @var array<int, MedicalRecord> $previous */
        $previous = [];

        return $records
            ->sortBy(fn (MedicalRecord $record): string => $record->examination_date->toDateString().'-'.str_pad((string) $record->id, 8, '0', STR_PAD_LEFT))
            ->map(function (MedicalRecord $record) use (&$previous): array {
                $prior = $previous[$record->patient_id] ?? null;
                $row = $record->toPortalArray();
                $row['readings'] = LabCatalog::readings($record);
                $row['analysis'] = self::forRecord($record, $prior);
                $previous[$record->patient_id] = $record;

                return $row;
            })
            ->reverse()
            ->values();
    }

    private static function status(string $key, float $value): string
    {
        return match ($key) {
            'hemoglobin' => match (true) {
                $value < 10 => 'RENDAH',
                $value < 11 => 'PERHATIAN',
                $value > 13 => 'TINGGI',
                default => 'BIASA',
            },
            'potassium' => match (true) {
                $value >= 5.5 => 'TINGGI',
                $value < 3.5 => 'RENDAH',
                default => 'BIASA',
            },
            'phosphate' => match (true) {
                $value > 1.8 => 'TINGGI',
                $value < 0.8 => 'RENDAH',
                default => 'BIASA',
            },
            'urea' => match (true) {
                $value > 30 => 'TINGGI',
                $value > 15 => 'PERHATIAN',
                default => 'BIASA',
            },
            'creatinine' => match (true) {
                $value > 1000 => 'TINGGI',
                $value > 150 => 'PERHATIAN',
                default => 'BIASA',
            },
            'wbc' => match (true) {
                $value < 4 => 'RENDAH',
                $value > 11 => 'TINGGI',
                default => 'BIASA',
            },
            'platelet' => match (true) {
                $value < 150 => 'RENDAH',
                $value > 400 => 'TINGGI',
                default => 'BIASA',
            },
            'egfr' => $value < 15 ? 'PERHATIAN' : 'BIASA',
            'calcium' => match (true) {
                $value < 2.1 => 'RENDAH',
                $value > 2.6 => 'TINGGI',
                default => 'BIASA',
            },
            'sodium' => match (true) {
                $value < 135 => 'RENDAH',
                $value > 145 => 'TINGGI',
                default => 'BIASA',
            },
            'glucose' => match (true) {
                $value < 3.9 => 'RENDAH',
                $value > 11 => 'TINGGI',
                $value > 7 => 'PERHATIAN',
                default => 'BIASA',
            },
            'hba1c' => match (true) {
                $value >= 9 => 'TINGGI',
                $value >= 7 => 'PERHATIAN',
                default => 'BIASA',
            },
            'cholesterol' => $value > 5.2 ? 'TINGGI' : 'BIASA',
            'ldl' => $value > 2.6 ? 'TINGGI' : 'BIASA',
            'hdl' => $value < 1 ? 'RENDAH' : 'BIASA',
            'triglycerides' => $value > 1.7 ? 'TINGGI' : 'BIASA',
            default => 'BIASA',
        };
    }

    private static function tip(string $key, string $status): string
    {
        if ($status === 'BIASA') {
            return 'Teruskan rutin dialisis, ubat, dan pemakanan seperti yang dinasihatkan.';
        }

        return match ($key) {
            'potassium' => 'Hadkan pisang, oren, kentang, dan air kelapa sehingga doktor menyemak semula. Jangan ubah ubat sendiri.',
            'phosphate' => 'Ambil ubat pengikat fosfat bersama makanan jika ia telah dipreskripsi, dan kurangkan minuman berkarbonat.',
            'hemoglobin' => 'Rehat jika letih. Maklumkan jururawat jika sesak nafas, pening, atau berdebar.',
            'sodium' => 'Kurangkan garam dan makanan diproses. Jangan tambah garam di meja.',
            'calcium' => 'Jangan tambah suplemen kalsium tanpa nasihat doktor.',
            'glucose', 'hba1c' => 'Catat makanan bergula dan bincang bacaan ini semasa rawatan seterusnya.',
            'cholesterol', 'ldl', 'hdl', 'triglycerides' => 'Pilih makanan yang kurang bergoreng dan bincang ubat kolesterol dengan doktor.',
            'wbc' => 'Maklumkan jika demam, batuk, atau luka di akses dialisis.',
            'platelet' => 'Berhati-hati dengan lebam atau pendarahan yang lambat berhenti.',
            'egfr' => 'Bacaan fungsi buah pinggang yang rendah adalah biasa bagi pesakit dialisis. Doktor yang menilainya.',
            'urea', 'creatinine' => 'Jangan langkau sesi dialisis. Sisa ini dibersihkan semasa rawatan.',
            default => 'Bincang bacaan ini dengan jururawat pada sesi yang seterusnya.',
        };
    }

    private static function sentence(string $key, string $status): string
    {
        return match ($key.'.'.$status) {
            'hemoglobin.RENDAH' => 'Hemoglobin rendah. Pesakit mungkin berasa letih dan kurang bertenaga.',
            'hemoglobin.PERHATIAN' => 'Hemoglobin sedikit rendah. Nilai ini perlu dipantau.',
            'hemoglobin.TINGGI' => 'Hemoglobin tinggi daripada julat biasa untuk pesakit dialisis.',
            'hemoglobin.BIASA' => 'Hemoglobin berada dalam julat yang dipantau.',
            'potassium.TINGGI' => 'Kalium tinggi. Nilai ini boleh membahayakan jantung.',
            'potassium.RENDAH' => 'Kalium rendah. Otot dan jantung perlu dipantau.',
            'potassium.BIASA' => 'Kalium berada dalam julat yang dipantau.',
            'phosphate.TINGGI' => 'Fosfat tinggi. Nilai ini boleh menyebabkan gatal dan menjejaskan tulang.',
            'phosphate.RENDAH' => 'Fosfat rendah. Pemakanan dan ubat pengikat fosfat perlu disemak.',
            'phosphate.BIASA' => 'Fosfat berada dalam julat yang dipantau.',
            'urea.TINGGI' => 'Urea sangat tinggi. Sisa dalam darah ini perlu perhatian segera.',
            'urea.PERHATIAN' => 'Urea meningkat. Nilai ini biasa sebelum dialisis, tetapi tetap perlu dipantau.',
            'urea.BIASA' => 'Urea berada dalam julat yang dipantau.',
            'creatinine.TINGGI' => 'Kreatinin sangat tinggi. Nilai ini perlu perhatian doktor.',
            'creatinine.PERHATIAN' => 'Kreatinin tinggi. Ini biasa bagi pesakit dialisis.',
            'creatinine.BIASA' => 'Kreatinin berada dalam julat yang dipantau.',
            'wbc.TINGGI' => 'Sel darah putih tinggi. Ini boleh menandakan jangkitan.',
            'wbc.RENDAH' => 'Sel darah putih rendah. Badan mungkin kurang mampu melawan jangkitan.',
            'wbc.BIASA' => 'Sel darah putih berada dalam julat yang dipantau.',
            'platelet.TINGGI' => 'Platelet tinggi. Pembekuan darah perlu dipantau.',
            'platelet.RENDAH' => 'Platelet rendah. Risiko lebam atau pendarahan lebih tinggi.',
            'platelet.BIASA' => 'Platelet berada dalam julat yang dipantau.',
            'egfr.PERHATIAN' => 'Fungsi buah pinggang rendah. Ini dijangka bagi pesakit dialisis dan dinilai oleh doktor.',
            'egfr.BIASA' => 'eGFR berada dalam julat yang dipantau.',
            'calcium.TINGGI' => 'Kalsium tinggi. Jangan tambah suplemen tanpa nasihat doktor.',
            'calcium.RENDAH' => 'Kalsium rendah. Tulang dan otot perlu dipantau.',
            'calcium.BIASA' => 'Kalsium berada dalam julat yang dipantau.',
            'sodium.TINGGI' => 'Natrium tinggi. Garam dan dahaga perlu dipantau.',
            'sodium.RENDAH' => 'Natrium rendah. Minuman dan garam perlu disemak.',
            'sodium.BIASA' => 'Natrium berada dalam julat yang dipantau.',
            'glucose.TINGGI' => 'Gula darah tinggi. Bacaan ini perlu perhatian.',
            'glucose.PERHATIAN' => 'Gula darah meningkat. Catat pemakanan dan bincang semasa rawatan.',
            'glucose.RENDAH' => 'Gula darah rendah. Ambil perhatian jika berpeluh, menggigil, atau pening.',
            'glucose.BIASA' => 'Gula darah berada dalam julat yang dipantau.',
            'hba1c.TINGGI' => 'HbA1c tinggi. Kawalan gula dalam beberapa bulan lalu perlu disemak.',
            'hba1c.PERHATIAN' => 'HbA1c meningkat. Kawalan gula perlu dipantau.',
            'hba1c.BIASA' => 'HbA1c berada dalam julat yang dipantau.',
            'cholesterol.TINGGI' => 'Kolesterol total tinggi.',
            'cholesterol.BIASA' => 'Kolesterol total berada dalam julat yang dipantau.',
            'ldl.TINGGI' => 'LDL tinggi. Kolesterol jahat ini perlu dipantau.',
            'ldl.BIASA' => 'LDL berada dalam julat yang dipantau.',
            'hdl.RENDAH' => 'HDL rendah. Kolesterol baik ini kurang daripada julat yang dipantau.',
            'hdl.BIASA' => 'HDL berada dalam julat yang dipantau.',
            'triglycerides.TINGGI' => 'Trigliserida tinggi.',
            'triglycerides.BIASA' => 'Trigliserida berada dalam julat yang dipantau.',
            default => 'Bacaan ini perlu disemak oleh kakitangan.',
        };
    }

    private static function change(float $current, float $previous, int $decimals): string
    {
        $currentText = self::format($current, $decimals);
        $previousText = self::format($previous, $decimals);

        if ($currentText === $previousText) {
            return 'Sama dengan '.$previousText.'.';
        }

        return ($current > $previous ? 'Naik daripada ' : 'Turun daripada ').$previousText.'.';
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @param  array<int, string>  $high
     * @param  array<int, string>  $watch
     */
    private static function summary(array $items, array $high, array $watch): string
    {
        $disclaimer = 'Analisa ini bukan diagnosis. Ia membaca nombor yang ada sahaja. Nilai yang tiada dalam PDF dibiarkan kosong.';

        if ($items === []) {
            return 'Tiada nombor untuk dianalisa. '.$disclaimer;
        }

        if ($high !== []) {
            $text = self::joinNames($high).' tinggi. ';

            if ($watch !== []) {
                $text .= 'Beberapa bacaan lain perlu dipantau. ';
            }

            return $text.$disclaimer;
        }

        if ($watch !== []) {
            return 'Tiada bacaan yang sangat tinggi. '.self::joinNames($watch).' perlu dipantau. '.$disclaimer;
        }

        return 'Semua bacaan yang dimasukkan berada dalam julat yang dipantau. '.$disclaimer;
    }

    /**
     * @param  array<int, string>  $names
     */
    private static function joinNames(array $names): string
    {
        if (count($names) === 1) {
            return $names[0];
        }

        $last = array_pop($names);

        return implode(', ', $names).' dan '.$last;
    }

    private static function format(float $value, int $decimals): string
    {
        return number_format($value, $decimals, '.', '');
    }

    private static function statusLabel(string $status): string
    {
        return match ($status) {
            'TINGGI' => 'Tinggi',
            'RENDAH' => 'Rendah',
            'PERHATIAN' => 'Perlu pantau',
            default => 'Biasa',
        };
    }

    private static function rank(string $status): int
    {
        return match ($status) {
            'TINGGI' => 0,
            'RENDAH' => 1,
            'PERHATIAN' => 2,
            default => 3,
        };
    }
}
