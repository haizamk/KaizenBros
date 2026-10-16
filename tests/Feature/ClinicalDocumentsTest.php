<?php

namespace Tests\Feature;

use App\Enums\DocumentCategory;
use App\Enums\ExaminationType;
use App\Enums\SchedulePattern;
use App\Enums\ShiftSlot;
use App\Models\MedicalRecord;
use App\Models\MedicalReport;
use App\Models\Patient;
use App\Models\PatientDocument;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\LabPdfFixture;
use Tests\TestCase;

class ClinicalDocumentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_stores_identity_documents_and_rejects_other_file_types(): void
    {
        Storage::fake('patient_documents');
        Storage::fake('public');
        $this->travelTo('2026-10-16 08:00:00');

        $this->post(route('registrations.store'), [
            ...$this->payload(),
            'surat_doktor' => UploadedFile::fake()->createWithContent('nota.txt', 'bukan dokumen'),
        ])->assertSessionHasErrors('surat_doktor');

        $this->assertDatabaseCount('registrations', 0);

        $this->post(route('registrations.store'), [
            ...$this->payload(),
            'kad_pengenalan' => $this->png('kad-pengenalan.png'),
            'lain' => $this->pdf('rujukan.pdf'),
        ])->assertRedirect(route('registrations.create'));

        $registration = Registration::query()->firstOrFail();
        $this->assertCount(2, $registration->documents);
        $identity = $registration->documents->firstWhere('category', DocumentCategory::KadPengenalan);
        $this->assertNotNull($identity);
        $this->assertSame('patient_documents', $identity->disk);
        $this->assertSame('kad-pengenalan.png', $identity->original_name);
        Storage::disk('patient_documents')->assertExists($identity->path);
        $this->assertSame([], Storage::disk('public')->allFiles());

        $admin = User::factory()->create(['role' => 'admin']);
        $patient = User::factory()->create(['role' => 'patient']);

        $this->get(route('admin.documents.download', $identity))->assertRedirect(route('login'));
        $this->actingAs($patient)->get(route('admin.documents.download', $identity))->assertForbidden();
        $this->actingAs($patient)->get(route('patient.documents.download', $identity))->assertForbidden();
        $this->actingAs($admin)
            ->get(route('admin.documents.download', $identity))
            ->assertOk()
            ->assertDownload('kad-pengenalan.png');

        $this->actingAs($admin)
            ->post(route('admin.documents.store', $registration), [
                'category' => DocumentCategory::SuratDoktor->value,
                'document' => $this->png('surat-klinik.png'),
            ])
            ->assertRedirect();

        $this->assertCount(3, $registration->documents()->get());
    }

    public function test_scanned_report_is_private_and_blood_records_cannot_be_deleted(): void
    {
        Storage::fake('medical_reports');
        $nurse = User::factory()->create(['role' => 'nurse']);
        $owner = User::factory()->create(['role' => 'patient']);
        $intruder = User::factory()->create(['role' => 'patient']);
        $ownPatient = $this->patient($owner, 'P-1001', 'Tan Ah Kow');
        $otherPatient = $this->patient($intruder, 'P-2002', 'Siti Aminah');

        $this->actingAs($nurse)
            ->from(route('nurse.records.index'))
            ->post(route('nurse.records.store'), [
                'patient_id' => $ownPatient->id,
                'examination_date' => today()->toDateString(),
                'examination_type' => ExaminationType::Berkala->value,
                'potassium' => 4.7,
                'report' => UploadedFile::fake()->createWithContent('nota.txt', 'bukan laporan'),
            ])
            ->assertRedirect(route('nurse.records.index'))
            ->assertSessionHasErrors('report');

        $this->assertDatabaseCount('medical_records', 0);

        MedicalRecord::query()->create([
            'patient_id' => $ownPatient->id,
            'examination_date' => today()->subMonths(3),
            'examination_type' => ExaminationType::Berkala,
            'hemoglobin' => 11.1,
            'potassium' => 4.70,
            'phosphate' => 1.60,
            'urea' => 18.2,
            'creatinine' => 690,
        ]);

        $this->actingAs($nurse)
            ->post(route('nurse.records.store'), [
                'patient_id' => $ownPatient->id,
                'examination_type' => ExaminationType::Berkala->value,
                'report' => LabPdfFixture::file('makmal.pdf', implode("\n", [
                    'Tarikh Ujian: '.today()->toDateString(),
                    'Hemoglobin (Hb) 10.4 g/dL',
                    'Potassium (Kalium) 5.60 mmol/L',
                    'Phosphate (Fosfat) 1.90 mmol/L',
                    'Urea 22.4 mmol/L',
                    'Creatinine 780 umol/L',
                ])),
            ])
            ->assertRedirect(route('nurse.records.index', ['pesakit' => $ownPatient->id]));

        $record = MedicalRecord::query()->where('potassium', 5.60)->firstOrFail();
        $report = MedicalReport::query()->firstOrFail();
        $this->assertSame($record->id, $report->medical_record_id);
        $this->assertSame('medical_reports', $report->disk);
        Storage::disk('medical_reports')->assertExists($report->path);

        $secret = MedicalReport::query()->create([
            'patient_id' => $otherPatient->id,
            'medical_record_id' => MedicalRecord::query()->create([
                'patient_id' => $otherPatient->id,
                'examination_date' => today()->subDay(),
                'examination_type' => ExaminationType::Khas,
                'potassium' => 6.4,
            ])->id,
            'disk' => 'medical_reports',
            'path' => 'pesakit/rahsia-siti.pdf',
            'original_name' => 'rahsia-siti.pdf',
            'mime' => 'application/pdf',
            'size' => 12,
        ]);
        Storage::disk('medical_reports')->put($secret->path, 'rahsia');

        $this->actingAs($owner)
            ->get(route('patient.blood'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('records.0.analysis.statuses.potassium', 'TINGGI')
                ->where('records.0.analysis.statuses.urea', 'PERHATIAN')
                ->where('records.0.analysis.statuses.creatinine', 'PERHATIAN')
                ->where('records.0.analysis.changes.potassium', 'Naik daripada 4.70.')
                ->where('records.0.analysis.has_high', true)
                ->where('records.0.report.original_name', 'makmal.pdf')
                ->where('charts.phosphate.0.value', 1.6)
                ->has('charts.creatinine', 2)
                ->where('records.0.analysis.summary', fn (string $summary): bool => str_contains($summary, 'Kalium')
                    && str_contains($summary, 'bukan diagnosis')
                    && ! str_contains($summary, 'Urea tinggi'))
            )
            ->assertDontSee('rahsia-siti.pdf');

        $this->actingAs($intruder)->get(route('patient.reports.download', $report))->assertForbidden();
        $this->actingAs($owner)->get(route('nurse.reports.download', $report))->assertForbidden();
        $this->actingAs($owner)
            ->get(route('patient.reports.download', $report))
            ->assertOk()
            ->assertDownload('makmal.pdf');
        $this->actingAs($nurse)
            ->get(route('nurse.reports.download', $report))
            ->assertOk();

        $this->assertFalse($record->delete());
        $this->assertFalse($report->delete());
        $this->assertNotNull(MedicalRecord::query()->find($record->id));
        $this->assertNotNull(MedicalReport::query()->find($report->id));
    }

    public function test_admin_can_store_a_document_for_an_existing_patient(): void
    {
        Storage::fake('patient_documents');
        $admin = User::factory()->create(['role' => 'admin']);
        $owner = User::factory()->create(['role' => 'patient']);
        $patient = $this->patient($owner, 'P-1001', 'Tan Ah Kow');

        $this->actingAs($admin)
            ->post(route('admin.patients.documents.store', $patient), [
                'category' => DocumentCategory::Lain->value,
                'document' => $this->png('borang-klinik.png'),
            ])
            ->assertRedirect();

        $document = PatientDocument::query()->firstOrFail();
        $this->assertSame($patient->id, $document->patient_id);
        $this->assertSame($admin->id, $document->uploaded_by);
        Storage::disk('patient_documents')->assertExists($document->path);

        $this->actingAs($owner)
            ->get(route('patient.documents.download', $document))
            ->assertOk()
            ->assertDownload('borang-klinik.png');
    }

    /**
     * @return array<string, string>
     */
    private function payload(): array
    {
        return [
            'full_name' => 'Siti Aminah',
            'ic_number' => '900615-08-2468',
            'phone_number' => '012-3001999',
            'address' => 'No. 27, Jalan 5/10, Semenyih',
            'patient_category' => 'PINDAH_PUSAT',
            'nok_name' => 'Aminah Hassan',
            'nok_relationship' => 'IBU_BAPA',
            'nok_phone' => '011-23456789',
        ];
    }

    private function png(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='));
    }

    private function pdf(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    }

    private function patient(User $user, string $code, string $name): Patient
    {
        return Patient::query()->create([
            'user_id' => $user->id,
            'patient_id_code' => $code,
            'name' => $name,
            'ic_number' => '580101-10-1231',
            'gender' => 'LELAKI',
            'age' => 68,
            'phone' => '012-3001001',
            'dry_weight_kg' => 62.5,
            'vascular_access' => 'AVF',
            'access_location' => 'Lengan kiri',
            'sponsor' => 'PERKESO / SOCSO',
            'schedule_pattern' => SchedulePattern::IsninRabuJumaat,
            'preferred_shift' => ShiftSlot::Syif1,
            'is_active' => true,
        ]);
    }
}
