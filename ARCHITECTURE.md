# Arquitetura do Sistema CRIPTA

Este documento define os padrões arquiteturais, especificações funcionais e a organização de diretórios do sistema **CRIPTA** — um sistema de chat com criptografia de ponta a ponta (E2EE) onde o próprio usuário gerencia suas chaves (**RSA** e **ECC**).

---

## 1. Visão Geral & Diferenciais do Produto

- **Criptografia de Ponta a Ponta (E2EE) com Chaves do Usuário**:
  - Suporte aos algoritmos **RSA** (`RSA-OAEP`) e **ECC** (`ECDH` + `AES-GCM`).
  - O usuário pode **gerar** seu par de chaves (`Public Key` e `Private Key`) diretamente no navegador ou **importar/colar** suas próprias chaves.
  - **Zero-Knowledge Server**: O servidor armazena **apenas a Public Key** do usuário. Nenhuma `Private Key` trafega ou é salva no servidor.
  - **Descriptografia 100% Client-Side**: Toda criptografia e descriptografia ocorre no navegador via Web Crypto API.
- **Identidade por `@` (Handle)**:
  - Cada usuário possui um `@username` único utilizado para adicionar contatos e iniciar conversas seguras.
- **UX de Desbloqueio de Mensagens**:
  - Ao abrir uma conversa, as mensagens aparecem criptografadas acompanhadas de um cadeado interativo:
    - Mensagem criptografada: `game-icons:padlock` ([`PadlockIcon`](file:///c:/Users/zedut/Desktop/Projeto/cripta/resources/js/components/icons/padlock-icons.tsx))
    - Mouse sobre o cadeado (*hover*): `game-icons:unlocking` ([`UnlockingIcon`](file:///c:/Users/zedut/Desktop/Projeto/cripta/resources/js/components/icons/padlock-icons.tsx))
    - Mensagem descriptografada (após o clique): `game-icons:padlock-open` ([`PadlockOpenIcon`](file:///c:/Users/zedut/Desktop/Projeto/cripta/resources/js/components/icons/padlock-icons.tsx))
- **Identidade Visual**:
  - **Tipografia**: `Shadows Into Light` (principal) e `Permanent Marker` (destaques).
  - **Paleta de Cores**: Principal `slate-800` (`#1e293b`) e Secundária `white` (`#ffffff`).
  - **Logo**: Palavra `CRIPTA` seguida do ícone `game-icons:william-tell-skull` ([`AppLogo`](file:///c:/Users/zedut/Desktop/Projeto/cripta/resources/js/components/app-logo.tsx) / [`AppLogoIcon`](file:///c:/Users/zedut/Desktop/Projeto/cripta/resources/js/components/app-logo-icon.tsx)).

---

## 2. Visão Geral da Stack

- **Backend**: PHP 8.3+, Laravel 13, Laravel Fortify + Passkeys, Laravel Wayfinder
- **Frontend**: React 19 (com React Compiler), TypeScript, Inertia.js v3, Tailwind CSS v4, Radix UI
- **Qualidade & Testes**: PHPUnit 12, Larastan (PHPStan), Laravel Pint, Vite+ (`vp check`, `tsc --noEmit`)

---

## 2. Estrutura do Backend (`app/`)

Seguimos uma abordagem orientada a **Actions**, **Services** e **DTOs** para manter os `Controllers` enxutos e as regras de negócio isoladas e testáveis:

```text
app/
├── Actions/        # Classes de ação única (ex: CreateOrderAction, ApproveUserAction)
├── Concerns/       # Traits reutilizáveis entre Models, Requests ou Services
├── Console/        # Comandos Artisan customizados
├── Contracts/      # Interfaces para inversão de dependência e contratos de domínio
├── DTOs/           # Objetos de Transferência de Dados imutáveis (readonly classes)
├── Enums/          # Enumerações nativas do PHP 8.3 com métodos auxiliares (labels, cores)
├── Http/
│   ├── Controllers/# Recebem FormRequests, invocam Actions/Services e retornam respostas Inertia
│   ├── Middleware/ # Middlewares HTTP e compartilhamento de estado Inertia
│   └── Requests/   # Validação de entrada e autorização (FormRequest)
├── Models/         # Eloquent Models (relacionamentos, scopes, casts)
├── Providers/      # Service Providers da aplicação
└── Services/       # Orquestração de fluxos complexos ou integrações externas
```

### Fluxo Recomendado de uma Requisição
1. **Rota (`routes/web.php`)** direciona para um `Controller`.
2. **`FormRequest` (`app/Http/Requests/`)** valida os dados recebidos.
3. **`DTO` (`app/DTOs/`)** (opcional) encapsula os dados validados com tipagem estrita.
4. **`Action` (`app/Actions/`)** ou **`Service` (`app/Services/`)** executa a regra de negócio e persistência.
5. **`Controller`** retorna a página Inertia (`Inertia::render(...)`) ou redirecionamento com feedback.

---

## 3. Estrutura do Frontend (`resources/js/`)

O frontend combina páginas de roteamento do Inertia com módulos organizados por **Features**:

```text
resources/js/
├── actions/        # Action helpers gerados pelo Laravel Wayfinder
├── components/     # Componentes globais de UI (shadcn/Radix, botões, modais, inputs)
├── features/       # Módulos de negócio isolados (ex: users, dashboard, reports)
│   └── <modulo>/
│       ├── components/
│       ├── hooks/
│       ├── types/
│       └── index.ts
├── hooks/          # Hooks globais utilitários
├── layouts/        # Layouts de página (AppLayout, AuthLayout, SettingsLayout)
├── lib/            # Funções utilitárias (cn, formatação, etc.)
├── pages/          # Páginas de entrada do Inertia.js (mapeadas 1:1 com as rotas)
├── routes/         # Rotas tipadas geradas pelo Laravel Wayfinder
└── types/          # Definições globais de tipos TypeScript
```

---

## 4. Comandos Úteis do Projeto

- **Ambiente de Desenvolvimento**: `composer run dev`
- **Verificação Completa (CI)**: `composer run ci:check`
- **Padronização de Código PHP**: `composer run lint`
- **Análise Estática PHP**: `composer run types:check`
- **Checagem de Tipos TS**: `npm run types:check`
