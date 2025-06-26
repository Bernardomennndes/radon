# Chat em Tempo Real - Radon

Sistema de chat em tempo real usando WebSocket (Socket.io), PostgreSQL (Supabase) e Next.js.

## Estrutura do Projeto

- **apps/server** - Servidor Express com Socket.io para WebSocket e API REST
- **apps/web** - Interface web em Next.js para o chat
- **packages/** - Pacotes compartilhados (UI, ESLint, TypeScript configs)

## Configuração do Banco de Dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. No SQL Editor do Supabase, execute o script `apps/server/supabase-schema.sql`
4. Copie as credenciais do projeto:
   - Project URL
   - Anon Key
   - Service Role Key (para o servidor)

## Configuração do Servidor

1. Navegue até a pasta do servidor:
   ```bash
   cd apps/server
   ```

2. Copie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```

3. Edite o arquivo `.env` com suas credenciais do Supabase:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PORT=3001
   ```

## Configuração do Cliente Web

1. Navegue até a pasta web:
   ```bash
   cd apps/web
   ```

2. Copie o arquivo de ambiente:
   ```bash
   cp .env.local.example .env.local
   ```

3. Edite o arquivo `.env.local`:
   ```
   NEXT_PUBLIC_SERVER_URL=http://localhost:3001
   ```

## Executando o Projeto

### Instalar dependências:
```bash
pnpm install
```

### Executar em desenvolvimento:

1. **Servidor** (Terminal 1):
   ```bash
   cd apps/server
   pnpm dev
   ```

2. **Cliente Web** (Terminal 2):
   ```bash
   cd apps/web
   pnpm dev
   ```

### Ou usando Turbo (recomendado):
```bash
# Na raiz do projeto
pnpm dev
```

## Como usar

1. Acesse `http://localhost:3000`
2. Digite um nome de usuário para entrar no chat
3. Selecione uma sala (algumas salas padrão são criadas automaticamente)
4. Comece a conversar em tempo real!

## Funcionalidades

- ✅ Chat em tempo real com WebSocket
- ✅ Múltiplas salas de chat
- ✅ Persistência de mensagens no PostgreSQL
- ✅ Interface moderna e responsiva
- ✅ Indicador de status de conexão
- ✅ Sistema de usuários básico

## Tecnologias Utilizadas

### Backend:
- Node.js + Express
- Socket.io para WebSocket
- Supabase (PostgreSQL)
- TypeScript

### Frontend:
- Next.js 15
- React 19
- Socket.io Client
- Tailwind CSS (via classes)
- TypeScript

### DevOps:
- Turborepo para monorepo
- pnpm para gerenciamento de pacotes
- ESLint + Prettier

## Arquitetura

```
┌─────────────┐    WebSocket    ┌──────────────┐    SQL     ┌─────────────┐
│   Next.js   │ ◄────────────► │   Express    │ ◄─────────► │  Supabase   │
│   Client    │    HTTP/REST    │   Server     │             │ PostgreSQL  │
└─────────────┘                └──────────────┘             └─────────────┘
```

O cliente se conecta ao servidor via WebSocket para comunicação em tempo real, enquanto o servidor persiste todas as mensagens no banco PostgreSQL do Supabase.
