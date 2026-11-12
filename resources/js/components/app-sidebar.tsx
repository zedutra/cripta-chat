import { Link, router, usePage } from '@inertiajs/react';
import {
    AtSign,
    BookOpen,
    Bot,
    FolderGit2,
    Pin,
    UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import AppLogo from '@/components/app-logo';
import { ProfileAvatarIcon } from '@/components/icons/profile-avatar-icons';
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
    isAssistantActive?: boolean;
};

export function AppSidebar() {
    const { t } = useI18n();
    const {
        contacts = [],
        activeContactId = null,
        isAssistantActive = false,
    } = usePage<SharedChatProps>().props;

    const [handleSearch, setHandleSearch] = useState<string>('');
    const [isAddingContact, setIsAddingContact] = useState<boolean>(false);

    const selectedContactId = isAssistantActive
        ? null
        : (activeContactId ?? contacts[0]?.id ?? null);

    const handleSelectAssistant = () => {
        router.get(
            '/dashboard',
            { assistant: 1 },
            { preserveState: true, preserveScroll: true },
        );
    };

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
        <Sidebar collapsible="offcanvas" variant="sidebar">
            <SidebarHeader className="border-b border-sidebar-border/60 p-3">
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
                    className="mt-2 flex flex-col gap-2 px-1"
                >
                    <label
                        htmlFor="sidebar-add-handle"
                        className="text-xs font-semibold text-sidebar-foreground/80"
                    >
                        {t('chat.add_contact.label')}
                    </label>
                    <div className="flex items-center gap-1.5">
                        <div className="relative min-w-0 flex-1">
                            <AtSign className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-sidebar-foreground/60" />
                            <input
                                id="sidebar-add-handle"
                                type="text"
                                value={handleSearch}
                                onChange={(e) =>
                                    setHandleSearch(e.target.value)
                                }
                                placeholder={t('chat.add_contact.placeholder')}
                                className="h-9 w-full rounded-lg border border-sidebar-border bg-white/10 pr-2.5 pl-7 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:ring-1 focus:ring-white focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isAddingContact}
                            title={t('chat.add_contact.button')}
                            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white bg-white text-xs font-semibold text-slate-800 transition-all duration-200 hover:bg-slate-900 hover:text-white disabled:opacity-50"
                        >
                            <UserPlus className="size-4" />
                            <span className="sr-only">
                                {t('chat.add_contact.button')}
                            </span>
                        </button>
                    </div>
                </form>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className="px-3 py-2">
                    <SidebarGroupLabel className="text-sidebar-foreground/70">
                        {t('chat.conversations')} ({contacts.length})
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        {/* Cripto Assistente is always pinned at the top of every user's conversations */}
                        <SidebarMenu className="mb-1.5">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    size="lg"
                                    isActive={isAssistantActive}
                                    onClick={handleSelectAssistant}
                                    className={`h-auto cursor-pointer rounded-xl px-3 py-2.5 transition-all duration-200 ${
                                        isAssistantActive
                                            ? 'border border-white bg-white text-slate-800 hover:bg-slate-700 hover:text-white data-[active=true]:bg-white data-[active=true]:text-slate-800 data-[active=true]:hover:bg-slate-700 data-[active=true]:hover:text-white'
                                            : 'border border-white/30 text-sidebar-foreground hover:border-white hover:bg-white hover:text-slate-800'
                                    }`}
                                >
                                    <Bot className="size-5 shrink-0" />
                                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                        <div className="truncate font-heading text-lg leading-tight font-bold">
                                            {t('assistant.name')}
                                        </div>
                                        <Pin className="size-3.5 shrink-0 opacity-70" />
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>

                        {contacts.length === 0 ? (
                            <div className="px-2 py-6 text-center text-xs text-sidebar-foreground/60">
                                {t('chat.no_contacts')}
                            </div>
                        ) : (
                            <SidebarMenu className="gap-1.5">
                                {contacts.map((contact) => {
                                    const isSelected =
                                        contact.id === selectedContactId;
                                    return (
                                        <SidebarMenuItem key={contact.id}>
                                            <SidebarMenuButton
                                                size="lg"
                                                isActive={isSelected}
                                                onClick={() =>
                                                    handleSelectContact(
                                                        contact.id,
                                                    )
                                                }
                                                className={`h-auto cursor-pointer rounded-xl px-3 py-2.5 transition-all duration-200 ${
                                                    isSelected
                                                        ? 'border border-white bg-white text-slate-800 hover:bg-slate-700 hover:text-white data-[active=true]:bg-white data-[active=true]:text-slate-800 data-[active=true]:hover:bg-slate-700 data-[active=true]:hover:text-white'
                                                        : 'border border-transparent text-sidebar-foreground hover:border-white hover:bg-white hover:text-slate-800'
                                                }`}
                                            >
                                                <ProfileAvatarIcon
                                                    icon={contact.avatar_icon}
                                                    className="size-5 shrink-0 fill-current"
                                                />
                                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="truncate font-heading text-lg leading-tight font-bold">
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
