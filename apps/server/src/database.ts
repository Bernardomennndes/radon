import { eq, desc, asc } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { users, rooms, messages, type User, type Room, type Message, type NewUser, type NewRoom, type NewMessage, type MessageWithUser } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuração da conexão com Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Database service functions using Supabase client
export class DatabaseService {
  async createMessage(content: string, userId: string, roomId: string): Promise<MessageWithUser> {
    // Criar mensagem usando Supabase
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        content,
        user_id: userId,
        room_id: roomId,
      })
      .select()
      .single();

    if (messageError || !message) {
      throw new Error(`Failed to create message: ${messageError?.message}`);
    }

    // Buscar a mensagem com os dados do usuário
    const { data: messageWithUser, error: joinError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        user_id,
        room_id,
        created_at,
        users!inner (
          id,
          username,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .eq('id', message.id)
      .single();

    if (joinError || !messageWithUser) {
      throw new Error(`Failed to fetch message with user: ${joinError?.message}`);
    }

    const userData = Array.isArray(messageWithUser.users) ? messageWithUser.users[0] : messageWithUser.users;

    if (!userData) {
      throw new Error('User data not found for message');
    }

    // Converter para o formato esperado pelo frontend
    return {
      id: messageWithUser.id,
      content: messageWithUser.content,
      userId: messageWithUser.user_id,
      roomId: messageWithUser.room_id,
      createdAt: new Date(messageWithUser.created_at),
      updatedAt: new Date(messageWithUser.created_at),
      user: {
        id: userData.id,
        username: userData.username,
        avatarUrl: userData.avatar_url,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
      }
    };
  }

  async getMessages(roomId: string, limit = 50): Promise<MessageWithUser[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        user_id,
        room_id,
        created_at,
        users!inner (
          id,
          username,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    // Converter para o formato esperado e reverter ordem (mais antigas primeiro)
    return (messages || []).reverse().map(msg => {
      const userData = Array.isArray(msg.users) ? msg.users[0] : msg.users;
      
      if (!userData) {
        throw new Error('User data not found for message');
      }

      return {
        id: msg.id,
        content: msg.content,
        userId: msg.user_id,
        roomId: msg.room_id,
        createdAt: new Date(msg.created_at),
        updatedAt: new Date(msg.created_at),
        user: {
          id: userData.id,
          username: userData.username,
          avatarUrl: userData.avatar_url,
          createdAt: new Date(userData.created_at),
          updatedAt: new Date(userData.updated_at),
        }
      };
    });
  }

  async getUser(userId: string): Promise<User | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If user not found, return null instead of throwing
      if (error.code === 'PGRST116') {
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

  async createUser(username: string, avatarUrl?: string): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username,
        avatar_url: avatarUrl,
      })
      .select()
      .single();

    if (error || !user) {
      throw new Error(`Failed to create user: ${error?.message}`);
    }

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    };
  }

  async getRooms(): Promise<Room[]> {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch rooms: ${error.message}`);
    }

    return (rooms || []).map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      createdAt: new Date(room.created_at),
      updatedAt: new Date(room.updated_at),
    }));
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      // If room not found, return null instead of throwing
      if (error.code === 'PGRST116') {
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
      .from('rooms')
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
}
