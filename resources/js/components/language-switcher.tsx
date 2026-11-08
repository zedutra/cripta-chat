import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
    const { locale, setLocale } = useI18n();

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 rounded-lg border border-slate-800/20 bg-slate-100 p-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800',
                className,
            )}
            title={
                locale === 'pt'
                    ? 'Alternar idioma (Português / Inglês)'
                    : 'Switch language (Portuguese / English)'
            }
        >
            <Languages className="ml-1.5 size-3.5 text-slate-600 dark:text-slate-300" />
            <button
                type="button"
                onClick={() => setLocale('pt')}
                className={cn(
                    'cursor-pointer rounded-md px-2 py-1 transition',
                    locale === 'pt'
                        ? 'bg-slate-800 text-white shadow-xs dark:bg-white dark:text-slate-800'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                )}
            >
                PT-BR
            </button>
            <button
                type="button"
                onClick={() => setLocale('en')}
                className={cn(
                    'cursor-pointer rounded-md px-2 py-1 transition',
                    locale === 'en'
                        ? 'bg-slate-800 text-white shadow-xs dark:bg-white dark:text-slate-800'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                )}
            >
                EN
            </button>
        </div>
    );
}
