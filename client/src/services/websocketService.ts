import useAuth from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useConversations } from '../contexts/ConversationContext';
import { WSMessage } from '@/types/websocket';

export const useWebSocket = () => {
  const { receiveMessage } = useConversations();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const socket = new WebSocket('ws://localhost:8080/api/ws');

    socket.onopen = () => {
      console.log('Conectado ao WebSocket');
      const authMessage: WSMessage = {
        type: 'auth',
        payload: {
          token: token,
        },
      };
      socket.send(JSON.stringify(authMessage));
    };

    socket.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        switch (data.type) {
          case 'message':
            const { conversationId, message } = data.payload;
            receiveMessage(conversationId, message);
            break;
          // Adicione outros tipos de mensagens conforme necessário
          default:
            console.warn('Tipo de mensagem desconhecido:', data.type);
        }
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