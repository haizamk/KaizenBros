<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Smalot\PdfParser\Parser;
use Throwable;

class LabPdfReader
{
    public function __construct(
        private LabPdfOcr $ocr = new LabPdfOcr,
    ) {}

    /**
     * @return array{
     *     values: array<string, float|null>,
     *     date: string|null,
     *     found: int,
     *     has_text: bool,
     *     patient_name: string|null,
     *     patient_ic: string|null,
     *     read_method: 'text'|'ocr',
     *     ocr_attempted: bool,
     *     ocr_available: bool
     * }
     */
    public function read(UploadedFile $file): array
    {
        $path = $file->getRealPath() ?: '';
        $candidates = [
            $this->withMethod($this->parseText($this->smalotText($path)), 'text'),
            $this->withMethod($this->parseText($this->popplerText($path)), 'text'),
        ];

        $best = $this->pickBest(...$candidates);
        $ocrAvailable = $this->ocr->available();

        if ($best['found'] === 0 && $ocrAvailable) {
            $ocrText = $this->ocr->extract($path);
            $ocrParsed = $this->withMethod($this->parseText($ocrText), 'ocr');
            $ocrParsed['ocr_attempted'] = true;
            $best = $this->pickBest($best, $ocrParsed);
        }

        $best['ocr_available'] = $ocrAvailable;
        $best['ocr_attempted'] = $best['ocr_attempted'] || ($best['found'] === 0 && $ocrAvailable);

        return $best;
    }

    /**
     * @return array{
     *     values: array<string, float|null>,
     *     date: string|null,
     *     found: int,
     *     has_text: bool,
     *     patient_name: string|null,
     *     patient_ic: string|null,
     *     read_method: 'text'|'ocr',
     *     ocr_attempted: bool,
     *     ocr_available: bool
     * }
     */
    public function parseText(string $text): array
    {
        $lines = preg_split('/\R/u', $text) ?: [];
        $flat = $this->normalize($text);
        $values = [];
        $found = 0;

        foreach (LabCatalog::fields() as $key => $meta) {
            $value = $this->findInLines($lines, $meta['aliases'], $meta['units'])
                ?? $this->findValue($flat, $meta['aliases'], $meta['units']);
            $value = $this->sanitizeValue($key, $value);
            $values[$key] = $value;

            if ($value !== null) {
                $found++;
            }
        }

        return [
            'values' => $values,
            'date' => $this->findDate($flat),
            'found' => $found,
            'has_text' => $flat !== '',
            'patient_name' => $this->findPatientName($flat),
            'patient_ic' => $this->findPatientIc($flat),
            'read_method' => 'text',
            'ocr_attempted' => false,
            'ocr_available' => false,
        ];
    }

    /**
     * @param  array{
     *     values: array<string, float|null>,
     *     date: string|null,
     *     found: int,
     *     has_text: bool,
     *     patient_name: string|null,
     *     patient_ic: string|null,
     *     read_method: 'text'|'ocr',
     *     ocr_attempted: bool,
     *     ocr_available: bool
     * }  $parsed
     * @return array{
     *     values: array<string, float|null>,
     *     date: string|null,
     *     found: int,
     *     has_text: bool,
     *     patient_name: string|null,
     *     patient_ic: string|null,
     *     read_method: 'text'|'ocr',
     *     ocr_attempted: bool,
     *     ocr_available: bool
     * }
     */
    private function withMethod(array $parsed, string $method): array
    {
        $parsed['read_method'] = $method;

        return $parsed;
    }

    /**
     * @param  array{
     *     values: array<string, float|null>,
     *     date: string|null,
     *     found: int,
     *     has_text: bool,
     *     patient_name: string|null,
     *     patient_ic: string|null,
     *     read_method: 'text'|'ocr',
     *     ocr_attempted: bool,
     *     ocr_available: bool
     * }  ...$candidates
     * @return array{
     *     values: array<string, float|null>,
     *     date: string|null,
     *     found: int,
     *     has_text: bool,
     *     patient_name: string|null,
     *     patient_ic: string|null,
     *     read_method: 'text'|'ocr',
     *     ocr_attempted: bool,
     *     ocr_available: bool
     * }
     */
    private function pickBest(array ...$candidates): array
    {
        usort($candidates, function (array $left, array $right): int {
            if ($left['found'] !== $right['found']) {
                return $right['found'] <=> $left['found'];
            }

            $leftDate = $left['date'] !== null ? 1 : 0;
            $rightDate = $right['date'] !== null ? 1 : 0;

            if ($leftDate !== $rightDate) {
                return $rightDate <=> $leftDate;
            }

            return 0;
        });

        return $candidates[0];
    }

    /**
     * @param  array<int, string>  $lines
     * @param  array<int, string>  $aliases
     * @param  array<int, string>  $units
     */
    private function findInLines(array $lines, array $aliases, array $units): ?float
    {
        foreach ($lines as $index => $line) {
            $normalized = $this->normalize($line);

            if (! $this->containsAlias($normalized, $aliases)) {
                continue;
            }

            $value = $this->findValue($normalized, $aliases, $units);

            if ($value !== null) {
                return $value;
            }

            $next = $lines[$index + 1] ?? null;

            if (is_string($next) && preg_match('/^\s*[0-9LH]/', $next) === 1) {
                $value = $this->findValue($this->normalize($line.' '.$next), $aliases, $units);

                if ($value !== null) {
                    return $value;
                }
            }
        }

        return null;
    }

    /**
     * @param  array<int, string>  $aliases
     * @param  array<int, string>  $units
     */
    private function findValue(string $text, array $aliases, array $units): ?float
    {
        $unitPattern = implode('|', array_map(
            fn (string $unit): string => preg_quote($this->normalize($unit), '/'),
            $units,
        ));

        usort($aliases, fn (string $left, string $right): int => strlen($right) <=> strlen($left));

        foreach ($aliases as $alias) {
            $aliasPattern = '/(?<![A-Za-z0-9])'.preg_quote($this->normalize($alias), '/').'(?![A-Za-z0-9])/iu';

            if (preg_match($aliasPattern, $text, $match, PREG_OFFSET_CAPTURE) !== 1) {
                continue;
            }

            $start = $match[0][1] + strlen($match[0][0]);
            $value = $this->numberWithUnit(substr($text, $start, 120), $unitPattern);

            if ($value !== null) {
                return $value;
            }
        }

        return null;
    }

    private function sanitizeValue(string $key, ?float $value): ?float
    {
        if ($value === null) {
            return null;
        }

        if ($key === 'sodium' && $value > 200) {
            $mod = fmod($value, 1000);

            if ($mod >= 120 && $mod <= 160) {
                return $mod;
            }
        }

        if ($key === 'hemoglobin' && $value > 20 && $value <= 200) {
            $scaled = $value / 10;

            if ($scaled >= 5 && $scaled <= 20) {
                return $scaled;
            }
        }

        if ($key === 'calcium' && $value > 8 && $value <= 20) {
            $adjusted = $value - 10;

            if ($adjusted >= 1.5 && $adjusted <= 3.5) {
                return $adjusted;
            }
        }

        return $value;
    }

    private function numberWithUnit(string $window, string $unitPattern): ?float
    {
        $pattern = '/(?:\b(?:L+|H+|HH)\s*)*(?<![\d.])([0-9]+(?:[.,][0-9]+)?)\s*(?:'.$unitPattern.')/iu';

        if (preg_match_all($pattern, $window, $matches, PREG_OFFSET_CAPTURE) < 1) {
            return null;
        }

        foreach ($matches[1] as $found) {
            $offset = $found[1];
            $prefix = substr($window, max(0, $offset - 10), min(10, $offset));

            if (preg_match('/[<>]\s*$/', $prefix) === 1 || preg_match('/\d\s*-\s*$/', $prefix) === 1) {
                continue;
            }

            return (float) str_replace(',', '.', $found[0]);
        }

        return null;
    }

    /**
     * @param  array<int, string>  $aliases
     */
    private function containsAlias(string $text, array $aliases): bool
    {
        foreach ($aliases as $alias) {
            $pattern = '/(?<![A-Za-z0-9])'.preg_quote($this->normalize($alias), '/').'(?![A-Za-z0-9])/iu';

            if (preg_match($pattern, $text) === 1) {
                return true;
            }
        }

        return false;
    }

    private function findPatientName(string $text): ?string
    {
        if (preg_match('/Name\s*:\s*(.+?)\s+No\.?\s*IC/i', $text, $matches) !== 1) {
            return null;
        }

        $name = trim($matches[1]);

        return $name === '' ? null : preg_replace('/\s+/u', ' ', $name);
    }

    private function findPatientIc(string $text): ?string
    {
        if (preg_match('/No\.?\s*IC\s*[:\s]*([0-9]{6,12})/i', $text, $matches) !== 1) {
            return null;
        }

        return $matches[1];
    }

    private function findDate(string $text): ?string
    {
        $labels = [
            'Sample',
            'Tarikh Ujian',
            'Tarikh Sampel',
            'Tarikh Diambil',
            'Tarikh Laporan',
            'Collection Date',
            'Collected Date',
            'Date Collected',
            'Sample Date',
            'Specimen Date',
            'Reported Date',
            'Report Date',
        ];

        foreach ($labels as $label) {
            $pattern = '/'.preg_quote($label, '/').'\s*[:\-]?\s*(.{0,48})/iu';

            if (preg_match($pattern, $text, $matches) !== 1) {
                continue;
            }

            $date = $this->parseDateFragment($matches[1]);

            if ($date !== null) {
                return $date;
            }
        }

        return null;
    }

    private function parseDateFragment(string $fragment): ?string
    {
        if (preg_match('/(\d{4})-(\d{2})-(\d{2})/', $fragment, $matches) === 1) {
            return $this->validDate($matches[1], $matches[2], $matches[3]);
        }

        if (preg_match('/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/', $fragment, $matches) === 1) {
            return $this->validDate($matches[3], $matches[2], $matches[1]);
        }

        if (preg_match('/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/u', $fragment, $matches) === 1) {
            $month = $this->monthNumber($matches[2]);

            if ($month !== null) {
                return $this->validDate($matches[3], (string) $month, $matches[1]);
            }
        }

        return null;
    }

    private function monthNumber(string $name): ?int
    {
        $months = [
            'jan' => 1, 'january' => 1,
            'feb' => 2, 'february' => 2,
            'mac' => 3, 'mar' => 3, 'march' => 3,
            'apr' => 4, 'april' => 4,
            'mei' => 5, 'may' => 5,
            'jun' => 6, 'june' => 6,
            'jul' => 7, 'julai' => 7, 'july' => 7,
            'ogos' => 8, 'aug' => 8, 'august' => 8,
            'sep' => 9, 'sept' => 9, 'september' => 9,
            'okt' => 10, 'oktober' => 10, 'oct' => 10, 'october' => 10,
            'nov' => 11, 'november' => 11,
            'dis' => 12, 'disember' => 12, 'dec' => 12, 'december' => 12,
        ];

        return $months[strtolower($name)] ?? null;
    }

    private function validDate(string $year, string $month, string $day): ?string
    {
        if (! checkdate((int) $month, (int) $day, (int) $year)) {
            return null;
        }

        return sprintf('%04d-%02d-%02d', (int) $year, (int) $month, (int) $day);
    }

    private function normalize(string $text): string
    {
        $text = str_replace(["\u{00A0}", "\u{2007}", "\u{2009}", "\u{202F}"], ' ', $text);
        $text = str_replace(["\u{00B5}", "\u{03BC}"], 'u', $text);
        $text = str_replace("\u{00B2}", '2', $text);
        $text = str_replace(['×', '✕'], 'x', $text);
        $text = preg_replace('/\be\/db\b/i', 'g/dL', $text) ?? $text;
        $text = preg_replace('/\b1043\/uL/i', '10^3/uL', $text) ?? $text;
        $text = preg_replace('/\b1046\/uL/i', '10^6/uL', $text) ?? $text;
        $text = preg_replace('/\b10\s*4\s*3\s*\/\s*uL/i', '10^3/uL', $text) ?? $text;
        $text = preg_replace('/\b10\s*[\^x]\s*0?\s*3\s*\/\s*uL/i', '10^3/uL', $text) ?? $text;
        $text = preg_replace('/\b10\s*[\^x]\s*0?\s*6\s*\/\s*uL/i', '10^6/uL', $text) ?? $text;
        $text = preg_replace('/\b(\d{1,2})\s+(\d)\s*(mmol\/L|umol\/L|g\/dL|g\/L|%)/i', '$1.$2 $3', $text) ?? $text;
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
        $text = preg_replace('/x\s*10\s*\^/iu', 'x10^', $text) ?? $text;

        return trim($text);
    }

    private function smalotText(string $path): string
    {
        if ($path === '' || ! is_file($path)) {
            return '';
        }

        try {
            return (new Parser)->parseFile($path)->getText();
        } catch (Throwable) {
            return '';
        }
    }

    private function popplerText(string $path): string
    {
        if ($path === '' || ! is_file($path) || ! LabPdfProcess::allowed() || ! is_executable('/usr/bin/pdftotext')) {
            return '';
        }

        try {
            $result = LabPdfProcess::runner(30)->run([
                '/usr/bin/pdftotext',
                '-layout',
                '-enc',
                'UTF-8',
                $path,
                '-',
            ]);
        } catch (Throwable) {
            return '';
        }

        return $result->successful() ? $result->output() : '';
    }
}
