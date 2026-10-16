<?php

namespace Tests\Unit;

use App\Support\BloodReportAnalysis;
use PHPUnit\Framework\TestCase;

class BloodReportAnalysisTest extends TestCase
{
    public function test_high_potassium_is_called_out_and_expected_dialysis_waste_is_not_marked_high(): void
    {
        $analysis = BloodReportAnalysis::fromValues([
            'potassium' => 5.6,
            'urea' => 22.4,
            'creatinine' => 780,
        ], [
            'potassium' => 4.7,
        ]);

        $this->assertSame('TINGGI', $analysis['statuses']['potassium']);
        $this->assertSame('PERHATIAN', $analysis['statuses']['urea']);
        $this->assertSame('PERHATIAN', $analysis['statuses']['creatinine']);
        $this->assertArrayNotHasKey('phosphate', $analysis['statuses']);
        $this->assertTrue($analysis['has_high']);
        $this->assertSame('Naik daripada 4.70.', $analysis['changes']['potassium']);
        $this->assertStringStartsWith('Kalium tinggi.', $analysis['summary']);
        $this->assertStringContainsString('bukan diagnosis', $analysis['summary']);
        $this->assertStringNotContainsString('Urea tinggi', $analysis['summary']);

        $potassium = collect($analysis['items'])->firstWhere('key', 'potassium');
        $this->assertStringContainsString('Kalium tinggi', $potassium['sentence']);
        $this->assertStringContainsString('pisang', $potassium['tip']);
    }

    public function test_thresholds_follow_dialysis_ranges(): void
    {
        $analysis = BloodReportAnalysis::fromValues([
            'hemoglobin' => 9.4,
            'potassium' => 3.2,
            'phosphate' => 1.8,
            'urea' => 15,
            'creatinine' => 150,
        ]);

        $this->assertSame('RENDAH', $analysis['statuses']['hemoglobin']);
        $this->assertSame('RENDAH', $analysis['statuses']['potassium']);
        $this->assertSame('BIASA', $analysis['statuses']['phosphate']);
        $this->assertSame('BIASA', $analysis['statuses']['urea']);
        $this->assertSame('BIASA', $analysis['statuses']['creatinine']);

        $upper = BloodReportAnalysis::fromValues([
            'hemoglobin' => 13.1,
            'phosphate' => 1.81,
            'urea' => 30.1,
            'creatinine' => 1000.1,
        ]);

        $this->assertSame('TINGGI', $upper['statuses']['hemoglobin']);
        $this->assertSame('TINGGI', $upper['statuses']['phosphate']);
        $this->assertSame('TINGGI', $upper['statuses']['urea']);
        $this->assertSame('TINGGI', $upper['statuses']['creatinine']);
        $this->assertSame('Sama dengan 5.50.', BloodReportAnalysis::fromValues([
            'potassium' => 5.5,
        ], [
            'potassium' => 5.5,
        ])['changes']['potassium']);
    }
}
