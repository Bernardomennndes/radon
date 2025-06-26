import { io, Socket } from 'socket.io-client';
import type { 
  Message, 
  User, 
  CreateMessagePayload, 
  CreateEncryptedMessagePayload,
  JoinRoomPayload,
  InitializeCryptoPayload,
  UserKeys
} from './types';

interface SocketEvents {
  // Client to Server
  join_room: (payload: JoinRoomPayload) => void;
  leave_room: (payload: { room_id: string }) => void;
  send_message: (payload: CreateMessagePayload) => void;
  send_encrypted_message: (payload: CreateEncryptedMessagePayload) => void;
  initialize_crypto: (payload: InitializeCryptoPayload) => void;
  get_user_keys: (payload: { user_id: string }) => void;
  
  // Server to Client
  message_received: (message: Message) => void;
  encrypted_message_received: (message: Message) => void;
  user_joined: (payload: { user: User; room_id: string }) => void;
  user_already_in_room: (payload: { user: User; room_id: string }) => void;
  user_left: (payload: { user_id: string; room_id: string }) => void;
  user_keys_response: (payload: { user_keys: UserKeys | null }) => void;
  crypto_initialized: (payload: { success: boolean; message?: string }) => void;
  error: (payload: { message: string }) => void;
}

class SocketService {
  private socket: Socket<SocketEvents> | null = null;
  private serverUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001')
    : 'http://localhost:3001';

  connect() {
    if (!this.socket) {
      this.socket = io(this.serverUrl);
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(payload: JoinRoomPayload) {
    this.socket?.emit('join_room', payload);
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave_room', { room_id: roomId });
  }

  sendMessage(payload: CreateMessagePayload) {
    this.socket?.emit('send_message', payload);
  }

  sendEncryptedMessage(payload: CreateEncryptedMessagePayload) {
    this.socket?.emit('send_encrypted_message', payload);
  }

  initializeCrypto(payload: InitializeCryptoPayload) {
    this.socket?.emit('initialize_crypto', payload);
  }

  getUserKeys(userId: string) {
    this.socket?.emit('get_user_keys', { user_id: userId });
  }

  onMessageReceived(callback: (message: Message) => void) {
    this.socket?.on('message_received', callback);
    return () => this.socket?.off('message_received', callback);
  }

  onEncryptedMessageReceived(callback: (message: Message) => void) {
    this.socket?.on('encrypted_message_received', callback);
    return () => this.socket?.off('encrypted_message_received', callback);
  }

  onUserJoined(callback: (payload: { user: User; room_id: string }) => void) {
    this.socket?.on('user_joined', callback);
    return () => this.socket?.off('user_joined', callback);
  }

  onUserAlreadyInRoom(callback: (payload: { user: User; room_id: string }) => void) {
    this.socket?.on('user_already_in_room', callback);
    return () => this.socket?.off('user_already_in_room', callback);
  }

  onUserLeft(callback: (payload: { user_id: string; room_id: string }) => void) {
    this.socket?.on('user_left', callback);
    return () => this.socket?.off('user_left', callback);
  }

  onUserKeysResponse(callback: (payload: { user_keys: UserKeys | null }) => void) {
    this.socket?.on('user_keys_response', callback);
    return () => this.socket?.off('user_keys_response', callback);
  }

  onCryptoInitialized(callback: (payload: { success: boolean; message?: string }) => void) {
    this.socket?.on('crypto_initialized', callback);
    return () => this.socket?.off('crypto_initialized', callback);
  }

  onError(callback: (payload: { message: string }) => void) {
    this.socket?.on('error', callback);
    return () => this.socket?.off('error', callback);
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
