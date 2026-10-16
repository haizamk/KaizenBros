<?php

namespace App\Support;

use Illuminate\Support\Facades\File;
use Throwable;

class LabPdfOcr
{
    public function available(): bool
    {
        if (! config('kaizenbros.lab_pdf_ocr.enabled')) {
            return false;
        }

        return LabPdfProcess::allowed()
            && is_executable((string) config('kaizenbros.lab_pdf_ocr.pdftoppm'))
            && is_executable((string) config('kaizenbros.lab_pdf_ocr.tesseract'));
    }

    public function extract(string $pdfPath): string
    {
        if (! $this->available() || $pdfPath === '' || ! is_file($pdfPath)) {
            return '';
        }

        $directory = $this->makeTempDirectory();

        if ($directory === null) {
            return '';
        }

        $prefix = $directory.'/page';

        try {
            $render = LabPdfProcess::runner((int) config('kaizenbros.lab_pdf_ocr.timeout_seconds'))->run([
                (string) config('kaizenbros.lab_pdf_ocr.pdftoppm'),
                '-png',
                '-r',
                (string) config('kaizenbros.lab_pdf_ocr.dpi'),
                '-f',
                '1',
                '-l',
                (string) config('kaizenbros.lab_pdf_ocr.max_pages'),
                $pdfPath,
                $prefix,
            ]);

            if (! $render->successful()) {
                return '';
            }

            $pages = glob($prefix.'-*.png') ?: [];
            natsort($pages);
            $chunks = [];

            foreach ($pages as $page) {
                $ocr = LabPdfProcess::runner(60)->run([
                    (string) config('kaizenbros.lab_pdf_ocr.tesseract'),
                    $page,
                    'stdout',
                    '-l',
                    (string) config('kaizenbros.lab_pdf_ocr.language'),
                    '--psm',
                    '6',
                ]);

                if ($ocr->successful()) {
                    $chunks[] = trim($ocr->output());
                }
            }

            return trim(implode("\n\n", $chunks));
        } catch (Throwable) {
            return '';
        } finally {
            File::deleteDirectory($directory);
        }
    }

    private function makeTempDirectory(): ?string
    {
        $base = rtrim(sys_get_temp_dir(), '/').'/kb-lab-ocr-'.bin2hex(random_bytes(8));

        if (! @mkdir($base, 0700, true) && ! is_dir($base)) {
            return null;
        }

        return $base;
    }
}
