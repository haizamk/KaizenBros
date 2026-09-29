<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VitalSign extends Model
{
    use HasFactory;

    protected $fillable = [
        'dialysis_session_id',
        'recorded_at',
        'phase',
        'systolic_bp',
        'diastolic_bp',
        'pulse_rate',
        'respiratory_rate',
        'temperature',
        'uf_rate_ml_hr',
        'blood_flow_rate_qb',
        'dialysate_flow_rate_qd',
        'venous_pressure',
        'transmembrane_pressure',
        'nurse_name',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(DialysisSession::class, 'dialysis_session_id');
    }
}
