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
                        errors.handle ??
                            'Não foi possível encontrar este @handle.',
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
            toast.error(
                'Configure primeiro suas chaves E2EE (RSA ou ECC) no topo da página antes de enviar mensagens!',
            );
            return;
        }

        if (!activeContact.public_key || !activeContact.key_algorithm) {
            toast.error(
                `O contato @${activeContact.handle} ainda não publicou uma Public Key para receber mensagens criptografadas.`,
            );
            return;
        }

        setIsSending(true);
        try {
            const plaintext = messageText.trim();

            // Encrypt for recipient using recipient's public key & algorithm
            const recipientCiphertext = await encryptForPublicKey(
                activeContact.key_algorithm,
                activeContact.public_key,
                plaintext,
            );

            // Encrypt copy for sender using sender's own public key & algorithm so sender can also unlock it later
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
                        toast.error(
                            'Erro ao enviar a mensagem criptografada.',
                        );
                    },
                },
            );
        } catch (error) {
            console.error(error);
            setIsSending(false);
            toast.error(
                'Falha ao criptografar a mensagem no navegador. Verifique as chaves públicas.',
            );
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
                                <span className="text-xl font-bold tracking-wide">
                                    {currentUser.name}
                                </span>
                                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-sm font-bold text-white">
                                    @{currentUser.handle}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300">
                                Compartilhe seu{' '}
                                <strong>@{currentUser.handle}</strong> para
                                adicionarem você no CRIPTA
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs">
                            {currentUser.public_key && privateKeyPem ? (
                                <>
                                    <CheckCircle2 className="size-4 text-emerald-400" />
                                    <span>
                                        E2EE Ativo ({currentUser.key_algorithm})
                                        — Private Key no Cliente
                                    </span>
                                </>
                            ) : (
                                <>
                                    <ShieldAlert className="size-4 text-amber-300" />
                                    <span>
                                        Chaves E2EE pendentes neste navegador
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
                                    className="text-sm font-bold text-slate-800 dark:text-white"
                                >
                                    Adicionar pessoa pelo @
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
                                            placeholder="usuario_destino"
                                            className="pl-8"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isAddingContact}
                                        className="gap-1.5 bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-800"
                                    >
                                        <UserPlus className="size-4" />
                                        Adicionar
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3">
                            <div className="mb-2 px-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Conversas ({contacts.length})
                            </div>

                            {contacts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-slate-500">
                                    <AtSign className="mb-2 size-8 opacity-50" />
                                    <p className="text-base">
                                        Nenhum contato ainda. Digite o{' '}
                                        <strong>@</strong> de alguém acima para
                                        iniciar um chat criptografado!
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
                                                        : 'hover:bg-slate-100 text-slate-800 dark:text-white dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <div className="truncate text-lg font-bold">
                                                        {contact.name}
                                                    </div>
                                                    <div className="truncate text-xs opacity-75">
                                                        @{contact.handle}
                                                    </div>
                                                </div>

                                                {contact.key_algorithm ? (
                                                    <span
                                                        className={`rounded-md border px-2 py-0.5 text-xs font-bold ${
                                                            isSelected
                                                                ? 'border-white/30 bg-white/10 text-white dark:border-slate-800/30 dark:text-slate-800'
                                                                : 'border-slate-800/20 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                                                        }`}
                                                    >
                                                        {contact.key_algorithm}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs opacity-60">
                                                        Sem chave
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
                                                <h2 className="text-xl font-bold">
                                                    {activeContact.name}
                                                </h2>
                                                <span className="text-sm text-slate-300">
                                                    @{activeContact.handle}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300">
                                                {activeContact.key_algorithm
                                                    ? `Criptografia Ponta a Ponta (${activeContact.key_algorithm}) — Clique no cadeado de cada mensagem para descriptografar`
                                                    : 'Este usuário ainda não configurou uma Public Key'}
                                            </p>
                                        </div>
                                    </div>

                                    {activeContact.key_algorithm && (
                                        <div className="hidden items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold sm:flex">
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
                                            <p className="text-lg font-bold">
                                                Nenhuma mensagem criptografada
                                                ainda
                                            </p>
                                            <p className="max-w-md text-sm">
                                                Envie uma mensagem abaixo. Ela
                                                será criptografada no seu
                                                navegador com a chave pública de{' '}
                                                <strong>
                                                    @{activeContact.handle}
                                                </strong>
                                                .
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
                                            activeContact.public_key
                                                ? `Escreva uma mensagem para @${activeContact.handle} (será criptografada via ${activeContact.key_algorithm})...`
                                                : `Aguardando @${activeContact.handle} configurar sua Public Key...`
                                        }
                                        disabled={
                                            !activeContact.public_key ||
                                            isSending
                                        }
                                        className="flex-1 text-base"
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
                                            ? 'Criptografando...'
                                            : 'Criptografar & Enviar'}
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
                                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-800 text-white">
                                    <Lock className="size-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    Bem-vindo ao CRIPTA
                                </h3>
                                <p className="mt-2 max-w-md text-base">
                                    1. Configure ou gere seu par de chaves (
                                    <strong>RSA</strong> ou <strong>ECC</strong>
                                    ) no botão do topo.
                                    <br />
                                    2. Adicione um contato pelo{' '}
                                    <strong>@handle</strong> na barra lateral.
                                    <br />
                                    3. Clique no cadeado das mensagens para
                                    descriptografar localmente!
                                </p>
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
