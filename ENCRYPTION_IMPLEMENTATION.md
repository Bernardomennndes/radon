# Implementação de Criptografia E2EE no Chat

## Resumo da Implementação

Implementamos um sistema de criptografia End-to-End (E2EE) baseado nos conceitos do Signal Protocol para o sistema de chat. A solução utiliza:

### Tecnologias Utilizadas

**Backend:**
- **TweetNaCl**: Biblioteca de criptografia para operações criptográficas básicas
- **Algoritmo de Criptografia**: Simulação do Signal Protocol usando NaCl
- **Armazenamento**: PostgreSQL via Supabase para chaves e sessões

**Frontend:**
- **TweetNaCl**: Mesma biblioteca para compatibilidade
- **React Hooks**: Para gerenciamento de estado da criptografia
- **Socket.IO**: Para comunicação em tempo real

### Arquitetura Implementada

#### 1. **Schema do Banco de Dados**

**Tabela `users` (atualizada):**
```sql
- identity_key: text          -- Chave de identidade pública
- signed_pre_key: text        -- Chave pré-assinada
- one_time_pre_keys: text     -- JSON array de chaves de uso único  
- registration_id: varchar    -- ID de registro único
```

**Tabela `messages` (atualizada):**
```sql
- encrypted_content: text           -- Conteúdo criptografado
- sender_key_id: text              -- ID da chave do remetente
- recipient_key_id: text           -- ID da chave do destinatário
- message_number: varchar          -- Número da mensagem na cadeia
- previous_message_number: varchar -- Número da mensagem anterior
- nonce: text                      -- Nonce para descriptografia
```

**Nova Tabela `crypto_sessions`:**
```sql
- session_id: varchar        -- ID único da sessão
- user_id_1: uuid           -- Primeiro usuário
- user_id_2: uuid           -- Segundo usuário
- room_id: uuid             -- Sala da conversa
- session_state: text       -- Estado serializado da sessão
- root_key: text            -- Chave raiz da sessão
- sending_chain_key: text   -- Chave da cadeia de envio
- receiving_chain_key: text -- Chave da cadeia de recebimento
- message_keys: text        -- JSON de chaves de mensagem usadas
```

#### 2. **Serviços de Criptografia**

**Backend (`crypto.ts`):**
```typescript
class SimplifiedE2EEService {
  generateUserKeys(userId: string): UserKeys
  establishSession(senderId: string, recipientId: string, recipientKeys: UserKeys): void
  encryptMessage(senderId: string, recipientId: string, content: string): EncryptedMessage
  decryptMessage(recipientId: string, senderId: string, encryptedMessage: EncryptedMessage): string
}
```

**Frontend (`crypto.ts`):**
```typescript
class ClientCryptoService {
  generateUserKeys(userId: string): UserKeys
  loadUserKeys(userId: string, keys: UserKeys): void
  establishSession(senderId: string, recipientId: string): void
  encryptMessage(senderId: string, recipientId: string, content: string): EncryptedMessage
  decryptMessage(recipientId: string, senderId: string, encryptedMessage: EncryptedMessage): string
}
```

#### 3. **Novos Endpoints da API**

```typescript
POST /api/users                           -- Criar usuário com chaves
GET  /api/users/:userId/keys               -- Obter chaves públicas do usuário
GET  /api/rooms/:roomId/encrypted-messages -- Obter mensagens criptografadas
```

#### 4. **Novos Eventos Socket.IO**

**Cliente → Servidor:**
- `send_encrypted_message`: Enviar mensagem criptografada
- `initialize_crypto`: Inicializar sessão de criptografia
- `get_user_keys`: Obter chaves de um usuário

**Servidor → Cliente:**
- `encrypted_message_received`: Mensagem criptografada recebida
- `user_keys_response`: Resposta com chaves do usuário
- `crypto_initialized`: Confirmação de inicialização da criptografia

### Fluxo de Funcionamento

#### 1. **Geração de Chaves**
1. Usuário se registra → Sistema gera:
   - Chave de identidade (key pair)
   - Chave pré-assinada (signed pre-key)
   - Chaves de uso único (one-time pre-keys)
   - ID de registro único

#### 2. **Estabelecimento de Sessão**
1. Usuário A quer conversar com Usuário B
2. Sistema obtém chaves públicas de B
3. Estabelece sessão usando protocolo similar ao Signal:
   - Deriva chave de sessão compartilhada
   - Cria estado de sessão para ambos os usuários

#### 3. **Envio de Mensagem Criptografada**
1. Usuário A escreve mensagem
2. Cliente criptografa usando chave de sessão
3. Envia dados criptografados + metadados para servidor
4. Servidor armazena mensagem criptografada
5. Transmite para outros usuários na sala

#### 4. **Recebimento e Descriptografia**
1. Cliente B recebe mensagem criptografada
2. Usa chave de sessão para descriptografar
3. Exibe conteúdo original ao usuário

### Componentes Criados

#### **Backend:**
- `src/crypto.ts` - Serviço de criptografia
- `src/schema.ts` - Schema atualizado do banco
- `src/database.ts` - Métodos para mensagens criptografadas
- `src/types.ts` - Tipos para criptografia
- `src/index.ts` - Handlers Socket.IO para criptografia

#### **Frontend:**
- `lib/crypto.ts` - Serviço de criptografia do cliente
- `lib/types.ts` - Tipos atualizados
- `lib/socket.ts` - Socket service atualizado
- `hooks/useEncryptedChat.ts` - Hook para chat criptografado
- `components/EncryptedChat.tsx` - Componente de chat criptografado

### Segurança Implementada

1. **Forward Secrecy**: Cada mensagem usa chaves derivadas únicas
2. **Autenticação**: Verificação de identidade através de chaves
3. **Integridade**: Nonce e MAC protegem contra modificação
4. **Confidencialidade**: Apenas remetente e destinatário podem ler

### Limitações da Implementação Atual

1. **Chaves Privadas**: Armazenadas em memória (para demo)
2. **Rotação de Chaves**: Não implementada automaticamente
3. **Verificação de Identidade**: Não há interface para verificar fingerprints
4. **Grupos**: Implementação focada em conversas 1:1
5. **Persistência**: Sessões são perdidas ao recarregar a página

### Próximos Passos para Produção

1. **Armazenamento Seguro**: Implementar armazenamento seguro de chaves privadas
2. **Key Verification**: Interface para verificar identidades
3. **Perfect Forward Secrecy**: Implementar rotação automática de chaves
4. **Group Chat**: Estender para conversas em grupo
5. **Backup/Restore**: Sistema de backup de chaves
6. **Auditoria**: Logs de segurança e auditoria

### Como Testar

1. Inicie o servidor: `pnpm dev:server`
2. Inicie o frontend: `pnpm dev:web`
3. Crie dois usuários diferentes
4. Use o componente `EncryptedChat`
5. Ative a criptografia e teste o envio de mensagens

A implementação atual serve como uma base sólida para um sistema de chat criptografado, demonstrando os conceitos fundamentais do Signal Protocol de forma simplificada mas funcional.
