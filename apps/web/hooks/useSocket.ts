'use client';

import { useEffect, useState } from 'react';
import { socketService } from '../lib/socket';
import { clientCryptoService } from '../lib/crypto';
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
  const [isCryptoInitialized, setIsCryptoInitialized] = useState(false);
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!roomId || !user || !isConnected) return;

    // Clear any previous messages and errors when joining a new room
    setMessages([]);
    setError(null);
    setIsCryptoInitialized(false);

    // Initialize crypto keys for the user if not already done
    if (!clientCryptoService.getUserKeys(user.id)) {
      const userKeys = clientCryptoService.generateUserKeys(user.id);
      // Send keys to server for other users to access
      socketService.initializeCrypto({
        user_id: user.id,
        identity_key: userKeys.identityKey,
        signed_pre_key: userKeys.signedPreKey,
        one_time_pre_keys: userKeys.oneTimePreKeys,
        registration_id: userKeys.registrationId,
      });
    }
    setIsCryptoInitialized(true);

    // Join the room
    socketService.joinRoom({ room_id: roomId, user_id: user.id });

    // Listen for new encrypted messages
    const unsubscribeEncryptedMessage = socketService.onEncryptedMessageReceived((message) => {
      console.log(`📩 Received encrypted message:`, {
        messageUserId: message.user_id,
        messageSenderKeyId: message.sender_key_id,
        currentUserId: user.id,
        isOwnMessage: message.user_id === user.id
      });
      
      try {
        // For encrypted messages, we need to decrypt them first
        if (message.encrypted_content && message.nonce && message.sender_key_id) {
          
          // Check if this is our own message - if so, ignore it completely
          if (message.user_id === user.id) {
            console.log(`📤 Ignoring own encrypted message from websocket`);
            return; // Don't process our own messages from websocket
          }
          
          console.log(`📨 Processing encrypted message from ${message.sender_key_id}`);
          
          // Establish session if not exists
          if (!clientCryptoService.hasSession(user.id, message.sender_key_id)) {
            clientCryptoService.establishSession(user.id, message.sender_key_id);
          }
          
          // Try to decrypt the message
          const decryptedContent = clientCryptoService.decryptMessage(
            user.id,
            message.sender_key_id,
            {
              encryptedContent: message.encrypted_content,
              senderKeyId: message.sender_key_id,
              recipientKeyId: user.id,
              messageNumber: message.message_number || '0',
              previousMessageNumber: message.previous_message_number || '0',
              nonce: message.nonce,
            }
          );
          
          // Add decrypted message to the list
          setMessages(prev => [...prev, {
            ...message,
            content: decryptedContent,
            is_encrypted: true,
          }]);
        } else {
          // If message can't be decrypted, show it as encrypted
          setMessages(prev => [...prev, {
            ...message,
            content: '[Mensagem criptografada - não foi possível descriptografar]',
            is_encrypted: true,
          }]);
        }
      } catch (decryptError) {
        console.error('Error decrypting message:', decryptError);
        // Show encrypted message as fallback
        setMessages(prev => [...prev, {
          ...message,
          content: '[Erro ao descriptografar mensagem]',
          is_encrypted: true,
        }]);
      }
    });

    // Listen for users joining
    const unsubscribeUserJoined = socketService.onUserJoined(({ user: joinedUser }) => {
      setOnlineUsers(prev => {
        const exists = prev.some(u => u.id === joinedUser.id);
        if (!exists) {
          // Establish session with the new user
          if (!clientCryptoService.hasSession(user.id, joinedUser.id)) {
            clientCryptoService.establishSession(user.id, joinedUser.id);
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
          // Establish session with existing user
          if (!clientCryptoService.hasSession(user.id, existingUser.id)) {
            clientCryptoService.establishSession(user.id, existingUser.id);
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

    // Listen for errors
    const unsubscribeError = socketService.onError(({ message }) => {
      console.error('Socket error:', message);
      setError(message);
    });

    // Listen for crypto initialization response
    const unsubscribeCryptoInit = socketService.onCryptoInitialized(({ success, message }) => {
      if (!success) {
        console.error('Crypto initialization failed:', message);
        setError('Falha ao inicializar criptografia: ' + message);
      }
    });

    return () => {
      if (roomId) {
        socketService.leaveRoom(roomId);
      }
      unsubscribeEncryptedMessage();
      unsubscribeUserJoined();
      unsubscribeUserAlreadyInRoom();
      unsubscribeUserLeft();
      unsubscribeError();
      unsubscribeCryptoInit();
    };
  }, [roomId, user, isConnected]);

  const sendMessage = (content: string) => {
    if (!roomId || !user || !content.trim() || !isCryptoInitialized) return;

    // Clear any previous errors
    setError(null);

    try {
      // Find the first other user in the room as recipient
      const recipientUser = onlineUsers.find(u => u.id !== user.id);
      
      if (!recipientUser) {
        // No other users in room - just send regular message
        socketService.sendMessage({
          content: content.trim(),
          user_id: user.id,
          room_id: roomId,
        });
        return;
      }
      
      const recipientId = recipientUser.id;
      
      console.log(`🔐 Sending encrypted message from ${user.id} to ${recipientId}`);
      
      // Establish session if not exists
      if (!clientCryptoService.hasSession(user.id, recipientId)) {
        clientCryptoService.establishSession(user.id, recipientId);
      }
      
      // Encrypt the message
      const encryptedMessage = clientCryptoService.encryptMessage(user.id, recipientId, content.trim());
      
      // Send encrypted message
      socketService.sendEncryptedMessage({
        encrypted_content: encryptedMessage.encryptedContent,
        sender_key_id: encryptedMessage.senderKeyId,
        recipient_key_id: encryptedMessage.recipientKeyId,
        message_number: encryptedMessage.messageNumber,
        previous_message_number: encryptedMessage.previousMessageNumber,
        nonce: encryptedMessage.nonce || '',
        user_id: user.id,
        room_id: roomId,
      });
      
      // Add message optimistically to the UI (sender sees it immediately)
      setMessages(prev => [...prev, {
        id: `temp-${Date.now()}`, // Temporary ID
        content: content.trim(),
        user_id: user.id,
        room_id: roomId,
        created_at: new Date().toISOString(),
        is_encrypted: true,
        user: user,
      }]);
      
    } catch (encryptError) {
      console.error('Error encrypting message:', encryptError);
      setError('Erro ao criptografar mensagem: ' + (encryptError as Error).message);
    }
  };

  return {
    messages,
    onlineUsers,
    sendMessage,
    isConnected,
    isCryptoInitialized,
    error,
  };
}
