import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DatabaseService } from './database.js';
import type { SocketEvents, CreateMessagePayload, JoinRoomPayload } from './types.js';
import { drizzleUserToSocket, drizzleMessageToSocket } from './types.js';

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
    const user = await db.createUser(username, avatar_url);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
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
      
      // Notify others in the room
      socket.to(room_id).emit('user_joined', { user: drizzleUserToSocket(user), room_id });
      
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

  socket.on('send_message', async (payload: CreateMessagePayload) => {
    try {
      const { content, user_id, room_id } = payload;
      
      // Validate user and room exist
      const user = await db.getUser(user_id);
      const room = await db.getRoom(room_id);
      
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        console.error(`Error sending message: User not found: ${user_id}`);
        return;
      }

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        console.error(`Error sending message: Room not found: ${room_id}`);
        return;
      }
      
      // Save message to database
      const message = await db.createMessage(content, user_id, room_id);
      
      // Emit to all users in the room
      io.to(room_id).emit('message_received', drizzleMessageToSocket(message));
      
      console.log(`Message sent in room ${room.name}: ${content}`);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
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
