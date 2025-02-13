import { useState, useRef, useEffect } from 'react'
import { Message, ConversationDetails } from '@/types/chat'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, MessageCircle, Users, MessageSquareDashed } from 'lucide-react'
import { ElGamal } from '@/utils/elgamal'
import { cn } from '@/lib/utils'

interface ChatMessagesProps {
  conversation: ConversationDetails
  messages: Message[]
  onSendMessage: (message: string) => Promise<void>
}

export default function ChatMessages({ conversation, messages, onSendMessage }: ChatMessagesProps) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { userId, privateKey } = useAuth()
  const elgamal = new ElGamal()

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
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
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            {conversation.type === 'DIRECT' ? <MessageCircle size={16} /> : <Users size={16} />}
          </div>
          <div>
            <h2 className="font-semibold text-sm text-gray-800">
              {conversation.name}
            </h2>
            <p className="text-xs text-gray-500">
              {conversation.type === 'DIRECT' ? '2 participantes' : `${conversation.participants.length} participantes`}
            </p>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 px-4" type="always">
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquareDashed size={40} className="mb-4 opacity-40" />
              <p className="text-sm">Ainda não há mensagens nesta conversa</p>
              <p className="text-xs">Comece uma conversa agora!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || index}
                className={cn("flex", message.senderId === userId ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg p-3 shadow-md transition-all ease-in-out duration-200",
                    message.senderId === userId
                      ? "bg-blue-500 text-white ml-12 hover:shadow-lg"
                      : "bg-gray-100 text-gray-800 border border-gray-200 mr-12 hover:shadow-lg"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <span className={cn(
                      "text-xs font-medium",
                      message.senderId === userId ? "text-white" : "text-gray-600"
                    )}>
                      {getSender(message.senderId)?.username || 'Usuário Desconhecido'}
                    </span>
                    <p className="text-sm break-words leading-relaxed">
                      {decryptMessageContent(message)}
                    </p>
                    <span className="text-[11px] text-gray-500">
                      {formatDate(message.createdAt!)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border border-gray-300 rounded"
          />
          <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded shadow">
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  )
}