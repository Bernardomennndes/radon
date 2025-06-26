import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DatabaseService } from './database.js';
import { cryptoService } from './crypto.js';
import type { 
  SocketEvents, 
  CreateMessagePayload, 
  CreateEncryptedMessagePayload,
  JoinRoomPayload,
  InitializeCryptoPayload
} from './types.js';
import { 
  drizzleUserToSocket, 
  legacyUserToSocket,
  drizzleMessageToSocket, 
  drizzleEncryptedMessageToSocket 
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const server = createServer(app);
const io = new SocketIOServer<SocketEvents>(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const db = new DatabaseService();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Chat server is running' });
});

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await db.getRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

app.get('/api/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await db.getMessages(roomId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { name, description } = req.body;
    const room = await db.createRoom(name, description);
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, avatar_url } = req.body;
    
    // Gerar chaves de criptografia para o novo usuário
    const userKeys = cryptoService.generateUserKeys(username);
    
    // Criar usuário no banco com as chaves
    const user = await db.createUser(username, avatar_url, userKeys);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/users/:userId/keys', async (req, res) => {
  try {
    const { userId } = req.params;
    const userKeys = await db.getUserKeys(userId);
    
    if (!userKeys) {
      return res.status(404).json({ error: 'User keys not found' });
    }
    
    res.json(userKeys);
  } catch (error) {
    console.error('Error fetching user keys:', error);
    res.status(500).json({ error: 'Failed to fetch user keys' });
  }
});

app.get('/api/rooms/:roomId/encrypted-messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await db.getEncryptedMessages(roomId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching encrypted messages:', error);
    res.status(500).json({ error: 'Failed to fetch encrypted messages' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', async (payload: JoinRoomPayload) => {
    try {
      const { room_id, user_id } = payload;
      
      // Verify user and room exist
      const user = await db.getUser(user_id);
      const room = await db.getRoom(room_id);
      
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        console.error(`Error joining room: User not found: ${user_id}`);
        return;
      }

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        console.error(`Error joining room: Room not found: ${room_id}`);
        return;
      }

      // Join the room
      socket.join(room_id);
      
      // Store user_id in socket data for tracking
      socket.data = { ...socket.data, user_id, room_id };
      
      // Get all users currently in the room (after this user joined)
      const socketsInRoom = await io.in(room_id).fetchSockets();
      const userIds = new Set<string>();
      
      console.log(`Total sockets in room ${room_id}: ${socketsInRoom.length}`);
      
      // Collect user IDs from all sockets in the room
      for (const socketInRoom of socketsInRoom) {
        console.log(`Socket ${socketInRoom.id} has user_id:`, socketInRoom.data?.user_id);
        if (socketInRoom.data?.user_id && socketInRoom.data.user_id !== user_id) {
          userIds.add(socketInRoom.data.user_id);
        }
      }
      
      console.log(`Found ${userIds.size} other users in room ${room_id}:`, Array.from(userIds));
      
      // Create crypto sessions with each user in the room
      for (const otherUserId of userIds) {
        try {
          console.log(`Checking session between ${user_id} and ${otherUserId} in room ${room_id}`);
          
          // Check if session already exists
          const existingSession = await db.getCryptoSession(user_id, otherUserId, room_id);
          
          if (!existingSession) {
            console.log(`Creating new crypto session between ${user_id} and ${otherUserId}`);
            
            // Generate session ID
            const sessionId = `${room_id}_${[user_id, otherUserId].sort().join('_')}`;
            
            // Create new crypto session
            const sortedUsers = [user_id, otherUserId].sort();
            const newSession = {
              sessionId,
              userId1: sortedUsers[0]!,
              userId2: sortedUsers[1]!,
              roomId: room_id,
              sessionState: JSON.stringify({}),
              rootKey: cryptoService.generateRootKey(),
              sendingChainKey: cryptoService.generateChainKey(),
              receivingChainKey: cryptoService.generateChainKey(),
              messageKeys: JSON.stringify([]),
            };
            
            await db.createCryptoSession(newSession);
            console.log(`✅ Created crypto session between ${user.username} and user ${otherUserId} in room ${room.name}`);
          } else {
            console.log(`Session already exists between ${user_id} and ${otherUserId}`);
          }
        } catch (sessionError) {
          console.error('❌ Error creating crypto session:', sessionError);
          // Don't fail the join if session creation fails
        }
      }
      
      // Notify others in the room AND notify the joining user about existing users
      socket.to(room_id).emit('user_joined', { user: legacyUserToSocket(user), room_id });
      
      // Notify the joining user about all existing users in the room
      for (const otherUserId of userIds) {
        try {
          const otherUser = await db.getUser(otherUserId);
          if (otherUser) {
            socket.emit('user_already_in_room', { user: legacyUserToSocket(otherUser), room_id });
          }
        } catch (error) {
          console.error('Error fetching other user data:', error);
        }
      }
      
      console.log(`User ${user.username} joined room ${room.name}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('leave_room', async (payload) => {
    try {
      const { room_id } = payload;
      socket.leave(room_id);
      
      // Note: In a production app, you'd want to track user_id for this socket
      // and notify others when they leave
      console.log(`User left room ${room_id}`);
      
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  socket.on('send_encrypted_message', async (payload: CreateEncryptedMessagePayload) => {
    try {
      const { 
        encrypted_content, 
        sender_key_id, 
        recipient_key_id, 
        message_number, 
        nonce, 
        user_id, 
        room_id 
      } = payload;
      
      // Validar usuário e sala
      const user = await db.getUser(user_id);
      const room = await db.getRoom(room_id);
      
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        console.error(`Error sending encrypted message: User not found: ${user_id}`);
        return;
      }

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        console.error(`Error sending encrypted message: Room not found: ${room_id}`);
        return;
      }
      
      // Preparar dados criptografados
      const encryptedData = {
        encryptedContent: encrypted_content,
        senderKeyId: sender_key_id,
        recipientKeyId: recipient_key_id,
        messageNumber: message_number,
        previousMessageNumber: (parseInt(message_number) - 1).toString(),
        nonce: nonce,
      };
      
      // Salvar mensagem criptografada no banco
      const message = await db.createEncryptedMessage(encryptedData, user_id, room_id);
      
      // Emitir para todos os usuários na sala
      io.to(room_id).emit('encrypted_message_received', drizzleEncryptedMessageToSocket(message));
      
      console.log(`Encrypted message sent in room ${room.name}`);
      
    } catch (error) {
      console.error('Error sending encrypted message:', error);
      socket.emit('error', { message: 'Failed to send encrypted message' });
    }
  });

  socket.on('initialize_crypto', async (payload: InitializeCryptoPayload) => {
    try {
      const { user_id, identity_key, signed_pre_key, one_time_pre_keys, registration_id } = payload;
      
      // Verificar se o usuário existe
      const user = await db.getUser(user_id);
      
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }
      
      // Atualizar chaves do usuário no banco
      const userKeys = {
        identityKey: identity_key,
        signedPreKey: signed_pre_key,
        oneTimePreKeys: one_time_pre_keys,
        registrationId: registration_id,
      };
      
      await db.updateUserKeys(user_id, userKeys);
      
      socket.emit('crypto_initialized', { success: true, message: 'Crypto keys saved successfully' });
      
    } catch (error) {
      console.error('Error initializing crypto:', error);
      socket.emit('crypto_initialized', { success: false, message: 'Failed to initialize crypto' });
    }
  });

  socket.on('get_user_keys', async (payload: { user_id: string }) => {
    try {
      const { user_id } = payload;
      const userKeys = await db.getUserKeys(user_id);
      
      socket.emit('user_keys_response', { user_keys: userKeys });
      
    } catch (error) {
      console.error('Error getting user keys:', error);
      socket.emit('error', { message: 'Failed to get user keys' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
  console.log(`🔗 Socket.IO server ready for connections`);
});
