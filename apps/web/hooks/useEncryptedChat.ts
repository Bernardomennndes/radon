'use client';

import { useEffect, useState } from 'react';
import { socketService } from '../lib/socket';
import { clientCryptoService } from '../lib/crypto';
import type { Message, User, CreateEncryptedMessagePayload } from '../lib/types';

export function useEncryptedChat(roomId: string | null, user: User | null, recipientUserId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCryptoInitialized, setIsCryptoInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  console.log(`🔧 useEncryptedChat hook initialized:`, {
    roomId,
    userId: user?.id,
    username: user?.username,
    recipientUserId
  });

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

  useEffect(() => {
    if (!roomId || !user || !isConnected) return;

    // Clear any previous messages and errors when joining a new room
    setMessages([]);
    setError(null);
    setIsCryptoInitialized(false);

    // Join the room
    socketService.joinRoom({ room_id: roomId, user_id: user.id });

    // Initialize crypto if recipient is specified
    if (recipientUserId) {
      initializeCrypto(user.id, roomId, recipientUserId);
    }

    // Listen for new encrypted messages
    const unsubscribeEncryptedMessage = socketService.onEncryptedMessageReceived((message) => {
      try {
        // Tentar descriptografar a mensagem
        if (message.encrypted_content && message.nonce && message.sender_key_id) {
          // Estabelecer sessão se não existir
          if (!clientCryptoService.hasSession(user.id, message.sender_key_id)) {
            console.log(`Establishing session with sender ${message.sender_key_id} for message decryption`);
            clientCryptoService.establishSession(user.id, message.sender_key_id);
          }
          
          const decryptedContent = clientCryptoService.decryptMessage(
            user.id,
            message.sender_key_id,
            {
              encryptedContent: message.encrypted_content,
              senderKeyId: message.sender_key_id,
              recipientKeyId: user.id,
              messageNumber: message.message_number || '0',
              previousMessageNumber: '0',
              nonce: message.nonce,
            }
          );
          
          // Adicionar mensagem descriptografada à lista
          setMessages(prev => [...prev, {
            ...message,
            content: decryptedContent,
            is_encrypted: true,
          }]);
        } else {
          // Mensagem criptografada mas não conseguimos descriptografar
          setMessages(prev => [...prev, {
            ...message,
            content: '[Mensagem Criptografada]',
            is_encrypted: true,
          }]);
        }
      } catch (error) {
        console.error('Erro ao descriptografar mensagem:', error);
        setMessages(prev => [...prev, {
          ...message,
          content: '[Erro ao descriptografar]',
          is_encrypted: true,
        }]);
      }
    });

    // Listen for regular messages (fallback)
    const unsubscribeMessage = socketService.onMessageReceived((message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for users joining
    const unsubscribeUserJoined = socketService.onUserJoined(({ user: joinedUser }) => {
      setOnlineUsers(prev => {
        const exists = prev.some(u => u.id === joinedUser.id);
        if (!exists) {
          // Estabelecer sessão com o usuário que acabou de entrar
          if (user && joinedUser.id !== user.id) {
            console.log(`Establishing session with user ${joinedUser.id} who just joined`);
            if (!clientCryptoService.hasSession(user.id, joinedUser.id)) {
              clientCryptoService.establishSession(user.id, joinedUser.id);
            }
          }
          return [...prev, joinedUser];
        }
        return prev;
      });
    });

    // Listen for users already in room (when we join)
    const unsubscribeUserAlreadyInRoom = socketService.onUserAlreadyInRoom(({ user: existingUser }) => {
      setOnlineUsers(prev => {
        const exists = prev.some(u => u.id === existingUser.id);
        if (!exists) {
          // Estabelecer sessão com usuário já presente na sala
          if (user && existingUser.id !== user.id) {
            console.log(`Establishing session with existing user ${existingUser.id}`);
            if (!clientCryptoService.hasSession(user.id, existingUser.id)) {
              clientCryptoService.establishSession(user.id, existingUser.id);
            }
          }
          return [...prev, existingUser];
        }
        return prev;
      });
    });

    // Listen for users leaving
    const unsubscribeUserLeft = socketService.onUserLeft(({ user_id }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== user_id));
    });

    // Listen for crypto initialization responses
    const unsubscribeCryptoInit = socketService.onCryptoInitialized(({ success }) => {
      setIsCryptoInitialized(success);
      if (!success) {
        setError('Falha ao inicializar criptografia');
      }
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
      unsubscribeEncryptedMessage();
      unsubscribeMessage();
      unsubscribeUserJoined();
      unsubscribeUserAlreadyInRoom();
      unsubscribeUserLeft();
      unsubscribeCryptoInit();
      unsubscribeError();
    };
  }, [roomId, user, recipientUserId, isConnected]);

  const initializeCrypto = async (userId: string, roomId: string, recipientUserId: string) => {
    try {
      // Gerar chaves se não existirem
      if (!clientCryptoService.getUserKeys(userId)) {
        clientCryptoService.generateUserKeys(userId);
      }

      // Estabelecer sessão local
      if (!clientCryptoService.hasSession(userId, recipientUserId)) {
        clientCryptoService.establishSession(userId, recipientUserId);
      }

      // Obter as chaves do usuário
      const userKeys = clientCryptoService.getUserKeys(userId);
      if (!userKeys) {
        throw new Error('Não foi possível gerar chaves do usuário');
      }

      // Inicializar no servidor com as chaves corretas
      socketService.initializeCrypto({
        user_id: userId,
        identity_key: userKeys.identityKey,
        signed_pre_key: userKeys.signedPreKey,
        one_time_pre_keys: userKeys.oneTimePreKeys,
        registration_id: userKeys.registrationId,
      });
    } catch (error) {
      console.error('Erro ao inicializar criptografia:', error);
      setError('Falha ao inicializar criptografia');
    }
  };

  const sendEncryptedMessage = (content: string) => {
    if (!roomId || !user || !recipientUserId || !content.trim() || !isCryptoInitialized) {
      setError('Criptografia não inicializada ou dados faltando');
      return;
    }

    console.log(`🔐 Sending encrypted message:`, {
      senderId: user.id,
      recipientUserId: recipientUserId,
      content: content.substring(0, 20) + '...'
    });

    try {
      // Criptografar mensagem
      const encryptedData = clientCryptoService.encryptMessage(
        user.id,
        recipientUserId,
        content.trim()
      );

      // Preparar payload
      const payload: CreateEncryptedMessagePayload = {
        encrypted_content: encryptedData.encryptedContent,
        sender_key_id: encryptedData.senderKeyId,
        recipient_key_id: encryptedData.recipientKeyId,
        message_number: encryptedData.messageNumber,
        nonce: encryptedData.nonce || '',
        user_id: user.id,
        room_id: roomId,
      };

      // Enviar mensagem criptografada
      socketService.sendEncryptedMessage(payload);

      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Erro ao enviar mensagem criptografada:', error);
      setError('Falha ao criptografar mensagem');
    }
  };

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
    sendEncryptedMessage,
    initializeCrypto: () => {
      if (user && roomId && recipientUserId) {
        initializeCrypto(user.id, roomId, recipientUserId);
      }
    },
    isConnected,
    isCryptoInitialized,
    error,
  };
}
