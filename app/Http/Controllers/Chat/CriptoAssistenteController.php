<?php

declare(strict_types=1);

namespace App\Http\Controllers\Chat;

use App\Ai\Agents\CriptoAssistente;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\SendAssistantMessageRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Contracts\ConversationStore;
use Laravel\Ai\Models\Conversation;
use Throwable;

class CriptoAssistenteController extends Controller
{
    public function __construct(private readonly ConversationStore $conversationStore) {}

    /**
     * Return the latest conversation history between the user and the Cripto Assistente.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'messages' => $this->historyFor($user),
        ]);
    }

    /**
     * Send a question to the Cripto Assistente and return its reply.
     */
    public function store(SendAssistantMessageRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        try {
            $response = retry(3, function () use ($user, $request) {
                return CriptoAssistente::make(user: $user)
                    ->continueLastConversation($user)
                    ->prompt((string) $request->validated('message'));
            }, 1000);
        } catch (Throwable $exception) {
            Log::warning('Cripto Assistente failed to respond.', ['error' => $exception->getMessage()]);

            return response()->json([
                'message' => __('O Cripto Assistente está indisponível no momento. Verifique se uma chave de API de IA está configurada no .env.'),
            ], 503);
        }

        return response()->json([
            'reply' => $response->text,
            'messages' => $this->historyFor($user),
        ]);
    }

    /**
     * @return list<array{id: string, role: string, content: string, created_at: string|null}>
     */
    private function historyFor(User $user): array
    {
        $conversationId = $this->conversationStore->latestConversationId(
            Conversation::participantType($user),
            Conversation::participantKey($user),
            CriptoAssistente::class,
        );

        if ($conversationId === null) {
            return [];
        }

        return DB::table(config('ai.conversations.tables.messages', 'agent_conversation_messages'))
            ->where('conversation_id', $conversationId)
            ->whereIn('role', ['user', 'assistant'])
            ->where('content', '!=', '')
            ->orderBy('id')
            ->limit(100)
            ->get(['id', 'role', 'content', 'created_at'])
            ->map(fn (object $message): array => [
                'id' => (string) $message->id,
                'role' => (string) $message->role,
                'content' => (string) $message->content,
                'created_at' => $message->created_at ? (string) $message->created_at : null,
            ])
            ->values()
            ->all();
    }
}
