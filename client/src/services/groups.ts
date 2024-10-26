// client/src/services/groups.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; // URL do backend

// Interface para requisição de criação de grupo
interface CreateGroupRequest {
  groupId: string;
  members: string[];
  senderKey: string;
}

// Função para criar grupo
export const createGroup = async (
  token: string,
  groupId: string,
  members: string[],
  senderKey: string
): Promise<{ message: string; groupId: string }> => {
  const response = await axios.post(
    `${API_URL}/groups`,
    { groupId, members, senderKey },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};