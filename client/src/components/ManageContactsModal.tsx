import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, UserPlus } from 'lucide-react';

const ManageContactsModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [contactName, setContactName] = useState('');

  const handleAddContact = () => {
    console.log('Adicionar contato:', contactName);
    setContactName('');
    setIsOpen(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button className="w-full flex items-center gap-2 bg-gray-700 hover:bg-gray-600">
          <UserPlus size={20} />
          Gerenciar Contatos
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold">
              Gerenciar Contatos
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Adicione, remova ou edite seus contatos.
          </Dialog.Description>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nome do contato"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddContact}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Nenhum contato adicionado ainda
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ManageContactsModal;