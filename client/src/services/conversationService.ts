// src/services/conversationService.ts
import { API_BASE_URL } from './authService'
import { ConversationListItem, ConversationDetails, Message } from '@/types/chat'
import { ElGamal } from '@/utils/elgamal'

export const conversationService = {
  async listConversations(): Promise<ConversationListItem[]> {
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

  async getConversation(id: string): Promise<ConversationDetails> {
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
      ...data,
      messages: data.messages || []
    }
  },

  async sendMessage(conversationId: string, content: string, participants: ConversationDetails['participants']): Promise<Message> {
    const elgamal = new ElGamal()
    const encryptedContents: { [key: string]: any } = {}

    for (const participant of participants) {
      const encrypted = elgamal.encrypt(content, participant.publicKey)
      encryptedContents[participant.id] = encrypted
    }

    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ encryptedContents })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao enviar mensagem')
    }

    return await response.json()
  },

  async updateMessageStatus(messageId: string, status: 'RECEIVED' | 'READ'): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao atualizar status da mensagem')
    }
  }
}