// client/src/components/Layout/ChatWindow.tsx
import { useState, useEffect, FormEvent } from 'react';
import { Search, MoreVertical, Paperclip, Smile, Send, Check, MessageSquare } from 'lucide-react';
import { Avatar } from '../Avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useConversations } from '../../contexts/ConversationContext';
import useAuth from '../../hooks/useAuth';
import { encryptMessage, decryptMessage } from '../../utils/cryptoUtils';
import { Message } from '../../types/chat';

const ChatWindow = () => {
  const { selectedConversation, sendMessage } = useConversations();
  const { user } = useAuth();
  const [messageContent, setMessageContent] = useState('');

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedConversation || !user) return;

    try {
      await sendMessage(selectedConversation.id, messageContent);
      setMessageContent('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  if (!selectedConversation) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Nenhuma conversa selecionada
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecione um contato para iniciar uma conversa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-gray-900 flex flex-col">
      <header className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            username={selectedConversation.participants.find(p => p !== user?.username) || 'Usuário'}
            size="sm"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedConversation.participants.find(p => p !== user?.username)}
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
        <div className="flex flex-col gap-6">
          {selectedConversation.messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === user?.username ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {message.sender !== user?.username && <Avatar username={message.sender} size="sm" />}
              <div className="max-w-[70%]">
                <div className={`p-3 rounded-2xl ${
                  message.sender === user?.username
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                }`}>
                  <p>{message.content || message.encryptedContent}</p>
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {message.sender === user?.username && <Check className="h-4 w-4 text-blue-500" />}
                </div>
              </div>
              {message.sender === user?.username && <Avatar username="Você" size="sm" />}
            </div>
          ))}
        </div>
      </div>

      <footer className="p-4 border-t border-gray-300 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-5 w-5 text-gray-500" />
          </Button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Digite sua mensagem..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
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