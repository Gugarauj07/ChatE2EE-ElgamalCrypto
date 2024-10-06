import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendMessage, receiveMessages, getPublicKey, sendHeartbeat } from '../services/api';
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
  const { selectedUser, elgamal } = location.state as any;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [receiverPublicKey, setReceiverPublicKey] = useState<any>(null);

  useEffect(() => {
    if (!selectedUser || !elgamal) {
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
    const intervalId = setInterval(fetchMessages, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat(selectedUser);
    }, 60000);

    return () => clearInterval(heartbeatInterval);
  }, [selectedUser]);

  const fetchMessages = async () => {
    try {
      const receivedMessages = await receiveMessages(elgamal.privateKey.x);
      if (receivedMessages.length > 0) {
        const decryptedMessages = receivedMessages.map((msg: any) => ({
          sender: msg.senderId,
          content: elgamal.decrypt(msg.encryptedMessage, elgamal.privateKey, elgamal.publicKey.p),
        }));
        setMessages((prev: any) => [...prev, ...decryptedMessages]);
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
      await sendMessage(encrypted, elgamal.privateKey.x.toString(), selectedUser);
      setMessages((prev: any) => [...prev, { sender: 'Você', content: message }]);
      setMessage('');
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
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-3xl mx-auto shadow-lg border border-gray-300 bg-white rounded-lg">
        <CardHeader className="bg-gray-800 text-white flex justify-between items-center rounded-t-lg">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 bg-gray-200">
              <AvatarImage src={`https://avatar.vercel.sh/${selectedUser}.png`} alt={selectedUser} />
              <AvatarFallback>{selectedUser.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <CardTitle>{selectedUser}</CardTitle>
              <CardDescription>Chat com {selectedUser}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <ScrollArea className="h-80 w-full rounded-md border border-gray-300 p-4 overflow-y-auto">
            {messages.map((msg: any, index: number) => (
              <div key={index} className={`mb-4 ${msg.sender === 'Você' ? 'text-right' : 'text-left'}`}>
                <span className="block text-sm font-semibold text-gray-700">{msg.sender}</span>
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