import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { PlusCircle, Users, LogOut, Search } from 'lucide-react';
import ManageContactsModal from '../ManageContactsModal';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateGroup = () => {
    console.log('Criar grupo');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    console.log('Pesquisar:', e.target.value);
  };

  return (
    <div className="w-80 h-screen bg-gray-900 flex flex-col border-r border-gray-800">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-gray-800">
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Pesquisar contatos..."
            value={searchTerm}
            onChange={handleSearch}
            className="bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-400 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Área de ações */}
      <div className="p-4 border-b border-gray-800">
        <div className="space-y-2">
          <ManageContactsModal />
          <Button
            onClick={handleCreateGroup}
            className="w-full flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200"
          >
            <Users size={20} />
            Criar Grupo
          </Button>
        </div>
      </div>

      {/* Lista de conversas */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {/* Aqui virá a lista de contatos/conversas */}
        </div>
      </ScrollArea>

      {/* Rodapé com botão de logout */}
      <div className="p-4 border-t border-gray-800">
        <Button
          onClick={handleLogout}
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