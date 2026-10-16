<?php

namespace Tests\Support;

use Illuminate\Http\UploadedFile;

class LabPdfFixture
{
    public static function file(string $name, string $body): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, self::document($body));
    }

    public static function document(string $body): string
    {
        $operations = "BT /F1 12 Tf 50 760 Td\n";
        $lines = preg_split("/\r\n|\n|\r/", trim($body)) ?: [];

        foreach ($lines as $index => $line) {
            if ($index > 0) {
                $operations .= "0 -16 Td\n";
            }

            $operations .= '('.self::escape($line).") Tj\n";
        }

        $operations .= 'ET';
        $length = strlen($operations);
        $objects = [
            "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
            "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
            "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
            "4 0 obj << /Length {$length} >> stream\n{$operations}\nendstream endobj\n",
            "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object;
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 6\n0000000000 65535 f \n";

        for ($index = 1; $index <= 5; $index++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$index]);
        }

        return $pdf."trailer << /Size 6 /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }

    private static function escape(string $text): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
    }
}
