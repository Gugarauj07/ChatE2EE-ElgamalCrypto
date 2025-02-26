import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConversationDetails, ConversationListItem, Message } from '@/types/chat'
import { conversationService } from '@/services/conversationService'
import { useToast } from '@/hooks/use-toast'
import AddContactDialog from '../dialogs/AddContactDialog'
import CreateGroupDialog from '../dialogs/CreateGroupDialog'
import { MessageCircle, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ChatMessages from './ChatMessages'
import { useAuth } from '@/contexts/AuthContext'
import { websocketService } from '@/services/websocketService'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Chat() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null)
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) {
      navigate('/login')
      return
    }

    loadConversations()
    const unsubscribe = websocketService.onConversationUpdate(() => {
      loadConversations()
    })

    return () => unsubscribe()
  }, [userId])

  useEffect(() => {
    if (!selectedConversation) return

    console.log(`Registrando handler para conversa: ${selectedConversation.id}`)

    const unsubscribe = websocketService.onMessage(
      selectedConversation.id,
      (message) => {
        console.log("Nova mensagem recebida:", message);
        setCurrentMessages((prev) => {
          if (prev.some(m => m.id === message.id)) {
            console.log(`Mensagem ${message.id} já existe, ignorando duplicata`);
            return prev;
          }
          return [...prev, message];
        });
      }
    )

    return () => {
      console.log(`Removendo handler para conversa: ${selectedConversation.id}`)
      unsubscribe()
    }
  }, [selectedConversation?.id])

  const loadConversations = async () => {
    try {
      const data = await conversationService.listConversations()
      setConversations(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as conversas"
      })
    }
  }

  const loadConversationDetails = async (conversationId: string) => {
    try {
      console.log(`Carregando detalhes da conversa: ${conversationId}`)
      const conversation = await conversationService.getConversation(conversationId)
      const sortedMessages = [...(conversation.messages || [])].sort(
        (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
      )

      // Remover mensagens duplicadas antes de definir o estado
      const uniqueMessages = Array.from(
        new Map(sortedMessages.map(msg => [msg.id, msg])).values()
      )

      setSelectedConversation(conversation)
      setCurrentMessages(uniqueMessages)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os detalhes da conversa"
      })
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    loadConversationDetails(conversationId)
  }

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

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !userId) return

    try {
      await websocketService.sendMessage(
        selectedConversation.id,
        content,
        selectedConversation.participants
      )
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Erro desconhecido"
      })
    }
  }

  return (
    <div className="h-full flex">
      <aside className="w-80 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col gap-2">
            <AddContactDialog onSuccess={loadConversations} />
            <CreateGroupDialog onSuccess={loadConversations} />
          </div>
        </div>
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
            Conversas
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation.id)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100",
                  selectedConversation?.id === conversation.id && "bg-gray-200 shadow"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                    {conversation.type === 'DIRECT' ? <MessageCircle size={18} /> : <Users size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-800 truncate">
                        {conversation.name}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {conversation.updatedAt ? formatDate(conversation.updatedAt) : ''}
                      </span>
                    </div>
                    {conversation.unreadCount! > 0 && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                          {conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <ChatMessages
            conversation={selectedConversation}
            messages={currentMessages}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageCircle size={40} className="mb-4 opacity-40" />
            <p className="text-sm">Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  )
}