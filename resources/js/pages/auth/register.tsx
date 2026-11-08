import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    PROFILE_AVATAR_ICONS,
    ProfileAvatarIcon,
} from '@/components/icons/profile-avatar-icons';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/lib/i18n';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const { t, locale } = useI18n();
    const [selectedAvatar, setSelectedAvatar] = useState<string>(
        'game-icons:william-tell-skull',
    );

    useEffect(() => {
        setLayoutProps({
            title: t('auth.register.title'),
            description: t('auth.register.description'),
        });
    }, [locale, t]);

    return (
        <>
            <Head title={t('auth.register.title')} />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>
                                    {t('settings.profile.avatar_label')}
                                </Label>
                                <input
                                    type="hidden"
                                    name="avatar_icon"
                                    value={selectedAvatar}
                                />
                                <div className="grid grid-cols-6 gap-1.5">
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
                                                className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg border p-2 transition-all duration-200 ${
                                                    isSelected
                                                        ? 'border-slate-800 bg-slate-800 text-white shadow-xs hover:bg-slate-700 dark:border-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-200'
                                                        : 'border-slate-800/25 bg-white text-slate-800 hover:border-slate-800 hover:bg-slate-800 hover:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-800'
                                                }`}
                                            >
                                                <ProfileAvatarIcon
                                                    icon={item.id}
                                                    className="size-6 fill-current"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.avatar_icon} />
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
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="username"
                                        name="handle"
                                        placeholder={t(
                                            'auth.handle.placeholder',
                                        )}
                                        className="pl-8"
                                    />
                                </div>
                                <InputError message={errors.handle} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={3}
                                    autoComplete="email"
                                    name="email"
                                    placeholder={t('auth.email.placeholder')}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    {t('auth.password')}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder={t('auth.password.placeholder')}
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    {t('auth.password_confirm')}
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder={t(
                                        'auth.password_confirm.placeholder',
                                    )}
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={6}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {t('auth.register.button')}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            {t('auth.has_account')}{' '}
                            <TextLink href={login()} tabIndex={7}>
                                {t('auth.login_link')}
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Criar uma conta',
    description:
        'Preencha seus dados abaixo para criar sua identidade no CRIPTA',
};
