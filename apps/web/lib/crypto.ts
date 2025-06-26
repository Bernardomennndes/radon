import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import type { UserKeys, EncryptedMessage } from './types';

export interface CryptoKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface UserCryptoKeys {
  identityKeyPair: CryptoKeyPair;
  signedPreKey: CryptoKeyPair;
  oneTimePreKeys: CryptoKeyPair[];
  registrationId: string;
}

export interface SessionData {
  sharedSecret: string;
}

/**
 * Serviço de criptografia E2EE para o frontend
 * Implementa conceitos similares ao Signal Protocol usando NaCl
 */
export class ClientCryptoService {
  private userKeys = new Map<string, UserCryptoKeys>();
  private sessions = new Map<string, SessionData>();

  /**
   * Gera chaves criptográficas para um usuário no cliente
   */
  generateUserKeys(userId: string): UserKeys {
    // Gerar chave de identidade
    const identityKeyPair = nacl.box.keyPair();
    
    // Gerar chave pré-assinada
    const signedPreKeyPair = nacl.box.keyPair();
    
    // Gerar chaves de uso único
    const oneTimePreKeys: string[] = [];
    const oneTimeKeyPairs: CryptoKeyPair[] = [];
    
    for (let i = 0; i < 10; i++) {
      const keyPair = nacl.box.keyPair();
      oneTimePreKeys.push(naclUtil.encodeBase64(keyPair.publicKey));
      oneTimeKeyPairs.push({
        publicKey: naclUtil.encodeBase64(keyPair.publicKey),
        privateKey: naclUtil.encodeBase64(keyPair.secretKey),
      });
    }

    // Gerar ID de registro
    const registrationId = Math.floor(Math.random() * 10000).toString();

    // Armazenar chaves do usuário
    const userCryptoKeys: UserCryptoKeys = {
      identityKeyPair: {
        publicKey: naclUtil.encodeBase64(identityKeyPair.publicKey),
        privateKey: naclUtil.encodeBase64(identityKeyPair.secretKey),
      },
      signedPreKey: {
        publicKey: naclUtil.encodeBase64(signedPreKeyPair.publicKey),
        privateKey: naclUtil.encodeBase64(signedPreKeyPair.secretKey),
      },
      oneTimePreKeys: oneTimeKeyPairs,
      registrationId,
    };

    this.userKeys.set(userId, userCryptoKeys);

    return {
      identityKey: naclUtil.encodeBase64(identityKeyPair.publicKey),
      signedPreKey: naclUtil.encodeBase64(signedPreKeyPair.publicKey),
      oneTimePreKeys,
      registrationId,
    };
  }

  /**
   * Carrega chaves de usuário no serviço
   */
  loadUserKeys(userId: string, keys: UserKeys): void {
    // Simular carregamento das chaves
    // Em uma implementação real, as chaves privadas seriam armazenadas de forma segura
    const userCryptoKeys: UserCryptoKeys = {
      identityKeyPair: {
        publicKey: keys.identityKey,
        privateKey: '', // Chave privada seria carregada de forma segura
      },
      signedPreKey: {
        publicKey: keys.signedPreKey,
        privateKey: '', // Chave privada seria carregada de forma segura
      },
      oneTimePreKeys: keys.oneTimePreKeys.map(key => ({
        publicKey: key,
        privateKey: '', // Chave privada seria carregada de forma segura
      })),
      registrationId: keys.registrationId,
    };

    this.userKeys.set(userId, userCryptoKeys);
  }

  /**
   * Estabelece uma sessão de criptografia entre dois usuários
   */
  establishSession(senderId: string, recipientId: string): void {
    const sessionKey = this.generateSessionKey(senderId, recipientId);
    
    // Verificar se já existe uma sessão
    if (this.sessions.has(sessionKey)) {
      console.log(`Session ${sessionKey} already exists, skipping creation`);
      return; // Sessão já existe
    }

    // Para demonstração, vamos usar uma chave de sessão determinística baseada nos IDs ordenados
    // Em uma implementação real, usaríamos Diffie-Hellman com as chaves dos usuários
    const [user1, user2] = [senderId, recipientId].sort();
    const combinedId = `${user1}:${user2}`;
    
    console.log(`Creating session for sessionKey: ${sessionKey}`);
    console.log(`Sender: ${senderId}, Recipient: ${recipientId}`);
    console.log(`Ordered users: ${user1}, ${user2}`);
    console.log(`Combined ID for hashing: "${combinedId}"`);
    
    const combinedIdBytes = naclUtil.decodeUTF8(combinedId);
    console.log(`Combined ID bytes length: ${combinedIdBytes.length}`);
    
    const hash = nacl.hash(combinedIdBytes);
    console.log(`Hash length: ${hash.length}, first 10 bytes: ${Array.from(hash.slice(0, 10)).join(',')}`);
    
    const sessionSecret = hash.slice(0, 32); // Usar os primeiros 32 bytes do hash
    const sessionSecretBase64 = naclUtil.encodeBase64(sessionSecret);
    
    console.log(`Session secret (base64): ${sessionSecretBase64}`);
    
    const sessionData: SessionData = {
      sharedSecret: sessionSecretBase64,
    };
    
    this.sessions.set(sessionKey, sessionData);
    
    console.log(`✅ Established session ${sessionKey} with combined ID: ${combinedId}, secret: ${sessionData.sharedSecret.substring(0, 10)}...`);
  }

  /**
   * Criptografa uma mensagem
   */
  encryptMessage(senderId: string, recipientId: string, content: string): EncryptedMessage {
    const sessionKey = this.generateSessionKey(senderId, recipientId);
    let session = this.sessions.get(sessionKey);
    
    console.log(`Attempting to encrypt message. SessionKey: ${sessionKey}, HasSession: ${!!session}`);
    
    if (!session) {
      // Estabelecer sessão se não existir
      this.establishSession(senderId, recipientId);
      session = this.sessions.get(sessionKey);
      if (!session) {
        throw new Error('Failed to establish session for encryption');
      }
    }

    // Gerar nonce único para esta mensagem
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    
    // Criptografar usando uma chave derivada
    const messageBytes = naclUtil.decodeUTF8(content);
    const key = naclUtil.decodeBase64(session.sharedSecret);
    
    console.log(`Encryption details:`, {
      sessionKey,
      sessionSecret: session.sharedSecret.substring(0, 10) + '...',
      messageLength: messageBytes.length,
      nonceLength: nonce.length,
      keyLength: key.length,
      content: content.substring(0, 20) + (content.length > 20 ? '...' : '')
    });
    
    const encryptedBytes = nacl.secretbox(messageBytes, nonce, key);
    
    const result = {
      encryptedContent: naclUtil.encodeBase64(encryptedBytes),
      senderKeyId: senderId,
      recipientKeyId: recipientId,
      messageNumber: '1', // Simplificado - sem contador
      previousMessageNumber: '0',
      nonce: naclUtil.encodeBase64(nonce),
    };
    
    console.log(`Successfully encrypted message for session ${sessionKey}`);
    return result;
  }

  /**
   * Descriptografa uma mensagem
   */
  decryptMessage(
    recipientId: string,
    senderId: string,
    encryptedMessage: EncryptedMessage & { nonce?: string }
  ): string {
    const sessionKey = this.generateSessionKey(senderId, recipientId);
    let session = this.sessions.get(sessionKey);
    
    console.log(`Attempting to decrypt message. SessionKey: ${sessionKey}, HasSession: ${!!session}`);
    
    if (!session) {
      console.log(`No session found for ${sessionKey}, establishing new session...`);
      this.establishSession(senderId, recipientId);
      session = this.sessions.get(sessionKey);
      if (!session) {
        throw new Error(`Failed to establish session between ${senderId} and ${recipientId}`);
      }
    }

    if (!encryptedMessage.nonce) {
      throw new Error('Nonce is required for decryption');
    }

    try {
      // Descriptografar usando a chave de sessão
      const encryptedBytes = naclUtil.decodeBase64(encryptedMessage.encryptedContent);
      const nonce = naclUtil.decodeBase64(encryptedMessage.nonce);
      const key = naclUtil.decodeBase64(session.sharedSecret);
      
      console.log(`Decryption details:`, {
        sessionKey,
        sessionSecret: session.sharedSecret.substring(0, 10) + '...',
        encryptedContentLength: encryptedBytes.length,
        nonceLength: nonce.length,
        keyLength: key.length
      });
      
      const decryptedBytes = nacl.secretbox.open(encryptedBytes, nonce, key);
      
      if (!decryptedBytes) {
        throw new Error('Failed to decrypt message - invalid key or corrupted data');
      }
      
      const result = naclUtil.encodeUTF8(decryptedBytes);
      console.log(`Successfully decrypted message: "${result}"`);
      return result;
    } catch (error) {
      console.error(`Decryption error for session ${sessionKey}:`, error);
      if (error instanceof Error) {
        throw new Error(`Decryption failed: ${error.message}`);
      } else {
        throw new Error('Decryption failed: unknown error');
      }
    }
  }

  /**
   * Gera uma chave de sessão única para dois usuários
   */
  private generateSessionKey(userId1: string, userId2: string): string {
    // Garantir ordem consistente para chave de sessão
    const [user1, user2] = [userId1, userId2].sort();
    return `${user1}:${user2}`;
  }

  /**
   * Verifica se existe uma sessão entre dois usuários
   */
  hasSession(userId1: string, userId2: string): boolean {
    const sessionKey = this.generateSessionKey(userId1, userId2);
    return this.sessions.has(sessionKey);
  }

  /**
   * Obtém as chaves públicas de um usuário
   */
  getUserKeys(userId: string): UserKeys | null {
    const userCryptoKeys = this.userKeys.get(userId);
    if (!userCryptoKeys) {
      return null;
    }

    return {
      identityKey: userCryptoKeys.identityKeyPair.publicKey,
      signedPreKey: userCryptoKeys.signedPreKey.publicKey,
      oneTimePreKeys: userCryptoKeys.oneTimePreKeys.map(k => k.publicKey),
      registrationId: userCryptoKeys.registrationId,
    };
  }
}

// Instância singleton do serviço de criptografia do cliente
export const clientCryptoService = new ClientCryptoService();
