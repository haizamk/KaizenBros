<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $chair_number
 * @property Carbon $blocked_on
 * @property string $reason
 * @property int $user_id
 */
#[Fillable([
    'chair_number',
    'blocked_on',
    'reason',
    'user_id',
])]
class ChairBlock extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'blocked_on' => 'date',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reasonLabel(): string
    {
        return $this->reason === 'TIDAK_SESUAI' ? 'Tidak sesuai' : 'Rosak';
    }
}
