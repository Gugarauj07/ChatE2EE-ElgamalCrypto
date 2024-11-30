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
import { Contact } from '@/types/chat'
import { contactService } from '@/services/contactService'
import { useToast } from '@/hooks/use-toast'

export default function AddContactDialog() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsLoading(true)
      const results = await contactService.searchUsers(searchQuery)
      setSearchResults(results)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar usuários"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddContact = async (contactId: string) => {
    try {
      await contactService.addContact(contactId)
      toast({
        title: "Sucesso",
        description: "Contato adicionado com sucesso"
      })
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o contato"
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Adicionar Contato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Contato</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              Buscar
            </Button>
          </div>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span>{user.username}</span>
                <Button
                  size="sm"
                  onClick={() => handleAddContact(user.id)}
                >
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}