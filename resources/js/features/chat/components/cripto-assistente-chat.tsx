import { Bot, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MarkdownContent } from '@/components/markdown-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';

type AssistantMessage = {
    id: string;
    role: 'user' | 'assistant' | string;
    content: string;
    created_at: string | null;
};

function getXsrfToken(): string {
    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));

    return match ? decodeURIComponent(match.split('=')[1]) : '';
}

export function CriptoAssistenteChat() {
    const { t } = useI18n();
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [question, setQuestion] = useState<string>('');
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
    const [isThinking, setIsThinking] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let isCancelled = false;

        fetch('/chat/assistant', {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        })
            .then((response) => (response.ok ? response.json() : null))
            .then((data: { messages: AssistantMessage[] } | null) => {
                if (!isCancelled && data) {
                    setMessages(data.messages);
                }
            })
            .catch(() => undefined)
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingHistory(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        containerRef.current?.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [messages, isThinking]);

    const handleAsk = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = question.trim();

        if (!text || isThinking) {
            return;
        }

        const optimisticMessage: AssistantMessage = {
            id: `local-${Date.now()}`,
            role: 'user',
            content: text,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setQuestion('');
        setIsThinking(true);

        try {
            const response = await fetch('/chat/assistant', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ message: text }),
            });

            const data = (await response.json()) as {
                reply?: string;
                messages?: AssistantMessage[];
                message?: string;
            };

            if (!response.ok) {
                throw new Error(data.message ?? t('assistant.toast.error'));
            }

            setMessages(data.messages ?? []);
        } catch (error) {
            setMessages((prev) =>
                prev.filter((m) => m.id !== optimisticMessage.id),
            );
            setQuestion(text);
            toast.error(
                error instanceof Error && error.message
                    ? error.message
                    : t('assistant.toast.error'),
            );
        } finally {
            setIsThinking(false);
        }
    };

    const suggestions = [
        t('assistant.suggestion.keys'),
        t('assistant.suggestion.padlock'),
        t('assistant.suggestion.contacts'),
    ];

    return (
        <>
            {/* Assistant Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-800/15 bg-slate-800 px-5 py-3.5 text-white dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-800">
                        <Bot className="size-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">
                            {t('assistant.name')}
                        </h2>
                        <p className="text-xs text-slate-300">
                            {t('assistant.subtitle')}
                        </p>
                    </div>
                </div>
                <div className="hidden items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold sm:flex">
                    <Sparkles className="size-3.5" />
                    Laravel AI SDK
                </div>
            </div>

            {/* Assistant Messages */}
            <div
                ref={containerRef}
                className="flex-1 min-h-0 space-y-4 overflow-y-auto bg-slate-50/60 p-5 dark:bg-slate-950/50"
            >
                {isLoadingHistory ? (
                    <div className="space-y-3">
                        <div className="h-14 w-2/3 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                        <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                        <Bot className="mb-3 size-12 opacity-40" />
                        <h3 className="text-2xl font-bold">
                            {t('assistant.empty.title')}
                        </h3>
                        <p className="mb-4 max-w-md text-sm">
                            {t('assistant.empty.desc')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => setQuestion(suggestion)}
                                    className="cursor-pointer rounded-full border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-all duration-200 hover:bg-slate-800 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-slate-800"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.role === 'user';

                        return (
                            <div
                                key={msg.id}
                                className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`flex max-w-[85%] items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm sm:max-w-[70%] ${
                                        isOwn
                                            ? 'border-slate-800 bg-slate-800 text-white dark:border-slate-600'
                                            : 'border-slate-800/30 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                                    }`}
                                >
                                    {!isOwn && (
                                        <Bot className="mt-0.5 size-5 shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <MarkdownContent
                                            content={msg.content}
                                            className={
                                                isOwn
                                                    ? '[&_strong]:text-white [&_code]:bg-white/20 [&_code]:text-white'
                                                    : ''
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {isThinking && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-800/30 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                            <Bot className="size-5 animate-pulse" />
                            {t('assistant.thinking')}
                        </div>
                    </div>
                )}
            </div>

            {/* Assistant Composer */}
            <form
                onSubmit={handleAsk}
                className="shrink-0 flex items-center gap-3 border-t border-slate-800/15 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
                <Input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={t('assistant.placeholder')}
                    disabled={isThinking}
                    maxLength={2000}
                    className="flex-1 text-sm"
                />
                <Button
                    type="submit"
                    disabled={!question.trim() || isThinking}
                    className="gap-2 border border-slate-800 bg-slate-800 px-5 text-white hover:bg-white hover:text-slate-800 dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                    <Send className="size-4" />
                    {t('assistant.send')}
                </Button>
            </form>
        </>
    );
}
