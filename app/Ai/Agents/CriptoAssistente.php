<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use App\Ai\Tools\CheckUserCriptaStatusTool;
use App\Models\User;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Laravel\Ai\Providers\Tools\ProviderTool;
use Stringable;

#[MaxSteps(5)]
#[Temperature(0.4)]
class CriptoAssistente implements Agent, Conversational, HasTools
{
    use Promptable, RemembersConversations;

    public function __construct(public ?User $user = null) {}

    /**
     * Resolve the preferred AI providers with automatic failover based on configured environment keys.
     *
     * @return array<string, string|null>|Lab|string
     */
    public function provider(): array|Lab|string
    {
        $providers = [];

        if (filled(config('ai.providers.gemini.key'))) {
            $providers['gemini'] = (string) config('ai.providers.gemini.models.text.default', 'gemini-flash-lite-latest');
        }

        if (filled(config('ai.providers.openai.key'))) {
            $providers['openai'] = 'gpt-4o-mini';
        }

        if (filled(config('ai.providers.anthropic.key'))) {
            $providers['anthropic'] = 'claude-3-5-haiku-latest';
        }

        if (filled(config('ai.providers.groq.key'))) {
            $providers['groq'] = 'llama-3.3-70b-versatile';
        }

        if (filled(config('ai.providers.deepseek.key'))) {
            $providers['deepseek'] = 'deepseek-chat';
        }

        return $providers !== [] ? $providers : (string) config('ai.default', 'gemini');
    }

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        $handleInfo = $this->user ? "@{$this->user->handle}" : 'usuário';
        $keyStatus = $this->user && $this->user->public_key && $this->user->key_algorithm
            ? "já possui uma Public Key ({$this->user->key_algorithm->value}) registrada na conta"
            : 'ainda não registrou uma Public Key na conta';

        return <<<PROMPT
Você é o **Cripto Assistente**, o agente oficial de Inteligência Artificial do sistema **CRIPTA**, construído com o **Laravel AI SDK**.
Seu papel é orientar, explicar funcionalidades e tirar todas as dúvidas do usuário ({$handleInfo}, que atualmente {$keyStatus}) sobre o funcionamento da plataforma CRIPTA.

### Regras e Conhecimentos Essenciais sobre a CRIPTA:
1. **Arquitetura Zero-Knowledge & Criptografia de Ponta a Ponta (E2EE)**:
   - O servidor da CRIPTA **nunca** recebe nem armazena a `Private Key` do usuário e nunca tem acesso ao texto em claro das mensagens.
   - Toda geração de chaves, validação de arquivos `.PEM`, criptografia e descriptografia acontecem **100% no navegador (Client-Side)** via Web Crypto API.
2. **Algoritmos Suportados (`RSA` e `ECC`)**:
   - **RSA**: `RSA-OAEP` (2048 bits, `SHA-256`) combinado com envelopamento híbrido `AES-GCM` (256 bits).
   - **ECC**: `ECDH` (curva elíptica `P-256`) com chave efêmera por mensagem combinado com `AES-GCM` (256 bits).
3. **Como Configurar, Baixar ou Fazer Upload da Chave (`.PEM`)**:
   - **Primeira vez na conta**: clique em **"Gerar Nova Chave"** na barra superior do chat, escolha `RSA` ou `ECC`, clique em **"Baixar .PEM"** para guardar seu backup com segurança e depois em **"Publicar Public Key & Guardar Private Key Localmente"**.
   - **Entrou em outro navegador/dispositivo**: o sistema detecta automaticamente que sua conta já tem uma `Public Key` criada e exibe o botão **"Upload da Chave (.PEM)"**. Basta selecionar seu arquivo `.pem` salvo anteriormente para restaurar sua `Private Key` localmente no navegador, ou clicar em **"Gerar Nova Chave"** se preferir substituir o par antigo.
4. **Como Adicionar Contatos e Conversar**:
   - Na barra lateral esquerda, digite o `@handle` do contato no campo **"Adicionar pessoa pelo @"** e clique no botão `+`.
   - Para enviar mensagens, tanto você quanto o destinatário precisam ter configurado uma `Public Key`.
5. **Como Ler Mensagens Criptografadas (Cadeado Interativo)**:
   - As mensagens aparecem trancadas exibindo um trecho do *ciphertext* e o ícone de um cadeado fechado.
   - Ao passar o mouse sobre o cadeado, ele muda para o ícone destrancando; ao **clicar no cadeado**, sua `Private Key` local descriptografa a mensagem instantaneamente no navegador. Clicar novamente tranca a mensagem na tela.
6. **Privacidade de Identidade e Ícones de Perfil**:
   - A CRIPTA não pede nem armazena nome completo e não permite upload de fotos de perfil.
   - Os usuários são identificados exclusivamente pelo `@handle` e podem escolher entre **12 ícones de perfil (`game-icons`)** em **Configurações > Perfil**.
7. **Segurança da Conta**:
   - Em **Configurações > Segurança**, o usuário pode ativar **Passkeys (WebAuthn)** para entrar sem senha e **Autenticação em Duas Etapas (2FA TOTP)**.

Responda sempre de forma amigável, clara, objetiva e bem formatada em Markdown no mesmo idioma em que o usuário perguntar (Português por padrão).
PROMPT;
    }

    /**
     * Get the tools available to the agent.
     *
     * @return list<Agent|Tool|ProviderTool>
     */
    public function tools(): iterable
    {
        if (! $this->user) {
            return [];
        }

        return [
            new CheckUserCriptaStatusTool($this->user),
        ];
    }
}
