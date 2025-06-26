// Importar tipos do schema Drizzle
import type { 
  User as DrizzleUser, 
  Room as DrizzleRoom, 
  Message as DrizzleMessage, 
  MessageWithUser,
  LegacyUser,
  LegacyMessageWithUser,
  UserKeys,
  EncryptedMessage 
} from './schema.js';

// Re-exportar tipos do Drizzle para compatibilidade
export type User = DrizzleUser;
export type Room = DrizzleRoom;
export type Message = DrizzleMessage;
export { UserKeys, EncryptedMessage };

// Tipos específicos para Socket.IO (mantendo compatibilidade com frontend)
export interface SocketMessage {
  id: string;
  content: string;
  user_id: string;
  room_id: string;
  created_at: string;
  user?: SocketUser;
  // Campos para mensagens criptografadas
  encrypted_content?: string;
  sender_key_id?: string;
  recipient_key_id?: string;
  message_number?: string;
  nonce?: string;
  is_encrypted?: boolean;
}

export interface SocketUser {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  // Campos para criptografia
  identity_key?: string;
  signed_pre_key?: string;
  one_time_pre_keys?: string[];
  registration_id?: string;
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

export interface CreateEncryptedMessagePayload {
  encrypted_content: string;
  sender_key_id: string;
  recipient_key_id: string;
  message_number: string;
  previous_message_number?: string;
  nonce: string;
  user_id: string;
  room_id: string;
}

export interface JoinRoomPayload {
  room_id: string;
  user_id: string;
}

export interface InitializeCryptoPayload {
  user_id: string;
  identity_key: string;
  signed_pre_key: string;
  one_time_pre_keys: string[];
  registration_id: string;
}

export interface SocketEvents {
  // Client to Server
  join_room: (payload: JoinRoomPayload) => void;
  leave_room: (payload: { room_id: string }) => void;
  send_message: (payload: CreateMessagePayload) => void;
  send_encrypted_message: (payload: CreateEncryptedMessagePayload) => void;
  initialize_crypto: (payload: InitializeCryptoPayload) => void;
  get_user_keys: (payload: { user_id: string }) => void;
  
  // Server to Client
  message_received: (message: SocketMessage) => void;
  encrypted_message_received: (message: SocketMessage) => void;
  user_joined: (payload: { user: SocketUser; room_id: string }) => void;
  user_already_in_room: (payload: { user: SocketUser; room_id: string }) => void;
  user_left: (payload: { user_id: string; room_id: string }) => void;
  user_keys_response: (payload: { user_keys: UserKeys | null }) => void;
  crypto_initialized: (payload: { success: boolean; message?: string }) => void;
  error: (payload: { message: string }) => void;
}

// Funções utilitárias para converter entre formatos Drizzle e Socket
export function drizzleUserToSocket(user: User): SocketUser {
  return {
    id: user.id,
    username: user.username,
    avatar_url: user.avatarUrl || undefined,
    created_at: user.createdAt.toISOString(),
    identity_key: user.identityKey || undefined,
    signed_pre_key: user.signedPreKey || undefined,
    one_time_pre_keys: user.oneTimePreKeys ? JSON.parse(user.oneTimePreKeys) : undefined,
    registration_id: user.registrationId || undefined,
  };
}

export function legacyUserToSocket(user: LegacyUser): SocketUser {
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

// Função para mensagens normais (legacy)
export function drizzleMessageToSocket(message: any): SocketMessage {
  return {
    id: message.id,
    content: message.content || '',
    user_id: message.userId,
    room_id: message.roomId,
    created_at: message.createdAt.toISOString(),
    is_encrypted: false,
    user: drizzleUserToSocket(message.user),
  };
}

// Função para mensagens criptografadas
export function drizzleEncryptedMessageToSocket(message: MessageWithUser): SocketMessage {
  return {
    id: message.id,
    content: '', // Conteúdo vazio para mensagens criptografadas
    encrypted_content: message.encryptedContent,
    sender_key_id: message.senderKeyId || undefined,
    recipient_key_id: message.recipientKeyId || undefined,
    message_number: message.messageNumber || undefined,
    nonce: message.nonce || undefined,
    is_encrypted: true,
    user_id: message.userId,
    room_id: message.roomId,
    created_at: message.createdAt.toISOString(),
    user: drizzleUserToSocket(message.user),
  };
}
