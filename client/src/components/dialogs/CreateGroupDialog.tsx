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
import { Users, Loader2, Search } from 'lucide-react'

interface CreateGroupDialogProps {
  onSuccess: () => Promise<void>
}

export default function CreateGroupDialog({ onSuccess }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const filteredContacts = contacts.filter(contact =>
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      setSearchQuery('')
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
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 px-3 h-10">
          <Users size={16} />
          <span className="flex-1 text-left">Novo Grupo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Nome do Grupo</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Digite o nome do grupo"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Participantes</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <ScrollArea className="h-[200px] border rounded-md">
              <div className="p-4 space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
                  >
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
                    <Label
                      htmlFor={contact.id}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {contact.username}
                    </Label>
                  </div>
                ))}
                {filteredContacts.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Nenhum contato encontrado
                  </p>
                )}
              </div>
            </ScrollArea>
            <div className="text-xs text-muted-foreground">
              {selectedContacts.length} contato(s) selecionado(s)
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleCreateGroup}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Criando grupo..." : "Criar Grupo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}