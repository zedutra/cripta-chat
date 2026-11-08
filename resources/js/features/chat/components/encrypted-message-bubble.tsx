import { useState } from 'react';
import { toast } from 'sonner';
import {
    PadlockIcon,
    PadlockOpenIcon,
    UnlockingIcon,
} from '@/components/icons/padlock-icons';
import {
    decryptWithPrivateKey,
    getCiphertextPreview,
} from '@/features/chat/lib/crypto-engine';
import type { EncryptedMessageItem } from '@/features/chat/types';
import { useI18n } from '@/lib/i18n';

type Props = {
    message: EncryptedMessageItem;
    isOwnMessage: boolean;
    privateKeyPem: string;
};

export function EncryptedMessageBubble({
    message,
    isOwnMessage,
    privateKeyPem,
}: Props) {
    const [isHoveringLock, setIsHoveringLock] = useState(false);
    const [decryptedText, setDecryptedText] = useState<string | null>(null);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const { t, locale } = useI18n();

    const isUnlocked = decryptedText !== null;
    const targetCiphertext = isOwnMessage
        ? message.sender_ciphertext
        : message.recipient_ciphertext;

    const handleToggleDecrypt = async () => {
        if (isUnlocked) {
            setDecryptedText(null);
            return;
        }

        if (!privateKeyPem.trim()) {
            toast.error(t('bubble.toast.need_privkey'));
            return;
        }

        setIsDecrypting(true);
        try {
            const plaintext = await decryptWithPrivateKey(
                privateKeyPem,
                targetCiphertext,
            );
            setDecryptedText(plaintext);
        } catch (error) {
            console.error(error);
            toast.error(t('bubble.toast.decrypt_failed'));
        } finally {
            setIsDecrypting(false);
        }
    };

    const formattedTime = new Date(message.created_at).toLocaleTimeString(
        locale === 'pt' ? 'pt-BR' : 'en-US',
        {
            hour: '2-digit',
            minute: '2-digit',
        },
    );

    return (
        <div
            className={`flex w-full ${
                isOwnMessage ? 'justify-end' : 'justify-start'
            }`}
        >
            <div
                className={`flex max-w-[85%] items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm transition sm:max-w-[70%] ${
                    isOwnMessage
                        ? 'border-slate-800 bg-slate-800 text-white dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                        : 'border-slate-800/30 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                }`}
            >
                <button
                    type="button"
                    onClick={handleToggleDecrypt}
                    onMouseEnter={() => setIsHoveringLock(true)}
                    onMouseLeave={() => setIsHoveringLock(false)}
                    disabled={isDecrypting}
                    title={
                        isUnlocked
                            ? t('bubble.unlocked_title')
                            : t('bubble.locked_title')
                    }
                    className={`mt-0.5 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-transform hover:scale-105 ${
                        isUnlocked
                            ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                            : isOwnMessage
                              ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                              : 'border-slate-800/30 bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                >
                    {isUnlocked ? (
                        <PadlockOpenIcon className="size-6" />
                    ) : isHoveringLock ? (
                        <UnlockingIcon className="size-6" />
                    ) : (
                        <PadlockIcon className="size-6" />
                    )}
                </button>

                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs opacity-75">
                        <span className="font-semibold">
                            {isUnlocked
                                ? t('bubble.status.unlocked', {
                                      alg: message.algorithm,
                                  })
                                : t('bubble.status.locked', {
                                      alg: message.algorithm,
                                  })}
                        </span>
                        <span>{formattedTime}</span>
                    </div>

                    {isUnlocked ? (
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {decryptedText}
                        </p>
                    ) : (
                        <p
                            onClick={handleToggleDecrypt}
                            className="line-clamp-2 cursor-pointer font-mono text-xs break-all opacity-80 select-none hover:opacity-100"
                        >
                            {getCiphertextPreview(targetCiphertext)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
