import { API_BASE_URL } from './authService'
import { Conversation } from '@/types/chat'

export const groupService = {
  async createGroup(name: string, participantIds: string[]): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name,
        participant_ids: participantIds
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao criar grupo')
    }

    return await response.json()
  }
}