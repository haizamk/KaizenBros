<?php

namespace App\Models;

use App\Support\RegistrationOptions;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $reference
 * @property string $full_name
 * @property string $ic_number
 * @property string $phone_number
 * @property string|null $email
 * @property string $gender
 * @property Carbon|null $birth_date
 * @property int|null $age_years
 * @property int|null $age_months
 * @property string|null $address
 * @property string|null $patient_category
 * @property string|null $medical_notes
 * @property string|null $nok_name
 * @property string|null $nok_relationship
 * @property string|null $nok_phone
 * @property string|null $nok_email
 * @property string $status
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 */
#[Fillable([
    'reference',
    'full_name',
    'ic_number',
    'phone_number',
    'email',
    'gender',
    'birth_date',
    'age_years',
    'age_months',
    'address',
    'patient_category',
    'medical_notes',
    'nok_name',
    'nok_relationship',
    'nok_phone',
    'nok_email',
    'status',
    'reviewed_by',
    'reviewed_at',
])]
class Registration extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            'DILULUSKAN' => 'Diluluskan',
            'DITOLAK' => 'Ditolak',
            default => 'Menunggu pengesahan',
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function toPortalArray(): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'full_name' => $this->full_name,
            'ic_number' => $this->ic_number,
            'phone_number' => $this->formatPhone($this->phone_number),
            'email' => $this->email,
            'gender' => $this->gender,
            'gender_label' => $this->gender === 'PEREMPUAN' ? 'Perempuan' : 'Lelaki',
            'age_label' => $this->age_years === null ? null : $this->age_years.' tahun '.$this->age_months.' bulan',
            'address' => $this->address,
            'patient_category_label' => RegistrationOptions::categories()[$this->patient_category] ?? $this->patient_category,
            'medical_notes' => $this->medical_notes,
            'nok_name' => $this->nok_name,
            'nok_relationship_label' => RegistrationOptions::relationships()[$this->nok_relationship] ?? $this->nok_relationship,
            'nok_phone' => $this->formatPhone($this->nok_phone),
            'status' => $this->status,
            'status_label' => $this->statusLabel(),
            'can_review' => $this->status === 'BARU',
            'created_at' => $this->created_at?->timezone('Asia/Kuala_Lumpur')->format('d/m/Y H:i'),
        ];
    }

    private function formatPhone(?string $phone): ?string
    {
        if ($phone === null || strlen($phone) < 4) {
            return $phone;
        }

        return substr($phone, 0, 3).'-'.substr($phone, 3);
    }
}
