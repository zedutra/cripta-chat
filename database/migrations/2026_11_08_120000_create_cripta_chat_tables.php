<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('handle', 50)->unique()->after('name');
            $table->text('public_key')->nullable()->after('password');
            $table->string('key_algorithm', 10)->nullable()->after('public_key');
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'contact_id']);
        });

        Schema::create('encrypted_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();
            $table->string('algorithm', 10);
            $table->longText('recipient_ciphertext');
            $table->longText('sender_ciphertext');
            $table->timestamps();

            $table->index(['sender_id', 'recipient_id', 'created_at']);
            $table->index(['recipient_id', 'sender_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('encrypted_messages');
        Schema::dropIfExists('contacts');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['handle', 'public_key', 'key_algorithm']);
        });
    }
};
