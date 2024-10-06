import React, { useState, useEffect } from 'react';
import { ElGamal } from '../utils/elgamal';
import { connectToServer, getUsers, disconnectUser } from '../services/api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const Setup: React.FC = () => {
  const [elgamal, setElgamal] = useState<ElGamal | null>(null);
  const [username, setUsername] = useState('');
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const eg = new ElGamal();
    setElgamal(eg);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(fetchUsers, 5000);
    return () => clearInterval(intervalId);
  }, [connected]);

  const handleGenerateKeys = () => {
    const eg = new ElGamal();
    setElgamal(eg);
    setShowExplanation(true);
  };

  const handleConnect = async () => {
    if (elgamal && username) {
      try {
        await connectToServer(username, elgamal.publicKey);
        setConnected(true);
        fetchUsers();
      } catch (error) {
        console.error('Erro ao conectar:', error);
      }
    }
  };

  const fetchUsers = async () => {
    if (connected) {
      try {
        const userList = await getUsers();
        setUsers(userList.filter(user => user !== username));
      } catch (error) {
        console.error('Erro ao obter usuários:', error);
      }
    }
  };

  const handleSelectUser = (user: string) => {
    setSelectedUser(user);
  };

  const handleDisconnect = async () => {
    if (username) {
      try {
        await disconnectUser(username);
        setConnected(false);
        setSelectedUser(null);
        setUsers([]);
      } catch (error) {
        console.error('Erro ao desconectar:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Configuração do Chat ElGamal</CardTitle>
          <CardDescription>Configure suas chaves e conecte-se ao chat</CardDescription>
        </CardHeader>
        <CardContent>
          {!connected ? (
            <>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Chave Pública:</h3>
                  <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
                    {elgamal ? JSON.stringify(elgamal.publicKey, null, 2) : ''}
                  </pre>
                </div>
                <Button onClick={handleGenerateKeys} className="w-full">
                  Gerar Novas Chaves
                </Button>
                {showExplanation && (
                  <Alert>
                    <AlertTitle>Processo de Geração de Chaves</AlertTitle>
                    <AlertDescription>
                      1. Gera um número primo grande 'p'<br />
                      2. Encontra uma raiz primitiva 'g' módulo 'p'<br />
                      3. Gera um número aleatório 'x' como chave privada<br />
                      4. Calcula 'y = g^x mod p' como parte da chave pública
                    </AlertDescription>
                  </Alert>
                )}
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu nome de usuário"
                />
                <Button onClick={handleConnect} className="w-full">
                  Conectar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Seu nome: <span className="font-bold">{username}</span></h3>
                <h3 className="text-lg font-medium">Sua Chave Pública:</h3>
                <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
                  {elgamal ? JSON.stringify(elgamal.publicKey, null, 2) : ''}
                </pre>
                <h3 className="text-lg font-medium">Usuários Disponíveis:</h3>
                <ScrollArea className="h-[200px] w-full rounded-md border">
                  {users.map((user) => (
                    <div
                      key={user}
                      className={`flex items-center p-2 hover:bg-accent cursor-pointer ${
                        selectedUser === user ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://avatar.vercel.sh/${user}.png`} alt={user} />
                        <AvatarFallback>{user[0]}</AvatarFallback>
                      </Avatar>
                      <span className="ml-2">{user}</span>
                    </div>
                  ))}
                </ScrollArea>
                {selectedUser && (
                  <Alert>
                    <AlertTitle>Usuário Selecionado</AlertTitle>
                    <AlertDescription>
                      Você selecionou: <strong>{selectedUser}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          {connected && (
            <Button onClick={handleDisconnect} variant="destructive" className="w-full">
              Desconectar
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Setup;
