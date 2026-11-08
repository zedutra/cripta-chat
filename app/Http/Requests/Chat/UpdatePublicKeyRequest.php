<?php

declare(strict_types=1);

namespace App\Http\Requests\Chat;

use App\Enums\KeyAlgorithm;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePublicKeyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Zero-Knowledge Guard: explicitly reject if client attempts to send private_key
        if ($this->has('private_key') || $this->has('privateKey')) {
            abort(422, 'O servidor CRIPTA é Zero-Knowledge e proíbe o envio de chaves privadas.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'public_key' => [
                'required',
                'string',
                'min:40',
                'max:10000',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_string($value) && str_contains(strtoupper($value), 'PRIVATE KEY')) {
                        $fail('Chave privada detectada! Envie apenas a sua Public Key para o servidor.');
                    }
                },
            ],
            'key_algorithm' => [
                'required',
                'string',
                Rule::enum(KeyAlgorithm::class),
            ],
        ];
    }
}
