import { Message, ConversationDetails } from '@/types/chat'
import { ElGamal } from '@/utils/elgamal'

export class WebSocketService {
  private connections: Map<string, WebSocket> = new Map()
  private messageHandlers: Map<string, ((message: Message) => void)[]> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 5
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private conversationParticipants: Map<string, ConversationDetails['participants']> = new Map()

  connectToConversation(conversationId: string, participants: ConversationDetails['participants']) {
    this.conversationParticipants.set(conversationId, participants)

    if (this.connections.get(conversationId)?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const ws = new WebSocket(`ws://localhost:8080/ws?conversationId=${conversationId}`)

      ws.onopen = () => {
        console.log(`Conexão WebSocket estabelecida para conversa ${conversationId}`)
        this.reconnectAttempts.set(conversationId, 0)
      }

      ws.onmessage = (event) => {
        try {
          console.log('Dados brutos recebidos do WebSocket:', event.data)
          const wsMessage = JSON.parse(event.data)
          console.log('Mensagem parseada:', wsMessage)

          if (wsMessage.type === 'message' && wsMessage.payload) {
            const { encryptedContents, senderId, conversationId } = wsMessage.payload
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

            console.log('Mensagem WebSocket processada:', message)
            this.messageHandlers.get(conversationId)?.forEach(handler => handler(message))
          }
        } catch (error) {
          console.error('Erro ao processar mensagem do WebSocket:', error)
        }
      }

      ws.onerror = (error) => {
        console.error(`Erro no WebSocket para conversa ${conversationId}:`, error)
        this.handleReconnect(conversationId, participants)
      }

      ws.onclose = () => {
        console.log(`Conexão WebSocket fechada para conversa ${conversationId}`)
        this.handleReconnect(conversationId, participants)
      }

      this.connections.set(conversationId, ws)
    } catch (error) {
      console.error(`Erro ao estabelecer conexão WebSocket para conversa ${conversationId}:`, error)
      this.handleReconnect(conversationId, participants)
    }
  }

  private handleReconnect(conversationId: string, participants: ConversationDetails['participants']) {
    const attempts = this.reconnectAttempts.get(conversationId) || 0
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(conversationId, attempts + 1)
      const delay = Math.min(1000 * Math.pow(2, attempts), 10000)

      const timeout = setTimeout(() => {
        const storedParticipants = this.conversationParticipants.get(conversationId)
        if (storedParticipants) {
          this.connectToConversation(conversationId, storedParticipants)
        } else {
          console.error(`Não foi possível reconectar: participantes não encontrados para conversa ${conversationId}`)
        }
      }, delay)

      this.reconnectTimeouts.set(conversationId, timeout)
    }
  }

  disconnectFromConversation(conversationId: string) {
    const timeout = this.reconnectTimeouts.get(conversationId)
    if (timeout) {
      clearTimeout(timeout)
      this.reconnectTimeouts.delete(conversationId)
    }

    const ws = this.connections.get(conversationId)
    if (ws) {
      ws.close()
      this.connections.delete(conversationId)
    }

    this.messageHandlers.delete(conversationId)
    this.reconnectAttempts.delete(conversationId)
    this.conversationParticipants.delete(conversationId)
  }

  onConversationMessage(conversationId: string, handler: (message: Message) => void) {
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

  async sendMessage(conversationId: string, content: string, senderId: string) {
    const ws = this.connections.get(conversationId)
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket não está conectado para esta conversa')
    }

    const participants = this.conversationParticipants.get(conversationId)
    if (!participants) {
      throw new Error('Participantes da conversa não encontrados')
    }

    try {
      const elgamal = new ElGamal()
      const encryptedContents: { [key: string]: any } = {}

      for (const participant of participants) {
        const encrypted = elgamal.encrypt(content, participant.publicKey)
        encryptedContents[participant.id] = encrypted
      }

      ws.send(JSON.stringify({
        type: 'message',
        payload: {
          conversationId,
          senderId,
          encryptedContents
        }
      }))

      console.log('Mensagem criptografada enviada via WebSocket')
    } catch (error) {
      console.error('Erro ao criptografar e enviar mensagem:', error)
      throw error
    }
  }
}

export const websocketService = new WebSocketService()