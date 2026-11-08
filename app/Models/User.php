<?php

namespace App\Models;

use App\Enums\KeyAlgorithm;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $handle
 * @property string $avatar_icon
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $public_key
 * @property KeyAlgorithm|null $key_algorithm
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'handle', 'avatar_icon', 'email', 'password', 'public_key', 'key_algorithm'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Allowed profile icons from Iconify game-icons collection.
     *
     * @var list<string>
     */
    public const array AVATAR_ICONS = [
        'game-icons:witch-face',
        'game-icons:wizard-face',
        'game-icons:bad-gnome',
        'game-icons:dwarf-face',
        'game-icons:horse-head',
        'game-icons:cloaked-figure-on-horseback',
        'game-icons:deathcab',
        'game-icons:daemon-skull',
        'game-icons:spiked-dragon-head',
        'game-icons:pegasus',
        'game-icons:unicorn',
        'game-icons:william-tell-skull',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'key_algorithm' => KeyAlgorithm::class,
        ];
    }

    /**
     * Contacts added by this user.
     *
     * @return BelongsToMany<User, $this>
     */
    public function contacts(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'contacts', 'user_id', 'contact_id')
            ->withTimestamps();
    }
}
