// client/src/components/Layout/ChatWindow.tsx
import { useState, FormEvent } from 'react';
import { Search, MoreVertical, Send, Check, MessageSquare, Loader2 } from 'lucide-react';
import { Avatar } from '../Avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useConversations } from '../../contexts/ConversationContext';
import useAuth from '../../hooks/useAuth';
import { format } from 'date-fns';
const mockMessages = [
  {
    id: '1',
    senderId: '123',
    content: 'Olá, tudo bem?',
    timestamp: new Date(2024, 2, 10, 14, 30),
    isDelivered: true
  },
  {
    id: '2',
    senderId: '456',
    content: 'Oi! Tudo bem e você?',
    timestamp: new Date(2024, 2, 10, 14, 31),
    isDelivered: true
  },
  {
    id: '3',
    senderId: '123',
    content: 'Estou bem! Precisava falar sobre aquele projeto que comentamos semana passada.',
    timestamp: new Date(2024, 2, 10, 14, 32),
    isDelivered: true
  },
  {
    id: '4',
    senderId: '456',
    content: 'Claro! Podemos conversar sobre isso agora.',
    timestamp: new Date(2024, 2, 10, 14, 33),
    isDelivered: true
  }
];

const ChatWindow = () => {
  const { selectedConversation, sendMessage } = useConversations();
  const { user, isLoading } = useAuth();
  const [messageContent, setMessageContent] = useState('');

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedConversation || !user || isLoading) return;

    try {
      await sendMessage(selectedConversation.id, messageContent);
      setMessageContent('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Carregando...
          </h3>
        </div>
      </div>
    );
  }

  // if (!selectedConversation) {
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

  const formatMessageTime = (date: Date) => {
    return String(date)
  };

  return (
    <div className="flex-1 bg-white dark:bg-gray-900 flex flex-col h-full">
      <header className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            username="Usuário"
            size="sm"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Usuário
            </h2>
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
        <div className="flex flex-col gap-4">
          {mockMessages.map((message) => {
            const isCurrentUser = message.senderId === '123';
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}
              >
                <Avatar
                  username={isCurrentUser ? "Você" : "Usuário"}
                  size="sm"
                />
                <div className="max-w-[70%]">
                  <div
                    className={`p-3 rounded-2xl ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground ml-auto rounded-br-none'
                        : 'bg-muted text-muted-foreground rounded-bl-none'
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-muted-foreground">
                      {format(message.timestamp, 'HH:mm')}
                    </span>
                    {isCurrentUser && message.isDelivered && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-300 dark:border-gray-700 flex items-center gap-2">
        <Input
          type="text"
          placeholder="Digite uma mensagem..."
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          required
          className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button type="submit" className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow;