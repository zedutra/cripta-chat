<?php

declare(strict_types=1);

namespace App\Http\Requests\Chat;

use App\Enums\KeyAlgorithm;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendEncryptedMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'algorithm' => ['required', 'string', Rule::enum(KeyAlgorithm::class)],
            'recipient_ciphertext' => ['required', 'string', 'max:65535'],
            'sender_ciphertext' => ['required', 'string', 'max:65535'],
        ];
    }
}
