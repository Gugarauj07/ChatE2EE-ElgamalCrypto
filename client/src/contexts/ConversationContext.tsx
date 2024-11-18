// client/src/contexts/ConversationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Conversation, Message, EncryptedMessage } from '../types/chat';
import { messageService } from '../services/messageService';
import { showErrorToast } from '../utils/errorHandler';
import { useContacts } from './ContactContext';
import useAuth from '@/hooks/useAuth';
import { decryptMessage, encryptMessage } from '../utils/cryptoUtils';
import { ElGamal } from '@/utils/elgamal';
import { PublicKey } from '@/utils/elgamal';

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
  const { user, privateKey, isLoading } = useAuth();
  const elGamal = new ElGamal();

  const loadConversations = async () => {
    if (isLoading) return;

    try {
      const data = await messageService.getConversations();

      if (!data) {
        setConversations([]);
        return;
      }

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

          const { a, b, p } = encryptedKey;
          const decryptedSenderKey = elGamal.decrypt(
            { a, b, p },
            privateKey
          );

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
      console.error('Erro ao carregar conversas:', error);
      showErrorToast('Erro ao carregar conversas.');
      setConversations([]);
    }
  };

  const selectConversation = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId) || null;
    setSelectedConversation(conversation);
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (isLoading) return; // Evita enviar mensagens enquanto carrega

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
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  const encryptSenderKey = (
    senderKey: string,
    participantsPublicKeys: { [key: string]: PublicKey }
  ): { [key: string]: EncryptedMessage } => {
    const encryptedKeys: { [key: string]: EncryptedMessage } = {};

    for (const pid in participantsPublicKeys) {
      const encrypted = elGamal.encrypt(senderKey, participantsPublicKeys[pid]);
      encryptedKeys[pid] = {
        a: encrypted.a,
        b: encrypted.b,
        p: encrypted.p
      };
    }

    return encryptedKeys;
  };

  const startConversation = async (participantUsername: string) => {
    if (isLoading) return;

    try {
      console.log('Dados do usuário:', user);

      if (!user?.id || !user?.publicKey) {
        console.error('Dados do usuário:', {
          id: user?.id,
          publicKey: user?.publicKey
        });
        throw new Error('Usuário não autenticado ou dados incompletos');
      }

      const participant = contacts.find(contact => contact.username === participantUsername);
      console.log('Dados do participante:', participant);

      if (!participant?.id || !participant?.publicKey) {
        console.error('Dados do participante:', {
          id: participant?.id,
          publicKey: participant?.publicKey
        });
        throw new Error('Participante não encontrado ou dados incompletos');
      }

      const senderKey = generateSenderKey();

      // Parse das chaves públicas que estão em formato string
      const userPublicKeyObj = typeof user.publicKey === 'string'
        ? JSON.parse(user.publicKey)
        : user.publicKey;

      const participantPublicKeyObj = typeof participant.publicKey === 'string'
        ? JSON.parse(participant.publicKey)
        : participant.publicKey;

      // Verificar se as chaves têm o formato correto
      if (!userPublicKeyObj.p || !userPublicKeyObj.g || !userPublicKeyObj.y) {
        throw new Error('Formato inválido da chave pública do usuário');
      }

      if (!participantPublicKeyObj.p || !participantPublicKeyObj.g || !participantPublicKeyObj.y) {
        throw new Error('Formato inválido da chave pública do participante');
      }

      const participantsPublicKeys: { [key: string]: PublicKey } = {
        [user.id]: userPublicKeyObj,
        [participant.id]: participantPublicKeyObj
      };

      const encryptedKeys: { [key: string]: EncryptedMessage } = encryptSenderKey(senderKey, participantsPublicKeys);

      const newConversation = await messageService.createConversation({
        ParticipantIDs: [user.id, participant.id],
        EncryptedKeys: encryptedKeys,
      });

      const conversationWithKey = { ...newConversation, senderKey };

      setConversations(prev => [...prev, conversationWithKey]);
      setSelectedConversation(conversationWithKey);
    } catch (error) {
      showErrorToast('Erro ao iniciar conversa.');
      console.error('Erro ao iniciar conversa:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadConversations();
  }, [isLoading, user, privateKey]);

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