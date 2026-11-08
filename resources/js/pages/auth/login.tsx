import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { useEffect } from 'react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/lib/i18n';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const { t, locale } = useI18n();

    useEffect(() => {
        setLayoutProps({
            title: t('auth.login.title'),
            description: t('auth.login.description'),
        });
    }, [locale, t]);

    return (
        <>
            <Head title={t('auth.login.button')} />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder={t('auth.email.placeholder')}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">
                                        {t('auth.password')}
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            {t('auth.forgot_password')}
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder={t('auth.password.placeholder')}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">
                                    {t('auth.remember_me')}
                                </Label>
                            </div>

                            <div className="grid gap-3 pt-2">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing && <Spinner />}
                                    {t('auth.login.button')}
                                </Button>

                                <PasskeyVerify
                                    label={t('auth.passkey.signin')}
                                    loadingLabel={t(
                                        'auth.passkey.authenticating',
                                    )}
                                    separator={t('auth.passkey.or_email')}
                                />
                            </div>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            {t('auth.no_account')}{' '}
                            <TextLink href={register()} tabIndex={5}>
                                {t('auth.signup_link')}
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Entrar na sua conta',
    description: 'Digite seu e-mail e senha abaixo para acessar a CRIPTA',
};
