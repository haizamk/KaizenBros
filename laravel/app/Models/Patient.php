<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'patient_id_code',
        'name',
        'ic_number',
        'phone',
        'email',
        'age',
        'gender',
        'blood_group',
        'address',
        'next_of_kin_name',
        'next_of_kin_phone',
        'next_of_kin_relation',
        'dry_weight_kg',
        'latest_weight_kg',
        'latest_bp',
        'vascular_access',
        'access_location',
        'sponsor',
        'sponsor_ref_no',
        'schedule_pattern',
        'preferred_shift',
        'assigned_chair',
        'allergies',
        'comorbidities',
        'hepatitis_status',
        'is_active',
    ];

    protected $casts = [
        'age' => 'integer',
        'dry_weight_kg' => 'decimal:2',
        'latest_weight_kg' => 'decimal:2',
        'comorbidities' => 'array',
        'hepatitis_status' => 'array',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(DialysisSession::class);
    }

    public function medications(): HasMany
    {
        return $this->hasMany(PatientMedication::class);
    }

    public function clinicalNotes(): HasMany
    {
        return $this->hasMany(ClinicalNote::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }
}
