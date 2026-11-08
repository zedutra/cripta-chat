<?php

declare(strict_types=1);

namespace App\Enums;

enum KeyAlgorithm: string
{
    case RSA = 'RSA';
    case ECC = 'ECC';

    public function label(): string
    {
        return match ($this) {
            self::RSA => 'RSA-OAEP (2048-bit)',
            self::ECC => 'ECC (ECDH P-256)',
        };
    }
}
