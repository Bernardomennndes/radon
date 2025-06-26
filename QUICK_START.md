# 🚀 Guia Rápido - Radon Chat

## ⚡ Início Rápido (5 minutos)

### 1. **Configure o Supabase**
1. Vá para [supabase.com](https://supabase.com) → Criar projeto
2. Copie: Project URL, Anon Key, Service Role Key
3. No SQL Editor, execute o script `apps/server/supabase-schema.sql`

### 2. **Configure variáveis de ambiente**

**`apps/server/.env`:**
```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
PORT=3001
CLIENT_URL=http://localhost:3000
```

**`apps/web/.env.local`:**
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

### 3. **Execute o projeto**
```bash
# Instalar dependências
pnpm install

# Executar tudo
pnpm dev
```

### 4. **Acesse e teste**
- Abra http://localhost:3000
- Digite um nome de usuário
- Comece a conversar! 🎉

## 🎯 URLs Importantes
- **Chat Web**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Tudo junto
pnpm dev:server      # Só servidor  
pnpm dev:web         # Só cliente

# Verificações
pnpm check-types     # TypeScript
pnpm lint            # ESLint
pnpm format          # Prettier

# Build
pnpm build           # Produção
```

## 🆘 Problemas Comuns

**Erro de conexão WebSocket?**
- Verifique se o servidor está rodando na porta 3001
- Confirme o `NEXT_PUBLIC_SERVER_URL` no .env.local

**Erro de banco de dados?**
- Verifique as credenciais do Supabase no .env
- Execute o script SQL no Supabase

**Erro de dependências?**
- Delete `node_modules` e rode `pnpm install`

---
📖 **README completo**: [README.md](./README.md)
