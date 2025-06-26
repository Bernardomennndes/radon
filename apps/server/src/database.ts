import { eq, desc, asc } from "drizzle-orm";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  users,
  rooms,
  messages,
  cryptoSessions,
  type User,
  type Room,
  type Message,
  type CryptoSession,
  type NewUser,
  type NewRoom,
  type NewMessage,
  type NewCryptoSession,
  type MessageWithUser,
  type LegacyMessage,
  type LegacyUser,
  type LegacyMessageWithUser,
  type UserKeys,
  type EncryptedMessage,
} from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

// Configuração da conexão com Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
  );
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Database service functions using Supabase client
export class DatabaseService {
  async createMessage(
    content: string,
    userId: string,
    roomId: string
  ): Promise<MessageWithUser> {
    // This method is deprecated - only encrypted messages are supported
    throw new Error("Plain text messages are not supported. Use createEncryptedMessage instead.");
  }

  async getMessages(
    roomId: string,
    limit = 50
  ): Promise<MessageWithUser[]> {
    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        encrypted_content,
        sender_key_id,
        recipient_key_id,
        message_number,
        previous_message_number,
        nonce,
        user_id,
        room_id,
        created_at,
        updated_at,
        users!inner (
          id,
          username,
          avatar_url,
          identity_key,
          signed_pre_key,
          one_time_pre_keys,
          registration_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    // Converter para o formato esperado e reverter ordem (mais antigas primeiro)
    return (messages || []).reverse().map((msg) => {
      const userData = Array.isArray(msg.users) ? msg.users[0] : msg.users;

      if (!userData) {
        throw new Error("User data not found for message");
      }

      return {
        id: msg.id,
        encryptedContent: msg.encrypted_content,
        senderKeyId: msg.sender_key_id,
        recipientKeyId: msg.recipient_key_id,
        messageNumber: msg.message_number,
        previousMessageNumber: msg.previous_message_number,
        nonce: msg.nonce,
        userId: msg.user_id,
        roomId: msg.room_id,
        createdAt: new Date(msg.created_at),
        updatedAt: new Date(msg.updated_at),
        user: {
          id: userData.id,
          username: userData.username,
          avatarUrl: userData.avatar_url,
          identityKey: userData.identity_key,
          signedPreKey: userData.signed_pre_key,
          oneTimePreKeys: userData.one_time_pre_keys,
          registrationId: userData.registration_id,
          createdAt: new Date(userData.created_at),
          updatedAt: new Date(userData.updated_at),
        },
      };
    });
  }

  async getUser(userId: string): Promise<LegacyUser | null> {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // If user not found, return null instead of throwing
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    };
  }

  async createUser(
    username: string,
    avatarUrl?: string,
    userKeys?: UserKeys
  ): Promise<User> {
    const userData: any = {
      username,
      avatar_url: avatarUrl || null,
    };

    // Se as chaves foram fornecidas, incluí-las
    if (userKeys) {
      userData.identity_key = userKeys.identityKey;
      userData.signed_pre_key = userKeys.signedPreKey;
      userData.one_time_pre_keys = JSON.stringify(userKeys.oneTimePreKeys);
      userData.registration_id = userKeys.registrationId;
    }

    const { data: user, error } = await supabase
      .from("users")
      .insert(userData)
      .select()
      .single();

    if (error || !user) {
      throw new Error(`Failed to create user: ${error?.message}`);
    }

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
      identityKey: user.identity_key,
      signedPreKey: user.signed_pre_key,
      oneTimePreKeys: user.one_time_pre_keys,
      registrationId: user.registration_id,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    };
  }

  async getRooms(): Promise<Room[]> {
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch rooms: ${error.message}`);
    }

    return (rooms || []).map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      createdAt: new Date(room.created_at),
      updatedAt: new Date(room.updated_at),
    }));
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const { data: room, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (error) {
      // If room not found, return null instead of throwing
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch room: ${error.message}`);
    }

    if (!room) {
      return null;
    }

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      createdAt: new Date(room.created_at),
      updatedAt: new Date(room.updated_at),
    };
  }

  async createRoom(name: string, description?: string): Promise<Room> {
    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        name,
        description,
      })
      .select()
      .single();

    if (error || !room) {
      throw new Error(`Failed to create room: ${error?.message}`);
    }

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      createdAt: new Date(room.created_at),
      updatedAt: new Date(room.updated_at),
    };
  }

  async createEncryptedMessage(
    encryptedData: EncryptedMessage,
    userId: string,
    roomId: string
  ): Promise<MessageWithUser> {
    // Criar mensagem criptografada usando Supabase
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        encrypted_content: encryptedData.encryptedContent,
        sender_key_id: encryptedData.senderKeyId,
        recipient_key_id: encryptedData.recipientKeyId,
        message_number: encryptedData.messageNumber,
        previous_message_number: encryptedData.previousMessageNumber,
        nonce: encryptedData.nonce,
        user_id: userId,
        room_id: roomId,
      })
      .select()
      .single();

    if (messageError || !message) {
      throw new Error(
        `Failed to create encrypted message: ${messageError?.message}`
      );
    }

    // Buscar a mensagem com os dados do usuário
    const { data: messageWithUser, error: joinError } = await supabase
      .from("messages")
      .select(
        `
        id,
        encrypted_content,
        sender_key_id,
        recipient_key_id,
        message_number,
        previous_message_number,
        nonce,
        user_id,
        room_id,
        created_at,
        users!inner (
          id,
          username,
          avatar_url,
          identity_key,
          signed_pre_key,
          one_time_pre_keys,
          registration_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("id", message.id)
      .single();

    if (joinError || !messageWithUser) {
      throw new Error(
        `Failed to fetch encrypted message with user: ${joinError?.message}`
      );
    }

    const userData = Array.isArray(messageWithUser.users)
      ? messageWithUser.users[0]
      : messageWithUser.users;

    if (!userData) {
      throw new Error("User data not found for message");
    }

    // Converter para o formato esperado
    return {
      id: messageWithUser.id,
      encryptedContent: messageWithUser.encrypted_content,
      senderKeyId: messageWithUser.sender_key_id,
      recipientKeyId: messageWithUser.recipient_key_id,
      messageNumber: messageWithUser.message_number,
      previousMessageNumber: messageWithUser.previous_message_number,
      nonce: messageWithUser.nonce,
      userId: messageWithUser.user_id,
      roomId: messageWithUser.room_id,
      createdAt: new Date(messageWithUser.created_at),
      updatedAt: new Date(messageWithUser.created_at),
      user: {
        id: userData.id,
        username: userData.username,
        avatarUrl: userData.avatar_url,
        identityKey: userData.identity_key,
        signedPreKey: userData.signed_pre_key,
        oneTimePreKeys: userData.one_time_pre_keys,
        registrationId: userData.registration_id,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
      },
    };
  }

  async getEncryptedMessages(
    roomId: string,
    limit = 50
  ): Promise<MessageWithUser[]> {
    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        encrypted_content,
        sender_key_id,
        recipient_key_id,
        message_number,
        previous_message_number,
        nonce,
        user_id,
        room_id,
        created_at,
        users!inner (
          id,
          username,
          avatar_url,
          identity_key,
          signed_pre_key,
          one_time_pre_keys,
          registration_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch encrypted messages: ${error.message}`);
    }

    return (messages || []).reverse().map((msg) => {
      const userData = Array.isArray(msg.users) ? msg.users[0] : msg.users;

      if (!userData) {
        throw new Error("User data not found for message");
      }

      return {
        id: msg.id,
        encryptedContent: msg.encrypted_content,
        senderKeyId: msg.sender_key_id,
        recipientKeyId: msg.recipient_key_id,
        messageNumber: msg.message_number,
        previousMessageNumber: msg.previous_message_number,
        nonce: msg.nonce,
        userId: msg.user_id,
        roomId: msg.room_id,
        createdAt: new Date(msg.created_at),
        updatedAt: new Date(msg.created_at),
        user: {
          id: userData.id,
          username: userData.username,
          avatarUrl: userData.avatar_url,
          identityKey: userData.identity_key,
          signedPreKey: userData.signed_pre_key,
          oneTimePreKeys: userData.one_time_pre_keys,
          registrationId: userData.registration_id,
          createdAt: new Date(userData.created_at),
          updatedAt: new Date(userData.updated_at),
        },
      };
    });
  }

  async getUserKeys(userId: string): Promise<UserKeys | null> {
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "identity_key, signed_pre_key, one_time_pre_keys, registration_id"
      )
      .eq("id", userId)
      .single();

    if (error || !user) {
      return null;
    }

    if (!user.identity_key || !user.signed_pre_key || !user.registration_id) {
      return null;
    }

    return {
      identityKey: user.identity_key,
      signedPreKey: user.signed_pre_key,
      oneTimePreKeys: user.one_time_pre_keys
        ? JSON.parse(user.one_time_pre_keys)
        : [],
      registrationId: user.registration_id,
    };
  }

  async updateUserKeys(userId: string, userKeys: UserKeys): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({
        identity_key: userKeys.identityKey,
        signed_pre_key: userKeys.signedPreKey,
        one_time_pre_keys: JSON.stringify(userKeys.oneTimePreKeys),
        registration_id: userKeys.registrationId,
      })
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to update user keys: ${error.message}`);
    }
  }

  async createCryptoSession(session: NewCryptoSession): Promise<CryptoSession> {
    const { data: cryptoSession, error } = await supabase
      .from("crypto_sessions")
      .insert({
        session_id: session.sessionId,
        user_id_1: session.userId1,
        user_id_2: session.userId2,
        room_id: session.roomId,
        session_state: session.sessionState,
        root_key: session.rootKey,
        sending_chain_key: session.sendingChainKey,
        receiving_chain_key: session.receivingChainKey,
        message_keys: session.messageKeys,
      })
      .select()
      .single();

    if (error || !cryptoSession) {
      throw new Error(`Failed to create crypto session: ${error?.message}`);
    }

    return {
      id: cryptoSession.id,
      sessionId: cryptoSession.session_id,
      userId1: cryptoSession.user_id_1,
      userId2: cryptoSession.user_id_2,
      roomId: cryptoSession.room_id,
      sessionState: cryptoSession.session_state,
      rootKey: cryptoSession.root_key,
      sendingChainKey: cryptoSession.sending_chain_key,
      receivingChainKey: cryptoSession.receiving_chain_key,
      messageKeys: cryptoSession.message_keys,
      createdAt: new Date(cryptoSession.created_at),
      updatedAt: new Date(cryptoSession.updated_at),
    };
  }

  async getCryptoSession(
    userId1: string,
    userId2: string,
    roomId: string
  ): Promise<CryptoSession | null> {
    // Garantir ordem consistente dos usuários
    const [user1, user2] = [userId1, userId2].sort();

    const { data: session, error } = await supabase
      .from("crypto_sessions")
      .select()
      .eq("user_id_1", user1)
      .eq("user_id_2", user2)
      .eq("room_id", roomId)
      .single();

    if (error || !session) {
      return null;
    }

    return {
      id: session.id,
      sessionId: session.session_id,
      userId1: session.user_id_1,
      userId2: session.user_id_2,
      roomId: session.room_id,
      sessionState: session.session_state,
      rootKey: session.root_key,
      sendingChainKey: session.sending_chain_key,
      receivingChainKey: session.receiving_chain_key,
      messageKeys: session.message_keys,
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
    };
  }

  // Métodos legados (manter por compatibilidade)
  async createLegacyMessage(
    content: string,
    userId: string,
    roomId: string
  ): Promise<LegacyMessageWithUser> {
    // This method is deprecated - only encrypted messages are supported
    throw new Error("Plain text messages are not supported. Use createEncryptedMessage instead.");
  }

  async getLegacyMessages(
    roomId: string,
    limit?: number
  ): Promise<MessageWithUser[]> {
    return this.getMessages(roomId, limit);
  }

  async getLegacyUser(userId: string): Promise<LegacyUser | null> {
    return this.getUser(userId);
  }

  async createLegacyUser(username: string, avatarUrl?: string): Promise<User> {
    return this.createUser(username, avatarUrl);
  }

  async getLegacyRooms(): Promise<Room[]> {
    return this.getRooms();
  }

  async getLegacyRoom(roomId: string): Promise<Room | null> {
    return this.getRoom(roomId);
  }

  async createLegacyRoom(name: string, description?: string): Promise<Room> {
    return this.createRoom(name, description);
  }
}
