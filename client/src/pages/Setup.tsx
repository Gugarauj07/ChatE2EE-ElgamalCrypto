import React, { useState, useEffect } from 'react';
import { ElGamal } from '../utils/elgamal';
import { connectToServer, getUsers } from '../services/api';

const Setup: React.FC = () => {
  const [elgamal, setElgamal] = useState<ElGamal | null>(null);
  const [username, setUsername] = useState('');
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    const eg = new ElGamal();
    setElgamal(eg);
  }, []);

  const handleGenerateKeys = () => {
    const eg = new ElGamal();
    setElgamal(eg);
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
    try {
      const userList = await getUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Erro ao obter usuários:', error);
    }
  };

  const handleSelectUser = (user: string) => {
    setSelectedUser(user);
    // Implementar a lógica de pareamento aqui
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {!connected ? (
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl mb-4">Configuração do Chat</h2>
          <div className="mb-4">
            <p className="mb-2">Chave Pública:</p>
            <textarea
              readOnly
              value={elgamal ? JSON.stringify(elgamal.publicKey, null, 2) : ''}
              className="w-full p-2 border rounded"
              rows={5}
            />
          </div>
          <button
            onClick={handleGenerateKeys}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded mb-4"
          >
            Gerar Novas Chaves
          </button>
          <div className="mb-4">
            <label className="block mb-2">Nome de Usuário:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Digite seu nome"
            />
          </div>
          <button
            onClick={handleConnect}
            className="w-full bg-green-500 text-white py-2 px-4 rounded"
          >
            Conectar
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl mb-4">Usuários Disponíveis</h2>
          <p className="mb-2">Nome: <strong>{username}</strong></p>
          <p className="mb-4">Sua Chave Pública:</p>
          <textarea
            readOnly
            value={elgamal ? JSON.stringify(elgamal.publicKey, null, 2) : ''}
            className="w-full p-2 border rounded mb-4"
            rows={5}
          />
          <ul className="mb-4">
            {users.map((user) => (
              <li
                key={user}
                className="p-2 border rounded mb-2 cursor-pointer hover:bg-gray-200"
                onClick={() => handleSelectUser(user)}
              >
                {user}
              </li>
            ))}
          </ul>
          {selectedUser && (
            <div className="mt-4">
              <p>Você selecionou: <strong>{selectedUser}</strong></p>
              {/* Implementar a lógica de pareamento aqui */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Setup;
