export interface Contact {
  id: string
  username: string
  publicKey: {
    p: string
    g: string
    y: string
  }
}

// Interface para a listagem de conversas
export interface ConversationListItem {
  id: string
  type: 'DIRECT' | 'GROUP'
  name: string
  unreadCount: number
  updatedAt: string
}

// Interface para os detalhes da conversa
export interface ConversationDetails {
  id: string
  type: 'DIRECT' | 'GROUP'
  name: string
  createdAt: string
  participants: Contact[]
  messages?: Message[]
}

export interface Message {
  id: string
  senderId: string
  createdAt: string
  content: {
    a: string
    b: string
    p: string
  }
  status: 'SENT' | 'DELIVERED' | 'READ'
}