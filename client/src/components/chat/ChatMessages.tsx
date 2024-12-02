import { useState, useRef, useEffect } from 'react'
import { Message, ConversationDetails } from '@/types/chat'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { ElGamal } from '@/utils/elgamal'

interface ChatMessagesProps {
  conversation: ConversationDetails
  messages: Message[]
  onSendMessage: (message: string) => Promise<void>
}

export default function ChatMessages({ conversation, messages, onSendMessage }: ChatMessagesProps) {
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { userId, privateKey } = useAuth()
  const elgamal = new ElGamal()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return ''
      }
      return formatDistanceToNow(date, {
        locale: ptBR,
        addSuffix: true
      })
    } catch {
      return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await onSendMessage(newMessage)
      setNewMessage('')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  const getSender = (senderId: string) => {
    return conversation.participants.find(p => p.id === senderId)
  }

  const decryptMessageContent = (message: Message) => {
    if (!userId || !privateKey) {
      console.error('Usuário ou chave privada não disponível')
      return 'Erro ao descriptografar mensagem'
    }

    try {
      if (!message.content || !message.content.a || !message.content.b || !message.content.p) {
        console.error('Mensagem com formato inválido:', message)
        return 'Mensagem com formato inválido'
      }

      return elgamal.decrypt(message.content, privateKey)
    } catch (error) {
      console.error('Erro ao descriptografar mensagem:', error)
      return 'Erro ao descriptografar mensagem'
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b p-4">
        <h2 className="font-semibold">
          {conversation.name}
        </h2>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="absolute inset-0" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Ainda não há mensagens nesta conversa. Comece uma conversa agora!
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${
                    message.senderId === userId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.senderId === userId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {getSender(message.senderId)?.username || 'Usuário Desconhecido'}
                      </span>
                      <p className="text-sm break-words">
                        {decryptMessageContent(message)}
                      </p>
                      <span className="text-xs opacity-70">
                        {formatDate(message.createdAt!)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}