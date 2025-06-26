import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tabela de usuários
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  // Chaves para criptografia E2EE
  identityKey: text('identity_key'), // Chave de identidade pública do usuário
  signedPreKey: text('signed_pre_key'), // Chave pré-assinada para início de sessão
  oneTimePreKeys: text('one_time_pre_keys'), // JSON array de chaves de uso único
  registrationId: varchar('registration_id', { length: 255 }), // ID de registro único
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela de salas
export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela para sessões de criptografia entre usuários
export const cryptoSessions = pgTable('crypto_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  userId1: uuid('user_id_1').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userId2: uuid('user_id_2').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  // Estado da sessão Signal
  sessionState: text('session_state'), // Serialized session state
  rootKey: text('root_key'), // Chave raiz da sessão
  sendingChainKey: text('sending_chain_key'), // Chave da cadeia de envio
  receivingChainKey: text('receiving_chain_key'), // Chave da cadeia de recebimento
  messageKeys: text('message_keys'), // JSON array de chaves de mensagem usadas
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userRoomIdx: index('crypto_sessions_user_room_idx').on(table.userId1, table.userId2, table.roomId),
}));

// Tabela de mensagens
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Conteúdo criptografado da mensagem
  encryptedContent: text('encrypted_content').notNull(),
  // Metadados para descriptografar
  senderKeyId: text('sender_key_id'), // ID da chave do remetente
  recipientKeyId: text('recipient_key_id'), // ID da chave do destinatário
  messageNumber: varchar('message_number', { length: 255 }), // Número da mensagem na cadeia
  previousMessageNumber: varchar('previous_message_number', { length: 255 }), // Número da mensagem anterior
  nonce: text('nonce'), // Nonce para descriptografia
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('messages_user_id_idx').on(table.userId),
  roomIdIdx: index('messages_room_id_idx').on(table.roomId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
}));

// Definindo relações
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  cryptoSessions1: many(cryptoSessions, { relationName: 'user1Sessions' }),
  cryptoSessions2: many(cryptoSessions, { relationName: 'user2Sessions' }),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  messages: many(messages),
  cryptoSessions: many(cryptoSessions),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
}));

export const cryptoSessionsRelations = relations(cryptoSessions, ({ one }) => ({
  user1: one(users, {
    fields: [cryptoSessions.userId1],
    references: [users.id],
    relationName: 'user1Sessions',
  }),
  user2: one(users, {
    fields: [cryptoSessions.userId2],
    references: [users.id],
    relationName: 'user2Sessions',
  }),
  room: one(rooms, {
    fields: [cryptoSessions.roomId],
    references: [rooms.id],
  }),
}));

// Tipos TypeScript derivados dos schemas
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type CryptoSession = typeof cryptoSessions.$inferSelect;
export type NewCryptoSession = typeof cryptoSessions.$inferInsert;

// Tipos para consultas com relações
export type MessageWithUser = Message & {
  user: User;
};

// Tipos legados para compatibilidade
export type LegacyMessage = {
  id: string;
  content: string;
  userId: string;
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LegacyUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LegacyMessageWithUser = LegacyMessage & {
  user: LegacyUser;
};

export type MessageWithRelations = Message & {
  user: User;
  room: Room;
};

// Tipos específicos para criptografia
export type UserKeys = {
  identityKey: string;
  signedPreKey: string;
  oneTimePreKeys: string[];
  registrationId: string;
};

export type EncryptedMessage = {
  encryptedContent: string;
  senderKeyId: string;
  recipientKeyId: string;
  messageNumber: string;
  previousMessageNumber: string;
  nonce?: string; // Nonce para descriptografia
};
