// src/services/conversationService.ts
import { API_BASE_URL } from './authService'
import { Conversation, Message } from '@/types/chat'

export const conversationService = {
  async listConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao listar conversas')
    }

    return await response.json()
  },

  async getConversation(id: string): Promise<{ conversation: Conversation, messages: Message[] }> {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao carregar conversa')
    }

    return await response.json()
  }
}