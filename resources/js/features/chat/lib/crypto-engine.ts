import type { GeneratedKeyPair } from '@/features/chat/types';
import type { KeyAlgorithm } from '@/types/auth';

const PRIVATE_KEY_STORAGE_PREFIX = 'cripta_e2ee_private_key_user_';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const cleanBase64 = base64.replace(/\s+/g, '');
    const binary = window.atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function formatPem(base64: string, label: string): string {
    const lines = base64.match(/.{1,64}/g) ?? [base64];
    return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

function stripPemHeaders(pem: string): string {
    return pem
        .replace(/-----BEGIN [^-]+-----/g, '')
        .replace(/-----END [^-]+-----/g, '')
        .replace(/\s+/g, '');
}

/**
 * Generates an E2EE key pair (RSA-OAEP 2048 or ECC ECDH P-256) 100% in the browser.
 */
export async function generateClientKeyPair(
    algorithm: KeyAlgorithm,
): Promise<GeneratedKeyPair> {
    if (algorithm === 'RSA') {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256',
            },
            true,
            ['encrypt', 'decrypt'],
        );

        const spki = await window.crypto.subtle.exportKey(
            'spki',
            keyPair.publicKey,
        );
        const pkcs8 = await window.crypto.subtle.exportKey(
            'pkcs8',
            keyPair.privateKey,
        );

        return {
            algorithm: 'RSA',
            publicKeyPem: formatPem(arrayBufferToBase64(spki), 'PUBLIC KEY'),
            privateKeyPem: formatPem(arrayBufferToBase64(pkcs8), 'PRIVATE KEY'),
        };
    }

    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveKey', 'deriveBits'],
    );

    const spki = await window.crypto.subtle.exportKey(
        'spki',
        keyPair.publicKey,
    );
    const pkcs8 = await window.crypto.subtle.exportKey(
        'pkcs8',
        keyPair.privateKey,
    );

    return {
        algorithm: 'ECC',
        publicKeyPem: formatPem(arrayBufferToBase64(spki), 'PUBLIC KEY'),
        privateKeyPem: formatPem(arrayBufferToBase64(pkcs8), 'PRIVATE KEY'),
    };
}

/**
 * Validates that a user-provided Public Key and Private Key are valid for the selected algorithm.
 */
export async function validateKeyPair(
    algorithm: KeyAlgorithm,
    publicKeyPem: string,
    privateKeyPem: string,
): Promise<void> {
    await importPublicKey(algorithm, publicKeyPem);
    await importPrivateKey(algorithm, privateKeyPem);
}

async function importPublicKey(
    algorithm: KeyAlgorithm,
    publicKeyPem: string,
): Promise<CryptoKey> {
    const der = base64ToArrayBuffer(stripPemHeaders(publicKeyPem));

    if (algorithm === 'RSA') {
        return window.crypto.subtle.importKey(
            'spki',
            der,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true,
            ['encrypt'],
        );
    }

    return window.crypto.subtle.importKey(
        'spki',
        der,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        [],
    );
}

async function importPrivateKey(
    algorithm: KeyAlgorithm,
    privateKeyPem: string,
): Promise<CryptoKey> {
    const der = base64ToArrayBuffer(stripPemHeaders(privateKeyPem));

    if (algorithm === 'RSA') {
        return window.crypto.subtle.importKey(
            'pkcs8',
            der,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['decrypt'],
        );
    }

    return window.crypto.subtle.importKey(
        'pkcs8',
        der,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        ['deriveKey', 'deriveBits'],
    );
}

/**
 * Encrypts plaintext for a target Public Key (RSA or ECC) using Hybrid Encryption:
 * - RSA: AES-GCM-256 content key wrapped with RSA-OAEP-256
 * - ECC: Ephemeral ECDH P-256 key pair deriving an AES-GCM-256 key
 */
export async function encryptForPublicKey(
    algorithm: KeyAlgorithm,
    recipientPublicKeyPem: string,
    plaintext: string,
): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    if (algorithm === 'RSA') {
        const rsaPubKey = await importPublicKey('RSA', recipientPublicKeyPem);
        const aesKey = await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt'],
        );

        const ciphertextBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            data,
        );

        const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            rsaPubKey,
            rawAesKey,
        );

        return JSON.stringify({
            v: 1,
            alg: 'RSA',
            ek: arrayBufferToBase64(encryptedAesKey),
            iv: arrayBufferToBase64(iv.buffer),
            ct: arrayBufferToBase64(ciphertextBuffer),
        });
    }

    // ECC (ECIES / Ephemeral ECDH P-256 + AES-GCM-256)
    const recipientEcPubKey = await importPublicKey(
        'ECC',
        recipientPublicKeyPem,
    );
    const ephemeralKeyPair = await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey'],
    );

    const aesKey = await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: recipientEcPubKey },
        ephemeralKeyPair.privateKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
    );

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        data,
    );

    const ephemeralSpki = await window.crypto.subtle.exportKey(
        'spki',
        ephemeralKeyPair.publicKey,
    );

    return JSON.stringify({
        v: 1,
        alg: 'ECC',
        epk: arrayBufferToBase64(ephemeralSpki),
        iv: arrayBufferToBase64(iv.buffer),
        ct: arrayBufferToBase64(ciphertextBuffer),
    });
}

/**
 * Decrypts a ciphertext payload client-side using the user's Private Key (RSA or ECC).
 */
export async function decryptWithPrivateKey(
    privateKeyPem: string,
    payloadJson: string,
): Promise<string> {
    const payload = JSON.parse(payloadJson) as {
        v: number;
        alg: KeyAlgorithm;
        ek?: string;
        epk?: string;
        iv: string;
        ct: string;
    };

    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
    const ciphertext = base64ToArrayBuffer(payload.ct);
    const decoder = new TextDecoder();

    if (payload.alg === 'RSA') {
        if (!payload.ek) {
            throw new Error('Payload RSA inválido (chave simétrica ausente).');
        }

        const rsaPrivKey = await importPrivateKey('RSA', privateKeyPem);
        const rawAesKey = await window.crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            rsaPrivKey,
            base64ToArrayBuffer(payload.ek),
        );

        const aesKey = await window.crypto.subtle.importKey(
            'raw',
            rawAesKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt'],
        );

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            ciphertext,
        );

        return decoder.decode(decryptedBuffer);
    }

    // ECC
    if (!payload.epk) {
        throw new Error('Payload ECC inválido (chave efêmera ausente).');
    }

    const ecPrivKey = await importPrivateKey('ECC', privateKeyPem);
    const ephemeralPubKey = await window.crypto.subtle.importKey(
        'spki',
        base64ToArrayBuffer(payload.epk),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        [],
    );

    const aesKey = await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: ephemeralPubKey },
        ecPrivKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        ciphertext,
    );

    return decoder.decode(decryptedBuffer);
}

/**
 * Format a visual preview of the encrypted payload so the user sees it is encrypted before clicking the padlock.
 */
export function getCiphertextPreview(payloadJson: string): string {
    try {
        const parsed = JSON.parse(payloadJson) as {
            alg?: string;
            ct?: string;
        };
        if (parsed.ct) {
            return `[${parsed.alg ?? 'E2EE'}] ${parsed.ct}`;
        }
    } catch {
        // Fallback to raw string
    }
    return payloadJson;
}

/**
 * Local-only storage helpers for the user's Private Key (never transmitted to the backend).
 */
export function loadLocalPrivateKey(userId: number): string {
    if (typeof window === 'undefined') {
        return '';
    }
    return (
        window.localStorage.getItem(`${PRIVATE_KEY_STORAGE_PREFIX}${userId}`) ??
        ''
    );
}

export function saveLocalPrivateKey(userId: number, privateKeyPem: string): void {
    if (typeof window === 'undefined') {
        return;
    }
    window.localStorage.setItem(
        `${PRIVATE_KEY_STORAGE_PREFIX}${userId}`,
        privateKeyPem.trim(),
    );
}

export function clearLocalPrivateKey(userId: number): void {
    if (typeof window === 'undefined') {
        return;
    }
    window.localStorage.removeItem(`${PRIVATE_KEY_STORAGE_PREFIX}${userId}`);
}
