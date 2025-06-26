const API_BASE_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001')
  : 'http://localhost:3001';

export async function fetchRooms() {
  const response = await fetch(`${API_BASE_URL}/api/rooms`);
  if (!response.ok) {
    throw new Error('Failed to fetch rooms');
  }
  return response.json();
}

export async function fetchMessages(roomId: string) {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/messages`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
}

export async function createRoom(name: string, description?: string) {
  const response = await fetch(`${API_BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create room');
  }
  return response.json();
}

export async function createUser(username: string, avatar_url?: string) {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, avatar_url }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  return response.json();
}
