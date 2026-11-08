<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        if (isset($input['handle']) && is_string($input['handle'])) {
            $input['handle'] = strtolower(ltrim(trim($input['handle']), '@'));
        }

        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $handle = ! empty($input['handle'])
            ? $input['handle']
            : $this->generateUniqueHandle($input['name']);

        return User::create([
            'name' => $input['name'],
            'handle' => $handle,
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }

    private function generateUniqueHandle(string $name): string
    {
        $base = strtolower(Str::slug($name, '_')) ?: 'cripta_user';
        $base = substr($base, 0, 40);
        $candidate = $base;
        $counter = 1;

        while (User::where('handle', $candidate)->exists()) {
            $candidate = $base.'_'.$counter;
            $counter++;
        }

        return $candidate;
    }
}
