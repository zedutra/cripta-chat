import { router } from '@inertiajs/react';
import {
    Download,
    KeyRound,
    ShieldCheck,
    Sparkles,
    Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    generateClientKeyPair,
    saveLocalPrivateKey,
    validateKeyPair,
} from '@/features/chat/lib/crypto-engine';
import { useI18n } from '@/lib/i18n';
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
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { t } = useI18n();

    useEffect(() => {
        setPrivateKeyInput(privateKeyPem);
    }, [privateKeyPem]);

    useEffect(() => {
        if (user.public_key) {
            setPublicKeyInput(user.public_key);
        }
        if (user.key_algorithm) {
            setAlgorithm(user.key_algorithm);
        }
    }, [user.public_key, user.key_algorithm]);

    const handleGenerateKeys = async (targetAlg?: KeyAlgorithm) => {
        const activeAlg = targetAlg ?? algorithm;
        setIsGenerating(true);
        try {
            const pair = await generateClientKeyPair(activeAlg);
            setPublicKeyInput(pair.publicKeyPem);
            setPrivateKeyInput(pair.privateKeyPem);
            toast.success(t('keys.toast.generated', { alg: activeAlg }));
        } catch (error) {
            console.error(error);
            toast.error(t('keys.toast.generate_error'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOpenAndGenerateNew = () => {
        setOpen(true);
        void handleGenerateKeys(user.key_algorithm ?? algorithm);
    };

    const handlePemFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            const privateMatch = text.match(
                /-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/,
            );
            const publicMatch = text.match(
                /-----BEGIN PUBLIC KEY-----[\s\S]+?-----END PUBLIC KEY-----/,
            );

            if (!privateMatch) {
                toast.error(t('keys.toast.pem_invalid_format'));
                return;
            }

            const extractedPriv = privateMatch[0].trim();
            const extractedPub = publicMatch ? publicMatch[0].trim() : '';

            // 1. If the user already has a public_key on their account, check if the uploaded private key matches it
            if (user.public_key && user.key_algorithm) {
                try {
                    await validateKeyPair(
                        user.key_algorithm,
                        user.public_key,
                        extractedPriv,
                    );
                    saveLocalPrivateKey(user.id, extractedPriv);
                    onPrivateKeyChange(extractedPriv);
                    setPrivateKeyInput(extractedPriv);
                    setPublicKeyInput(user.public_key);
                    setAlgorithm(user.key_algorithm);
                    setOpen(false);
                    toast.success(t('keys.toast.pem_uploaded'));
                    return;
                } catch {
                    // Does not match current server public_key; fall through to check if file contains a full key pair
                }
            }

            // 2. If the uploaded .PEM file contains both Public Key and Private Key, validate and publish
            if (extractedPub) {
                const candidateAlgorithms: KeyAlgorithm[] =
                    algorithm === 'ECC' ? ['ECC', 'RSA'] : ['RSA', 'ECC'];

                for (const candidateAlg of candidateAlgorithms) {
                    try {
                        await validateKeyPair(
                            candidateAlg,
                            extractedPub,
                            extractedPriv,
                        );
                        setAlgorithm(candidateAlg);
                        setPublicKeyInput(extractedPub);
                        setPrivateKeyInput(extractedPriv);
                        saveLocalPrivateKey(user.id, extractedPriv);
                        onPrivateKeyChange(extractedPriv);

                        router.put(
                            '/chat/keys',
                            {
                                public_key: extractedPub,
                                key_algorithm: candidateAlg,
                            },
                            {
                                preserveScroll: true,
                                onSuccess: () => {
                                    setOpen(false);
                                    toast.success(t('keys.toast.pem_uploaded'));
                                },
                            },
                        );
                        return;
                    } catch {
                        // Try next algorithm
                    }
                }
            }

            // 3. Could not validate automatically: populate fields and open modal for manual inspection
            setPrivateKeyInput(extractedPriv);
            if (extractedPub) {
                setPublicKeyInput(extractedPub);
            }
            setOpen(true);
            toast.error(t('keys.toast.pem_mismatch'));
        } catch (error) {
            console.error(error);
            toast.error(t('keys.toast.pem_invalid_format'));
        }
    };

    const handleDownloadKeys = () => {
        if (!publicKeyInput || !privateKeyInput) {
            toast.error(t('keys.toast.fill_before_download'));
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
            toast.error(t('keys.toast.fill_both'));
            return;
        }

        setIsSaving(true);
        try {
            await validateKeyPair(algorithm, publicKeyInput, privateKeyInput);
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            toast.error(t('keys.toast.invalid_pair', { alg: algorithm }));
            return;
        }

        saveLocalPrivateKey(user.id, privateKeyInput);
        onPrivateKeyChange(privateKeyInput.trim());

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

    const hasServerPublicKey = Boolean(user.public_key && user.key_algorithm);
    const hasConfiguredKeys = Boolean(hasServerPublicKey && privateKeyPem);

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".pem,.key,.txt"
                className="hidden"
                onChange={handlePemFileUpload}
            />

            {hasConfiguredKeys && user.key_algorithm ? (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(true)}
                    className="gap-2 border border-white bg-white text-slate-800 hover:bg-slate-900 hover:text-white dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-900 dark:hover:text-white"
                >
                    <KeyRound className="size-4" />
                    {t('keys.button.configured', {
                        alg: user.key_algorithm,
                    })}
                </Button>
            ) : hasServerPublicKey ? (
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2 border border-white bg-white text-slate-800 hover:bg-slate-900 hover:text-white dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-900 dark:hover:text-white"
                    >
                        <Upload className="size-4" />
                        {t('keys.button.upload_pem')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenAndGenerateNew}
                        className="gap-2 border border-white/60 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-800 dark:border-white/60 dark:bg-transparent dark:text-white dark:hover:bg-white dark:hover:text-slate-800"
                    >
                        <Sparkles className="size-4" />
                        {t('keys.button.generate_new')}
                    </Button>
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        onClick={handleOpenAndGenerateNew}
                        className="gap-2 border border-white bg-white text-slate-800 hover:bg-slate-900 hover:text-white dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-900 dark:hover:text-white"
                    >
                        <Sparkles className="size-4" />
                        {t('keys.button.generate_new')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2 border border-white/60 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-800 dark:border-white/60 dark:bg-transparent dark:text-white dark:hover:bg-white dark:hover:text-slate-800"
                    >
                        <Upload className="size-4" />
                        {t('keys.button.upload_pem')}
                    </Button>
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <ShieldCheck className="size-6" />
                            {t('keys.modal.title')}
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            {t('keys.modal.desc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-300 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm font-semibold">
                                    {t('keys.algorithm')}
                                </Label>
                                <div className="inline-flex gap-1 rounded-md border border-slate-800 p-0.5 dark:border-white">
                                    <button
                                        type="button"
                                        onClick={() => setAlgorithm('RSA')}
                                        className={`cursor-pointer rounded px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                                            algorithm === 'RSA'
                                                ? 'bg-slate-800 text-white hover:bg-slate-600 dark:bg-white dark:text-slate-800 dark:hover:bg-slate-200'
                                                : 'text-slate-800 hover:bg-slate-800 hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-slate-800'
                                        }`}
                                    >
                                        RSA (RSA-OAEP 2048)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAlgorithm('ECC')}
                                        className={`cursor-pointer rounded px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                                            algorithm === 'ECC'
                                                ? 'bg-slate-800 text-white hover:bg-slate-600 dark:bg-white dark:text-slate-800 dark:hover:bg-slate-200'
                                                : 'text-slate-800 hover:bg-slate-800 hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-slate-800'
                                        }`}
                                    >
                                        ECC (ECDH P-256)
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="gap-1.5"
                                >
                                    <Upload className="size-4" />
                                    {t('keys.upload_pem_btn')}
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => void handleGenerateKeys()}
                                    disabled={isGenerating}
                                    className="gap-1.5 border border-slate-800 font-semibold"
                                >
                                    <Sparkles className="size-4" />
                                    {isGenerating
                                        ? t('keys.generating')
                                        : t('keys.generate_btn', {
                                              alg: algorithm,
                                          })}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadKeys}
                                    className="gap-1.5"
                                >
                                    <Download className="size-4" />
                                    {t('keys.download_pem')}
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="public_key_pem"
                                className="text-sm font-semibold"
                            >
                                {t('keys.pubkey_label')}
                            </Label>
                            <textarea
                                id="public_key_pem"
                                rows={5}
                                value={publicKeyInput}
                                onChange={(e) =>
                                    setPublicKeyInput(e.target.value)
                                }
                                placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                                className="w-full rounded-md border border-slate-400 bg-white p-2.5 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-slate-800 focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="private_key_pem"
                                className="text-sm font-semibold"
                            >
                                {t('keys.privkey_label')}
                            </Label>
                            <textarea
                                id="private_key_pem"
                                rows={6}
                                value={privateKeyInput}
                                onChange={(e) =>
                                    setPrivateKeyInput(e.target.value)
                                }
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
                            className="w-full gap-2 border border-slate-800 bg-slate-800 text-white hover:bg-white hover:text-slate-800 sm:w-auto dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                            <Upload className="size-4" />
                            {isSaving ? t('keys.saving') : t('keys.save_btn')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
