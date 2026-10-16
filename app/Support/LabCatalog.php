<?php

namespace App\Support;

use App\Models\MedicalRecord;

class LabCatalog
{
    /**
     * Fields follow the centre lab report. A missing PDF value stays null.
     *
     * @return array<string, array{name: string, unit: string, decimals: int, color: string, aliases: array<int, string>, units: array<int, string>}>
     */
    public static function fields(): array
    {
        return [
            'hemoglobin' => self::field('Hemoglobin', 'g/dL', 1, '#fbbf24', ['Hemoglobin (Hb)', 'Haemoglobin (Hb)', 'Hemoglobin', 'Haemoglobin'], ['g/dL']),
            'wbc' => self::field('Sel darah putih', '10^3/uL', 1, '#38bdf8', ['White Blood Cell (WBC)', 'White Blood Cell', 'WBC'], ['10^3/uL', '10^9/L']),
            'platelet' => self::field('Platelet', '10^3/uL', 0, '#fb7185', ['Platelet', 'Platelet Count'], ['10^3/uL', '10^9/L']),
            'urea' => self::field('Urea', 'mmol/L', 1, '#fb923c', ['Urea'], ['mmol/L']),
            'creatinine' => self::field('Kreatinin', 'µmol/L', 1, '#22d3ee', ['Creatinine', 'Kreatinin'], ['umol/L', 'µmol/L', 'umol/l']),
            'egfr' => self::field('eGFR', 'mL/min', 1, '#a3e635', ['eGFR (Fungsi Buah Pinggang)', 'eGFR'], ['mL/min', 'ml/min']),
            'potassium' => self::field('Kalium', 'mmol/L', 2, '#c084fc', ['Potassium (Kalium)', 'Potassium', 'Kalium'], ['mmol/L']),
            'phosphate' => self::field('Fosfat', 'mmol/L', 2, '#34d399', ['Phosphate (Fosfat)', 'Phosphate', 'Fosfat'], ['mmol/L']),
            'calcium' => self::field('Kalsium', 'mmol/L', 2, '#fde68a', ['Calcium (Kalsium)', 'Calcium', 'Kalsium'], ['mmol/L']),
            'sodium' => self::field('Natrium', 'mmol/L', 1, '#93c5fd', ['Sodium (Natrium)', 'Sodium', 'Natrium'], ['mmol/L']),
            'glucose' => self::field('Gula darah', 'mmol/L', 1, '#f9a8d4', ['Glucose (Gula Darah)', 'Glucose', 'Gula Darah'], ['mmol/L']),
            'hba1c' => self::field('HbA1c', '%', 1, '#f472b6', ['HbA1c'], ['%']),
            'cholesterol' => self::field('Kolesterol total', 'mmol/L', 2, '#fdba74', ['Total Cholesterol', 'Kolesterol Total'], ['mmol/L']),
            'ldl' => self::field('LDL', 'mmol/L', 2, '#f87171', ['LDL (Kolesterol Jahat)', 'LDL'], ['mmol/L']),
            'hdl' => self::field('HDL', 'mmol/L', 2, '#4ade80', ['HDL (Kolesterol Baik)', 'HDL'], ['mmol/L']),
            'triglycerides' => self::field('Trigliserida', 'mmol/L', 2, '#facc15', ['Triglycerides', 'Trigliserida'], ['mmol/L']),
        ];
    }

    /**
     * @return array<int, array{key: string, name: string, unit: string, value: string|null}>
     */
    public static function readings(MedicalRecord $record): array
    {
        $rows = [];

        foreach (self::fields() as $key => $meta) {
            $raw = $record->{$key};
            $rows[] = [
                'key' => $key,
                'name' => $meta['name'],
                'unit' => $meta['unit'],
                'value' => $raw === null ? null : number_format((float) $raw, $meta['decimals'], '.', ''),
            ];
        }

        return $rows;
    }

    /**
     * @return array<int, array{key: string, title: string, unit: string, color: string}>
     */
    public static function chartSeries(): array
    {
        $series = [];

        foreach (self::fields() as $key => $meta) {
            $series[] = [
                'key' => $key,
                'title' => $meta['name'],
                'unit' => $meta['unit'],
                'color' => $meta['color'],
            ];
        }

        return $series;
    }

    /**
     * @param  array<int, string>  $aliases
     * @param  array<int, string>  $units
     * @return array{name: string, unit: string, decimals: int, color: string, aliases: array<int, string>, units: array<int, string>}
     */
    private static function field(string $name, string $unit, int $decimals, string $color, array $aliases, array $units): array
    {
        return [
            'name' => $name,
            'unit' => $unit,
            'decimals' => $decimals,
            'color' => $color,
            'aliases' => $aliases,
            'units' => $units,
        ];
    }
}
