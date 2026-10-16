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
 * @property string|null $wbc
 * @property string|null $platelet
 * @property string|null $potassium
 * @property string|null $sodium
 * @property string|null $phosphate
 * @property string|null $calcium
 * @property string|null $urea
 * @property string|null $creatinine
 * @property string|null $egfr
 * @property string|null $glucose
 * @property string|null $hba1c
 * @property string|null $cholesterol
 * @property string|null $ldl
 * @property string|null $hdl
 * @property string|null $triglycerides
 * @property string|null $clinical_notes
 * @property string|null $nephrologist_notes
 * @property int|null $nephrologist_user_id
 * @property Carbon|null $nephrologist_signed_at
 */
#[Fillable([
    'patient_id',
    'recorded_by',
    'examination_date',
    'examination_type',
    'hemoglobin',
    'wbc',
    'platelet',
    'potassium',
    'sodium',
    'phosphate',
    'calcium',
    'urea',
    'creatinine',
    'egfr',
    'glucose',
    'hba1c',
    'cholesterol',
    'ldl',
    'hdl',
    'triglycerides',
    'clinical_notes',
    'nephrologist_notes',
    'nephrologist_user_id',
    'nephrologist_signed_at',
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
            'wbc' => 'decimal:1',
            'platelet' => 'decimal:0',
            'potassium' => 'decimal:2',
            'sodium' => 'decimal:1',
            'phosphate' => 'decimal:2',
            'calcium' => 'decimal:2',
            'urea' => 'decimal:1',
            'creatinine' => 'decimal:1',
            'egfr' => 'decimal:1',
            'glucose' => 'decimal:1',
            'hba1c' => 'decimal:1',
            'cholesterol' => 'decimal:2',
            'ldl' => 'decimal:2',
            'hdl' => 'decimal:2',
            'triglycerides' => 'decimal:2',
            'nephrologist_signed_at' => 'datetime',
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
     * @return BelongsTo<User, $this>
     */
    public function nephrologist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nephrologist_user_id');
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
            'wbc' => $this->wbc,
            'platelet' => $this->platelet,
            'potassium' => $this->potassium,
            'sodium' => $this->sodium,
            'phosphate' => $this->phosphate,
            'calcium' => $this->calcium,
            'urea' => $this->urea,
            'creatinine' => $this->creatinine,
            'egfr' => $this->egfr,
            'glucose' => $this->glucose,
            'hba1c' => $this->hba1c,
            'cholesterol' => $this->cholesterol,
            'ldl' => $this->ldl,
            'hdl' => $this->hdl,
            'triglycerides' => $this->triglycerides,
            'potassium_needs_attention' => $this->potassium !== null && (float) $this->potassium >= 5.5,
            'clinical_notes' => $this->clinical_notes,
            'nephrologist_notes' => $this->nephrologist_notes,
            'nephrologist_name' => $this->nephrologist?->name,
            'nephrologist_signed_at' => $this->nephrologist_signed_at?->toIso8601String(),
            'recorded_by' => $this->recorder?->name,
            'patient_name' => $this->patient->name,
            'patient_id_code' => $this->patient->patient_id_code,
            'report' => $this->report?->toPortalArray(),
        ];
    }
}
