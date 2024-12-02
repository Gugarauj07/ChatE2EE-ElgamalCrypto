import { useState, useEffect, useRef } from 'react'
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
import { WebSocketService } from '@/services/websocketService'
import { ElGamal } from '@/utils/elgamal'
import { useNavigate } from 'react-router-dom'

export default function Chat() {
  const { userId, token } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null)
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const { toast } = useToast()
  const websocketRef = useRef<WebSocketService | null>(null)
  const elgamal = new ElGamal()

  useEffect(() => {
    if (!userId) {
      navigate('/login')
      return
    }

    loadConversations()
  }, [userId])

  useEffect(() => {
    if (!selectedConversation) return

    // Conectar ao WebSocket da conversa selecionada com os participantes
    websocketRef.current = new WebSocketService()
    websocketRef.current.connectToConversation(
      selectedConversation.id,
      selectedConversation.participants
    )

    // Registrar handler de mensagens para esta conversa
    const unsubscribe = websocketRef.current.onConversationMessage(
      selectedConversation.id,
      (message) => {
        setCurrentMessages(prev => [...prev, message])
        loadConversations() // Atualizar lista de conversas
      }
    )

    return () => {
      unsubscribe()
      websocketRef.current?.disconnectFromConversation(selectedConversation.id)
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
    if (!selectedConversation || !userId) return

    try {
      await websocketRef.current?.sendMessage(
        selectedConversation.id,
        content,
        userId
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