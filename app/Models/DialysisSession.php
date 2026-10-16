<?php

namespace App\Models;

use App\Enums\SessionStatus;
use App\Enums\ShiftSlot;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $patient_id
 * @property string $chair_number
 * @property Carbon $scheduled_date
 * @property string $scheduled_time
 * @property ShiftSlot $shift
 * @property SessionStatus $status
 * @property string|null $pre_weight_kg
 * @property string|null $post_weight_kg
 * @property string|null $pre_bp
 * @property string|null $intra_bp
 * @property string|null $post_bp
 * @property Carbon|null $started_at
 * @property Carbon|null $completed_at
 * @property int|null $nurse_user_id
 * @property string|null $nurse_notes
 */
#[Fillable([
    'patient_id',
    'chair_number',
    'scheduled_date',
    'scheduled_time',
    'shift',
    'status',
    'pre_weight_kg',
    'post_weight_kg',
    'pre_bp',
    'intra_bp',
    'post_bp',
    'started_at',
    'completed_at',
    'nurse_user_id',
    'nurse_notes',
])]
class DialysisSession extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'shift' => ShiftSlot::class,
            'status' => SessionStatus::class,
            'pre_weight_kg' => 'decimal:2',
            'post_weight_kg' => 'decimal:2',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
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
    public function nurse(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nurse_user_id');
    }

    /**
     * @return array<string, mixed>
     */
    public function toPortalArray(): array
    {
        return [
            'id' => $this->id,
            'chair_number' => $this->chair_number,
            'scheduled_date' => $this->scheduled_date->toDateString(),
            'scheduled_time' => $this->scheduled_time,
            'shift' => $this->shift->value,
            'shift_label' => $this->shift->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'pre_weight_kg' => $this->pre_weight_kg,
            'post_weight_kg' => $this->post_weight_kg,
            'pre_bp' => $this->pre_bp,
            'intra_bp' => $this->intra_bp,
            'post_bp' => $this->post_bp,
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'nurse_notes' => $this->nurse_notes,
            'nurse_name' => $this->nurse?->name,
            'patient' => [
                'id' => $this->patient->id,
                'name' => $this->patient->name,
                'patient_id_code' => $this->patient->patient_id_code,
                'dry_weight_kg' => $this->patient->dry_weight_kg,
                'sponsor' => $this->patient->sponsor,
                'allergies' => $this->patient->allergies,
            ],
        ];
    }
}
