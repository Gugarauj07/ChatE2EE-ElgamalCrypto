import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroups, Group } from '../services/auth';

export default function Groups() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchGroups = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token ausente. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }

      try {
        const data = await getGroups(token);
        setGroups(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao buscar grupos');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleEnterGroup = (id: string) => {
    navigate(`/groups/${id}`);
  };

  if (loading) {
    return <p>Carregando grupos...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Meus Grupos</h2>
      <ul>
        {groups.map((group) => (
          <li key={group.groupId} className="flex justify-between items-center mb-2">
            <span>{group.groupId}</span>
            <button
              onClick={() => handleEnterGroup(group.groupId)}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Entrar no Grupo
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
