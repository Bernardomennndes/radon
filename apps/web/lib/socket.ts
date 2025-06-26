import { io, Socket } from 'socket.io-client';
import type { Message, User, CreateMessagePayload, JoinRoomPayload } from './types';

interface SocketEvents {
  // Client to Server
  join_room: (payload: JoinRoomPayload) => void;
  leave_room: (payload: { room_id: string }) => void;
  send_message: (payload: CreateMessagePayload) => void;
  
  // Server to Client
  message_received: (message: Message) => void;
  user_joined: (payload: { user: User; room_id: string }) => void;
  user_left: (payload: { user_id: string; room_id: string }) => void;
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

  onMessageReceived(callback: (message: Message) => void) {
    this.socket?.on('message_received', callback);
    return () => this.socket?.off('message_received', callback);
  }

  onUserJoined(callback: (payload: { user: User; room_id: string }) => void) {
    this.socket?.on('user_joined', callback);
    return () => this.socket?.off('user_joined', callback);
  }

  onUserLeft(callback: (payload: { user_id: string; room_id: string }) => void) {
    this.socket?.on('user_left', callback);
    return () => this.socket?.off('user_left', callback);
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
