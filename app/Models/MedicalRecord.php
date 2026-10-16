<?php

namespace App\Models;

use App\Enums\ExaminationType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $patient_id
 * @property int|null $recorded_by
 * @property Carbon $examination_date
 * @property ExaminationType $examination_type
 * @property string|null $hemoglobin
 * @property string|null $potassium
 * @property string|null $phosphate
 * @property string|null $urea
 * @property string|null $creatinine
 * @property string|null $clinical_notes
 */
#[Fillable([
    'patient_id',
    'recorded_by',
    'examination_date',
    'examination_type',
    'hemoglobin',
    'potassium',
    'phosphate',
    'urea',
    'creatinine',
    'clinical_notes',
])]
class MedicalRecord extends Model
{
    protected static function booted(): void
    {
        static::deleting(fn (): bool => false);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'examination_date' => 'date',
            'examination_type' => ExaminationType::class,
            'hemoglobin' => 'decimal:1',
            'potassium' => 'decimal:2',
            'phosphate' => 'decimal:2',
            'urea' => 'decimal:1',
            'creatinine' => 'decimal:1',
        ];
    }

    /**
     * @return BelongsTo<Patient, $this>
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * @return HasOne<MedicalReport, $this>
     */
    public function report(): HasOne
    {
        return $this->hasOne(MedicalReport::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toPortalArray(): array
    {
        return [
            'id' => $this->id,
            'examination_date' => $this->examination_date->toDateString(),
            'examination_label' => $this->examination_date->format('d/m/Y'),
            'examination_type' => $this->examination_type->value,
            'examination_type_label' => $this->examination_type->label(),
            'hemoglobin' => $this->hemoglobin,
            'potassium' => $this->potassium,
            'phosphate' => $this->phosphate,
            'urea' => $this->urea,
            'creatinine' => $this->creatinine,
            'potassium_needs_attention' => $this->potassium !== null && (float) $this->potassium >= 5.5,
            'clinical_notes' => $this->clinical_notes,
            'recorded_by' => $this->recorder?->name,
            'patient_name' => $this->patient->name,
            'patient_id_code' => $this->patient->patient_id_code,
            'report' => $this->report?->toPortalArray(),
        ];
    }
}
