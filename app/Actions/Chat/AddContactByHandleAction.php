<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Contracts\ActionContract;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class AddContactByHandleAction implements ActionContract
{
    public function execute(User $user, string $handle): User
    {
        $normalizedHandle = strtolower(ltrim(trim($handle), '@'));

        $contact = User::where('handle', $normalizedHandle)->first();

        if (! $contact) {
            throw ValidationException::withMessages([
                'handle' => 'Nenhum usuário encontrado com @'.$normalizedHandle.'.',
            ]);
        }

        if ($contact->id === $user->id) {
            throw ValidationException::withMessages([
                'handle' => 'Você não pode adicionar seu próprio @handle como contato.',
            ]);
        }

        // Attach bidirectional contact relationship so both users appear in each other's chat list
        $user->contacts()->syncWithoutDetaching([$contact->id]);
        $contact->contacts()->syncWithoutDetaching([$user->id]);

        return $contact;
    }
}
