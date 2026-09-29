<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DialysisSession extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'session_code',
        'patient_id',
        'chair_id',
        'machine_id',
        'scheduled_date',
        'scheduled_shift',
        'scheduled_time',
        'actual_start_time',
        'actual_end_time',
        'status',
        'pre_weight_kg',
        'post_weight_kg',
        'dry_weight_kg',
        'target_uf_litres',
        'actual_uf_litres',
        'pre_bp',
        'current_bp',
        'post_bp',
        'dialyzer_type',
        'anticoagulant',
        'nurse_in_charge',
        'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'pre_weight_kg' => 'decimal:2',
        'post_weight_kg' => 'decimal:2',
        'dry_weight_kg' => 'decimal:2',
        'target_uf_litres' => 'decimal:2',
        'actual_uf_litres' => 'decimal:2',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function chair(): BelongsTo
    {
        return $this->belongsTo(DialysisChair::class);
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(DialysisMachine::class);
    }

    public function vitalSigns(): HasMany
    {
        return $this->hasMany(VitalSign::class);
    }
}
