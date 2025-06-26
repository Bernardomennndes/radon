// Importar tipos do schema Drizzle
import type { User as DrizzleUser, Room as DrizzleRoom, Message as DrizzleMessage, MessageWithUser } from './schema.js';

// Re-exportar tipos do Drizzle para compatibilidade
export type User = DrizzleUser;
export type Room = DrizzleRoom;
export type Message = DrizzleMessage;

// Tipos específicos para Socket.IO (mantendo compatibilidade com frontend)
export interface SocketMessage {
  id: string;
  content: string;
  user_id: string;
  room_id: string;
  created_at: string;
  user?: SocketUser;
}

export interface SocketUser {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface SocketRoom {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface CreateMessagePayload {
  content: string;
  user_id: string;
  room_id: string;
}

export interface JoinRoomPayload {
  room_id: string;
  user_id: string;
}

export interface SocketEvents {
  // Client to Server
  join_room: (payload: JoinRoomPayload) => void;
  leave_room: (payload: { room_id: string }) => void;
  send_message: (payload: CreateMessagePayload) => void;
  
  // Server to Client
  message_received: (message: SocketMessage) => void;
  user_joined: (payload: { user: SocketUser; room_id: string }) => void;
  user_left: (payload: { user_id: string; room_id: string }) => void;
  error: (payload: { message: string }) => void;
}

// Funções utilitárias para converter entre formatos Drizzle e Socket
export function drizzleUserToSocket(user: User): SocketUser {
  return {
    id: user.id,
    username: user.username,
    avatar_url: user.avatarUrl || undefined,
    created_at: user.createdAt.toISOString(),
  };
}

export function drizzleRoomToSocket(room: Room): SocketRoom {
  return {
    id: room.id,
    name: room.name,
    description: room.description || undefined,
    created_at: room.createdAt.toISOString(),
  };
}

export function drizzleMessageToSocket(message: MessageWithUser): SocketMessage {
  return {
    id: message.id,
    content: message.content,
    user_id: message.userId,
    room_id: message.roomId,
    created_at: message.createdAt.toISOString(),
    user: drizzleUserToSocket(message.user),
  };
}
