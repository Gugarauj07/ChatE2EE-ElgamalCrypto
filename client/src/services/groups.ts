import api from './api'; // Importa a instância personalizada

// Função para criar grupo
export const createGroup = async (
  groupId: string,
  members: string[],
  senderKey: string
): Promise<{ message: string; groupId: string }> => {
  const response = await api.post('/groups', { groupId, members, senderKey });
  return response.data;
};
