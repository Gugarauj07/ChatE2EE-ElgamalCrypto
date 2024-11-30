import { API_BASE_URL } from './authService'

interface Contact {
  id: string
  username: string
  publicKey: {
    p: string
    g: string
    y: string
  }
}

export const contactService = {
  async searchUsers(query: string): Promise<Contact[]> {
    const response = await fetch(`${API_BASE_URL}/contacts/search?q=${query}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao buscar usuários')
    }

    return await response.json()
  },

  async addContact(contactId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ contact_id: contactId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao adicionar contato')
    }
  },

  async listContacts(): Promise<Contact[]> {
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao listar contatos')
    }

    return await response.json()
  }
}