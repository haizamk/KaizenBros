<?php

namespace App\Support;

use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Process;

class LabPdfProcess
{
    public static function allowed(): bool
    {
        if (! function_exists('proc_open')) {
            return false;
        }

        $disabled = ini_get('disable_functions');

        if (! is_string($disabled) || trim($disabled) === '') {
            return true;
        }

        return ! in_array('proc_open', array_map(trim(...), explode(',', $disabled)), true);
    }

    public static function runner(int $timeoutSeconds): PendingProcess
    {
        return Process::timeout($timeoutSeconds)->path(self::workingDirectory());
    }

    public static function workingDirectory(): string
    {
        $configured = config('kaizenbros.lab_pdf_ocr.working_directory');

        if (is_string($configured) && $configured !== '' && is_dir($configured)) {
            return $configured;
        }

        return storage_path('app');
    }
}
