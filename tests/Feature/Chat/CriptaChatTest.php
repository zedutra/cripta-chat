<?php

declare(strict_types=1);

namespace Tests\Feature\Chat;

use App\Enums\KeyAlgorithm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CriptaChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_publish_rsa_and_ecc_public_keys(): void
    {
        $user = User::factory()->create();

        $fakePublicKey = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtestpublickeycontent\n-----END PUBLIC KEY-----";

        $response = $this->actingAs($user)->put(route('chat.keys.update'), [
            'public_key' => $fakePublicKey,
            'key_algorithm' => KeyAlgorithm::RSA->value,
        ]);

        $response->assertRedirect();
        $user->refresh();

        $this->assertSame($fakePublicKey, $user->public_key);
        $this->assertSame(KeyAlgorithm::RSA, $user->key_algorithm);
    }

    public function test_zero_knowledge_guard_rejects_private_key_in_public_key_field(): void
    {
        $user = User::factory()->create();

        $accidentalPrivateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtestprivate\n-----END PRIVATE KEY-----";

        $response = $this->actingAs($user)->put(route('chat.keys.update'), [
            'public_key' => $accidentalPrivateKey,
            'key_algorithm' => KeyAlgorithm::ECC->value,
        ]);

        $response->assertSessionHasErrors('public_key');
        $this->assertNull($user->fresh()?->public_key);
    }

    public function test_zero_knowledge_guard_rejects_payload_containing_private_key_parameter(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->put(route('chat.keys.update'), [
            'public_key' => "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtestpublickeycontent\n-----END PUBLIC KEY-----",
            'private_key' => 'secret-private-key',
            'key_algorithm' => KeyAlgorithm::RSA->value,
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_add_contact_by_at_handle(): void
    {
        $alice = User::factory()->create(['handle' => 'alice_crypto']);
        $bob = User::factory()->create(['handle' => 'bob_ecc']);

        $response = $this->actingAs($alice)->post(route('chat.contacts.store'), [
            'handle' => '@bob_ecc',
        ]);

        $response->assertRedirect(route('dashboard', ['contact' => $bob->id]));

        $this->assertTrue($alice->contacts()->where('contact_id', $bob->id)->exists());
        $this->assertTrue($bob->contacts()->where('contact_id', $alice->id)->exists());
    }

    public function test_user_can_send_encrypted_message_and_retrieve_in_dashboard(): void
    {
        $alice = User::factory()->create([
            'handle' => 'alice',
            'public_key' => '-----BEGIN PUBLIC KEY-----ALICE_PUB_KEY_CONTENT_1234567890-----END PUBLIC KEY-----',
            'key_algorithm' => KeyAlgorithm::ECC,
        ]);

        $bob = User::factory()->create([
            'handle' => 'bob',
            'public_key' => '-----BEGIN PUBLIC KEY-----BOB_PUB_KEY_CONTENT_1234567890-----END PUBLIC KEY-----',
            'key_algorithm' => KeyAlgorithm::ECC,
        ]);

        $recipientCipher = '{"v":1,"alg":"ECC","epk":"ephemeral","iv":"123","ct":"encrypted_for_bob"}';
        $senderCipher = '{"v":1,"alg":"ECC","epk":"ephemeral2","iv":"456","ct":"encrypted_for_alice"}';

        $response = $this->actingAs($alice)->post(route('chat.messages.store'), [
            'recipient_id' => $bob->id,
            'algorithm' => KeyAlgorithm::ECC->value,
            'recipient_ciphertext' => $recipientCipher,
            'sender_ciphertext' => $senderCipher,
        ]);

        $response->assertRedirect(route('dashboard', ['contact' => $bob->id]));

        $this->assertDatabaseHas('encrypted_messages', [
            'sender_id' => $alice->id,
            'recipient_id' => $bob->id,
            'algorithm' => 'ECC',
            'recipient_ciphertext' => $recipientCipher,
            'sender_ciphertext' => $senderCipher,
        ]);
    }
}
