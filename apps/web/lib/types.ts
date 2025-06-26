export interface Message {
  id: string;
  content: string;
  user_id: string;
  room_id: string;
  created_at: string;
  user?: User;
}

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface CreateMessagePayload {
  content: string;
  user_id: string;
  room_id: string;
}

export interface JoinRoomPayload {
  room_id: string;
  user_id: string;
}
