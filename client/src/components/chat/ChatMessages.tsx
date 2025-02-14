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
import { globalWebSocketService } from '@/services/globalWebSocketService'

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
  const lastMessageDateRef = useRef<string>('')

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
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

  const shouldShowDate = (dateString: string) => {
    const currentDate = new Date(dateString).toLocaleDateString()
    if (currentDate !== lastMessageDateRef.current) {
      lastMessageDateRef.current = currentDate
      return true
    }
    return false
  }

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.senderId === userId
    const sender = getSender(message.senderId)
    const content = decryptMessageContent(message)
    const showDate = shouldShowDate(message.createdAt)

    return (
      <div key={message.id} className="flex flex-col">
        {showDate && (
          <div className="flex justify-center my-3">
            <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
              {new Date(message.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        <div className={cn("flex mb-2 px-4", isOwnMessage ? "justify-end" : "justify-start")}>
          <div className={cn(
            "max-w-[75%] rounded-2xl px-4 py-2",
            isOwnMessage
              ? "bg-blue-500 text-white rounded-br-sm"
              : "bg-gray-100 dark:bg-gray-800 rounded-bl-sm"
          )}>
            {!isOwnMessage && (
              <div className="text-xs font-medium mb-1 text-muted-foreground">
                {sender?.username}
              </div>
            )}
            <p className="break-words text-sm">{content}</p>
            <div className={cn(
              "text-[10px] mt-1 text-right",
              isOwnMessage ? "text-blue-100" : "text-muted-foreground"
            )}>
              {formatDate(message.createdAt)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      await globalWebSocketService.sendMessage(
        conversation.id,
        newMessage,
        conversation.participants
      )
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
    <div className="flex flex-col h-full">
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
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquareDashed size={40} className="mb-4 opacity-40" />
              <p className="text-sm">Ainda não há mensagens nesta conversa</p>
              <p className="text-xs">Comece uma conversa agora!</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button type="submit" size="icon" variant="default">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}