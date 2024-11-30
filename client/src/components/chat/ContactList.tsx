import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Contact } from '@/types/chat'
import { contactService } from '@/services/contactService'
import { useToast } from '@/hooks/use-toast'
import AddContactDialog from '../dialogs/AddContactDialog'

interface ContactListProps {
  onConversationCreated: () => Promise<void>;
}

export default function ContactList({ onConversationCreated }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const data = await contactService.listContacts()
      setContacts(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os contatos"
      })
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Contatos</h2>
        <AddContactDialog />
      </div>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-2 hover:bg-accent rounded cursor-pointer"
              onClick={() => onConversationCreated()}
            >
              <div className="font-medium">{contact.username}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}