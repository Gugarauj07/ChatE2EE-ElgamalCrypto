import useAuth from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useConversations } from '../contexts/ConversationContext';

export const useWebSocket = () => {
  const { receiveMessage } = useConversations();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const socket = new WebSocket(`ws://localhost:8080/api/ws?token=${token}`);

    socket.onopen = () => {
      console.log('Conectado ao WebSocket');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { conversationId, message } = data;
        receiveMessage(conversationId, message);
      } catch (error) {
        console.error('Erro ao processar mensagem recebida:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket fechado');
    };

    return () => {
      socket.close();
    };
  }, [token, receiveMessage]);
};