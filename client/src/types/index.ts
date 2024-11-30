// src/types/index.ts

export interface User {
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
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
}

export interface Message {
  id: string
  conversationID: string
  sender: User
  content: string // Conteúdo criptografado
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
  publicKey: User['publicKey']
  encryptedPrivateKey: string
}