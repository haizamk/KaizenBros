<?php

namespace Tests\Unit;

use App\Support\LabPdfReader;
use PHPUnit\Framework\TestCase;

class LabPdfReaderTest extends TestCase
{
    public function test_it_reads_only_values_that_are_printed_with_a_unit(): void
    {
        $parsed = (new LabPdfReader)->parseText(<<<'TEXT'
            Tarikh Ujian: 01/09/2026
            Hemoglobin (Hb) 11,2 g/dL
            White Blood Cell (WBC) 7.4 10^3/uL
            Platelet 210 10^3/uL
            Urea 18.4 mmol/L
            Creatinine 640 umol/L
            eGFR (Fungsi Buah Pinggang) 8 mL/min
            Potassium (Kalium) 5.8 mmol/L
            Phosphate (Fosfat) 1.90 mmol/L
            Calcium (Kalsium) 2.20 mmol/L
            Sodium (Natrium) 138 mmol/L
            Glucose (Gula Darah) 6.1 mmol/L
            HbA1c 6.4 %
            Total Cholesterol 4.80 mmol/L
            LDL (Kolesterol Jahat) 2.40 mmol/L
            HDL (Kolesterol Baik) 1.20 mmol/L
            Triglycerides 1.50 mmol/L
            TEXT);

        $this->assertSame('2026-09-01', $parsed['date']);
        $this->assertSame(16, $parsed['found']);
        $this->assertSame(11.2, $parsed['values']['hemoglobin']);
        $this->assertSame(7.4, $parsed['values']['wbc']);
        $this->assertSame(210.0, $parsed['values']['platelet']);
        $this->assertSame(5.8, $parsed['values']['potassium']);
        $this->assertSame(8.0, $parsed['values']['egfr']);
        $this->assertSame(1.2, $parsed['values']['hdl']);
    }

    public function test_a_missing_result_stays_empty_and_no_date_is_invented(): void
    {
        $parsed = (new LabPdfReader)->parseText(<<<'TEXT'
            Hemoglobin (Hb) 10.4 g/dL
            Potassium (Kalium) 5.6 mmol/L
            Hemoglobin susulan tanpa unit 12.0
            WBC 9.1
            TEXT);

        $this->assertNull($parsed['date']);
        $this->assertSame(2, $parsed['found']);
        $this->assertSame(10.4, $parsed['values']['hemoglobin']);
        $this->assertSame(5.6, $parsed['values']['potassium']);
        $this->assertNull($parsed['values']['wbc']);
        $this->assertNull($parsed['values']['phosphate']);
        $this->assertNull($parsed['values']['urea']);
        $this->assertNull($parsed['values']['creatinine']);
    }

    public function test_an_impossible_printed_date_is_ignored(): void
    {
        $parsed = (new LabPdfReader)->parseText('Tarikh Ujian: 32/13/2026 Hemoglobin (Hb) 11.0 g/dL');

        $this->assertNull($parsed['date']);
        $this->assertSame(11.0, $parsed['values']['hemoglobin']);
    }
}
