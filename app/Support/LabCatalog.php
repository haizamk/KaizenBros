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
            'hemoglobin' => self::field('Hemoglobin', 'g/dL', 1, '#fbbf24', ['Hemoglobin (Hb)', 'Haemoglobin (Hb)', 'Hemoglobin', 'Haemoglobin', 'Hgb', 'Hb'], ['g/dL', 'gm/dL']),
            'wbc' => self::field('Sel darah putih', '10^3/uL', 1, '#38bdf8', ['Total White Cell Count', 'White Blood Cell (WBC)', 'White Cell Count', 'Total White Cell', 'White Blood Cell', 'Sel darah putih', 'TWBC', 'WBC'], ['10^3/uL', '10^9/L', 'x10^9/L', 'x10^3/uL']),
            'platelet' => self::field('Platelet', '10^3/uL', 0, '#fb7185', ['Platelet Count', 'Kiraan platelet', 'Platelet', 'Platelets', 'PLT'], ['10^3/uL', '10^9/L', 'x10^9/L', 'x10^3/uL']),
            'urea' => self::field('Urea', 'mmol/L', 1, '#fb923c', ['Urea'], ['mmol/L']),
            'creatinine' => self::field('Kreatinin', 'µmol/L', 1, '#22d3ee', ['Creatinine', 'Kreatinin'], ['umol/L', 'µmol/L', 'μmol/L']),
            'egfr' => self::field('eGFR', 'mL/min', 1, '#a3e635', ['eGFR (Fungsi Buah Pinggang)', 'Estimated GFR', 'Fungsi Buah Pinggang', 'eGFR'], ['mL/min/1.73m2', 'mL/min', 'ml/min']),
            'potassium' => self::field('Kalium', 'mmol/L', 2, '#c084fc', ['Potassium (Kalium)', 'Serum Potassium', 'Potassium', 'Kalium'], ['mmol/L']),
            'phosphate' => self::field('Fosfat', 'mmol/L', 2, '#34d399', ['Inorganic Phosphate', 'Phosphate (Fosfat)', 'Phosphate', 'Fosfat'], ['mmol/L']),
            'calcium' => self::field('Kalsium', 'mmol/L', 2, '#fde68a', ['Corrected Calcium', 'Calcium (Kalsium)', 'Serum Calcium', 'Calcium', 'Kalsium'], ['mmol/L']),
            'sodium' => self::field('Natrium', 'mmol/L', 1, '#93c5fd', ['Sodium (Natrium)', 'Serum Sodium', 'Sodium', 'Natrium'], ['mmol/L']),
            'glucose' => self::field('Gula darah', 'mmol/L', 1, '#f9a8d4', ['Fasting Blood Glucose', 'Random Glucose', 'Glucose (Gula Darah)', 'Glucose', 'Glukosa', 'Gula Darah'], ['mmol/L']),
            'hba1c' => self::field('HbA1c', '%', 1, '#f472b6', ['Glycated Haemoglobin', 'HbA1c'], ['%']),
            'cholesterol' => self::field('Kolesterol total', 'mmol/L', 2, '#fdba74', ['Total Cholesterol', 'Kolesterol Total'], ['mmol/L']),
            'ldl' => self::field('LDL', 'mmol/L', 2, '#f87171', ['LDL Cholesterol', 'LDL-Cholesterol', 'LDL (Kolesterol Jahat)', 'LDL'], ['mmol/L']),
            'hdl' => self::field('HDL', 'mmol/L', 2, '#4ade80', ['HDL Cholesterol', 'HDL-Cholesterol', 'HDL (Kolesterol Baik)', 'HDL'], ['mmol/L']),
            'triglycerides' => self::field('Trigliserida', 'mmol/L', 2, '#facc15', ['Triglycerides', 'Triglyceride', 'Trigliserida'], ['mmol/L']),
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
