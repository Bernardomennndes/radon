import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tabela de usuários
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
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

// Tabela de mensagens
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
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
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  messages: many(messages),
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

// Tipos TypeScript derivados dos schemas
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// Tipos para consultas com relações
export type MessageWithUser = Message & {
  user: User;
};

export type MessageWithRelations = Message & {
  user: User;
  room: Room;
};
