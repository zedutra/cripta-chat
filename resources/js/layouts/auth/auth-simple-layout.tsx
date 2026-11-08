import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LanguageSwitcher } from '@/components/language-switcher';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>

            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex items-center gap-2 self-center font-heading text-4xl font-bold tracking-wider text-foreground"
                >
                    <span>CRIPTA</span>
                    <AppLogoIcon className="size-[1em] shrink-0 fill-current" />
                    <span className="sr-only">{title}</span>
                </Link>

                <div className="flex flex-col gap-6 rounded-2xl border border-slate-800/20 bg-white p-6 shadow-lg sm:p-8 dark:border-slate-700 dark:bg-slate-800/90">
                    <div className="w-full space-y-1.5 text-left">
                        <h1 className="font-heading text-2xl font-bold tracking-wider uppercase">
                            {title}
                        </h1>
                        <p className="text-left text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
