'use client';

import { useState } from 'react';
import { useEncryptedChat } from '../hooks/useEncryptedChat';
import type { User } from '../lib/types';

interface EncryptedChatProps {
  user: User | null;
  roomId: string | null;
  recipientUserId: string | null;
}

export function EncryptedChat({ user, roomId, recipientUserId }: EncryptedChatProps) {
  const [message, setMessage] = useState('');
  const [useEncryption, setUseEncryption] = useState(true);
  
  const {
    messages,
    sendMessage,
    sendEncryptedMessage,
    initializeCrypto,
    isConnected,
    isCryptoInitialized,
    error,
  } = useEncryptedChat(roomId, user, recipientUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      if (useEncryption && isCryptoInitialized) {
        sendEncryptedMessage(message);
      } else {
        sendMessage(message);
      }
      setMessage('');
    }
  };

  const handleInitializeCrypto = () => {
    if (user && roomId && recipientUserId) {
      initializeCrypto();
    }
  };

  if (!user || !roomId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Selecione um usuário e sala para começar a conversar
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat Criptografado</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            {recipientUserId && (
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isCryptoInitialized ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                <span className="text-sm text-gray-600">
                  {isCryptoInitialized ? 'Criptografado' : 'Não criptografado'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Crypto Controls */}
        {recipientUserId && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useEncryption}
                  onChange={(e) => setUseEncryption(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Usar criptografia E2EE</span>
              </label>
              
              {!isCryptoInitialized && useEncryption && (
                <button
                  onClick={handleInitializeCrypto}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Inicializar Criptografia
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Nenhuma mensagem ainda. Comece uma conversa!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {msg.user?.username?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {msg.user?.username || 'Usuário Desconhecido'}
                  </span>
                  {msg.is_encrypted && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      🔒 Criptografado
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700 mt-1">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              useEncryption && isCryptoInitialized
                ? "Digite uma mensagem criptografada..."
                : "Digite uma mensagem..."
            }
            disabled={!isConnected}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isConnected || !message.trim() || (useEncryption && !isCryptoInitialized)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {useEncryption && isCryptoInitialized ? '🔒 Enviar' : 'Enviar'}
          </button>
        </form>
        
        {useEncryption && !isCryptoInitialized && recipientUserId && (
          <p className="text-sm text-yellow-600 mt-2">
            ⚠️ Criptografia não inicializada. Clique em &quot;Inicializar Criptografia&quot; para enviar mensagens seguras.
          </p>
        )}
      </div>
    </div>
  );
}
