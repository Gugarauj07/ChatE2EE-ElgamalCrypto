import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendMessage, receiveMessages, getPublicKey, sendHeartbeat } from '../services/api';
import { ElGamal } from '../utils/elgamal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from 'lucide-react';
import { LocationState, ChatMessage, PublicKey, EncryptedMessage } from '../types';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedUser, publicKey, privateKey, userId } = location.state as LocationState;

  const [elGamal] = useState(() => {
    const eg = new ElGamal();
    eg.setKeys(publicKey, privateKey);
    return eg;
  });

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [receiverPublicKey, setReceiverPublicKey] = useState<PublicKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchAndDecryptMessages = async () => {
    try {
      const encryptedMessages = await receiveMessages(userId, selectedUser);
      if (encryptedMessages.length > 0) {
        const decryptedMessages = encryptedMessages.map((msg) => {
          try {
            console.log('Mensagem criptografada:', msg.encryptedContent);
            console.log('Chave privada:', privateKey);
            console.log('Módulo p:', publicKey.p);
            const decryptedContent = elGamal.decrypt(msg.encryptedContent, privateKey, publicKey.p);
            console.log('Conteúdo descriptografado:', decryptedContent);
            return {
              ...msg,
              content: decryptedContent,
              isOwnMessage: msg.senderId === userId
            };
          } catch (decryptError) {
            console.error('Erro detalhado ao descriptografar:', decryptError);
            return {
              ...msg,
              content: "Erro ao descriptografar mensagem",
              isOwnMessage: msg.senderId === userId
            };
          }
        });
        setMessages(decryptedMessages);
      }
    } catch (error) {
      console.error('Erro ao receber mensagens:', error);
    }
  };

  useEffect(() => {
    if (!selectedUser || !publicKey || !privateKey || !userId) {
      navigate('/');
      return;
    }

    const fetchPublicKey = async () => {
      try {
        const pubKey = await getPublicKey(selectedUser);
        setReceiverPublicKey(pubKey);
      } catch (error) {
        console.error('Erro ao obter chave pública:', error);
      }
    };

    fetchPublicKey();
    fetchAndDecryptMessages();
    const intervalId = setInterval(fetchAndDecryptMessages, 5000);

    return () => clearInterval(intervalId);
  }, [selectedUser, publicKey, privateKey, userId, navigate, elGamal]);

  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat(userId);
    }, 60000);

    return () => clearInterval(heartbeatInterval);
  }, [userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !receiverPublicKey) return;

    try {
      const encrypted: EncryptedMessage = elGamal.encrypt(message, receiverPublicKey);
      await sendMessage(encrypted, userId, selectedUser);
      setMessage('');
      await fetchAndDecryptMessages();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleBack = () => {
    navigate('/', {
      state: {
        userId: userId,
        publicKey: publicKey,
        privateKey: privateKey
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-3xl mx-auto shadow-lg border border-gray-300 bg-white rounded-lg">
        <CardHeader className="bg-gray-800 text-white flex items-center rounded-t-lg p-4">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center flex-grow">
            <Avatar className="h-10 w-10 bg-gray-200">
              <AvatarImage src={`https://avatar.vercel.sh/${selectedUser}.png`} alt={selectedUser} />
              <AvatarFallback>{selectedUser.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <CardTitle>{selectedUser}</CardTitle>
              <CardDescription>Chat com {selectedUser}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ScrollArea className="h-80 w-full rounded-md border border-gray-300 p-4 overflow-y-auto" ref={scrollRef}>
            {messages.map((msg: ChatMessage, index: number) => (
              <div key={index} className={`mb-4 ${msg.isOwnMessage ? 'text-right' : 'text-left'}`}>
                <span className="block text-sm font-semibold text-gray-700">
                  {msg.isOwnMessage ? 'Você' : selectedUser}
                </span>
                <span className="block text-gray-800">{msg.content}</span>
                <span className="block text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-6 flex space-x-4">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-grow border border-gray-300 focus:border-blue-600 focus:ring-blue-600"
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 text-white">
            Enviar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Chat;