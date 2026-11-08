import type { KeyAlgorithm } from '@/types/auth';

export type ChatContact = {
    id: number;
    handle: string;
    avatar_icon?: string | null;
    public_key: string | null;
    key_algorithm: KeyAlgorithm | null;
};

export type EncryptedMessageItem = {
    id: number;
    sender_id: number;
    recipient_id: number;
    algorithm: KeyAlgorithm;
    recipient_ciphertext: string;
    sender_ciphertext: string;
    created_at: string;
};

export type GeneratedKeyPair = {
    algorithm: KeyAlgorithm;
    publicKeyPem: string;
    privateKeyPem: string;
};
