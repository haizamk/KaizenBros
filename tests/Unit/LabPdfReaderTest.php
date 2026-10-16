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

    public function test_it_reads_a_column_style_lab_report_and_ignores_the_reference_range(): void
    {
        $parsed = (new LabPdfReader)->parseText(<<<'TEXT'
            Collection Date: 16 Oct 2026
            Haemoglobin                 10.8 g/dL      13.0 - 17.0
            Total White Cell Count      6.8 x10^9/L    4.0 - 11.0
            Platelet Count              198 x10^9/L    150 - 410
            Urea                        21.5 mmol/L    2.5 - 6.7
            Creatinine                  712 umol/L     60 - 110
            eGFR                        7 mL/min/1.73m2
            Potassium                   5.70 mmol/L    3.5 - 5.1
            Inorganic Phosphate         1.95 mmol/L
            Calcium                     2.15 mmol/L
            Sodium                      136 mmol/L
            Random Glucose              6.8 mmol/L
            Total Cholesterol           5.40 mmol/L    < 5.2
            HDL Cholesterol             0.90 mmol/L
            LDL Cholesterol             3.10 mmol/L
            Triglyceride                1.40 mmol/L
            TEXT);

        $this->assertSame('2026-10-16', $parsed['date']);
        $this->assertSame(15, $parsed['found']);
        $this->assertSame(10.8, $parsed['values']['hemoglobin']);
        $this->assertSame(6.8, $parsed['values']['wbc']);
        $this->assertSame(198.0, $parsed['values']['platelet']);
        $this->assertSame(712.0, $parsed['values']['creatinine']);
        $this->assertSame(7.0, $parsed['values']['egfr']);
        $this->assertSame(5.7, $parsed['values']['potassium']);
        $this->assertSame(1.95, $parsed['values']['phosphate']);
        $this->assertSame(0.9, $parsed['values']['hdl']);
        $this->assertSame(3.1, $parsed['values']['ldl']);
        $this->assertNull($parsed['values']['hba1c']);
    }

    public function test_a_reference_limit_without_a_result_stays_empty(): void
    {
        $parsed = (new LabPdfReader)->parseText('Total Cholesterol < 5.2 mmol/L');

        $this->assertSame(0, $parsed['found']);
        $this->assertNull($parsed['values']['cholesterol']);
        $this->assertTrue($parsed['has_text']);
    }

    public function test_prima_lab_ocr_text_reads_sample_date_name_and_flagged_results(): void
    {
        $parsed = (new LabPdfReader)->parseText(<<<'TEXT'
            Name : KHAIRUL HAIZAM BIN MD RADZI No.IC : 781129105503
            Test Selected : BMC19A Sample : 01/10/2026 15:00:12
            Haemoglobin EH L11.4 g/db (12.0 - 18.0)
            White Cell Count mae 5.5 1043/uL (4.0- 11.0)
            Platelet MUR 194 1043/uL (150-450)
            Glucose ste 5.6 mmol/L (3.9-6.0)
            Sodium A 2133 mmol/L (136-145)
            Potassium # HH6.1 mmol/L (3.5-5.1)
            Creatinine AU RET # 808 umol/L (59-116)
            Phosphate FAR H2.73 mmol/L (0.65 - 1.60 )
            Urea RR H17.4 mmol/L (2.8-8.1)
            TEXT);

        $this->assertSame('2026-10-01', $parsed['date']);
        $this->assertSame('KHAIRUL HAIZAM BIN MD RADZI', $parsed['patient_name']);
        $this->assertSame('781129105503', $parsed['patient_ic']);
        $this->assertSame(11.4, $parsed['values']['hemoglobin']);
        $this->assertSame(5.5, $parsed['values']['wbc']);
        $this->assertSame(194.0, $parsed['values']['platelet']);
        $this->assertSame(5.6, $parsed['values']['glucose']);
        $this->assertSame(133.0, $parsed['values']['sodium']);
        $this->assertSame(6.1, $parsed['values']['potassium']);
        $this->assertSame(808.0, $parsed['values']['creatinine']);
        $this->assertSame(2.73, $parsed['values']['phosphate']);
    }

    public function test_ocr_misread_haemoglobin_and_calcium_are_corrected(): void
    {
        $parsed = (new LabPdfReader)->parseText(<<<'TEXT'
            Sample : 09/04/2026 15:00:39
            Haemoglobin fila 111.8 e/db (12.0- 18.0)
            Calcium a 12.05 mmol/L (2.15 - 2.50)
            TEXT);

        $this->assertSame('2026-04-09', $parsed['date']);
        $this->assertSame(11.18, $parsed['values']['hemoglobin']);
        $this->assertEqualsWithDelta(2.05, $parsed['values']['calcium'], 0.001);
    }
}
