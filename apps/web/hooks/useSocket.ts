'use client';

import { useEffect, useState } from 'react';
import { socketService } from '../lib/socket';
import type { Message, User } from '../lib/types';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { isConnected };
}

export function useChat(roomId: string | null, user: User | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!roomId || !user || !isConnected) return;

    // Clear any previous messages and errors when joining a new room
    setMessages([]);
    setError(null);

    // Join the room
    socketService.joinRoom({ room_id: roomId, user_id: user.id });

    // Listen for new messages
    const unsubscribeMessage = socketService.onMessageReceived((message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for users joining
    const unsubscribeUserJoined = socketService.onUserJoined(({ user: joinedUser }) => {
      setOnlineUsers(prev => {
        const exists = prev.some(u => u.id === joinedUser.id);
        return exists ? prev : [...prev, joinedUser];
      });
    });

    // Listen for users leaving
    const unsubscribeUserLeft = socketService.onUserLeft(({ user_id }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== user_id));
    });

    // Listen for errors
    const unsubscribeError = socketService.onError(({ message }) => {
      console.error('Socket error:', message);
      setError(message);
    });

    return () => {
      if (roomId) {
        socketService.leaveRoom(roomId);
      }
      unsubscribeMessage();
      unsubscribeUserJoined();
      unsubscribeUserLeft();
      unsubscribeError();
    };
  }, [roomId, user, isConnected]);

  const sendMessage = (content: string) => {
    if (!roomId || !user || !content.trim()) return;

    // Clear any previous errors
    setError(null);

    socketService.sendMessage({
      content: content.trim(),
      user_id: user.id,
      room_id: roomId,
    });
  };

  return {
    messages,
    onlineUsers,
    sendMessage,
    isConnected,
    error,
  };
}
