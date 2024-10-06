import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendMessage, receiveMessages, getPublicKey, sendHeartbeat } from '../services/api';
import { ElGamal } from '../utils/elgamal';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft } from 'lucide-react'

const Chat: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedUser, publicKey, privateKey, userId } = location.state as any;

  const [elgamal] = useState(() => {
    const eg = new ElGamal();
    eg.setKeys(publicKey, privateKey);
    return eg;
  });

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [receiverPublicKey, setReceiverPublicKey] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedUser || !publicKey || !privateKey) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar chat",
        description: "Usuário ou chaves não fornecidas.",
        duration: 5000,
      });
      navigate('/');
      return;
    }

    const fetchPublicKey = async () => {
      try {
        const pubKey = await getPublicKey(selectedUser);
        setReceiverPublicKey(pubKey);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao obter chave pública",
          description: "Não foi possível obter a chave pública do usuário selecionado.",
          duration: 5000,
        });
        console.error('Erro ao obter chave pública:', error);
      }
    };

    fetchPublicKey();
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 5000);

    return () => clearInterval(intervalId);
  }, [selectedUser]);

  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat(selectedUser);
    }, 60000);

    return () => clearInterval(heartbeatInterval);
  }, [selectedUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const receivedMessages = await receiveMessages(userId, selectedUser);
      if (receivedMessages.length > 0) {
        const decryptedMessages = receivedMessages.map((msg: any) => ({
          ...msg,
          content: elgamal.decrypt({ a: msg.content.split(',')[0], b: msg.content.split(',')[1] }, elgamal.privateKey, elgamal.publicKey.p),
        }));
        setMessages(decryptedMessages);
      }
    } catch (error) {
      console.error('Erro ao receber mensagens:', error);
      toast({
        variant: "destructive",
        title: "Erro ao receber mensagens",
        description: "Não foi possível buscar novas mensagens.",
        duration: 5000,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!receiverPublicKey) {
      toast({
        variant: "destructive",
        title: "Chave pública indisponível",
        description: "Não foi possível enviar a mensagem sem a chave pública do destinatário.",
        duration: 5000,
      });
      return;
    }

    try {
      const encrypted = elgamal.encrypt(message, receiverPublicKey);
      await sendMessage(encrypted, userId, selectedUser);
      setMessage('');
      fetchMessages(); // Atualiza as mensagens imediatamente após enviar
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        duration: 5000,
      });
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
            {messages.map((msg: any, index: number) => (
              <div key={index} className={`mb-4 ${msg.senderId === elgamal.privateKey.x ? 'text-right' : 'text-left'}`}>
                <span className="block text-sm font-semibold text-gray-700">
                  {msg.senderId === elgamal.privateKey.x ? 'Você' : selectedUser}
                </span>
                <span className="block text-gray-800">{msg.content}</span>
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
            onKeyPress={(e: any) => {
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
      <Toaster />
    </div>
  );
};

export default Chat;