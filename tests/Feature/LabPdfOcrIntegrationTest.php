<?php

namespace Tests\Feature;

use App\Support\LabPdfOcr;
use App\Support\LabPdfReader;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class LabPdfOcrIntegrationTest extends TestCase
{
    public function test_camscanner_prima_lab_pdf_can_be_read_when_ocr_tools_exist(): void
    {
        $fixture = '/home/ubuntu/.cursor/projects/workspace/uploads/report_darah_October_2026_407d.pdf';

        if (! is_file($fixture) || ! (new LabPdfOcr)->available()) {
            $this->markTestSkipped('OCR fixture or tesseract is unavailable.');
        }

        $parsed = (new LabPdfReader)->read(
            new UploadedFile($fixture, 'report darah October 2026.pdf', 'application/pdf', null, true),
        );

        $this->assertGreaterThanOrEqual(8, $parsed['found']);
        $this->assertSame('ocr', $parsed['read_method']);
        $this->assertSame('2026-10-01', $parsed['date']);
        $this->assertSame(6.1, $parsed['values']['potassium']);
        $this->assertSame(808.0, $parsed['values']['creatinine']);
    }
}
