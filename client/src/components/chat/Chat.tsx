import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConversationDetails, ConversationListItem, Message } from '@/types/chat'
import { conversationService } from '@/services/conversationService'
import { useToast } from '@/hooks/use-toast'
import AddContactDialog from '../dialogs/AddContactDialog'
import CreateGroupDialog from '../dialogs/CreateGroupDialog'
import { ArrowLeft, MessageCircle, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ChatMessages from './ChatMessages'
import { useAuth } from '@/contexts/AuthContext'
import { websocketService } from '@/services/websocketService'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

export default function Chat() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null)
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [isMobileView, setIsMobileView] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const { toast } = useToast()

  // Detectar viewport para responsividade
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768)
    };

    // Verificar inicialmente
    checkIfMobile();

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkIfMobile);

    // Limpar listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Ajustar visibilidade da sidebar em modo mobile
  useEffect(() => {
    if (isMobileView && selectedConversation) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
    }
  }, [isMobileView, selectedConversation]);

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

          // Marcar a mensagem como lida se não for do usuário atual
          if (message.senderId !== userId && message.id) {
            markMessageAsRead(selectedConversation.id, message.id);
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

      // Marcar todas as mensagens não lidas como lidas
      markAllMessagesAsRead(conversationId, uniqueMessages);
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
    if (isMobileView) {
      setShowSidebar(false)
    }
  }

  const handleBackToList = () => {
    setShowSidebar(true)
  }

  const markAllMessagesAsRead = async (conversationId: string, messages: Message[]) => {
    try {
      // Filtrar mensagens não lidas que não são do usuário atual
      const unreadMessages = messages.filter(
        msg => msg.senderId !== userId && msg.status === 'SENT' && msg.id
      );

      // Marcar cada mensagem como lida
      for (const message of unreadMessages) {
        if (message.id) {
          await markMessageAsRead(conversationId, message.id);
        }
      }

      // Se houver mensagens marcadas como lidas, atualizar a lista de conversas
      if (unreadMessages.length > 0) {
        loadConversations();
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  const markMessageAsRead = async (conversationId: string, messageId: string) => {
    try {
      await conversationService.markMessageAsRead(conversationId, messageId);
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''

      // Ajustar para o fuso horário local
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))

      return formatDistanceToNow(localDate, {
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
      {/* Sidebar - lista de conversas */}
      {(!isMobileView || (isMobileView && showSidebar)) && (
        <aside className={cn(
          "border-r border-gray-200 bg-white flex flex-col",
          isMobileView ? "w-full absolute inset-0 z-10" : "w-72 md:w-80"
        )}>
          <div className={cn(
            "border-b border-gray-200",
            isMobileView ? "pt-5 pb-3 px-3" : "p-3 md:p-4"
          )}>
            <h2 className="font-semibold text-xs md:text-sm text-gray-700 uppercase tracking-wide mb-3">
              Conversas
            </h2>
            <div className="flex flex-col space-y-2 mt-8">
              <AddContactDialog onSuccess={loadConversations} />
              <CreateGroupDialog onSuccess={loadConversations} />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1 md:space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={cn(
                    "p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100",
                    selectedConversation?.id === conversation.id && "bg-gray-200 shadow"
                  )}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                      {conversation.type === 'DIRECT' ? <MessageCircle size={16} className="md:w-[18px] md:h-[18px]" /> : <Users size={16} className="md:w-[18px] md:h-[18px]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs md:text-sm text-gray-800 truncate">
                          {conversation.name}
                        </span>
                        <span className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">
                          {conversation.updatedAt ? formatDate(conversation.updatedAt) : ''}
                        </span>
                      </div>
                      {conversation.unreadCount! > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs font-medium rounded-full bg-blue-100 text-blue-600">
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
      )}

      {/* Área de mensagens */}
      <div className={cn(
        "flex-1 flex flex-col bg-gray-50",
        isMobileView && showSidebar && "hidden"
      )}>
        {selectedConversation ? (
          <>
            {isMobileView && (
              <div className="p-2 bg-white border-b border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="flex items-center text-sm text-gray-600"
                >
                  <ArrowLeft size={16} className="mr-1" /> Voltar
                </Button>
              </div>
            )}
            <ChatMessages
              conversation={selectedConversation}
              messages={currentMessages}
              onSendMessage={handleSendMessage}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageCircle size={36} className="mb-3 md:mb-4 opacity-40" />
            <p className="text-xs md:text-sm">Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  )
}