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

export default function Chat() {
  const { userId } = useAuth()
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null)
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadConversations()
  }, [])

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
      const conversation = await conversationService.getConversation(conversationId)
      setSelectedConversation(conversation)
      setCurrentMessages(conversation.messages || [])
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

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return

    try {
      const newMessage = await conversationService.sendMessage(
        selectedConversation.id,
        content,
        selectedConversation.participants
      )
      setCurrentMessages([...currentMessages, newMessage])
      await loadConversations()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar a mensagem"
      })
    }
  }

  return (
    <div className="h-full flex">
      <aside className="w-80 border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex flex-col gap-3">
            <AddContactDialog onSuccess={loadConversations} />
            <CreateGroupDialog onSuccess={loadConversations} />
          </div>
        </div>
        <h2 className="font-semibold m-4 text-md">Conversas</h2>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.id === conversation.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {conversation.type === 'DIRECT' ? (
                      <MessageCircle size={20} />
                    ) : (
                      <Users size={20} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {conversation.name}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {conversation.updatedAt ? formatDate(conversation.updatedAt) : ''}
                      </span>
                    </div>
                    {conversation.unreadCount! > 0 && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
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
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatMessages
            conversation={selectedConversation}
            messages={currentMessages}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  )
}