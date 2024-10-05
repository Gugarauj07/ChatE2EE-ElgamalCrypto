import React, { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { encryptMessage, sendMessage, receiveMessages } from '../services/api';
import { KeyPair, PublicKey, ChatMessage, EncryptionLogEntry } from '../types';

interface ChatProps {
  userId: string;
  keys: KeyPair;
  partnerUserId: string;
  partnerPublicKey: PublicKey;
}

export default function Chat({ userId, keys, partnerUserId, partnerPublicKey }: ChatProps) {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [encryptionLog, setEncryptionLog] = useState<EncryptionLogEntry[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const messages = await receiveMessages(userId, keys.privateKey as unknown as number);
      setChatLog(prevLog => [...prevLog, ...messages]);
    };

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userId, keys.privateKey]);

  const handleSendMessage = async () => {
    if (message) {
      const encryptedMessage = await encryptMessage(message, partnerPublicKey);
      await sendMessage(encryptedMessage, userId, partnerUserId);

      setEncryptionLog(prev => [...prev, {
        type: 'encrypt',
        content: `Mensagem "${message}" criptografada para ${partnerUserId}`,
        details: JSON.stringify(encryptedMessage)
      }]);

      setChatLog(prev => [...prev, { sender: userId, receiver: partnerUserId, message }]);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatLog.map((msg, index) => (
          <div key={index} className={`p-2 rounded-lg ${msg.sender === userId ? 'bg-blue-100 ml-auto' : 'bg-gray-100'} max-w-[70%]`}>
            <p>{msg.message}</p>
            <small className="text-xs text-gray-500">{msg.sender === userId ? 'Você' : partnerUserId}</small>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>Enviar</Button>
        </div>
      </div>

      <div className="p-4 border-t">
        <h3 className="font-bold mb-2">Log de Criptografia</h3>
        <div className="h-40 overflow-y-auto bg-gray-100 p-2 rounded">
          {encryptionLog.map((log, index) => (
            <div key={index} className={`mb-2 ${log.type === 'encrypt' ? 'text-green-600' : 'text-blue-600'}`}>
              <p>{log.content}</p>
              <small className="text-xs text-gray-500">{JSON.stringify(log.details)}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}