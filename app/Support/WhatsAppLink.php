<?php

namespace App\Support;

class WhatsAppLink
{
    public static function sessionReminder(string $phone, string $name, string $when, string $time, string $chair): ?string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '0')) {
            $digits = '6'.$digits;
        }

        $message = "Salam {$name}, ini peringatan sesi dialisis anda di Pusat Dialisis KaizenBros Semenyih pada {$when} jam {$time}, kerusi {$chair}.";

        return 'https://wa.me/'.$digits.'?text='.rawurlencode($message);
    }
}
