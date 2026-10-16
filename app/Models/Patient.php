<?php

namespace App\Models;

use App\Enums\SchedulePattern;
use App\Enums\ShiftSlot;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $user_id
 * @property string $patient_id_code
 * @property string $name
 * @property string $ic_number
 * @property string $gender
 * @property int $age
 * @property string $phone
 * @property string|null $email
 * @property string|null $address
 * @property string $dry_weight_kg
 * @property string $vascular_access
 * @property string $access_location
 * @property string $sponsor
 * @property SchedulePattern $schedule_pattern
 * @property ShiftSlot $preferred_shift
 * @property string|null $allergies
 * @property bool $is_active
 */
#[Fillable([
    'user_id',
    'patient_id_code',
    'name',
    'ic_number',
    'gender',
    'age',
    'phone',
    'email',
    'address',
    'dry_weight_kg',
    'vascular_access',
    'access_location',
    'sponsor',
    'schedule_pattern',
    'preferred_shift',
    'allergies',
    'is_active',
])]
class Patient extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'age' => 'integer',
            'dry_weight_kg' => 'decimal:2',
            'schedule_pattern' => SchedulePattern::class,
            'preferred_shift' => ShiftSlot::class,
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<DialysisSession, $this>
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(DialysisSession::class);
    }

    /**
     * @return HasMany<PatientMedication, $this>
     */
    public function medications(): HasMany
    {
        return $this->hasMany(PatientMedication::class);
    }

    /**
     * @return HasMany<PatientDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(PatientDocument::class);
    }

    /**
     * @return HasMany<MedicalRecord, $this>
     */
    public function medicalRecords(): HasMany
    {
        return $this->hasMany(MedicalRecord::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toPortalArray(): array
    {
        return [
            'id' => $this->id,
            'patient_id_code' => $this->patient_id_code,
            'name' => $this->name,
            'ic_number' => $this->ic_number,
            'gender' => $this->gender,
            'age' => $this->age,
            'phone' => $this->phone,
            'dry_weight_kg' => $this->dry_weight_kg,
            'vascular_access' => $this->vascular_access,
            'access_location' => $this->access_location,
            'sponsor' => $this->sponsor,
            'schedule_pattern' => $this->schedule_pattern->value,
            'schedule_label' => $this->schedule_pattern->label(),
            'preferred_shift' => $this->preferred_shift->value,
            'shift_label' => $this->preferred_shift->label(),
            'time_range' => $this->preferred_shift->timeRange(),
            'allergies' => $this->allergies,
        ];
    }
}
