<?php

declare(strict_types=1);

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

class AddContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('handle') && is_string($this->input('handle'))) {
            $this->merge([
                'handle' => strtolower(ltrim(trim($this->input('handle')), '@')),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'handle' => ['required', 'string', 'exists:users,handle'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'handle.exists' => 'Nenhum usuário encontrado com este @handle.',
        ];
    }
}
