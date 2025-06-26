# Script SQL para Supabase

## Como executar no Supabase:

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **SQL Editor** no menu lateral
3. Copie e cole o conteúdo do arquivo `supabase-schema.sql`
4. Clique em **Run** para executar

## O que o script faz:

### Cria as tabelas:
- **users** - Armazena informações dos usuários
- **rooms** - Salas de chat disponíveis  
- **messages** - Mensagens enviadas

### Configura Row Level Security (RLS):
- Habilita RLS em todas as tabelas
- Cria políticas básicas de acesso
- **⚠️ Nota**: As políticas são básicas para desenvolvimento. Para produção, customize conforme suas necessidades de segurança.

### Insere dados iniciais:
- 3 salas padrão: "General", "Technology", "Random"

### Cria índices:
- Otimiza consultas por sala, data e usuário

## Após executar:

✅ Suas tabelas estarão criadas  
✅ Salas padrão estarão disponíveis  
✅ Sistema estará pronto para uso  

## Verificação:

Para verificar se tudo foi criado corretamente, execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'rooms', 'messages');

-- Verificar salas criadas
SELECT * FROM rooms;
```

Deve retornar as 3 tabelas e 3 salas padrão.
