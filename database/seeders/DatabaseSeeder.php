<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $alice = User::updateOrCreate(
            ['email' => 'alice@cripta.local'],
            [
                'name' => 'Alice Crypto',
                'handle' => 'alice',
                'avatar_icon' => 'game-icons:witch-face',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $bob = User::updateOrCreate(
            ['email' => 'bob@cripta.local'],
            [
                'name' => 'Bob Cipher',
                'handle' => 'bob',
                'avatar_icon' => 'game-icons:wizard-face',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        // Conecta Alice e Bob como contatos para facilitar o teste do chat
        $alice->contacts()->syncWithoutDetaching([$bob->id]);
        $bob->contacts()->syncWithoutDetaching([$alice->id]);
    }
}
