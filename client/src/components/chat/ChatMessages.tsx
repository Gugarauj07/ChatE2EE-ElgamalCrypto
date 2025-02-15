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

  useEffect(() => {
    // Marcar mensagens como recebidas quando visualizadas
    messages.forEach(message => {
      if (message.senderId !== userId && message.status === 'SENT') {
        globalWebSocketService.updateMessageStatus(message.id, 'RECEIVED')
      }
    })
  }, [messages, userId])

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
          <div className="flex justify-center my-4">
            <span className="text-[11px] bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-gray-500">
              {new Date(message.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        <div className={cn("flex mb-1.5 px-4", isOwnMessage ? "justify-end" : "justify-start")}>
          {!isOwnMessage && (
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-2">
              <span className="text-sm font-medium">
                {sender?.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className={cn(
            "max-w-[80%] group relative",
            isOwnMessage ? "items-end" : "items-start"
          )}>
            {!isOwnMessage && (
              <span className="text-xs font-medium text-gray-500 ml-1 mb-1">
                {sender?.username}
              </span>
            )}
            <div className={cn(
              "px-4 py-2.5 rounded-2xl text-sm relative",
              isOwnMessage
                ? "bg-blue-500 text-white rounded-br-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md shadow-sm"
            )}>
              <p className="break-words leading-relaxed">{content}</p>
              <div className={cn(
                "flex items-center gap-1 text-[10px] mt-1",
                isOwnMessage ? "text-blue-100" : "text-gray-500"
              )}>
                <span>{formatDate(message.createdAt)}</span>
                {isOwnMessage && (
                  <span className="flex items-center transition-opacity">
                    {message.status === 'SENT' && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {message.status === 'RECEIVED' && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 12l7 7 13-13M2 19l7 7 13-13"/>
                      </svg>
                    )}
                    {message.status === 'READ' && (
                      <svg className="w-3 h-3 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 12l7 7 13-13M2 19l7 7 13-13"/>
                      </svg>
                    )}
                  </span>
                )}
              </div>
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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="border-b bg-white dark:bg-gray-800 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center">
            {conversation.type === 'DIRECT' ? <MessageCircle size={20} /> : <Users size={20} />}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">
              {conversation.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {conversation.type === 'DIRECT' ? '2 participantes' : `${conversation.participants.length} participantes`}
            </p>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 py-4 px-2">
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