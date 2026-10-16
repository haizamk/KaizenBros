<?php

namespace Tests\Unit;

use App\Support\LabPdfPatientMatch;
use PHPUnit\Framework\TestCase;

class LabPdfPatientMatchTest extends TestCase
{
    public function test_prima_lab_name_variants_still_match(): void
    {
        $this->assertTrue(LabPdfPatientMatch::nameMatches(
            'KHAIRUL HAIZAM BIN MD RADZI',
            'Khairul Haizam bin Mohd Radzi',
        ));
    }

    public function test_clearly_different_names_do_not_match(): void
    {
        $this->assertFalse(LabPdfPatientMatch::nameMatches(
            'KHAIRUL HAIZAM BIN MD RADZI',
            'Tan Ah Kow',
        ));
    }
}
