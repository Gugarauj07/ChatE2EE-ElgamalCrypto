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
  type: 'individual' | 'group'
  name: string // Nome do contato ou do grupo
  lastMessage?: {
    content: string
    timestamp: string
    senderId: string
  }
  participants: Contact[]
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