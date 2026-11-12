import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    KeyRound,
    Lock,
    Send,
    ShieldAlert,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PadlockIcon } from '@/components/icons/padlock-icons';
import { ProfileAvatarIcon } from '@/components/icons/profile-avatar-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    CriptoAssistenteChat,
    EncryptedMessageBubble,
    KeyManagerModal,
    encryptForPublicKey,
    loadLocalPrivateKey,
} from '@/features/chat';
import type { ChatContact, EncryptedMessageItem } from '@/features/chat';
import { useI18n } from '@/lib/i18n';
import { dashboard } from '@/routes';
import type { Auth } from '@/types/auth';

type Props = {
    contacts: ChatContact[];
    activeContactId: number | null;
    messages: EncryptedMessageItem[];
    isAssistantActive?: boolean;
};

export default function Dashboard({
    contacts = [],
    activeContactId = null,
    messages = [],
    isAssistantActive = false,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const currentUser = auth.user;
    const { t } = useI18n();

    const [privateKeyPem, setPrivateKeyPem] = useState<string>('');
    const [messageText, setMessageText] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [liveMessages, setLiveMessages] =
        useState<EncryptedMessageItem[]>(messages);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const prevLastMessageIdRef = useRef<number | null>(
        messages[messages.length - 1]?.id ?? null,
    );

    useEffect(() => {
        setPrivateKeyPem(loadLocalPrivateKey(currentUser.id));
    }, [currentUser.id]);

    useEffect(() => {
        setLiveMessages(messages);
    }, [messages]);

    const activeContact = isAssistantActive
        ? null
        : (contacts.find((c) => c.id === activeContactId) ??
          contacts[0] ??
          null);

    // Scroll to bottom when switching active contact
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
                messagesContainerRef.current.scrollHeight;
        }
    }, [activeContact?.id]);

    // Auto-scroll smoothly when a new message arrives
    useEffect(() => {
        const lastId = liveMessages[liveMessages.length - 1]?.id ?? null;
        if (lastId !== prevLastMessageIdRef.current) {
            prevLastMessageIdRef.current = lastId;
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTo({
                    top: messagesContainerRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }
        }
    }, [liveMessages]);

    // Real-time background synchronization for incoming messages and contact updates
    useEffect(() => {
        let isCancelled = false;

        const pollChatUpdates = async () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            try {
                const query = activeContact?.id
                    ? `?contact=${activeContact.id}`
                    : '';
                const response = await fetch(`/chat/sync${query}`, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok || isCancelled) {
                    return;
                }

                const data = (await response.json()) as {
                    contacts: ChatContact[];
                    activeContactId: number | null;
                    messages: EncryptedMessageItem[];
                };

                if (isCancelled) {
                    return;
                }

                setLiveMessages((prev) => {
                    const prevLastId = prev[prev.length - 1]?.id ?? null;
                    const nextLastId =
                        data.messages[data.messages.length - 1]?.id ?? null;
                    if (
                        prev.length !== data.messages.length ||
                        prevLastId !== nextLastId
                    ) {
                        return data.messages;
                    }
                    return prev;
                });

                const contactsSignature = JSON.stringify(
                    contacts.map((c) => [
                        c.id,
                        c.handle,
                        c.avatar_icon,
                        c.public_key,
                        c.key_algorithm,
                    ]),
                );
                const nextContactsSignature = JSON.stringify(
                    data.contacts.map((c) => [
                        c.id,
                        c.handle,
                        c.avatar_icon,
                        c.public_key,
                        c.key_algorithm,
                    ]),
                );

                if (contactsSignature !== nextContactsSignature) {
                    router.reload({
                        only: ['contacts', 'activeContactId', 'messages'],
                    });
                }
            } catch {
                // Ignore transient network errors during background sync
            }
        };

        const intervalId = window.setInterval(() => {
            void pollChatUpdates();
        }, 2500);

        return () => {
            isCancelled = true;
            window.clearInterval(intervalId);
        };
    }, [activeContact?.id, contacts]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeContact || !messageText.trim()) {
            return;
        }

        if (!currentUser.public_key || !currentUser.key_algorithm) {
            toast.error(t('chat.toast.configure_first'));
            return;
        }

        if (!activeContact.public_key || !activeContact.key_algorithm) {
            toast.error(
                t('chat.toast.recipient_no_key', {
                    handle: activeContact.handle,
                }),
            );
            return;
        }

        setIsSending(true);
        try {
            const plaintext = messageText.trim();

            const recipientCiphertext = await encryptForPublicKey(
                activeContact.key_algorithm,
                activeContact.public_key,
                plaintext,
            );

            const senderCiphertext = await encryptForPublicKey(
                currentUser.key_algorithm,
                currentUser.public_key,
                plaintext,
            );

            router.post(
                '/chat/messages',
                {
                    recipient_id: activeContact.id,
                    algorithm: activeContact.key_algorithm,
                    recipient_ciphertext: recipientCiphertext,
                    sender_ciphertext: senderCiphertext,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setMessageText('');
                        setIsSending(false);
                    },
                    onError: () => {
                        setIsSending(false);
                        toast.error(t('chat.toast.send_error'));
                    },
                },
            );
        } catch (error) {
            console.error(error);
            setIsSending(false);
            toast.error(t('chat.toast.encrypt_error'));
        }
    };

    return (
        <>
            <Head title="CRIPTA Chat E2EE" />

            <div className="flex h-[calc(100vh-4rem)] flex-1 flex-col gap-4 p-4">
                {/* Top Status Bar: User @handle & Key Manager */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/20 bg-slate-800 px-5 py-3 text-white shadow-sm dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-800">
                            <ProfileAvatarIcon
                                icon={currentUser.avatar_icon}
                                className="size-6 fill-current"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-wide">
                                    @{currentUser.handle}
                                </h1>
                            </div>
                            <p className="text-xs text-slate-300">
                                {t('chat.share_handle_prefix')}{' '}
                                <strong>@{currentUser.handle}</strong>{' '}
                                {t('chat.share_handle_suffix')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs">
                            {currentUser.public_key && privateKeyPem ? (
                                <>
                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                                    <span>
                                        {t('chat.status.active')} (
                                        {currentUser.key_algorithm}) —{' '}
                                        {t('chat.status.client_key')}
                                    </span>
                                </>
                            ) : currentUser.public_key &&
                              currentUser.key_algorithm ? (
                                <>
                                    <ShieldAlert className="size-4 shrink-0 text-amber-300" />
                                    <span>
                                        {t(
                                            'chat.status.key_exists_missing_priv',
                                            {
                                                alg: currentUser.key_algorithm,
                                            },
                                        )}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <ShieldAlert className="size-4 shrink-0 text-amber-300" />
                                    <span>
                                        {t('chat.status.no_key_created')}
                                    </span>
                                </>
                            )}
                        </div>

                        <KeyManagerModal
                            user={currentUser}
                            privateKeyPem={privateKeyPem}
                            onPrivateKeyChange={setPrivateKeyPem}
                        />
                    </div>
                </div>

                {/* Full-Width Encrypted Chat Window */}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800/20 bg-white dark:border-slate-700 dark:bg-slate-900">
                    {isAssistantActive ? (
                        <CriptoAssistenteChat />
                    ) : activeContact ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between border-b border-slate-800/15 bg-slate-800 px-5 py-3.5 text-white dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
                                        <ProfileAvatarIcon
                                            icon={activeContact.avatar_icon}
                                            className="size-6 fill-current text-white"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-bold">
                                                @{activeContact.handle}
                                            </h2>
                                        </div>
                                        <p className="text-xs text-slate-300">
                                            {activeContact.key_algorithm
                                                ? t('chat.header.e2ee_info', {
                                                      alg: activeContact.key_algorithm,
                                                  })
                                                : t('chat.header.no_pubkey')}
                                        </p>
                                    </div>
                                </div>

                                {activeContact.key_algorithm && (
                                    <div className="hidden items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold sm:flex">
                                        <KeyRound className="size-3.5" />
                                        Public Key:{' '}
                                        {activeContact.key_algorithm}
                                    </div>
                                )}
                            </div>

                            {/* Messages List */}
                            <div
                                ref={messagesContainerRef}
                                className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-5 dark:bg-slate-950/50"
                            >
                                {liveMessages.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                                        <PadlockIcon className="mb-3 size-12 opacity-40" />
                                        <h3 className="text-2xl font-bold">
                                            {t('chat.empty.title')}
                                        </h3>
                                        <p className="max-w-md text-sm">
                                            {t('chat.empty.desc', {
                                                handle: activeContact.handle,
                                            })}
                                        </p>
                                    </div>
                                ) : (
                                    liveMessages.map((msg) => (
                                        <EncryptedMessageBubble
                                            key={msg.id}
                                            message={msg}
                                            isOwnMessage={
                                                msg.sender_id ===
                                                currentUser.id
                                            }
                                            privateKeyPem={privateKeyPem}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Message Composer */}
                            <form
                                onSubmit={handleSendMessage}
                                className="flex items-center gap-3 border-t border-slate-800/15 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                            >
                                <Input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) =>
                                        setMessageText(e.target.value)
                                    }
                                    placeholder={
                                        activeContact.public_key &&
                                        activeContact.key_algorithm
                                            ? t('chat.composer.placeholder', {
                                                  handle: activeContact.handle,
                                                  alg: activeContact.key_algorithm,
                                              })
                                            : t('chat.composer.waiting_key', {
                                                  handle: activeContact.handle,
                                              })
                                    }
                                    disabled={
                                        !activeContact.public_key || isSending
                                    }
                                    className="flex-1 text-sm"
                                />
                                <Button
                                    type="submit"
                                    disabled={
                                        !activeContact.public_key ||
                                        !messageText.trim() ||
                                        isSending
                                    }
                                    className="gap-2 border border-slate-800 bg-slate-800 px-5 text-white hover:bg-white hover:text-slate-800 dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    <Send className="size-4" />
                                    {isSending
                                        ? t('chat.composer.encrypting')
                                        : t('chat.composer.send')}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
                            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-800 text-white">
                                <Lock className="size-8" />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                                {t('chat.welcome.title')}
                            </h3>
                            <div className="mt-3 max-w-md space-y-1 text-sm">
                                <p>{t('chat.welcome.step1')}</p>
                                <p>{t('chat.welcome.step2')}</p>
                                <p>{t('chat.welcome.step3')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'CRIPTA Chat E2EE',
            href: dashboard(),
        },
    ],
};
