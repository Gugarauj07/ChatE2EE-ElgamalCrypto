export interface Contact {
  id: string
  username: string
  publicKey: {
    p: string
    g: string
    y: string
  }
}

export interface Conversation {
  id: string
  type: 'DIRECT' | 'GROUP'
  name?: string
  participants: Contact[]
  unreadCount?: number
  updatedAt: string
}

export interface Message {
  id: string
  content: string
  senderId: string
  sender: Contact
  conversationId: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read'
  encrypted: {
    a: string
    b: string
    p: string
  }
}