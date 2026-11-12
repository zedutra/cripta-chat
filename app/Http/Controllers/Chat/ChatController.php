<?php

declare(strict_types=1);

namespace App\Http\Controllers\Chat;

use App\Actions\Chat\AddContactByHandleAction;
use App\Actions\Chat\StoreEncryptedMessageAction;
use App\Actions\Chat\UpdateUserPublicKeyAction;
use App\Enums\KeyAlgorithm;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\AddContactRequest;
use App\Http\Requests\Chat\SendEncryptedMessageRequest;
use App\Http\Requests\Chat\UpdatePublicKeyRequest;
use App\Models\EncryptedMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $contacts = $this->getContactsForUser($user);

        $activeContactId = $request->integer('contact') ?: $contacts->first()?->id;

        $messages = $this->getMessagesForContact($user, $activeContactId);

        return Inertia::render('dashboard', [
            'contacts' => $contacts,
            'activeContactId' => $activeContactId,
            'messages' => $messages,
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $contacts = $this->getContactsForUser($user);

        $activeContactId = $request->integer('contact') ?: $contacts->first()?->id;

        $messages = $this->getMessagesForContact($user, $activeContactId);

        return response()->json([
            'contacts' => $contacts,
            'activeContactId' => $activeContactId,
            'messages' => $messages,
        ]);
    }

    /**
     * @return Collection<int, User>
     */
    private function getContactsForUser(User $user): Collection
    {
        return $user->contacts()
            ->select(['users.id', 'users.handle', 'users.avatar_icon', 'users.public_key', 'users.key_algorithm'])
            ->orderBy('users.handle')
            ->get();
    }

    /**
     * @return Collection<int, array<string, mixed>>|array<int, never>
     */
    private function getMessagesForContact(User $user, ?int $activeContactId): Collection|array
    {
        if (! $activeContactId) {
            return [];
        }

        return EncryptedMessage::query()
            ->where(function ($query) use ($user, $activeContactId) {
                $query->where('sender_id', $user->id)
                    ->where('recipient_id', $activeContactId);
            })
            ->orWhere(function ($query) use ($user, $activeContactId) {
                $query->where('sender_id', $activeContactId)
                    ->where('recipient_id', $user->id);
            })
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->limit(200)
            ->get()
            ->map(fn (EncryptedMessage $msg) => [
                'id' => $msg->id,
                'sender_id' => $msg->sender_id,
                'recipient_id' => $msg->recipient_id,
                'algorithm' => $msg->algorithm->value,
                'recipient_ciphertext' => $msg->recipient_ciphertext,
                'sender_ciphertext' => $msg->sender_ciphertext,
                'created_at' => $msg->created_at?->toIso8601String(),
            ]);
    }

    public function updatePublicKey(
        UpdatePublicKeyRequest $request,
        UpdateUserPublicKeyAction $action,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();

        $action->execute(
            $user,
            (string) $request->validated('public_key'),
            KeyAlgorithm::from((string) $request->validated('key_algorithm')),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Public Key publicada com sucesso! Sua Private Key permanece apenas no seu navegador.',
        ]);

        return back();
    }

    public function addContact(
        AddContactRequest $request,
        AddContactByHandleAction $action,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();

        $contact = $action->execute($user, (string) $request->validated('handle'));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Contato @{$contact->handle} adicionado!",
        ]);

        return to_route('dashboard', ['contact' => $contact->id]);
    }

    public function sendMessage(
        SendEncryptedMessageRequest $request,
        StoreEncryptedMessageAction $action,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();

        $recipientId = (int) $request->validated('recipient_id');

        $action->execute(
            $user,
            $recipientId,
            KeyAlgorithm::from((string) $request->validated('algorithm')),
            (string) $request->validated('recipient_ciphertext'),
            (string) $request->validated('sender_ciphertext'),
        );

        return to_route('dashboard', ['contact' => $recipientId]);
    }
}
