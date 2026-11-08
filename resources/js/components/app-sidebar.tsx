import { Link, router, usePage } from '@inertiajs/react';
import {
    AtSign,
    BookOpen,
    FolderGit2,
    MessageSquareLock,
    UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { ChatContact } from '@/features/chat';
import { useI18n } from '@/lib/i18n';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

type SharedChatProps = {
    contacts?: ChatContact[];
    activeContactId?: number | null;
};

export function AppSidebar() {
    const { t } = useI18n();
    const { contacts = [], activeContactId = null } =
        usePage<SharedChatProps>().props;

    const [handleSearch, setHandleSearch] = useState<string>('');
    const [isAddingContact, setIsAddingContact] = useState<boolean>(false);

    const selectedContactId = activeContactId ?? contacts[0]?.id ?? null;

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

    const footerNavItems: NavItem[] = [
        {
            title: t('nav.repository'),
            href: 'https://github.com/zedutra/cripta-chat',
            icon: FolderGit2,
        },
        {
            title: t('nav.documentation'),
            href: 'https://github.com/zedutra/cripta-chat/blob/main/ARCHITECTURE.md',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Add Contact by @handle directly in the left sidebar */}
                <form
                    onSubmit={handleAddContact}
                    className="mt-2 flex flex-col gap-2 px-1 group-data-[collapsible=icon]:hidden"
                >
                    <label
                        htmlFor="sidebar-add-handle"
                        className="text-xs font-semibold text-sidebar-foreground/80"
                    >
                        {t('chat.add_contact.label')}
                    </label>
                    <div className="flex gap-1.5">
                        <div className="relative flex-1">
                            <AtSign className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-sidebar-foreground/60" />
                            <input
                                id="sidebar-add-handle"
                                type="text"
                                value={handleSearch}
                                onChange={(e) =>
                                    setHandleSearch(e.target.value)
                                }
                                placeholder={t('chat.add_contact.placeholder')}
                                className="h-8 w-full rounded-lg border border-sidebar-border bg-white/10 pr-2 pl-7 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:ring-1 focus:ring-white focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isAddingContact}
                            title={t('chat.add_contact.button')}
                            className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border border-white bg-white px-2.5 text-xs font-semibold text-slate-800 transition-all duration-200 hover:bg-slate-900 hover:text-white disabled:opacity-50"
                        >
                            <UserPlus className="size-3.5" />
                            <span className="sr-only sm:not-sr-only">
                                {t('chat.add_contact.button')}
                            </span>
                        </button>
                    </div>
                </form>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className="px-2 py-2">
                    <SidebarGroupLabel className="text-sidebar-foreground/70">
                        {t('chat.conversations')} ({contacts.length})
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        {contacts.length === 0 ? (
                            <div className="px-2 py-6 text-center text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                                {t('chat.no_contacts')}
                            </div>
                        ) : (
                            <SidebarMenu className="gap-1">
                                {contacts.map((contact) => {
                                    const isSelected =
                                        contact.id === selectedContactId;
                                    return (
                                        <SidebarMenuItem key={contact.id}>
                                            <SidebarMenuButton
                                                size="lg"
                                                isActive={isSelected}
                                                tooltip={{
                                                    children: `${contact.name} (@${contact.handle})`,
                                                }}
                                                onClick={() =>
                                                    handleSelectContact(
                                                        contact.id,
                                                    )
                                                }
                                                className={`cursor-pointer rounded-xl px-3 py-2.5 transition-all duration-200 ${
                                                    isSelected
                                                        ? 'border border-white bg-white text-slate-800 hover:bg-slate-700 hover:text-white data-[active=true]:bg-white data-[active=true]:text-slate-800 data-[active=true]:hover:bg-slate-700 data-[active=true]:hover:text-white'
                                                        : 'border border-transparent text-sidebar-foreground hover:border-white hover:bg-white hover:text-slate-800'
                                                }`}
                                            >
                                                <MessageSquareLock className="size-4 shrink-0" />
                                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
                                                    <div className="min-w-0">
                                                        <div className="truncate font-heading text-lg leading-tight font-bold">
                                                            {contact.name}
                                                        </div>
                                                        <div className="truncate text-[11px] opacity-75">
                                                            @{contact.handle}
                                                        </div>
                                                    </div>

                                                    {contact.key_algorithm ? (
                                                        <span
                                                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                                                isSelected
                                                                    ? 'bg-slate-800 text-white'
                                                                    : 'bg-white/15 text-white'
                                                            }`}
                                                        >
                                                            {
                                                                contact.key_algorithm
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="shrink-0 text-[10px] opacity-60">
                                                            {t('chat.no_key')}
                                                        </span>
                                                    )}
                                                </div>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        )}
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
