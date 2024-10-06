import { ElGamal } from '../utils/elgamal';

export interface PublicKey {
  p: number;
  g: number;
  y: number;
}

export interface PrivateKey {
  x: number;
}

export interface KeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

export interface EncryptedMessage {
  a: any;
  b: any;
}

export interface ChatMessage {
  sender: string;
  content: string;
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
  publicKey: string;
  privateKey: string;
}