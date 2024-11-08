import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { decryptPrivateKey } from '../utils/cryptoUtils';
import { PrivateKey } from '../utils/elgamal';
import { set, get } from 'idb-keyval';

interface AuthContextType {
  token: string | null;
  privateKey: PrivateKey | null;
  login: (token: string, encryptedPrivateKey: string, password: string) => Promise<void>;
  logout: () => void;
  setAuthData: (data: { token: string; privateKey: PrivateKey }) => void;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  privateKey: null,
  login: async () => {},
  logout: () => {},
  setAuthData: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [privateKey, setPrivateKey] = useState<PrivateKey | null>(null);

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
    }
  }, [token]);

  const loginUser = async (newToken: string, encryptedPrivateKey: string, password: string) => {
    setToken(newToken);
    try {
      // Descriptografar a chave privada
      const decryptedPrivateKey = await decryptPrivateKey(encryptedPrivateKey, password);
      setPrivateKey(decryptedPrivateKey);
      // Armazenar a chave privada no IndexedDB
      await set('privateKey', decryptedPrivateKey);
    } catch (err) {
      console.error('Erro ao descriptografar ou armazenar a chave privada:', err);
      throw new Error('Falha na descriptografia da chave privada.');
    }
  };

  const logout = async () => {
    setToken(null);
    setPrivateKey(null);
    try {
      await set('privateKey', null);
    } catch (err) {
      console.error('Erro ao remover a chave privada do IndexedDB:', err);
    }
  };

  const setAuthData = async (data: { token: string; privateKey: PrivateKey }) => {
    setToken(data.token);
    setPrivateKey(data.privateKey);
    await set('privateKey', data.privateKey);
  };

  return (
    <AuthContext.Provider value={{ token, privateKey, login: loginUser, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
};