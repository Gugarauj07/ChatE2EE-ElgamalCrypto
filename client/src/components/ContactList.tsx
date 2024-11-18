import React from 'react';
import { Avatar } from './Avatar';
import { Contact } from '@/types/contact';
import { MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { useConversations } from '@/contexts/ConversationContext';

interface ContactsListProps {
  contacts: Contact[];
}

const ContactsList: React.FC<ContactsListProps> = ({ contacts }) => {
  const { startConversation } = useConversations();

  const handleStartChat = (contact: Contact) => {
    startConversation(contact.username);
  };

  return (
    <div className="space-y-2">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Avatar username={contact.username} size="sm" />
            <span className="text-sm font-medium text-gray-200">
              {contact.username}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-200"
            onClick={() => handleStartChat(contact)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ContactsList;