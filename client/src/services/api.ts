import axios from 'axios';
import { PublicKey, EncryptedMessage, ChatMessage } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export const connectToServer = async (userId: string, publicKey: PublicKey): Promise<void> => {
  await api.post('/connect', { userId, publicKey });
};

export const getUsers = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/users');
  return response.data;
};

export const sendMessage = async (encryptedMessage: EncryptedMessage, senderId: string, receiverId: string): Promise<void> => {
  await api.post('/send-message', { encryptedMessage, senderId, receiverId });
};

export const receiveMessages = async (userId: string, otherUserId: string): Promise<ChatMessage[]> => {
  try {
    const response = await api.post<ChatMessage[]>('/receive-messages', { userId, otherUserId });
    return response.data || [];
  } catch (error) {
    console.error('Erro ao receber mensagens:', error);
    return [];
  }
};

export async function disconnectUser(userId: string): Promise<void> {
  await api.post('/disconnect', { userId });
}

export const getPublicKey = async (userId: string): Promise<PublicKey> => {
  const response = await api.get<PublicKey>(`/public-key/${userId}`);
  return response.data;
};

export const sendHeartbeat = async (userId: string): Promise<void> => {
  await api.post('/heartbeat', { userId });
};