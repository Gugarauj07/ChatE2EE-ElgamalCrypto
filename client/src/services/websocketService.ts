import { Message } from '@/types/chat'
import { ElGamal } from '@/utils/elgamal'

type ConversationUpdateHandler = () => void

export class WebSocketService {
  private static instance: WebSocketService
  private ws: WebSocket | null = null
  private messageHandlers = new Map<string, ((message: Message) => void)[]>()
  private conversationUpdateHandlers: (() => void)[] = []
  private currentAttempts = 0
  private maxAttempts = 5
  private reconnectDelay = 3000
  private pendingMessages = new Map<string, Message[]>()
  private reconnectTimeout: NodeJS.Timeout | null = null

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

    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => handler(message))
    } else {
      console.log(`Nenhum handler encontrado para conversationId: ${conversationId}. Armazenando mensagem para entrega posterior.`)

      if (!this.pendingMessages.has(conversationId)) {
        this.pendingMessages.set(conversationId, [])
      }
      this.pendingMessages.get(conversationId)?.push(message)

      this.notifyConversationUpdate()
    }
  }

  private handleReconnect(userId: string) {
    if (this.currentAttempts >= this.maxAttempts) return

    const delay = Math.min(this.reconnectDelay, 10000)
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

  onMessage(conversationId: string, handler: (message: Message) => void): () => void {
    if (!this.messageHandlers.has(conversationId)) {
      this.messageHandlers.set(conversationId, [])
    }

    this.messageHandlers.get(conversationId)?.push(handler)
    console.log(`Handler registrado para conversationId: ${conversationId}`)

    const pendingMessages = this.pendingMessages.get(conversationId) || []
    if (pendingMessages.length > 0) {
      console.log(`Entregando ${pendingMessages.length} mensagens pendentes para conversationId: ${conversationId}`)
      pendingMessages.forEach(message => handler(message))
      this.pendingMessages.delete(conversationId)
    }

    return () => {
      const handlers = this.messageHandlers.get(conversationId)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index !== -1) {
          handlers.splice(index, 1)
          console.log(`Handler removido para conversationId: ${conversationId}`)
        }
      }
    }
  }

  onConversationUpdate(handler: ConversationUpdateHandler) {
    this.conversationUpdateHandlers.push(handler)
    return () => {
      const index = this.conversationUpdateHandlers.indexOf(handler)
      if (index !== -1) {
        this.conversationUpdateHandlers.splice(index, 1)
      }
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