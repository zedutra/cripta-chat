<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Contracts\ActionContract;
use App\Enums\KeyAlgorithm;
use App\Models\EncryptedMessage;
use App\Models\User;

class StoreEncryptedMessageAction implements ActionContract
{
    public function execute(
        User $sender,
        int $recipientId,
        KeyAlgorithm $algorithm,
        string $recipientCiphertext,
        string $senderCiphertext,
    ): EncryptedMessage {
        // Ensure both users are in each other's contact list
        $sender->contacts()->syncWithoutDetaching([$recipientId]);
        User::where('id', $recipientId)->first()?->contacts()->syncWithoutDetaching([$sender->id]);

        return EncryptedMessage::create([
            'sender_id' => $sender->id,
            'recipient_id' => $recipientId,
            'algorithm' => $algorithm,
            'recipient_ciphertext' => $recipientCiphertext,
            'sender_ciphertext' => $senderCiphertext,
        ]);
    }
}
