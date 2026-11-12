<?php

declare(strict_types=1);

namespace App\Ai\Tools;

use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class CheckUserCriptaStatusTool implements Tool
{
    public function __construct(public User $user) {}

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Consulta o status atual da conta do usuário no sistema CRIPTA (se já possui Public Key configurada, algoritmo RSA ou ECC, quantidade de contatos e 2FA).';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $hasKey = filled($this->user->public_key) && $this->user->key_algorithm !== null;
        $algorithm = $this->user->key_algorithm?->value ?? 'Nenhum';
        $contactsCount = $this->user->contacts()->count();
        $hasTwoFactor = filled($this->user->two_factor_confirmed_at);

        return json_encode([
            'handle' => '@'.$this->user->handle,
            'avatar_icon' => $this->user->avatar_icon,
            'has_public_key_on_server' => $hasKey,
            'key_algorithm' => $algorithm,
            'contacts_count' => $contactsCount,
            'two_factor_enabled' => $hasTwoFactor,
        ], JSON_UNESCAPED_UNICODE) ?: '{}';
    }

    /**
     * Get the tool's schema definition.
     *
     * @return array<string, mixed>
     */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
