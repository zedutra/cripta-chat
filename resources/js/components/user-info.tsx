import { ProfileAvatarIcon } from '@/components/icons/profile-avatar-icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarFallback className="rounded-lg bg-slate-800 text-white dark:bg-white dark:text-slate-800">
                    <ProfileAvatarIcon
                        icon={user.avatar_icon}
                        className="size-5 fill-current"
                    />
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
