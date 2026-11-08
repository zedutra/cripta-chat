import { Head, router, usePage } from '@inertiajs/react';
import {
    AtSign,
    CheckCircle2,
    KeyRound,
    Lock,
    Send,
    ShieldAlert,
    UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AppLogoIcon from '@/components/app-logo-icon';
import { PadlockIcon } from '@/components/icons/padlock-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
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
};

export default function Dashboard({
    contacts = [],
    activeContactId = null,
    messages = [],
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const currentUser = auth.user;
    const { t } = useI18n();

    const [privateKeyPem, setPrivateKeyPem] = useState<string>('');
    const [handleSearch, setHandleSearch] = useState<string>('');
    const [isAddingContact, setIsAddingContact] = useState<boolean>(false);
    const [messageText, setMessageText] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);

    useEffect(() => {
        setPrivateKeyPem(loadLocalPrivateKey(currentUser.id));
    }, [currentUser.id]);

    const activeContact =
        contacts.find((c) => c.id === activeContactId) ?? null;

    const handleAddContact = (e: React.FormEvent) => {
        e.preventDefault();
        if (!handleSearch.trim()) {
            return;
        }

        setIsAddingContact(true);
        router.post(
            '/chat/contacts',
            { handle: handleSearch.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setHandleSearch('');
                    setIsAddingContact(false);
                },
                onError: (errors) => {
                    setIsAddingContact(false);
                    toast.error(
                        errors.handle ?? t('chat.toast.handle_not_found'),
                    );
                },
            },
        );
    };

    const handleSelectContact = (contactId: number) => {
        router.get(
            '/dashboard',
            { contact: contactId },
            { preserveState: true, preserveScroll: true },
        );
    };

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
                            <AppLogoIcon className="size-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-wide">
                                    {currentUser.name}
                                </h1>
                                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-sm font-semibold text-white">
                                    @{currentUser.handle}
                                </span>
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
                                    <CheckCircle2 className="size-4 text-emerald-400" />
                                    <span>
                                        {t('chat.status.active')} (
                                        {currentUser.key_algorithm}) —{' '}
                                        {t('chat.status.client_key')}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <ShieldAlert className="size-4 text-amber-300" />
                                    <span>{t('chat.status.pending')}</span>
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

                {/* Main Chat Split Layout */}
                <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-12">
                    {/* Left Column: Add by @handle & Contacts List */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-800/20 bg-white md:col-span-4 dark:border-slate-700 dark:bg-slate-900">
                        <div className="border-b border-slate-800/15 p-4 dark:border-slate-800">
                            <form
                                onSubmit={handleAddContact}
                                className="flex flex-col gap-2"
                            >
                                <label
                                    htmlFor="add-handle-input"
                                    className="text-sm font-semibold text-slate-800 dark:text-white"
                                >
                                    {t('chat.add_contact.label')}
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <AtSign className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-slate-500" />
                                        <Input
                                            id="add-handle-input"
                                            type="text"
                                            value={handleSearch}
                                            onChange={(e) =>
                                                setHandleSearch(e.target.value)
                                            }
                                            placeholder={t(
                                                'chat.add_contact.placeholder',
                                            )}
                                            className="pl-8"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isAddingContact}
                                        className="gap-1.5 bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-800"
                                    >
                                        <UserPlus className="size-4" />
                                        {t('chat.add_contact.button')}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3">
                            <div className="mb-2 px-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                {t('chat.conversations')} ({contacts.length})
                            </div>

                            {contacts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-slate-500">
                                    <AtSign className="mb-2 size-8 opacity-50" />
                                    <p className="text-sm">
                                        {t('chat.no_contacts')}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    {contacts.map((contact) => {
                                        const isSelected =
                                            contact.id === activeContact?.id;
                                        return (
                                            <button
                                                key={contact.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectContact(
                                                        contact.id,
                                                    )
                                                }
                                                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition ${
                                                    isSelected
                                                        ? 'bg-slate-800 text-white shadow-sm dark:bg-white dark:text-slate-800'
                                                        : 'text-slate-800 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <div className="truncate font-heading text-xl font-bold">
                                                        {contact.name}
                                                    </div>
                                                    <div className="truncate text-xs opacity-75">
                                                        @{contact.handle}
                                                    </div>
                                                </div>

                                                {contact.key_algorithm ? (
                                                    <span
                                                        className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                                                            isSelected
                                                                ? 'border-white/30 bg-white/10 text-white dark:border-slate-800/30 dark:text-slate-800'
                                                                : 'border-slate-800/20 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                                                        }`}
                                                    >
                                                        {contact.key_algorithm}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs opacity-60">
                                                        {t('chat.no_key')}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Encrypted Chat Window */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-800/20 bg-white md:col-span-8 dark:border-slate-700 dark:bg-slate-900">
                        {activeContact ? (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center justify-between border-b border-slate-800/15 bg-slate-800 px-5 py-3.5 text-white dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
                                            <PadlockIcon className="size-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-2xl font-bold">
                                                    {activeContact.name}
                                                </h2>
                                                <span className="text-sm text-slate-300">
                                                    @{activeContact.handle}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300">
                                                {activeContact.key_algorithm
                                                    ? t(
                                                          'chat.header.e2ee_info',
                                                          {
                                                              alg: activeContact.key_algorithm,
                                                          },
                                                      )
                                                    : t(
                                                          'chat.header.no_pubkey',
                                                      )}
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
                                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-5 dark:bg-slate-950/50">
                                    {messages.length === 0 ? (
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
                                        messages.map((msg) => (
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
                                                ? t(
                                                      'chat.composer.placeholder',
                                                      {
                                                          handle: activeContact.handle,
                                                          alg: activeContact.key_algorithm,
                                                      },
                                                  )
                                                : t(
                                                      'chat.composer.waiting_key',
                                                      {
                                                          handle: activeContact.handle,
                                                      },
                                                  )
                                        }
                                        disabled={
                                            !activeContact.public_key ||
                                            isSending
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
                                        className="gap-2 bg-slate-800 px-5 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-800"
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
