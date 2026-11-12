import { useSyncExternalStore } from 'react';

export type Locale = 'pt' | 'en';

const LOCALE_STORAGE_KEY = 'cripta_locale';
const listeners = new Set<() => void>();

export function getLocale(): Locale {
    if (typeof window === 'undefined') {
        return 'pt';
    }
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return saved === 'en' ? 'en' : 'pt';
}

export function setLocale(locale: Locale): void {
    if (typeof window === 'undefined') {
        return;
    }
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en';
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

const dictionary = {
    pt: {
        // Common & Navigation
        'nav.platform': 'Plataforma',
        'nav.dashboard': 'Chat Criptografado',
        'nav.repository': 'Repositório GitHub',
        'nav.documentation': 'Arquitetura E2EE',
        'nav.settings': 'Configurações',
        'nav.logout': 'Sair',
        'nav.login': 'Entrar',
        'nav.register': 'Criar conta',

        // Welcome Page
        'welcome.title': 'Bem-vindo a CRIPTA',
        'welcome.subtitle':
            'Chat com criptografia de ponta a ponta (RSA & ECC) onde você controla suas próprias chaves públicas e privadas.',
        'welcome.feature1.title': 'Zero-Knowledge Server',
        'welcome.feature1.desc':
            'O servidor nunca recebe ou armazena sua Private Key. Toda descriptografia ocorre 100% no seu navegador.',
        'welcome.feature2.title': 'Gere ou Importe Chaves RSA & ECC',
        'welcome.feature2.desc':
            'Crie pares RSA-OAEP (2048-bit) ou ECC (ECDH P-256) com 1 clique ou cole seu próprio arquivo .PEM.',
        'welcome.feature3.title': 'Desbloqueio Interativo por Cadeado',
        'welcome.feature3.desc':
            'Adicione contatos pelo @handle e clique no cadeado de cada mensagem para descriptografar instantaneamente.',
        'welcome.cta.enter': 'Acessar o Chat Agora',
        'welcome.cta.create': 'Criar Conta Gratuita',

        // Auth - Login
        'auth.login.title': 'Entrar na sua conta',
        'auth.login.description':
            'Digite seu e-mail e senha abaixo para acessar a CRIPTA',
        'auth.email': 'Endereço de e-mail',
        'auth.email.placeholder': 'seu@email.com',
        'auth.password': 'Senha',
        'auth.password.placeholder': 'Sua senha',
        'auth.forgot_password': 'Esqueceu sua senha?',
        'auth.remember_me': 'Lembrar de mim',
        'auth.login.button': 'Entrar',
        'auth.no_account': 'Ainda não tem uma conta?',
        'auth.signup_link': 'Cadastre-se',
        'auth.passkey.signin': 'Entrar com Passkey',
        'auth.passkey.authenticating': 'Autenticando...',
        'auth.passkey.or_email': 'Ou',

        // Auth - Register
        'auth.register.title': 'Criar uma conta',
        'auth.register.description':
            'Escolha seu ícone e preencha seus dados abaixo para criar sua identidade na CRIPTA',
        'auth.name': 'Nome completo',
        'auth.name.placeholder': 'Seu nome',
        'auth.handle': ' Seu @ (Identificador único para contatos)',
        'auth.handle.placeholder': 'seu_usuario',
        'auth.password_confirm': 'Confirmar senha',
        'auth.password_confirm.placeholder': 'Confirme sua senha',
        'auth.register.button': 'Criar conta',
        'auth.has_account': 'Já possui uma conta?',
        'auth.login_link': 'Entrar',

        // Auth - Forgot / Reset / Confirm / Verify / 2FA
        'auth.forgot.title': 'Recuperar senha',
        'auth.forgot.description':
            'Informe seu e-mail para receber um link de redefinição de senha',
        'auth.forgot.button': 'Enviar link de recuperação',
        'auth.forgot.return': 'Ou volte para',
        'auth.reset.title': 'Redefinir senha',
        'auth.reset.description': 'Digite sua nova senha abaixo',
        'auth.reset.button': 'Redefinir senha',
        'auth.confirm.title': 'Confirmar senha',
        'auth.confirm.description':
            'Esta é uma área segura do sistema. Confirme sua senha antes de continuar.',
        'auth.confirm.passkey': 'Confirmar com Passkey',
        'auth.confirm.confirming': 'Confirmando...',
        'auth.confirm.or_password': 'Ou confirme com sua senha',
        'auth.confirm.button': 'Confirmar senha',
        'auth.verify.title': 'Verificação de e-mail',
        'auth.verify.description':
            'Verifique seu endereço de e-mail clicando no link que acabamos de enviar para você.',
        'auth.verify.sent':
            'Um novo link de verificação foi enviado para o e-mail informado no cadastro.',
        'auth.verify.resend': 'Reenviar e-mail de verificação',
        'auth.2fa.code_title': 'Código de autenticação',
        'auth.2fa.code_desc':
            'Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.',
        'auth.2fa.recovery_title': 'Código de recuperação',
        'auth.2fa.recovery_desc':
            'Confirme o acesso à sua conta informando um dos seus códigos de recuperação de emergência.',
        'auth.2fa.use_recovery': 'entrar usando um código de recuperação',
        'auth.2fa.use_code': 'entrar usando um código de autenticação',
        'auth.2fa.or_you_can': 'ou você pode ',
        'auth.2fa.continue': 'Continuar',
        'auth.2fa.recovery_placeholder': 'Digite o código de recuperação',

        // Dashboard / Chat E2EE
        'chat.share_handle_prefix': 'Compartilhe seu',
        'chat.share_handle_suffix': 'para adicionarem você no CRIPTA',
        'chat.status.active': 'E2EE Ativo',
        'chat.status.client_key': 'Private Key no Cliente',
        'chat.status.pending': 'Chaves E2EE pendentes neste navegador',
        'chat.status.key_exists_missing_priv':
            'Chave {alg} já criada nesta conta — envie sua Private Key (.PEM) ou gere uma nova',
        'chat.status.no_key_created':
            'Nenhuma chave E2EE criada nesta conta ainda',
        'chat.add_contact.label': 'Adicionar pessoa pelo @',
        'chat.add_contact.placeholder': 'usuario_destino',
        'chat.add_contact.button': 'Adicionar',
        'chat.conversations': 'Conversas',
        'chat.no_contacts':
            'Nenhum contato ainda. Digite o @ de alguém acima para iniciar um chat criptografado!',
        'chat.no_key': 'Sem chave',
        'chat.header.e2ee_info':
            'Criptografia Ponta a Ponta ({alg}) — Clique no cadeado de cada mensagem para descriptografar',
        'chat.header.no_pubkey':
            'Este usuário ainda não configurou uma Public Key',
        'chat.empty.title': 'Nenhuma mensagem criptografada ainda',
        'chat.empty.desc':
            'Envie uma mensagem abaixo. Ela será criptografada no seu navegador com a chave pública de @{handle}.',
        'chat.composer.placeholder':
            'Escreva uma mensagem para @{handle} (será criptografada via {alg})...',
        'chat.composer.waiting_key':
            'Aguardando @{handle} configurar sua Public Key...',
        'chat.composer.encrypting': 'Criptografando...',
        'chat.composer.send': 'Criptografar & Enviar',
        'chat.welcome.title': 'Bem-vindo a CRIPTA',
        'chat.welcome.step1':
            '1. Configure ou gere seu par de chaves (RSA ou ECC) no botão do topo.',
        'chat.welcome.step2':
            '2. Adicione um contato pelo @handle na barra lateral.',
        'chat.welcome.step3':
            '3. Clique no cadeado das mensagens para descriptografar localmente!',
        'chat.toast.configure_first':
            'Configure primeiro suas chaves E2EE (RSA ou ECC) no topo da página antes de enviar mensagens!',
        'chat.toast.recipient_no_key':
            'O contato @{handle} ainda não publicou uma Public Key para receber mensagens criptografadas.',
        'chat.toast.send_error': 'Erro ao enviar a mensagem criptografada.',
        'chat.toast.encrypt_error':
            'Falha ao criptografar a mensagem no navegador. Verifique as chaves públicas.',
        'chat.toast.handle_not_found':
            'Não foi possível encontrar este @handle.',

        // Cripto Assistente (AI Agent)
        'assistant.name': 'Cripto Assistente',
        'assistant.subtitle':
            'Agente de IA da CRIPTA — tire suas dúvidas sobre o sistema',
        'assistant.empty.title': 'Olá! Eu sou o Cripto Assistente',
        'assistant.empty.desc':
            'Pergunte qualquer coisa sobre a CRIPTA: chaves RSA/ECC, arquivos .PEM, cadeados, contatos, Passkeys e mais.',
        'assistant.suggestion.keys': 'Como configuro minhas chaves E2EE?',
        'assistant.suggestion.padlock':
            'Como descriptografo uma mensagem?',
        'assistant.suggestion.contacts': 'Como adiciono um contato?',
        'assistant.placeholder': 'Pergunte algo ao Cripto Assistente...',
        'assistant.send': 'Perguntar',
        'assistant.thinking': 'Pensando...',
        'assistant.toast.error':
            'Não foi possível obter uma resposta do Cripto Assistente.',

        // Message Bubble
        'bubble.unlocked_title':
            'Mensagem descriptografada (clique para trancar novamente)',
        'bubble.locked_title':
            'Clique no cadeado para descriptografar (Client-Side)',
        'bubble.status.unlocked': 'Descriptografada ({alg})',
        'bubble.status.locked':
            'Criptografada ({alg}) — Clique no cadeado',
        'bubble.toast.need_privkey':
            'Configure ou cole sua Private Key no Gerenciador de Chaves antes de descriptografar!',
        'bubble.toast.decrypt_failed':
            'Não foi possível descriptografar esta mensagem com a Private Key atual.',

        // Key Manager Modal
        'keys.button.configured': 'Chaves E2EE ({alg})',
        'keys.button.setup': 'Configurar Chaves (RSA / ECC)',
        'keys.button.upload_pem': 'Upload da Chave (.PEM)',
        'keys.button.generate_new': 'Gerar Nova Chave',
        'keys.modal.title': 'Gerenciador de Chaves E2EE (RSA & ECC)',
        'keys.modal.desc':
            'Você pode enviar seu arquivo .PEM salvo anteriormente, gerar um novo par de chaves ou colar suas chaves manualmente. O servidor armazena apenas a sua Public Key. Sua Private Key fica exclusivamente no seu navegador.',
        'keys.algorithm': 'Algoritmo:',
        'keys.generating': 'Gerando...',
        'keys.generate_btn': 'Gerar Par {alg}',
        'keys.upload_pem_btn': 'Upload .PEM',
        'keys.download_pem': 'Baixar .PEM',
        'keys.pubkey_label':
            'Public Key (Enviada ao servidor para que contatos criptografem mensagens para você)',
        'keys.privkey_label':
            'Private Key (NUNCA enviada ao servidor — usada apenas no cliente para abrir os cadeados)',
        'keys.saving': 'Validando e Salvando...',
        'keys.save_btn':
            'Publicar Public Key & Guardar Private Key Localmente',
        'keys.toast.generated':
            'Par de chaves {alg} gerado no seu navegador!',
        'keys.toast.generate_error':
            'Falha ao gerar o par de chaves via Web Crypto API.',
        'keys.toast.fill_before_download':
            'Preencha ou gere as chaves antes de baixar.',
        'keys.toast.fill_both':
            'Informe tanto a Public Key quanto a sua Private Key.',
        'keys.toast.invalid_pair':
            'As chaves informadas não são válidas para o algoritmo {alg}. Verifique o formato PEM.',
        'keys.toast.pem_uploaded':
            'Chave privada (.PEM) carregada e validada com sucesso neste navegador!',
        'keys.toast.pem_invalid_format':
            'O arquivo selecionado não contém uma Private Key PEM válida (-----BEGIN PRIVATE KEY-----).',
        'keys.toast.pem_mismatch':
            'A Private Key enviada não corresponde à Public Key atual da sua conta.',

        // Settings
        'settings.title': 'Configurações',
        'settings.description':
            'Gerencie seu perfil, segurança e preferências da conta',
        'settings.nav.profile': 'Perfil',
        'settings.nav.security': 'Segurança',
        'settings.nav.appearance': 'Aparência',
        'settings.profile.title': 'Perfil',
        'settings.profile.desc':
            'Escolha seu ícone de perfil e atualize seu @handle e endereço de e-mail',
        'settings.profile.avatar_label': 'Ícone de Perfil',
        'settings.profile.avatar_desc':
            'Envio de fotos desativado por privacidade. Escolha um dos 12 ícones abaixo para representar sua identidade na CRIPTA:',
        'settings.profile.unverified': 'Seu endereço de e-mail não foi verificado.',
        'settings.profile.resend': 'Clique aqui para reenviar o e-mail de verificação.',
        'settings.profile.sent':
            'Um novo link de verificação foi enviado para o seu endereço de e-mail.',
        'settings.save': 'Salvar alterações',
        'settings.delete.title': 'Excluir conta',
        'settings.delete.desc':
            'Exclua permanentemente sua conta e todos os seus dados',
        'settings.delete.warning_title': 'Atenção',
        'settings.delete.warning_desc':
            'Prossiga com cuidado, esta ação não pode ser desfeita.',
        'settings.delete.button': 'Excluir conta',
        'settings.delete.confirm_title':
            'Tem certeza que deseja excluir sua conta?',
        'settings.delete.confirm_desc':
            'Assim que sua conta for excluída, todas as suas conversas e chaves públicas serão removidas permanentemente. Digite sua senha para confirmar.',
        'settings.cancel': 'Cancelar',
        'settings.security.title': 'Configurações de segurança',
        'settings.security.password_title': 'Atualizar senha',
        'settings.security.password_desc':
            'Garanta que sua conta utilize uma senha longa e segura',
        'settings.security.current_password': 'Senha atual',
        'settings.security.new_password': 'Nova senha',
        'settings.security.2fa_title': 'Autenticação em duas etapas (2FA)',
        'settings.security.2fa_desc':
            'Gerencie suas configurações de autenticação em duas etapas',
        'settings.security.2fa_enabled_desc':
            'Um código PIN seguro será solicitado durante o login a partir do seu aplicativo autenticador no celular.',
        'settings.security.2fa_disabled_desc':
            'Ao ativar a autenticação em duas etapas, um código PIN seguro será solicitado durante o login.',
        'settings.security.enable_2fa': 'Ativar 2FA',
        'settings.security.disable_2fa': 'Desativar 2FA',
        'settings.security.continue_setup': 'Continuar configuração',
        'settings.security.passkeys_title': 'Chaves de acesso (Passkeys)',
        'settings.security.passkeys_desc':
            'Gerencie suas Passkeys para entrar sem senha',
        'settings.security.no_passkeys': 'Nenhuma Passkey cadastrada',
        'settings.security.no_passkeys_desc':
            'Adicione uma Passkey para fazer login com biometria ou chave de segurança',
        'settings.appearance.title': 'Configurações de aparência',
        'settings.appearance.desc':
            'Personalize o tema visual e o idioma do sistema',
        'settings.appearance.light': 'Claro',
        'settings.appearance.dark': 'Escuro',
        'settings.appearance.system': 'Sistema',
    },
    en: {
        // Common & Navigation
        'nav.platform': 'Platform',
        'nav.dashboard': 'Encrypted Chat',
        'nav.repository': 'GitHub Repository',
        'nav.documentation': 'E2EE Architecture',
        'nav.settings': 'Settings',
        'nav.logout': 'Log out',
        'nav.login': 'Log in',
        'nav.register': 'Register',

        // Welcome Page
        'welcome.title': 'Welcome to CRIPTA',
        'welcome.subtitle':
            'End-to-end encrypted chat (RSA & ECC) where you control your own public and private keys.',
        'welcome.feature1.title': 'Zero-Knowledge Server',
        'welcome.feature1.desc':
            'The server never receives or stores your Private Key. All decryption happens 100% in your browser.',
        'welcome.feature2.title': 'Generate or Import RSA & ECC Keys',
        'welcome.feature2.desc':
            'Generate RSA-OAEP (2048-bit) or ECC (ECDH P-256) key pairs with 1 click or paste your own .PEM file.',
        'welcome.feature3.title': 'Interactive Padlock Unlocking',
        'welcome.feature3.desc':
            'Add contacts via @handle and click each message padlock to decrypt it instantaneously.',
        'welcome.cta.enter': 'Open Chat Now',
        'welcome.cta.create': 'Create Free Account',

        // Auth - Login
        'auth.login.title': 'Log in to your account',
        'auth.login.description':
            'Enter your email and password below to log in to CRIPTA',
        'auth.email': 'Email address',
        'auth.email.placeholder': 'email@example.com',
        'auth.password': 'Password',
        'auth.password.placeholder': 'Password',
        'auth.forgot_password': 'Forgot your password?',
        'auth.remember_me': 'Remember me',
        'auth.login.button': 'Log in',
        'auth.no_account': "Don't have an account?",
        'auth.signup_link': 'Sign up',
        'auth.passkey.signin': 'Sign in with a passkey',
        'auth.passkey.authenticating': 'Authenticating...',
        'auth.passkey.or_email': 'Or',

        // Auth - Register
        'auth.register.title': 'Create an account',
        'auth.register.description':
            'Choose your icon and enter your details below to create your CRIPTA identity',
        'auth.name': 'Full name',
        'auth.name.placeholder': 'Full name',
        'auth.handle': 'Your @ (Unique handle for contacts)',
        'auth.handle.placeholder': 'your_handle',
        'auth.password_confirm': 'Confirm password',
        'auth.password_confirm.placeholder': 'Confirm password',
        'auth.register.button': 'Create account',
        'auth.has_account': 'Already have an account?',
        'auth.login_link': 'Log in',

        // Auth - Forgot / Reset / Confirm / Verify / 2FA
        'auth.forgot.title': 'Forgot password',
        'auth.forgot.description':
            'Enter your email to receive a password reset link',
        'auth.forgot.button': 'Email password reset link',
        'auth.forgot.return': 'Or, return to',
        'auth.reset.title': 'Reset password',
        'auth.reset.description': 'Please enter your new password below',
        'auth.reset.button': 'Reset password',
        'auth.confirm.title': 'Confirm password',
        'auth.confirm.description':
            'This is a secure area of the application. Please confirm your password before continuing.',
        'auth.confirm.passkey': 'Confirm with passkey',
        'auth.confirm.confirming': 'Confirming...',
        'auth.confirm.or_password': 'Or confirm with password',
        'auth.confirm.button': 'Confirm password',
        'auth.verify.title': 'Email verification',
        'auth.verify.description':
            'Please verify your email address by clicking on the link we just emailed to you.',
        'auth.verify.sent':
            'A new verification link has been sent to the email address you provided during registration.',
        'auth.verify.resend': 'Resend verification email',
        'auth.2fa.code_title': 'Authentication code',
        'auth.2fa.code_desc':
            'Enter the authentication code provided by your authenticator application.',
        'auth.2fa.recovery_title': 'Recovery code',
        'auth.2fa.recovery_desc':
            'Please confirm access to your account by entering one of your emergency recovery codes.',
        'auth.2fa.use_recovery': 'login using a recovery code',
        'auth.2fa.use_code': 'login using an authentication code',
        'auth.2fa.or_you_can': 'or you can ',
        'auth.2fa.continue': 'Continue',
        'auth.2fa.recovery_placeholder': 'Enter recovery code',

        // Dashboard / Chat E2EE
        'chat.share_handle_prefix': 'Share your',
        'chat.share_handle_suffix': 'so people can add you on CRIPTA',
        'chat.status.active': 'E2EE Active',
        'chat.status.client_key': 'Private Key on Client',
        'chat.status.pending': 'E2EE Keys pending in this browser',
        'chat.status.key_exists_missing_priv':
            '{alg} key already created on this account — upload your Private Key (.PEM) or generate a new one',
        'chat.status.no_key_created':
            'No E2EE key created on this account yet',
        'chat.add_contact.label': 'Add person by @',
        'chat.add_contact.placeholder': 'target_user',
        'chat.add_contact.button': 'Add',
        'chat.conversations': 'Conversations',
        'chat.no_contacts':
            'No contacts yet. Type someone’s @ above to start an encrypted chat!',
        'chat.no_key': 'No key',
        'chat.header.e2ee_info':
            'End-to-End Encryption ({alg}) — Click each message padlock to decrypt',
        'chat.header.no_pubkey':
            'This user has not configured a Public Key yet',
        'chat.empty.title': 'No encrypted messages yet',
        'chat.empty.desc':
            'Send a message below. It will be encrypted in your browser with @{handle}’s public key.',
        'chat.composer.placeholder':
            'Write a message to @{handle} (will be encrypted via {alg})...',
        'chat.composer.waiting_key':
            'Waiting for @{handle} to configure their Public Key...',
        'chat.composer.encrypting': 'Encrypting...',
        'chat.composer.send': 'Encrypt & Send',
        'chat.welcome.title': 'Welcome to CRIPTA',
        'chat.welcome.step1':
            '1. Configure or generate your key pair (RSA or ECC) using the top button.',
        'chat.welcome.step2':
            '2. Add a contact by their @handle in the sidebar.',
        'chat.welcome.step3':
            '3. Click the padlock on messages to decrypt locally!',
        'chat.toast.configure_first':
            'Please configure your E2EE keys (RSA or ECC) at the top of the page before sending messages!',
        'chat.toast.recipient_no_key':
            'Contact @{handle} has not published a Public Key to receive encrypted messages yet.',
        'chat.toast.send_error': 'Error sending encrypted message.',
        'chat.toast.encrypt_error':
            'Failed to encrypt message in browser. Check public keys.',
        'chat.toast.handle_not_found': 'Could not find this @handle.',

        // Cripto Assistente (AI Agent)
        'assistant.name': 'Cripto Assistente',
        'assistant.subtitle':
            'CRIPTA AI agent — ask anything about the system',
        'assistant.empty.title': "Hi! I'm Cripto Assistente",
        'assistant.empty.desc':
            'Ask anything about CRIPTA: RSA/ECC keys, .PEM files, padlocks, contacts, passkeys and more.',
        'assistant.suggestion.keys': 'How do I set up my E2EE keys?',
        'assistant.suggestion.padlock': 'How do I decrypt a message?',
        'assistant.suggestion.contacts': 'How do I add a contact?',
        'assistant.placeholder': 'Ask Cripto Assistente something...',
        'assistant.send': 'Ask',
        'assistant.thinking': 'Thinking...',
        'assistant.toast.error':
            'Could not get a response from Cripto Assistente.',

        // Message Bubble
        'bubble.unlocked_title':
            'Decrypted message (click to lock again)',
        'bubble.locked_title':
            'Click padlock to decrypt (Client-Side)',
        'bubble.status.unlocked': 'Decrypted ({alg})',
        'bubble.status.locked':
            'Encrypted ({alg}) — Click padlock',
        'bubble.toast.need_privkey':
            'Configure or paste your Private Key in the Key Manager before decrypting!',
        'bubble.toast.decrypt_failed':
            'Could not decrypt this message with the current Private Key.',

        // Key Manager Modal
        'keys.button.configured': 'E2EE Keys ({alg})',
        'keys.button.setup': 'Configure Keys (RSA / ECC)',
        'keys.button.upload_pem': 'Upload Key (.PEM)',
        'keys.button.generate_new': 'Generate New Key',
        'keys.modal.title': 'E2EE Key Manager (RSA & ECC)',
        'keys.modal.desc':
            'You can upload your previously saved .PEM file, generate a new key pair, or paste your keys manually. The server only stores your Public Key. Your Private Key stays exclusively in your browser.',
        'keys.algorithm': 'Algorithm:',
        'keys.generating': 'Generating...',
        'keys.generate_btn': 'Generate {alg} Pair',
        'keys.upload_pem_btn': 'Upload .PEM',
        'keys.download_pem': 'Download .PEM',
        'keys.pubkey_label':
            'Public Key (Sent to server so contacts can encrypt messages for you)',
        'keys.privkey_label':
            'Private Key (NEVER sent to server — used only on client to unlock padlocks)',
        'keys.saving': 'Validating & Saving...',
        'keys.save_btn': 'Publish Public Key & Save Private Key Locally',
        'keys.toast.generated': '{alg} key pair generated in your browser!',
        'keys.toast.generate_error':
            'Failed to generate key pair via Web Crypto API.',
        'keys.toast.fill_before_download':
            'Fill or generate keys before downloading.',
        'keys.toast.fill_both':
            'Please provide both Public Key and your Private Key.',
        'keys.toast.invalid_pair':
            'Provided keys are not valid for {alg} algorithm. Check PEM format.',
        'keys.toast.pem_uploaded':
            'Private key (.PEM) uploaded and validated in this browser!',
        'keys.toast.pem_invalid_format':
            'Selected file does not contain a valid PEM Private Key (-----BEGIN PRIVATE KEY-----).',
        'keys.toast.pem_mismatch':
            'Uploaded Private Key does not match the current Public Key on your account.',

        // Settings
        'settings.title': 'Settings',
        'settings.description':
            'Manage your profile, security, and account preferences',
        'settings.nav.profile': 'Profile',
        'settings.nav.security': 'Security',
        'settings.nav.appearance': 'Appearance',
        'settings.profile.title': 'Profile',
        'settings.profile.desc':
            'Choose your profile icon and update your @handle and email address',
        'settings.profile.avatar_label': 'Profile Icon',
        'settings.profile.avatar_desc':
            'Photo uploads are disabled for privacy. Choose one of the 12 icons below to represent your CRIPTA identity:',
        'settings.profile.unverified': 'Your email address is unverified.',
        'settings.profile.resend': 'Click here to re-send the verification email.',
        'settings.profile.sent':
            'A new verification link has been sent to your email address.',
        'settings.save': 'Save changes',
        'settings.delete.title': 'Delete account',
        'settings.delete.desc':
            'Permanently delete your account and all of its resources',
        'settings.delete.warning_title': 'Warning',
        'settings.delete.warning_desc':
            'Please proceed with caution, this cannot be undone.',
        'settings.delete.button': 'Delete account',
        'settings.delete.confirm_title':
            'Are you sure you want to delete your account?',
        'settings.delete.confirm_desc':
            'Once your account is deleted, all of its conversations and public keys will be permanently deleted. Please enter your password to confirm.',
        'settings.cancel': 'Cancel',
        'settings.security.title': 'Security settings',
        'settings.security.password_title': 'Update password',
        'settings.security.password_desc':
            'Ensure your account is using a long, random password to stay secure',
        'settings.security.current_password': 'Current password',
        'settings.security.new_password': 'New password',
        'settings.security.2fa_title': 'Two-factor authentication',
        'settings.security.2fa_desc':
            'Manage your two-factor authentication settings',
        'settings.security.2fa_enabled_desc':
            'You will be prompted for a secure, random pin during login from your TOTP authenticator app.',
        'settings.security.2fa_disabled_desc':
            'When you enable two-factor authentication, you will be prompted for a secure pin during login.',
        'settings.security.enable_2fa': 'Enable 2FA',
        'settings.security.disable_2fa': 'Disable 2FA',
        'settings.security.continue_setup': 'Continue setup',
        'settings.security.passkeys_title': 'Passkeys',
        'settings.security.passkeys_desc':
            'Manage your passkeys for passwordless sign-in',
        'settings.security.no_passkeys': 'No passkeys yet',
        'settings.security.no_passkeys_desc':
            'Add a passkey to sign in without a password',
        'settings.appearance.title': 'Appearance settings',
        'settings.appearance.desc':
            'Customize the visual theme and system language',
        'settings.appearance.light': 'Light',
        'settings.appearance.dark': 'Dark',
        'settings.appearance.system': 'System',
    },
} as const;

export type TranslationKey = keyof typeof dictionary.pt;

export function translate(
    locale: Locale,
    key: TranslationKey,
    params?: Record<string, string | number>,
): string {
    let text: string = dictionary[locale][key] ?? dictionary.pt[key] ?? key;
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replaceAll(`{${k}}`, String(v));
        });
    }
    return text;
}

export function useI18n() {
    const locale = useSyncExternalStore(subscribe, getLocale, () => 'pt' as Locale);

    const t = (
        key: TranslationKey,
        params?: Record<string, string | number>,
    ): string => translate(locale, key, params);

    return {
        locale,
        setLocale,
        t,
    };
}
