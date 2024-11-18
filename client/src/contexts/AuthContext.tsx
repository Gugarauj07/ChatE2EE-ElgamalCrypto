import { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { decryptPrivateKey } from '../utils/cryptoUtils';
import { PrivateKey, PublicKey } from '../utils/elgamal';
import { set, get } from 'idb-keyval';
import { User } from '../types/chat';

interface AuthContextType {
  token: string | null;
  privateKey: PrivateKey | null;
  user: User | null;
  login: (token: string, encryptedPrivateKey: string, password: string, userData: User) => Promise<void>;
  logout: () => void;
  setAuthData: (data: { token: string; privateKey: PrivateKey; user: User }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  privateKey: null,
  user: null,
  login: async () => {},
  logout: () => {},
  setAuthData: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [privateKey, setPrivateKey] = useState<PrivateKey | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (token) {
        try {
          const response = await api.get('/api/user/profile');

          if (!response.data?.id || !response.data?.publicKey) {
            console.error('Dados do usuário incompletos');
            console.error('Resposta da API:', response.data);
            return;
          }

          setUser({
            id: response.data.id,
            username: response.data.username,
            publicKey: response.data.publicKey
          });
        } catch (err) {
          console.error('Erro ao carregar dados do usuário:', err);
          console.error('Erro completo:', err);
        }
      }
    };

    loadUserData();
  }, [token]);

  useEffect(() => {
    const loadPrivateKey = async () => {
      if (token) {
        try {
          const storedPrivateKey = await get<PrivateKey>('privateKey');
          if (storedPrivateKey) {
            setPrivateKey(storedPrivateKey);
          }
        } catch (err) {
          console.error('Erro ao carregar a chave privada do IndexedDB:', err);
        }
      }
    };

    loadPrivateKey();
  }, [token]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.Authorization;
      setPrivateKey(null);
      setUser(null);
    }
  }, [token]);

  const loginUser = async (newToken: string, encryptedPrivateKey: string, password: string, userData: User) => {
    try {
      setToken(newToken);
      localStorage.setItem('token', newToken);
      api.defaults.headers.Authorization = `Bearer ${newToken}`;

      const decryptedPrivateKey = await decryptPrivateKey(encryptedPrivateKey, password);
      setPrivateKey(decryptedPrivateKey);
      await set('privateKey', decryptedPrivateKey);

      setUser(userData);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const logout = async () => {
    setToken(null);
    setPrivateKey(null);
    setUser(null);
    try {
      await set('privateKey', null);
    } catch (err) {
      console.error('Erro ao remover a chave privada do IndexedDB:', err);
    }
  };

  const setAuthData = async (data: { token: string; privateKey: PrivateKey; user: User }) => {
    setToken(data.token);
    setPrivateKey(data.privateKey);
    setUser(data.user);
    await set('privateKey', data.privateKey);
  };

  return (
    <AuthContext.Provider value={{ token, privateKey, user, login: loginUser, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
};