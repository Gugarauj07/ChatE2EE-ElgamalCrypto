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

  private constructor() {}

  static getInstance(): GlobalWebSocketService {
    if (!GlobalWebSocketService.instance) {
      GlobalWebSocketService.instance = new GlobalWebSocketService()
    }
    return GlobalWebSocketService.instance
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    try {
      const wsUrl = process.env.VITE_WS_URL || 'ws://localhost:8080'
      const userId = localStorage.getItem('userId')
      this.ws = new WebSocket(`${wsUrl}/ws?userId=${userId}`)

      this.ws.onopen = () => {
        console.log('Conexão WebSocket global estabelecida')
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const wsMessage = JSON.parse(event.data)
          console.log('Mensagem global recebida:', wsMessage)

          if (wsMessage.type === 'message' && wsMessage.payload) {
            const { conversationId, senderId, encryptedContents } = wsMessage.payload
            const userId = localStorage.getItem('userId')

            if (!userId || !encryptedContents[userId]) {
              console.error('Conteúdo criptografado não encontrado para o usuário atual')
              return
            }

            const message: Message = {
              conversationId,
              senderId,
              content: encryptedContents[userId],
              type: 'received',
              createdAt: new Date().toISOString()
            }

            this.messageHandlers.get(conversationId)?.forEach(handler => handler(message))
          }
        } catch (error) {
          console.error('Erro ao processar mensagem global:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('Erro na conexão WebSocket global:', error)
        this.handleReconnect()
      }

      this.ws.onclose = () => {
        console.log('Conexão WebSocket global fechada')
        this.handleReconnect()
      }
    } catch (error) {
      console.error('Erro ao estabelecer conexão WebSocket global:', error)
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
}

export const globalWebSocketService = GlobalWebSocketService.getInstance()