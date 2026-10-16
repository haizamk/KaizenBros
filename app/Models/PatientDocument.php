<?php

namespace App\Models;

use App\Enums\DocumentCategory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $registration_id
 * @property int|null $patient_id
 * @property int|null $uploaded_by
 * @property string $disk
 * @property string $path
 * @property string $original_name
 * @property string $mime
 * @property int $size
 * @property DocumentCategory $category
 */
#[Fillable([
    'registration_id',
    'patient_id',
    'uploaded_by',
    'disk',
    'path',
    'original_name',
    'mime',
    'size',
    'category',
])]
class PatientDocument extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'category' => DocumentCategory::class,
        ];
    }

    /**
     * @return BelongsTo<Registration, $this>
     */
    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
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
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * @return array<string, mixed>
     */
    public function toPortalArray(): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category->value,
            'category_label' => $this->category->label(),
            'original_name' => $this->original_name,
            'size_label' => $this->sizeLabel(),
            'created_at' => $this->created_at?->timezone('Asia/Kuala_Lumpur')->format('d/m/Y H:i'),
        ];
    }

    public function sizeLabel(): string
    {
        if ($this->size < 1024) {
            return $this->size.' B';
        }

        if ($this->size < 1024 * 1024) {
            return number_format($this->size / 1024, 0).' KB';
        }

        return number_format($this->size / 1024 / 1024, 1).' MB';
    }
}
