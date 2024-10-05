import React, { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { generateKeys, connectToServer, getUsers, getPublicKey } from '../services/api';
import { KeyPair, PublicKey, EncryptionLogEntry } from '../types';

interface SetupProps {
  onSetupComplete: (userId: string, keys: KeyPair, partnerUserId: string, partnerPublicKey: PublicKey) => void;
  setEncryptionLog: React.Dispatch<React.SetStateAction<EncryptionLogEntry[]>>;
}

export default function Setup({ onSetupComplete, setEncryptionLog }: SetupProps) {
  const [keys, setKeys] = useState<KeyPair | null>(null);
  const [userId, setUserId] = useState('');
  const [partnerUserId, setPartnerUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  useEffect(() => {
    generateNewKeys();
  }, []);

  const generateNewKeys = async () => {
    const generatedKeys = await generateKeys();
    setKeys(generatedKeys);
    setEncryptionLog(prev => [...prev, {
      type: 'keys',
      content: 'Novas chaves geradas',
      details: JSON.stringify(generatedKeys.publicKey)
    }]);
  };

  const handleConnect = async () => {
    if (userId && keys) {
      await connectToServer(userId, keys.publicKey);
      setEncryptionLog(prev => [...prev, {
        type: 'connect',
        content: `Conectado ao servidor como ${userId}`,
        details: JSON.stringify(keys.publicKey)
      }]);
      const users = await getUsers();
      setAvailableUsers(users.filter(id => id !== userId));
    }
  };

  const handleSelectPartner = async (selectedUserId: string) => {
    setPartnerUserId(selectedUserId);
    if (keys) {
      const partnerPublicKey = await getPublicKey(selectedUserId);
      setEncryptionLog(prev => [...prev, {
        type: 'partner',
        content: `Parceiro selecionado: ${selectedUserId}`,
        details: JSON.stringify(partnerPublicKey)
      }]);
      onSetupComplete(userId, keys, selectedUserId, partnerPublicKey);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Configuração do Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              Seu ID de Usuário
            </label>
            <Input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Digite seu ID de usuário"
            />
          </div>

          <Button onClick={handleConnect} disabled={!userId || !keys} className="w-full">
            Conectar ao Servidor
          </Button>

          {availableUsers.length > 0 && (
            <div>
              <label htmlFor="partnerSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Selecione um Parceiro
              </label>
              <Select onValueChange={handleSelectPartner}>
                <SelectTrigger id="partnerSelect">
                  <SelectValue placeholder="Escolha um parceiro" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={generateNewKeys} variant="outline" className="w-full">
            Gerar Novas Chaves
          </Button>
        </div>

        {keys && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Suas Chaves:</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(keys, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}