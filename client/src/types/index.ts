import { ElGamal } from '../utils/elgamal';

export interface PublicKey {
  p: string;
  g: string;
  y: string;
}

export interface PrivateKey {
  x: string;
}

export interface KeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

export interface EncryptedMessage {
  a: string;
  b: string;
}

export interface ChatMessage {
  senderId: string;
  encryptedContent: EncryptedMessage;
  content?: string;
  timestamp: string;
  isOwnMessage: boolean;
}

export interface ReceivedMessage {
  senderId: string;
  encryptedMessage: EncryptedMessage;
}

export interface EncryptionLogEntry {
  type: 'keys' | 'connect' | 'partner' | 'encrypt' | 'decrypt';
  content: string;
  details: string;
}

// Adicionando o tipo para o estado de navegação
export interface LocationState {
  selectedUser: string;
  publicKey: PublicKey;
  privateKey: PrivateKey;
  userId: string;
}