import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Contact } from '../types/contact';
import { contactService } from '../services/contactService';
import { showErrorToast } from '../utils/errorHandler';

interface ContactContextType {
  contacts: Contact[];
  loadContacts: () => Promise<void>;
  addContact: (username: string) => Promise<any>;
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
    showErrorToast(error);
  }
};

const addContact = async (username: string) => {
  try {
    const newContact = await contactService.addContact(username);
    setContacts(prev => [...prev, newContact]);
    return newContact;
  } catch (error) {
    showErrorToast(error);
    throw error;
  }
};

const removeContact = async (contactId: string) => {
  try {
    await contactService.removeContact(contactId);
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
  } catch (error) {
    showErrorToast(error);
    throw error;
  }
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