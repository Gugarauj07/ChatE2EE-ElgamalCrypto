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
  a: number;
  b: number;
}

export interface ChatMessage {
  sender: string;
  receiver: string;
  message: string;
}

export interface EncryptionLogEntry {
  type: 'keys' | 'connect' | 'partner' | 'encrypt' | 'decrypt';
  content: string;
  details: string;
}