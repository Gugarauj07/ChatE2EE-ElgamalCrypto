// client/src/services/messageService.ts
import api from './api';
import { Message, Conversation } from '../types/chat';
import { EncryptedMessage } from '@/utils/elgamal';

// Definir interfaces para os diferentes tipos de requisição
interface CreateConversationRequest {
  ParticipantIDs: string[];
  EncryptedKeys: { [key: string]: EncryptedMessage };
}

export const messageService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/api/conversations');
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<Message> => {
    const response = await api.post(`/api/conversations/${conversationId}/messages`, { content });
    return response.data;
  },

  receiveMessage: async (conversationId: string): Promise<Message> => {
    const response = await api.get(`/api/conversations/${conversationId}/messages/latest`);
    return response.data;
  },

  createConversation: async (
    payload: CreateConversationRequest
  ): Promise<Conversation> => {
    const response = await api.post('/api/conversations', payload);
    return response.data;
  },
};