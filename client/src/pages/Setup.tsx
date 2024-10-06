import React, { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { connectToServer, getUsers, getPublicKey } from '../services/api';
import { KeyPair, PublicKey, EncryptionLogEntry } from '../types';
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { CheckCircle, UserPlus } from 'lucide-react'; // Importe ícones

interface SetupProps {
  onSetupComplete: (userId: string, keys: KeyPair, partnerUserId: string, partnerPublicKey: PublicKey) => void;
  setEncryptionLog: React.Dispatch<React.SetStateAction<EncryptionLogEntry[]>>;
  isConnected: boolean;
  userId: string;
  keys: KeyPair;
}

export default function Setup({ onSetupComplete, setEncryptionLog, isConnected, userId, keys }: SetupProps) {
  const [partnerUserId, setPartnerUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      fetchUsers();
    }
  }, [isConnected]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const users = await getUsers();
      setAvailableUsers(users.filter(id => id !== userId));
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (userId && keys) {
      setIsLoading(true);
      try {
        await connectToServer(userId, keys.publicKey);
        await fetchUsers();
      } catch (error) {
        console.error("Erro ao conectar:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectPartner = async (selectedUserId: string) => {
    setPartnerUserId(selectedUserId);
    if (keys) {
      const partnerPublicKey = await getPublicKey(selectedUserId);
      onSetupComplete(userId, keys, selectedUserId, partnerPublicKey);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Configuração do Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isConnected ? (
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle size={24} />
            <span>Conectado como {userId}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                Seu ID de Usuário: {userId}
              </label>
            </div>
            <Button onClick={handleConnect} disabled={!userId || !keys || isLoading} className="w-full">
              {isLoading ? "Conectando..." : "Conectar ao Servidor"}
            </Button>
          </div>
        )}

        {isConnected && (
          <>
            {availableUsers.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione um Parceiro
                </label>
                <RadioGroup onValueChange={handleSelectPartner} className="space-y-2">
                  {availableUsers.map((user) => (
                    <div key={user} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-100">
                      <RadioGroupItem value={user} id={user} />
                      <Label htmlFor={user} className="flex items-center space-x-2">
                        <UserPlus size={18} />
                        <span>{user}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <Card className="bg-yellow-100 border-yellow-300">
                <CardContent className="p-4">
                  <p className="text-yellow-800 text-center">
                    Nenhum usuário disponível no momento. Aguarde ou tente novamente mais tarde.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}