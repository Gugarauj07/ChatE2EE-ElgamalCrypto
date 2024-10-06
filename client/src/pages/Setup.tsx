import React, { useState, useEffect } from 'react';
import { ElGamal } from '../utils/elgamal';
import { connectToServer, getUsers, disconnectUser } from '../services/api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const Setup: React.FC = () => {
  const { toast } = useToast()
  const [elgamal, setElgamal] = useState<ElGamal | null>(null);
  const [username, setUsername] = useState('');
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    try {
      const eg = new ElGamal();
      setElgamal(eg);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar chaves iniciais",
        description: "Por favor, tente novamente.",
        duration: 5000,
      })
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (connected) {
      const intervalId = setInterval(fetchUsers, 5000);
      return () => clearInterval(intervalId);
    }
  }, [connected]);

  const handleGenerateKeys = () => {
    try {
      const eg = new ElGamal();
      setElgamal(eg);
      setShowExplanation(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar novas chaves",
        description: "Por favor, tente novamente.",
        duration: 5000,
      })
      console.error(err);
    }
  };

  const handleConnect = async () => {
    if (elgamal && username) {
      try {
        await connectToServer(username, {
          p: Number(elgamal.publicKey.p),
          g: Number(elgamal.publicKey.g),
          y: Number(elgamal.publicKey.y)
        });
        setConnected(true);
        fetchUsers();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao conectar",
          description: "Por favor, tente novamente.",
          duration: 5000,
        })
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
        toast({
          variant: "destructive",
          title: "Erro ao obter usuários",
          description: "Por favor, tente novamente.",
          duration: 5000,
        })
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
        toast({
          variant: "destructive",
          title: "Erro ao desconectar",
          description: "Por favor, tente novamente.",
          duration: 5000,
        })
        console.error('Erro ao desconectar:', error);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-2xl mx-auto shadow-lg border border-gray-300 bg-white rounded-lg">
        <CardHeader className="bg-gray-800 text-white rounded-t-lg">
          <CardTitle>Configuração do Chat ElGamal</CardTitle>
          <CardDescription>Configure suas chaves e conecte-se ao chat</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!connected ? (
            <>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Chave Pública:</h3>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-x-auto text-sm text-gray-800">
                    {elgamal
                      ? `p: ${elgamal.publicKey.p}\ng: ${elgamal.publicKey.g}\ny: ${elgamal.publicKey.y}`
                      : 'Gerando chaves...'}
                  </pre>
                </div>
                <Button onClick={handleGenerateKeys} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Gerar Novas Chaves
                </Button>
                {showExplanation && (
                  <Alert className="bg-gray-100 border border-gray-300 text-gray-700">
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
                  className="border border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                />
                <Button onClick={handleConnect} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Conectar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">
                    Seu nome: <span className="font-bold text-gray-900">{username}</span>
                  </h3>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Sua Chave Pública:</h3>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-x-auto text-sm text-gray-800">
                    {elgamal
                      ? `p: ${elgamal.publicKey.p}\ng: ${elgamal.publicKey.g}\ny: ${elgamal.publicKey.y}`
                      : ''}
                  </pre>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Usuários Disponíveis:</h3>
                  <ScrollArea className="h-60 w-full rounded-md border border-gray-300 mt-2">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <div
                          key={user}
                          className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer ${
                            selectedUser === user ? 'bg-blue-100' : ''
                          }`}
                          onClick={() => handleSelectUser(user)}
                        >
                          <Avatar className="h-10 w-10 bg-gray-200">
                            <AvatarImage src={`https://avatar.vercel.sh/${user}.png`} alt={user} />
                            <AvatarFallback>{user.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="ml-3 text-gray-800">{user}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 p-4">Nenhum usuário disponível no momento.</p>
                    )}
                  </ScrollArea>
                  {selectedUser && (
                    <Alert className="bg-green-100 border border-green-300 text-green-700 mt-4">
                      <AlertTitle>Usuário Selecionado</AlertTitle>
                      <AlertDescription>
                        Você selecionou: <strong>{selectedUser}</strong>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="p-6">
          {connected && (
            <Button onClick={handleDisconnect} variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white">
              Desconectar
            </Button>
          )}
        </CardFooter>
      </Card>
      <Toaster />
    </div>
  );
};

export default Setup;