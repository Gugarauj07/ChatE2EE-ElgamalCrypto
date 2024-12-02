// src/services/conversationService.ts
import { API_BASE_URL } from './authService'
import { Conversation, Message } from '@/types/chat'

export const conversationService = {
  async listConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
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
    const response = await fetch(`${API_BASE_URL}/api/conversations/${id}?include_messages=true`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao carregar conversa')
    }

    const data = await response.json()
    return {
      conversation: data.conversation,
      messages: Array.isArray(data.messages) ? data.messages : []
    }
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ content })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao enviar mensagem')
    }

    return await response.json()
  }
}