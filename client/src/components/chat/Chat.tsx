import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import ContactList from './ContactList'
import { Conversation } from '@/types/chat'
import { conversationService } from '@/services/conversationService'
import { useToast } from '@/hooks/use-toast'

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
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

  return (
    <div className="h-full flex">
      {/* Lista de contatos e conversas */}
      <aside className="w-80 border-r flex flex-col">
        <ContactList onConversationCreated={loadConversations} />
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <h3 className="text-sm font-semibold">Conversas</h3>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-2 hover:bg-accent rounded cursor-pointer"
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="font-medium">{conversation.name}</div>
                {conversation.lastMessage && (
                  <div className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <div>Área de mensagens será implementada aqui</div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  )
}