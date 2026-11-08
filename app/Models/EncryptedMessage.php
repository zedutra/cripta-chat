<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\KeyAlgorithm;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $sender_id
 * @property int $recipient_id
 * @property KeyAlgorithm $algorithm
 * @property string $recipient_ciphertext
 * @property string $sender_ciphertext
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $sender
 * @property-read User $recipient
 */
#[Fillable([
    'sender_id',
    'recipient_id',
    'algorithm',
    'recipient_ciphertext',
    'sender_ciphertext',
])]
class EncryptedMessage extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'algorithm' => KeyAlgorithm::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
}
