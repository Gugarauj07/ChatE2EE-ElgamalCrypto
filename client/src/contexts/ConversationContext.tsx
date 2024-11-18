// client/src/contexts/ConversationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Conversation, Message } from '../types/chat';
import { messageService } from '../services/messageService';
import { showErrorToast } from '../utils/errorHandler';
import { useContacts } from './ContactContext';
import useAuth from '@/hooks/useAuth';
import { decryptMessage, encryptMessage } from '../utils/cryptoUtils';
import { ElGamal } from '@/utils/elgamal';

interface ConversationContextType {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  selectConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  receiveMessage: (conversationId: string, message: Message) => void;
  loadConversations: () => Promise<void>;
  startConversation: (participantUsername: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
};

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { contacts } = useContacts();
  const { user, privateKey } = useAuth();
  const elGamal = new ElGamal();

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations();

      if (!user || !privateKey) {
        setConversations(data);
        return;
      }

      const updatedData = await Promise.all(
        data.map(async (convo: Conversation) => {
          const encryptedKey = convo.encryptedKeys[user.id];
          if (!encryptedKey) {
            return convo;
          }

          const [a, b, p] = encryptedKey.split(';');
          const decryptedSenderKey = elGamal.decrypt(
            { a, b, p },
            privateKey
          );

          // Descriptografar mensagens
          const decryptedMessages = convo.messages.map(msg => ({
            ...msg,
            content: decryptMessage(msg.encryptedContent, decryptedSenderKey)
          }));

          return {
            ...convo,
            senderKey: decryptedSenderKey,
            messages: decryptedMessages
          };
        })
      );

      setConversations(updatedData);
    } catch (error) {
      showErrorToast('Erro ao carregar conversas.');
      console.error(error);
    }
  };

  const selectConversation = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId) || null;
    setSelectedConversation(conversation);
  };

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (!conversation?.senderKey) {
        throw new Error('SenderKey não disponível para criptografia.');
      }

      const encryptedContent = encryptMessage(content, conversation.senderKey);
      const message = await messageService.sendMessage(conversationId, encryptedContent);

      const newMessage: Message = {
        ...message,
        encryptedContent,
        content // Mantém o conteúdo original para exibição
      };

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, messages: [...conv.messages, newMessage] }
            : conv
        )
      );

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev =>
          prev ? { ...prev, messages: [...prev.messages, newMessage] } : prev
        );
      }
    } catch (error) {
      showErrorToast('Erro ao enviar mensagem.');
      console.error(error);
    }
  };

  const receiveMessage = (conversationId: string, message: Message) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation && conversation.senderKey) {
      const decryptedContent = decryptMessage(message.encryptedContent, conversation.senderKey);
      const decryptedMessage = { ...message, encryptedContent: decryptedContent };

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, messages: [...conv.messages, decryptedMessage] } : conv
        )
      );

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, decryptedMessage] } : prev);
      }
    } else {
      console.error('senderKey não encontrado para a conversa:', conversationId);
    }
  };

  const generateSenderKey = (): string => {
    // Implementar lógica para gerar a chave do remetente
    // Exemplo: gerar uma string aleatória segura
    return window.crypto.getRandomValues(new Uint8Array(16)).toString();
  };

  // Função para criptografar a senderKey com a chave pública de cada participante
  const encryptSenderKey = (senderKey: string, participantsPublicKeys: { [key: string]: any }): { [key: string]: string } => {
    const encryptedKeys: { [key: string]: string } = {};

    for (const pid in participantsPublicKeys) {
      const encrypted = elGamal.encrypt(senderKey, participantsPublicKeys[pid]);
      encryptedKeys[pid] = `${encrypted.a};${encrypted.b};${encrypted.p}`;
    }

    return encryptedKeys;
  };

  const startConversation = async (participantUsername: string) => {
    try {
      if (!user?.id || !user?.publicKey) {
        throw new Error('Usuário não autenticado ou dados incompletos');
      }

      const participant = contacts.find(contact => contact.username === participantUsername);
      if (!participant?.id || !participant?.public_key) {
        throw new Error('Participante não encontrado ou dados incompletos');
      }

      const senderKey = generateSenderKey();

       const participantsPublicKeys: { [key: string]: any } = {
        [user.id]: user.publicKey,
        [participant.id]: participant.public_key
      };

      const encryptedKeys = encryptSenderKey(senderKey, participantsPublicKeys);

      const newConversation = await messageService.createConversation({
        ParticipantIDs: [participant.id],
        EncryptedKeys: encryptedKeys,
      });

      const conversationWithKey = { ...newConversation, senderKey };

      setConversations(prev => [...prev, conversationWithKey]);
      setSelectedConversation(conversationWithKey);
    } catch (error) {
      showErrorToast('Erro ao iniciar conversa.');
      console.error('Erro ao iniciar conversa:', error);
      throw error; // Propagar o erro para tratamento no componente
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <ConversationContext.Provider value={{
      conversations,
      selectedConversation,
      selectConversation,
      sendMessage,
      receiveMessage,
      loadConversations,
      startConversation
    }}>
      {children}
    </ConversationContext.Provider>
  );
};