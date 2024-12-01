import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Contact } from '@/types/chat'
import { contactService } from '@/services/contactService'
import { groupService } from '@/services/groupService'
import { useToast } from '@/hooks/use-toast'
import { Users, Loader2 } from 'lucide-react'

interface CreateGroupDialogProps {
  onSuccess: () => Promise<void>
}

export default function CreateGroupDialog({ onSuccess }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleOpenChange = async (open: boolean) => {
    setOpen(open)
    if (open) {
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
    } else {
      setGroupName('')
      setSelectedContacts([])
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite um nome para o grupo"
      })
      return
    }

    if (selectedContacts.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione pelo menos um participante"
      })
      return
    }

    try {
      setIsLoading(true)
      await groupService.createGroup(groupName, selectedContacts)
      await onSuccess()
      setOpen(false)
      toast({
        title: "Grupo criado",
        description: "Grupo criado com sucesso"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o grupo"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 gap-2">
          <Users size={16} />
          Novo Grupo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Nome do Grupo</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Digite o nome do grupo"
            />
          </div>
          <div className="space-y-2">
            <Label>Participantes</Label>
            <ScrollArea className="h-[200px] border rounded-md p-4">
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={contact.id}
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedContacts([...selectedContacts, contact.id])
                        } else {
                          setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
                        }
                      }}
                    />
                    <Label htmlFor={contact.id} className="cursor-pointer">
                      {contact.username}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <Button
            className="w-full"
            onClick={handleCreateGroup}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Criar Grupo"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}