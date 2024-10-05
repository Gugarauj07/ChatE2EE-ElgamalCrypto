import axios from 'axios';
import { KeyPair, PublicKey, EncryptedMessage, ChatMessage } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export const generateKeys = async (): Promise<KeyPair> => {
  const response = await api.get<KeyPair>('/generate-keys');
  return response.data;
};

export const connectToServer = async (userId: string, publicKey: PublicKey): Promise<void> => {
  await api.post('/connect', { userId, publicKey });
};

export const getUsers = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/users');
  return response.data;
};

export const getPublicKey = async (userId: string): Promise<PublicKey> => {
  const response = await api.get<PublicKey>(`/public-key/${userId}`);
  return response.data;
};

export const encryptMessage = async (message: string, publicKey: PublicKey): Promise<EncryptedMessage> => {
  const response = await api.post<EncryptedMessage>('/encrypt', { message, publicKey });
  return response.data;
};

export const decryptMessage = async (encryptedMessage: EncryptedMessage, privateKey: number, publicKey: PublicKey): Promise<string> => {
  const response = await api.post<string>('/decrypt', { encryptedMessage, privateKey, publicKey });
  return response.data;
};

export const sendMessage = async (encryptedMessage: EncryptedMessage, senderId: string, receiverId: string): Promise<void> => {
  await api.post('/send-message', { encryptedMessage, senderId, receiverId });
};

export const receiveMessages = async (userId: string, privateKey: number): Promise<ChatMessage[]> => {
  const response = await api.post<ChatMessage[]>('/receive-messages', { userId, privateKey });
  return response.data;
};

export async function disconnectUser(userId: string): Promise<void> {
  const response = await fetch('http://localhost:3000/disconnect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to disconnect user');
  }
}