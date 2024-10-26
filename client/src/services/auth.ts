import { PublicKey } from '@/utils/elgamal';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; // URL do backend

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

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await axios.post(`${API_URL}/login`, { username, password });
  return response.data;
};

export const register = async (username: string, password: string, publicKey: PublicKey): Promise<RegisterResponse> => {
  const response = await axios.post(`${API_URL}/register`, {
    username,
    password,
    publicKey,
  });
  return response.data;
};

// Função para obter lista de usuários
export const getUsers = async (token: string): Promise<User[]> => {
  const response = await axios.get(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Função para obter lista de grupos
export const getGroups = async (token: string): Promise<Group[]> => {
  const response = await axios.get(`${API_URL}/groups`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
