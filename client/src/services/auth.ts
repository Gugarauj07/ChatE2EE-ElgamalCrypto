import { PublicKey } from '@/utils/elgamal';
import api from './api';

// Atualize a interface para incluir publicKey
interface LoginResponse {
  token: string;
  userId: string;
  publicKey: PublicKey;
}

// Interface para a resposta de registro
interface RegisterResponse {
  token: string;
  userId: string;
  message: string;
}

// Interface para lista de usuários
export interface User {
  userId: string;
  username: string;
  publicKey: {
    p: string;
    g: string;
    y: string;
  };
}

// Interface para lista de grupos
export interface Group {
  groupId: string;
  members: string[];
  senderKey: string;
}

export const login = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post('/login', { username, password });
  return response.data;
};

export const register = async (
  username: string,
  password: string,
  publicKey: PublicKey
): Promise<RegisterResponse> => {
  const response = await api.post('/register', {
    username,
    password,
    publicKey,
  });
  return response.data;
};

// Função para obter lista de usuários
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

// Função para obter lista de grupos
export const getGroups = async (): Promise<Group[]> => {
  const response = await api.get('/groups');
  return response.data;
};
