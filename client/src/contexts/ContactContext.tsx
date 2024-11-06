import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Contact } from '../types/contact';
import { contactService } from '../services/contactService';

interface ContactContextType {
  contacts: Contact[];
  loadContacts: () => Promise<void>;
  addContact: (username: string) => Promise<void>;
  removeContact: (contactId: string) => Promise<void>;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

export const ContactProvider = ({ children }: { children: ReactNode }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);

  const loadContacts = async () => {
    try {
      const contactsList = await contactService.getContacts();
      setContacts(contactsList);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  const addContact = async (username: string) => {
    const newContact = await contactService.addContact(username);
    setContacts(prev => [...prev, newContact]);
  };

  const removeContact = async (contactId: string) => {
    await contactService.removeContact(contactId);
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <ContactContext.Provider value={{ contacts, loadContacts, addContact, removeContact }}>
      {children}
    </ContactContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error('useContacts deve ser usado dentro de um ContactProvider');
  }
  return context;
}; 