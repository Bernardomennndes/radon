export interface Message {
  id: string;
  content: string;
  user_id: string;
  room_id: string;
  created_at: string;
  user?: User;
  // Campos para mensagens criptografadas
  encrypted_content?: string;
  sender_key_id?: string;
  recipient_key_id?: string;
  message_number?: string;
  previous_message_number?: string;
  nonce?: string;
  is_encrypted?: boolean;
}

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  // Campos para criptografia
  identity_key?: string;
  signed_pre_key?: string;
  one_time_pre_keys?: string[];
  registration_id?: string;
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

export interface CreateEncryptedMessagePayload {
  encrypted_content: string;
  sender_key_id: string;
  recipient_key_id: string;
  message_number: string;
  previous_message_number?: string;
  nonce: string;
  user_id: string;
  room_id: string;
}

export interface JoinRoomPayload {
  room_id: string;
  user_id: string;
}

export interface InitializeCryptoPayload {
  user_id: string;
  identity_key: string;
  signed_pre_key: string;
  one_time_pre_keys: string[];
  registration_id: string;
}

// Tipos para criptografia
export interface UserKeys {
  identityKey: string;
  signedPreKey: string;
  oneTimePreKeys: string[];
  registrationId: string;
}

export interface EncryptedMessage {
  encryptedContent: string;
  senderKeyId: string;
  recipientKeyId: string;
  messageNumber: string;
  previousMessageNumber: string;
  nonce?: string;
}
