<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $reference
 * @property string $full_name
 * @property string $ic_number
 * @property string $phone_number
 * @property string|null $email
 * @property string $gender
 * @property string|null $address
 * @property string|null $medical_notes
 * @property string|null $nok_name
 * @property string|null $nok_phone
 * @property string $status
 */
#[Fillable([
    'reference',
    'full_name',
    'ic_number',
    'phone_number',
    'email',
    'gender',
    'address',
    'medical_notes',
    'nok_name',
    'nok_phone',
    'status',
])]
class Registration extends Model
{
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
            'phone_number' => $this->phone_number,
            'email' => $this->email,
            'gender' => $this->gender,
            'medical_notes' => $this->medical_notes,
            'status' => $this->status,
            'created_at' => $this->created_at?->timezone('Asia/Kuala_Lumpur')->format('d/m/Y H:i'),
        ];
    }
}
