import { Message, ConversationDetails } from '@/types/chat'
import { conversationService } from './conversationService'
import { ElGamal } from '@/utils/elgamal'

type MessageHandler = (message: Message) => void

export class GlobalWebSocketService {
  private static instance: GlobalWebSocketService
  private ws: WebSocket | null = null
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private statusHandlers = new Map<string, ((update: { messageId: string, status: string, userId: string }) => void)[]>()

  private constructor() {}

  static getInstance(): GlobalWebSocketService {
    if (!GlobalWebSocketService.instance) {
      GlobalWebSocketService.instance = new GlobalWebSocketService()
    }
    return GlobalWebSocketService.instance
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado')
      return
    }

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsHost = import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8080'
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      if (!token || !userId) {
        console.error('Usuário não autenticado')
        return
      }

      const wsUrl = `${wsProtocol}//${wsHost}/ws?token=${token}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('✅ Conexão WebSocket estabelecida')
        this.reconnectAttempts = 0
      }

      this.ws.onerror = (error) => {
        console.error('❌ Erro na conexão WebSocket:', error)
      }

      this.ws.onclose = () => {
        console.log('🔴 Conexão WebSocket fechada')
        this.handleReconnect()
      }

      this.ws.onmessage = (event) => {
        try {
          const wsMessage = JSON.parse(event.data)
          console.log('📩 Mensagem recebida:', {
            tipo: wsMessage.type,
            payload: wsMessage.payload
          })

          if (wsMessage.type === 'message') {
            const { conversationId, senderId, encryptedContents } = wsMessage.payload
            const userId = localStorage.getItem('userId')

            if (!userId || !encryptedContents[userId]) {
              console.error('Conteúdo criptografado não encontrado para o usuário atual')
              return
            }

            const message: Message = {
              id: wsMessage.payload.messageId || crypto.randomUUID(),
              conversationId,
              senderId,
              content: encryptedContents[userId],
              type: 'received',
              createdAt: new Date().toISOString()
            }

            console.log('Processando mensagem recebida:', message)
            const handlers = this.messageHandlers.get(conversationId)
            if (handlers) {
              handlers.forEach(handler => handler(message))
            }
          } else if (wsMessage.type === 'status_update') {
            const { messageId, status, userId } = wsMessage.payload
            // Notificar handlers sobre atualização de status
            const handlers = this.statusHandlers?.get(messageId)
            if (handlers) {
              handlers.forEach(handler => handler({ messageId, status, userId }))
            }
          }
        } catch (error) {
          console.error('Erro ao processar mensagem global:', error)
        }
      }
    } catch (error) {
      console.error('Erro ao estabelecer conexão WebSocket:', error)
      this.handleReconnect()
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
      }

      this.reconnectTimeout = setTimeout(() => {
        this.connect()
      }, delay)
    }
  }

  async sendMessage(conversationId: string, content: string, participants: ConversationDetails['participants']) {
    // Usar o serviço de conversas existente para criptografar e enviar a mensagem via HTTP
    const message = await conversationService.sendMessage(conversationId, content, participants)

    // Enviar a mensagem via WebSocket para notificação em tempo real
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message_sent',
        payload: {
          messageId: message.id,
          conversationId
        }
      }))
    }

    return message
  }

  subscribeToConversation(conversationId: string, handler: MessageHandler) {
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

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.messageHandlers.clear()
  }

  async updateMessageStatus(messageId: string, status: 'RECEIVED' | 'READ') {
    // Enviar apenas via WebSocket
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message_status',
        payload: {
          messageId,
          status,
          userId: localStorage.getItem('userId')
        }
      }))
    }
  }

  subscribeToMessageStatus(messageId: string, handler: (update: { messageId: string, status: string, userId: string }) => void) {
    if (!this.statusHandlers.has(messageId)) {
      this.statusHandlers.set(messageId, [])
    }
    this.statusHandlers.get(messageId)?.push(handler)

    return () => {
      const handlers = this.statusHandlers.get(messageId)
      if (handlers) {
        this.statusHandlers.set(
          messageId,
          handlers.filter(h => h !== handler)
        )
      }
    }
  }
}

export const globalWebSocketService = GlobalWebSocketService.getInstance()