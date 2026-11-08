import { router } from '@inertiajs/react';
import { Download, KeyRound, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    generateClientKeyPair,
    saveLocalPrivateKey,
    validateKeyPair,
} from '@/features/chat/lib/crypto-engine';
import type { KeyAlgorithm, User } from '@/types/auth';

type Props = {
    user: User;
    privateKeyPem: string;
    onPrivateKeyChange: (newPrivateKey: string) => void;
};

export function KeyManagerModal({
    user,
    privateKeyPem,
    onPrivateKeyChange,
}: Props) {
    const [open, setOpen] = useState(false);
    const [algorithm, setAlgorithm] = useState<KeyAlgorithm>(
        user.key_algorithm ?? 'RSA',
    );
    const [publicKeyInput, setPublicKeyInput] = useState<string>(
        user.public_key ?? '',
    );
    const [privateKeyInput, setPrivateKeyInput] =
        useState<string>(privateKeyPem);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleGenerateKeys = async () => {
        setIsGenerating(true);
        try {
            const pair = await generateClientKeyPair(algorithm);
            setPublicKeyInput(pair.publicKeyPem);
            setPrivateKeyInput(pair.privateKeyPem);
            toast.success(
                `Par de chaves ${algorithm} gerado no seu navegador!`,
            );
        } catch (error) {
            console.error(error);
            toast.error('Falha ao gerar o par de chaves via Web Crypto API.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadKeys = () => {
        if (!publicKeyInput || !privateKeyInput) {
            toast.error('Preencha ou gere as chaves antes de baixar.');
            return;
        }

        const content = [
            `=== CRIPTA E2EE KEY PAIR (${algorithm}) ===`,
            `User: @${user.handle}`,
            `IMPORTANTE: Nunca compartilhe sua PRIVATE KEY! O servidor CRIPTA nao possui copia dela.`,
            '',
            publicKeyInput.trim(),
            '',
            privateKeyInput.trim(),
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cripta-${user.handle}-${algorithm.toLowerCase()}-keys.pem`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleSaveAndPublish = async () => {
        if (!publicKeyInput.trim() || !privateKeyInput.trim()) {
            toast.error(
                'Informe tanto a Public Key quanto a sua Private Key.',
            );
            return;
        }

        setIsSaving(true);
        try {
            await validateKeyPair(algorithm, publicKeyInput, privateKeyInput);
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            toast.error(
                `As chaves informadas não são válidas para o algoritmo ${algorithm}. Verifique o formato PEM.`,
            );
            return;
        }

        // Save Private Key strictly on client side (never sent to backend)
        saveLocalPrivateKey(user.id, privateKeyInput);
        onPrivateKeyChange(privateKeyInput.trim());

        // Send ONLY Public Key and algorithm to the server
        router.put(
            '/chat/keys',
            {
                public_key: publicKeyInput.trim(),
                key_algorithm: algorithm,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    setOpen(false);
                },
                onError: (errors) => {
                    setIsSaving(false);
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        firstError ?? 'Erro ao salvar a Public Key no servidor.',
                    );
                },
            },
        );
    };

    const hasConfiguredKeys = Boolean(user.public_key && privateKeyPem);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={hasConfiguredKeys ? 'outline' : 'default'}
                    className="gap-2 border-slate-800 bg-slate-800 text-white hover:bg-slate-700 dark:border-white dark:bg-white dark:text-slate-800"
                >
                    <KeyRound className="size-4" />
                    {hasConfiguredKeys
                        ? `Chaves E2EE (${user.key_algorithm})`
                        : 'Configurar Chaves (RSA / ECC)'}
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <ShieldCheck className="size-6" />
                        Gerenciador de Chaves E2EE (RSA & ECC)
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Você pode <strong>gerar</strong> um novo par de chaves ou{' '}
                        <strong>colar suas próprias chaves</strong>. O servidor
                        armazena apenas a sua <strong>Public Key</strong>. Sua{' '}
                        <strong>Private Key</strong> fica exclusivamente no seu
                        navegador para descriptografia client-side.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-300 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                            <Label className="text-base font-bold">
                                Algoritmo:
                            </Label>
                            <div className="inline-flex rounded-md border border-slate-800 p-0.5 dark:border-white">
                                <button
                                    type="button"
                                    onClick={() => setAlgorithm('RSA')}
                                    className={`rounded px-3 py-1 text-sm font-bold transition ${
                                        algorithm === 'RSA'
                                            ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800'
                                            : 'text-slate-800 dark:text-white'
                                    }`}
                                >
                                    RSA (RSA-OAEP 2048)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAlgorithm('ECC')}
                                    className={`rounded px-3 py-1 text-sm font-bold transition ${
                                        algorithm === 'ECC'
                                            ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800'
                                            : 'text-slate-800 dark:text-white'
                                    }`}
                                >
                                    ECC (ECDH P-256)
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleGenerateKeys}
                                disabled={isGenerating}
                                className="gap-1.5 border border-slate-800 font-bold"
                            >
                                <Sparkles className="size-4" />
                                {isGenerating
                                    ? 'Gerando...'
                                    : `Gerar Par ${algorithm}`}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadKeys}
                                className="gap-1.5"
                            >
                                <Download className="size-4" />
                                Baixar .PEM
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="public_key_pem" className="text-base font-bold">
                            Public Key (Enviada ao servidor para que contatos criptografem mensagens para você)
                        </Label>
                        <textarea
                            id="public_key_pem"
                            rows={5}
                            value={publicKeyInput}
                            onChange={(e) => setPublicKeyInput(e.target.value)}
                            placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                            className="w-full rounded-md border border-slate-400 bg-white p-2.5 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-slate-800 focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="private_key_pem" className="text-base font-bold">
                            Private Key (NUNCA enviada ao servidor — usada apenas no cliente para abrir os cadeados)
                        </Label>
                        <textarea
                            id="private_key_pem"
                            rows={6}
                            value={privateKeyInput}
                            onChange={(e) => setPrivateKeyInput(e.target.value)}
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                            className="w-full rounded-md border border-slate-400 bg-white p-2.5 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-slate-800 focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        onClick={handleSaveAndPublish}
                        disabled={isSaving}
                        className="w-full gap-2 bg-slate-800 text-white hover:bg-slate-700 sm:w-auto dark:bg-white dark:text-slate-800"
                    >
                        <Upload className="size-4" />
                        {isSaving
                            ? 'Validando e Salvando...'
                            : 'Publicar Public Key & Guardar Private Key Localmente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
