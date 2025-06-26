# Radon - Chat em Tempo Real

Sistema de chat em tempo real desenvolvido com arquitetura de WebSocket usando Socket.io, banco de dados PostgreSQL via Supabase, e interface web moderna em Next.js.

## 🚀 Funcionalidades

- ✅ **Chat em tempo real** - Mensagens instantâneas via WebSocket
- ✅ **Múltiplas salas** - Organize conversas em diferentes canais
- ✅ **Persistência** - Todas as mensagens são salvas no banco PostgreSQL
- ✅ **Interface moderna** - UI responsiva e intuitiva
- ✅ **Status de conexão** - Indicador visual da conexão WebSocket
- ✅ **Sistema de usuários** - Login simples com nome de usuário

## 🏗️ Arquitetura

Este projeto utiliza uma arquitetura de monorepo com:

### Backend (`apps/server`)
- **Express.js** - Servidor HTTP e API REST
- **Socket.io** - WebSocket para comunicação em tempo real  
- **Supabase** - Banco PostgreSQL hospedado
- **TypeScript** - Tipagem estática

### Frontend (`apps/web`)
- **Next.js 15** - Framework React com App Router
- **React 19** - Interface do usuário
- **Socket.io Client** - Conexão WebSocket com o servidor
- **Tailwind CSS** - Estilização (via classes CSS)

### Pacotes Compartilhados (`packages/`)
- **ESLint Config** - Configurações de linting
- **TypeScript Config** - Configurações do TypeScript
- **UI Components** - Componentes reutilizáveis

## 📦 Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- pnpm
- Conta no Supabase

### 1. Clone e instale dependências
```bash
git clone <repo-url>
cd radon
pnpm install
```

### 2. Configure o banco de dados (Supabase)
1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Execute o script SQL em `apps/server/supabase-schema.sql` no SQL Editor
3. Copie as credenciais do projeto

### 3. Configure as variáveis de ambiente

**Servidor** (`apps/server/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
CLIENT_URL=http://localhost:3000
```

**Cliente Web** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

### 4. Execute o projeto

#### Desenvolvimento (recomendado):
```bash
pnpm dev
```

#### Ou separadamente:
```bash
# Terminal 1 - Servidor
cd apps/server
pnpm dev

# Terminal 2 - Cliente Web  
cd apps/web
pnpm dev
```

### 5. Acesse a aplicação
- **Cliente Web**: http://localhost:3000
- **API Server**: http://localhost:3001

## 🎯 Como usar

1. Acesse `http://localhost:3000`
2. Digite seu nome de usuário
3. Selecione uma sala de chat (algumas salas padrão são criadas automaticamente)
4. Comece a conversar em tempo real!

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Executa servidor e cliente
pnpm dev:server      # Apenas servidor
pnpm dev:web         # Apenas cliente web

# Build
pnpm build           # Build de produção
pnpm build:server    # Build apenas servidor
pnpm build:web       # Build apenas cliente

# Qualidade de código
pnpm lint            # ESLint em todos os projetos
pnpm check-types     # Verificação TypeScript
pnpm format          # Prettier formatting
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais:
- **users** - Informações dos usuários
- **rooms** - Salas de chat disponíveis  
- **messages** - Mensagens enviadas nos chats

### Schema:
```sql
users (id, username, avatar_url, created_at)
rooms (id, name, description, created_at)  
messages (id, content, user_id, room_id, created_at)
```

## 🔄 Fluxo de Dados

```
┌─────────────┐    WebSocket    ┌──────────────┐    SQL     ┌─────────────┐
│   Next.js   │ ◄────────────► │   Express    │ ◄─────────► │  Supabase   │
│   Client    │    HTTP/REST    │   Server     │             │ PostgreSQL  │
└─────────────┘                └──────────────┘             └─────────────┘
```

1. **Cliente** se conecta via WebSocket ao **Servidor**
2. **Servidor** persiste mensagens no **Banco PostgreSQL**
3. **Servidor** distribui mensagens em tempo real para clientes conectados
4. **API REST** fornece dados históricos (salas, mensagens antigas)

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js, React, TypeScript, Socket.io Client
- **Backend**: Node.js, Express, Socket.io, TypeScript  
- **Banco**: PostgreSQL (Supabase)
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier

## 📝 Próximos Passos

- [ ] Autenticação com Supabase Auth
- [ ] Upload de arquivos/imagens
- [ ] Mensagens privadas
- [ ] Notificações push
- [ ] Temas dark/light
- [ ] Emojis e reações
- [ ] Deploy automatizado

---

Desenvolvido com ❤️ usando tecnologias modernas para chat em tempo real.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
