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
 * @property string $nursing_board_no
 * @property int|null $years_experience
 * @property string|null $preferred_shift
 * @property string|null $notes
 * @property string $status
 */
#[Fillable([
    'reference',
    'full_name',
    'ic_number',
    'phone_number',
    'email',
    'nursing_board_no',
    'years_experience',
    'preferred_shift',
    'notes',
    'status',
])]
class NurseApplication extends Model
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
            'phone_number' => $this->phone_number,
            'nursing_board_no' => $this->nursing_board_no,
            'preferred_shift' => $this->preferred_shift,
            'status' => $this->status,
            'created_at' => $this->created_at?->timezone('Asia/Kuala_Lumpur')->format('d/m/Y H:i'),
        ];
    }
}
