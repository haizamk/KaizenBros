<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Process;
use Smalot\PdfParser\Parser;
use Throwable;

class LabPdfReader
{
    /**
     * @return array{values: array<string, float|null>, date: string|null, found: int, has_text: bool}
     */
    public function read(UploadedFile $file): array
    {
        $path = $file->getRealPath() ?: '';
        $parsed = $this->parseText($this->smalotText($path));
        $layout = $this->parseText($this->popplerText($path));

        if ($layout['found'] > $parsed['found']) {
            return $layout;
        }

        if ($parsed['found'] === 0 && $layout['has_text']) {
            return $layout;
        }

        return $parsed;
    }

    /**
     * @return array{values: array<string, float|null>, date: string|null, found: int, has_text: bool}
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
        ];
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

            if (is_string($next) && preg_match('/^\s*[0-9]/', $next) === 1) {
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
            $value = $this->numberWithUnit(substr($text, $start, 90), $unitPattern);

            if ($value !== null) {
                return $value;
            }
        }

        return null;
    }

    private function numberWithUnit(string $window, string $unitPattern): ?float
    {
        $pattern = '/(?<![\d.])([0-9]+(?:[.,][0-9]+)?)\s*(?:'.$unitPattern.')/iu';

        if (preg_match_all($pattern, $window, $matches, PREG_OFFSET_CAPTURE) < 1) {
            return null;
        }

        foreach ($matches[1] as $found) {
            $offset = $found[1];
            $prefix = substr($window, max(0, $offset - 8), min(8, $offset));

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

    private function findDate(string $text): ?string
    {
        $labels = [
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
        if ($path === '' || ! is_file($path) || ! is_executable('/usr/bin/pdftotext')) {
            return '';
        }

        try {
            $result = Process::timeout(30)->run([
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
