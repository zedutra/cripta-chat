import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2">
            <span className="truncate font-heading text-2xl tracking-wider font-bold">
                CRIPTA
            </span>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-slate-800 text-white dark:bg-white dark:text-slate-800">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
        </div>
    );
}
