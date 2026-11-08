import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2 font-heading text-2xl font-bold tracking-wider">
            <span className="truncate">CRIPTA</span>
            <AppLogoIcon className="size-[1em] shrink-0 fill-current" />
        </div>
    );
}
