import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import {
    PROFILE_AVATAR_ICONS,
    ProfileAvatarIcon,
} from '@/components/icons/profile-avatar-icons';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const { t } = useI18n();
    const [selectedAvatar, setSelectedAvatar] = useState<string>(
        auth.user.avatar_icon ?? 'game-icons:william-tell-skull',
    );

    return (
        <>
            <Head title={t('settings.profile.title')} />

            <h1 className="sr-only">{t('settings.profile.title')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('settings.profile.title')}
                    description={t('settings.profile.desc')}
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-3">
                                <div>
                                    <Label>
                                        {t('settings.profile.avatar_label')}
                                    </Label>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {t('settings.profile.avatar_desc')}
                                    </p>
                                </div>

                                <input
                                    type="hidden"
                                    name="avatar_icon"
                                    value={selectedAvatar}
                                />

                                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                                    {PROFILE_AVATAR_ICONS.map((item) => {
                                        const isSelected =
                                            selectedAvatar === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                title={item.id}
                                                onClick={() =>
                                                    setSelectedAvatar(item.id)
                                                }
                                                className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all duration-200 ${
                                                    isSelected
                                                        ? 'border-slate-800 bg-slate-800 text-white shadow-sm hover:bg-slate-700 dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-200'
                                                        : 'border-slate-800/25 bg-white text-slate-800 hover:border-slate-800 hover:bg-slate-800 hover:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-800'
                                                }`}
                                            >
                                                <ProfileAvatarIcon
                                                    icon={item.id}
                                                    className="size-8 fill-current"
                                                />
                                                <span className="max-w-full truncate text-[10px] font-medium">
                                                    {item.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <InputError
                                    className="mt-1"
                                    message={errors.avatar_icon}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="handle">
                                    {t('auth.handle')}
                                </Label>

                                <div className="relative flex items-center">
                                    <span className="pointer-events-none absolute left-3 font-bold text-muted-foreground">
                                        @
                                    </span>
                                    <Input
                                        id="handle"
                                        className="mt-1 block w-full pl-8"
                                        defaultValue={auth.user.handle}
                                        name="handle"
                                        required
                                        autoComplete="username"
                                        placeholder={t(
                                            'auth.handle.placeholder',
                                        )}
                                    />
                                </div>

                                <InputError
                                    className="mt-2"
                                    message={errors.handle}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.email')}</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder={t('auth.email.placeholder')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            {t('settings.profile.unverified')}{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                {t('settings.profile.resend')}
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                {t('settings.profile.sent')}
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {t('settings.save')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Perfil',
            href: edit(),
        },
    ],
};
