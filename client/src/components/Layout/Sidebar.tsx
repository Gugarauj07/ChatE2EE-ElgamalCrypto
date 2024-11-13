import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogOut, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import ManageContactsModal from '../ManageContactsModal';
import UserProfile from '../UserProfile';
import ContactsList from '../ContactList';
import { useContacts } from '../../contexts/ContactContext';
import useAuth from '../../hooks/useAuth';
import { Contact } from '@/types/contact';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { contacts, loadContacts } = useContacts();
  const [filteredContacts, setFilteredContacts] = useState(contacts);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    setFilteredContacts(
      contacts.filter(contact =>
        contact.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, contacts]);

  const handleStartChat = (contact: Contact) => {
    // Implementar lógica para iniciar chat
    console.log('Iniciar chat com:', contact.username);
  };

  return (
    <div className="w-80 h-screen bg-gray-900 flex flex-col border-r border-gray-800">
      <UserProfile />

      <div className="p-4 border-b border-gray-800">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Pesquisar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-700 text-gray-200"
            />
          </div>
        </div>
      </div>


      <ScrollArea className="flex-1 p-4">
        <ContactsList
          contacts={filteredContacts}
          onStartChat={handleStartChat}
        />
      </ScrollArea>
      
      <div className="p-4 border-b border-gray-800">
        <div className="space-y-2">
          <ManageContactsModal />
          <Button
            onClick={() => {}} // Implementar criação de grupo
            className="w-full flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200"
          >
            <Users size={20} />
            Criar Grupo
          </Button>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <Button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          variant="destructive"
          className="w-full flex items-center gap-2"
        >
          <LogOut size={20} />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;