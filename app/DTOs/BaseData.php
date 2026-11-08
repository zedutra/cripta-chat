<?php

declare(strict_types=1);

namespace App\DTOs;

abstract readonly class BaseData
{
    /**
     * Convert the DTO instance to an associative array.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return get_object_vars($this);
    }
}
