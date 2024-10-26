// client/src/pages/CreateGroup.tsx
import React, { useEffect, useState } from 'react';
import { getUsers, User, Group } from '../services/auth';
import { createGroup } from '../services/groups';
import { useNavigate } from 'react-router-dom';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupId, setGroupId] = useState<string>('');
  const [senderKey, setSenderKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

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

  const handleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!groupId || selectedUsers.length === 0 || !senderKey) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token ausente. Por favor, faça login novamente.');
        return;
      }

      await createGroup(token, groupId, selectedUsers, senderKey);
      setSuccess('Grupo criado com sucesso!');
      setTimeout(() => {
        navigate('/chat');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar grupo');
    }
  };

  if (loading) {
    return <p>Carregando usuários...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleCreateGroup} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl mb-4 text-center">Criar Novo Grupo</h2>
        {success && <p className="mb-4 text-green-500 text-center">{success}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">ID do Grupo</label>
          <input
            type="text"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full px-3 py-2 border rounded mt-1"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Selecionar Membros</label>
          <div className="max-h-40 overflow-y-auto border p-2 rounded mt-1">
            {users.map((user) => (
              <div key={user.userId} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={user.userId}
                  checked={selectedUsers.includes(user.userId)}
                  onChange={() => handleUserSelection(user.userId)}
                  className="mr-2"
                />
                <label htmlFor={user.userId}>{user.username}</label>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700">Sender Key</label>
          <input
            type="text"
            value={senderKey}
            onChange={(e) => setSenderKey(e.target.value)}
            className="w-full px-3 py-2 border rounded mt-1"
            required
          />
          <small className="text-gray-500">Forneça uma sender key única para o grupo.</small>
        </div>
        <button type="submit" className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
          Criar Grupo
        </button>
      </form>
    </div>
  );
}