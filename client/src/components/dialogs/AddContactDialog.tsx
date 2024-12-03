import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Contact } from '@/types/chat'
import { contactService } from '@/services/contactService'
import { useToast } from '@/hooks/use-toast'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AddContactDialogProps {
  onSuccess: () => Promise<void>
}

export default function AddContactDialog({ onSuccess }: AddContactDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    try {
      setIsLoading(true)
      const results = await contactService.searchUsers(searchQuery)
      setSearchResults(results)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Não foi possível buscar usuários. Tente novamente."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddContact = async (contactId: string) => {
    try {
      setIsAdding(contactId)
      await contactService.addContact(contactId)
      toast({
        title: "Contato adicionado",
        description: "Contato adicionado com sucesso à sua lista"
      })
      setOpen(false)
      setSearchQuery('')
      setSearchResults([])
      await onSuccess()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o contato. Tente novamente."
      })
    } finally {
      setIsAdding(null)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchQuery('')
      setSearchResults([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 px-3 h-10">
          <UserPlus size={16} />
          <span className="flex-1 text-left">Adicionar Contato</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Contato</DialogTitle>
          <DialogDescription>
            Busque por usuários pelo nome de usuário para adicionar à sua lista de contatos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="mt-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>

          <ScrollArea className="mt-4 max-h-[300px] pr-4">
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddContact(user.id)}
                    disabled={isAdding === user.id}
                  >
                    {isAdding === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Adicionar"
                    )}
                  </Button>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && !isLoading && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhum usuário encontrado
                </p>
              )}
            </div>
          </ScrollArea>
        </form>
      </DialogContent>
    </Dialog>
  )
}