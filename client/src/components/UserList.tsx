import React, { useEffect, useState } from 'react';
import { getUsers, User } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export default function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token ausente. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }

      try {
        const data = await getUsers(token);
        setUsers(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao buscar usuários');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleStartChat = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  if (loading) {
    return <p>Carregando usuários...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Usuários</h2>
      <ul>
        {users.map((user) => (
          <li key={user.userId} className="flex justify-between items-center mb-2">
            <span>{user.username}</span>
            <button
              onClick={() => handleStartChat(user.userId)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Iniciar Conversa
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}