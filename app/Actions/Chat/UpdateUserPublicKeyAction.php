<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Contracts\ActionContract;
use App\Enums\KeyAlgorithm;
use App\Models\User;

class UpdateUserPublicKeyAction implements ActionContract
{
    public function execute(User $user, string $publicKey, KeyAlgorithm $algorithm): User
    {
        $user->update([
            'public_key' => trim($publicKey),
            'key_algorithm' => $algorithm,
        ]);

        return $user;
    }
}
