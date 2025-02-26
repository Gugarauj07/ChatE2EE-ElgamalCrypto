import { Message } from '@/types/chat'
import { ElGamal } from '@/utils/elgamal'

type MessageHandler = (message: Message) => void
type ConversationUpdateHandler = () => void

export class WebSocketService {
  private static instance: WebSocketService
  private ws: WebSocket | null = null
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private conversationUpdateHandlers: Set<ConversationUpdateHandler> = new Set()
  private reconnectTimeout: NodeJS.Timeout | null = null
  private maxReconnectAttempts = 5
  private currentAttempts = 0

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  connect(userId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
    this.ws = new WebSocket(`${wsUrl}/ws?userId=${userId}`)

    this.ws.onopen = () => {
      console.log('WebSocket conectado')
      this.currentAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const wsMessage = JSON.parse(event.data)

        switch (wsMessage.type) {
          case 'message':
            this.handleNewMessage(wsMessage.payload)
            break
          case 'conversation_update':
            this.notifyConversationUpdate()
            break
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket desconectado')
      this.handleReconnect(userId)
    }

    this.ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error)
    }
  }

  private handleNewMessage(payload: any) {
    console.log('Payload WebSocket recebido:', payload)

    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload)
      } catch (error) {
        console.error('Erro ao parsear payload:', error)
        return
      }
    }

    const { id, conversationId, senderId, createdAt, encryptedContents } = payload
    const userId = localStorage.getItem('userId')

    if (!userId || !encryptedContents || !encryptedContents[userId]) {
      console.error('Conteúdo criptografado não encontrado para usuário:', userId)
      return
    }

    const message: Message = {
      id,
      conversationId,
      senderId,
      content: encryptedContents[userId],
      createdAt
    }

    console.log('Mensagem processada:', message)
    const handlers = this.messageHandlers.get(conversationId)

    if (handlers) {
      handlers.forEach(handler => handler(message))
    } else {
      console.error('Nenhum handler encontrado para conversationId:', conversationId)
    }
  }

  private handleReconnect(userId: string) {
    if (this.currentAttempts >= this.maxReconnectAttempts) return

    const delay = Math.min(1000 * Math.pow(2, this.currentAttempts), 10000)
    this.currentAttempts++

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect(userId)
    }, delay)
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  onMessage(conversationId: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(conversationId)) {
      this.messageHandlers.set(conversationId, [])
    }
    this.messageHandlers.get(conversationId)?.push(handler)

    return () => {
      const handlers = this.messageHandlers.get(conversationId)
      if (handlers) {
        this.messageHandlers.set(
          conversationId,
          handlers.filter(h => h !== handler)
        )
      }
    }
  }

  onConversationUpdate(handler: ConversationUpdateHandler) {
    this.conversationUpdateHandlers.add(handler)
    return () => {
      this.conversationUpdateHandlers.delete(handler)
    }
  }

  private notifyConversationUpdate() {
    this.conversationUpdateHandlers.forEach(handler => handler())
  }

  sendMessage(conversationId: string, content: string, participants: any[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket não está conectado')
    }

    console.log('Enviando mensagem:', {
      conversationId,
      participants,
      wsState: this.ws.readyState
    })

    const elgamal = new ElGamal()
    const encryptedContents: { [key: string]: any } = {}

    for (const participant of participants) {
      console.log('Criptografando para participante:', participant)
      const encrypted = elgamal.encrypt(content, participant.publicKey)
      encryptedContents[participant.id] = encrypted
    }

    const message = {
      type: 'message',
      payload: {
        conversationId,
        encryptedContents
      }
    }

    console.log('Enviando mensagem WebSocket:', message)
    this.ws.send(JSON.stringify(message))
  }
}

export const websocketService = WebSocketService.getInstance()