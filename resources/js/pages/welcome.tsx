import { Head, Link, usePage } from '@inertiajs/react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { PadlockIcon } from '@/components/icons/padlock-icons';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/lib/i18n';
import { dashboard, login, register } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;
    const { t } = useI18n();

    return (
        <>
            <Head title={t('welcome.title')} />
            <div className="flex min-h-screen flex-col items-center bg-white p-6 text-slate-800 lg:justify-center lg:p-8 dark:bg-slate-900 dark:text-white">
                <header className="mb-8 flex w-full max-w-4xl items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-heading text-3xl font-bold tracking-wider">
                            CRIPTA
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-lg bg-slate-800 text-white dark:bg-white dark:text-slate-800">
                            <AppLogoIcon className="size-5 fill-current" />
                        </div>
                    </div>

                    <nav className="flex items-center gap-3">
                        <LanguageSwitcher />

                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-lg border border-slate-800 bg-slate-800 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white hover:text-slate-800 dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                {t('nav.dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-lg border border-slate-800/40 px-4 py-2 text-sm font-medium text-slate-800 transition-all duration-200 hover:border-slate-800 hover:bg-slate-800 hover:text-white dark:border-white/40 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-800"
                                >
                                    {t('nav.login')}
                                </Link>
                                <Link
                                    href={register()}
                                    className="inline-block rounded-lg border border-slate-800 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white hover:text-slate-800 dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    {t('nav.register')}
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-800/20 bg-white shadow-lg lg:grid-cols-12 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex flex-col justify-center p-8 lg:col-span-7 lg:p-12">
                        <h1 className="mb-3 font-heading text-4xl font-bold tracking-wide lg:text-5xl">
                            {t('welcome.title')}
                        </h1>
                        <p className="mb-6 text-base text-slate-600 dark:text-slate-300">
                            {t('welcome.subtitle')}
                        </p>

                        <div className="mb-8 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white dark:bg-white dark:text-slate-800">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-heading text-xl font-bold">
                                        {t('welcome.feature1.title')}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {t('welcome.feature1.desc')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white dark:bg-white dark:text-slate-800">
                                    <KeyRound className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-heading text-xl font-bold">
                                        {t('welcome.feature2.title')}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {t('welcome.feature2.desc')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white dark:bg-white dark:text-slate-800">
                                    <PadlockIcon className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-heading text-xl font-bold">
                                        {t('welcome.feature3.title')}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {t('welcome.feature3.desc')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-xl border border-slate-800 bg-slate-800 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-white hover:text-slate-800 dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    {t('welcome.cta.enter')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-xl border border-slate-800 bg-slate-800 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-white hover:text-slate-800 dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                                    >
                                        {t('welcome.cta.enter')}
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-xl border border-slate-800 px-6 py-3 font-semibold text-slate-800 transition-all duration-200 hover:bg-slate-800 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-slate-800"
                                    >
                                        {t('welcome.cta.create')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-slate-800 p-10 text-white lg:col-span-5 dark:bg-slate-950">
                        <div className="mb-4 flex size-28 items-center justify-center rounded-3xl bg-white text-slate-800 shadow-xl">
                            <AppLogoIcon className="size-20" />
                        </div>
                        <h2 className="font-heading text-4xl font-bold tracking-widest">
                            CRIPTA
                        </h2>
                        <p className="mt-2 text-center text-xs tracking-widest text-slate-300 uppercase">
                            RSA-OAEP 2048 &bull; ECDH P-256 &bull; AES-GCM
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}
