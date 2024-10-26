// client/src/pages/GroupChat.tsx
import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ElGamal } from '../utils/elgamal';
import { AuthContext } from '../contexts/AuthContext';

export default function GroupChat() {
  const { groupId } = useParams<{ groupId: string }>();
  const { token, publicKey, privateKey } = useContext(AuthContext);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState<string>('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const elgamal = new ElGamal();

  // Scroll automático para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!publicKey) return;

    const fetchGroupPublicKeys = async () => {
      // Obtenha as chaves públicas dos membros do grupo do servidor
      // Necessário para criptografar mensagens para cada membro
      // Implemente a chamada de API conforme necessário
    };

    fetchGroupPublicKeys();
  }, [groupId, publicKey, token]);

  useEffect(() => {
    if (!token || !groupId) return;

    // Inicializar WebSocket
    ws.current = new WebSocket(`ws://localhost:3000/ws?token=${token}`);

    ws.current.onopen = () => {
      console.log('Conectado ao WebSocket');
    };

    ws.current.onmessage = (event) => {
      const message: any = JSON.parse(event.data);
      if (message.recipientId === groupId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    ws.current.onclose = () => {
      console.log('Conexão WebSocket fechada');
    };

    return () => {
      ws.current?.close();
    };
  }, [groupId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || !publicKey || !privateKey) return;

    // Criptografar a mensagem usando a chave pública do grupo
    const encryptedContent: any = elgamal.encrypt(input, publicKey);

    const messageData = {
      recipientId: groupId,
      encryptedContent,
    };

    try {
      await axios.post(
        'http://localhost:3000/api/messages/send',
        messageData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Enviar mensagem via WebSocket
      ws.current?.send(JSON.stringify({
        senderId: "me", // Substitua com o ID real do usuário
        recipientId: groupId,
        encryptedContent,
        timestamp: new Date().toISOString(),
      }));

      setMessages((prev) => [...prev, {
        senderId: "me",
        recipientId: groupId,
        encryptedContent,
        timestamp: new Date().toISOString(),
      }]);
      setInput('');
    } catch (err: any) {
      console.error(err.response?.data?.error || 'Erro ao enviar mensagem');
    }
  };

  const decryptMessage = (encrypted: any) => {
    if (!privateKey || !publicKey) return "Erro na descriptografia";
    try {
      return elgamal.decrypt(encrypted, privateKey, publicKey.p);
    } catch (error) {
      console.error("Erro na descriptografia:", error);
      return "Erro na descriptografia";
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
        <h1 className="text-2xl">Grupo: {groupId}</h1>
      </header>
      <main className="flex-grow p-4 overflow-y-auto bg-gray-100">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.senderId === "me" ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-4 py-2 rounded ${msg.senderId === "me" ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
              {msg.senderId === "me"
                ? `Mensagem Enviada: ${input}`
                : `Mensagem de ${msg.senderId}: ${decryptMessage(msg.encryptedContent)}`
              }
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>
      <footer className="p-4 bg-white shadow-md">
        <form onSubmit={handleSend} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-grow px-4 py-2 border rounded-l"
            required
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600">
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}
