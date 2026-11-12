<?php

declare(strict_types=1);

namespace Tests\Feature\Chat;

use App\Ai\Agents\CriptoAssistente;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CriptoAssistenteTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_ask_cripto_assistente_and_history_is_remembered(): void
    {
        CriptoAssistente::fake(['Clique em "Gerar Nova Chave" no topo do chat.']);

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('chat.assistant.store'), [
            'message' => 'Como configuro minhas chaves?',
        ]);

        $response->assertOk()
            ->assertJsonPath('reply', 'Clique em "Gerar Nova Chave" no topo do chat.')
            ->assertJsonCount(2, 'messages')
            ->assertJsonPath('messages.0.role', 'user')
            ->assertJsonPath('messages.1.role', 'assistant');

        CriptoAssistente::assertPrompted('Como configuro minhas chaves?');

        $this->actingAs($user)->getJson(route('chat.assistant.index'))
            ->assertOk()
            ->assertJsonCount(2, 'messages');
    }

    public function test_assistant_history_is_isolated_per_user(): void
    {
        CriptoAssistente::fake(['Resposta privada.']);

        $author = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->actingAs($author)->postJson(route('chat.assistant.store'), [
            'message' => 'Pergunta privada',
        ])->assertOk();

        $this->actingAs($otherUser)->getJson(route('chat.assistant.index'))
            ->assertOk()
            ->assertJsonCount(0, 'messages');
    }

    public function test_message_is_required(): void
    {
        CriptoAssistente::fake();

        $user = User::factory()->create();

        $this->actingAs($user)->postJson(route('chat.assistant.store'), ['message' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('message');

        CriptoAssistente::assertNeverPrompted();
    }

    public function test_guests_cannot_access_the_assistant(): void
    {
        $this->getJson(route('chat.assistant.index'))->assertUnauthorized();
        $this->postJson(route('chat.assistant.store'), ['message' => 'Oi'])->assertUnauthorized();
    }

    public function test_dashboard_opens_assistant_conversation(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard', ['assistant' => 1]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->where('isAssistantActive', true)
                ->where('activeContactId', null));
    }
}
