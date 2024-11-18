import { PublicKey } from '../utils/elgamal';

export interface Message {
  id: string;
  conversationId: string;
  sender: string;
  encryptedContent: string;
  content?: string;
  timestamp: string;
  isDelivered: boolean;
}

export interface Conversation {
  id: string;
  createdAt: string;
  groupId?: string;
  participants: string[];
  messages: Message[];
  encryptedKeys: { [userId: string]: string };
  senderKey?: string;
}

export interface Contact {
  id: string;
  username: string;
  publicKey: PublicKey;
}

export interface User {
  id: string;
  username: string;
  publicKey: PublicKey;
  created_at: string;
  last_seen: string;
}
