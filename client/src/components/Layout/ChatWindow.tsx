import React from 'react';
import { Search, MoreVertical, Paperclip, Smile, Send, Check, MessageSquare } from 'lucide-react';
import { Avatar } from '../Avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ChatWindowProps {
  selectedChat: {
    id: string;
    name: string;
  } | null;
}


const ChatWindow = ({ selectedChat }: ChatWindowProps) => {
  // if (!selectedChat) {
  //   return (
  //     <div className="flex-1 bg-white dark:bg-gray-900 flex items-center justify-center">
  //       <div className="text-center">
  //         <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
  //         <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
  //           Nenhuma conversa selecionada
  //         </h3>
  //         <p className="text-sm text-gray-500 dark:text-gray-400">
  //           Selecione um contato para iniciar uma conversa
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex-1 bg-white dark:bg-gray-900 flex flex-col">
      <header className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar username="Maria" size="sm" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Maria</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="flex flex-col gap-6">
          <div className="flex justify-start gap-2">
            <Avatar username="Maria" size="sm" />
            <div className="max-w-[70%]">
              <div className="bg-gray-200 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none">
                <p className="text-gray-800 dark:text-gray-200">Olá! Como você está?</p>
              </div>
              <span className="text-xs text-gray-500 mt-1">10:30</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <div className="max-w-[70%]">
              <div className="bg-blue-600 p-3 rounded-2xl rounded-tr-none">
                <p className="text-white">Estou bem, obrigado! E você?</p>
              </div>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-xs text-gray-500">10:31</span>
                <Check className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <Avatar username="Você" size="sm" />
          </div>
        </div>
      </div>
      <footer className="p-4 border-t border-gray-300 dark:border-gray-700">
        <form className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-5 w-5 text-gray-500" />
          </Button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Digite sua mensagem..."
              className="pr-10 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
            <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2">
              <Smile className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
          <Button type="submit" size="icon" className="rounded-full">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWindow;