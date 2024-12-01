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
  name: string
  unread_count: number
  updated_at: string
}

export interface Message {
  id: string
  content: string
  senderId: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read'
  encrypted: {
    a: string
    b: string
    p: string
  }
}