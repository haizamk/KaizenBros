<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Smalot\PdfParser\Parser;
use Throwable;

class LabPdfReader
{
    /**
     * @return array{values: array<string, float|null>, date: string|null, found: int}
     */
    public function read(UploadedFile $file): array
    {
        try {
            $text = (new Parser)->parseFile($file->getRealPath())->getText();
        } catch (Throwable) {
            $text = '';
        }

        return $this->parseText($text);
    }

    /**
     * @return array{values: array<string, float|null>, date: string|null, found: int}
     */
    public function parseText(string $text): array
    {
        $flat = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
        $values = [];
        $found = 0;

        foreach (LabCatalog::fields() as $key => $meta) {
            $value = $this->findValue($flat, $meta['aliases'], $meta['units']);
            $values[$key] = $value;

            if ($value !== null) {
                $found++;
            }
        }

        return [
            'values' => $values,
            'date' => $this->findDate($flat),
            'found' => $found,
        ];
    }

    /**
     * @param  array<int, string>  $aliases
     * @param  array<int, string>  $units
     */
    private function findValue(string $text, array $aliases, array $units): ?float
    {
        $unitPattern = implode('|', array_map(
            fn (string $unit): string => preg_quote($unit, '/'),
            $units,
        ));

        foreach ($aliases as $alias) {
            $pattern = '/'.preg_quote($alias, '/').'\s*[:=]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:'.$unitPattern.')/iu';

            if (preg_match($pattern, $text, $matches) === 1) {
                return (float) str_replace(',', '.', $matches[1]);
            }
        }

        return null;
    }

    private function findDate(string $text): ?string
    {
        if (preg_match('/Tarikh Ujian:\s*(\d{4})-(\d{2})-(\d{2})/i', $text, $matches) === 1) {
            return $this->validDate($matches[1], $matches[2], $matches[3]);
        }

        if (preg_match('/Tarikh Ujian:\s*(\d{2})\/(\d{2})\/(\d{4})/i', $text, $matches) === 1) {
            return $this->validDate($matches[3], $matches[2], $matches[1]);
        }

        return null;
    }

    private function validDate(string $year, string $month, string $day): ?string
    {
        if (! checkdate((int) $month, (int) $day, (int) $year)) {
            return null;
        }

        return sprintf('%04d-%02d-%02d', (int) $year, (int) $month, (int) $day);
    }
}
