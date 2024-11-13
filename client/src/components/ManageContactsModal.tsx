import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, UserPlus, Trash2, Search, Loader2 } from 'lucide-react';
import { Contact } from '../types/contact';
import { contactService } from '../services/contactService';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '../hooks/use-toast';
import { showErrorToast } from '../utils/errorHandler';

const ManageContactsModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const loadContacts = async (search?: string) => {
    setIsSearching(true);
    try {
      const contactsList = await contactService.getContacts(search);
      setContacts(contactsList);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  // Debounce para a pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        loadContacts(searchTerm || undefined);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  const handleAddContact = async (username: string) => {
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      const newContact = await contactService.addContact(username);
      setContacts(prev => [...prev, newContact]);
      toast({
        title: "Sucesso",
        description: "Contato adicionado com sucesso",
      });
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    try {
      await contactService.removeContact(contactId);
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      toast({
        title: "Sucesso",
        description: "Contato removido com sucesso",
      });
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button className="w-full flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200">
          <UserPlus size={20} />
          Gerenciar Contatos
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Gerenciar Contatos
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Procurar ou adicionar contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-24"
              />
              {searchTerm && (
                <Button
                  size="sm"
                  onClick={() => handleAddContact(searchTerm)}
                  disabled={isLoading}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Adicionar
                    </>
                  )}
                </Button>
              )}
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {isSearching ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-700"
                    >
                      <span className="text-sm font-medium">{contact.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? "Nenhum contato encontrado" : "Nenhum contato adicionado ainda"}
                </p>
              )}
            </ScrollArea>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ManageContactsModal;