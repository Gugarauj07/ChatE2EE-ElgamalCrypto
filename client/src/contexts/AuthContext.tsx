// client/src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getPrivateKey, savePrivateKey } from '../services/keyStore';
import { PublicKey, PrivateKey } from '../utils/elgamal';

interface AuthContextType {
  token: string | null;
  userId: string | null;
  publicKey: PublicKey | null;
  privateKey: PrivateKey | null;
  setAuth: (token: string, userId: string, publicKey: PublicKey, privateKey: PrivateKey) => void;
  setAuthFromStorage: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  userId: null,
  publicKey: null,
  privateKey: null,
  setAuth: () => {},
  setAuthFromStorage: () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [privateKey, setPrivateKey] = useState<PrivateKey | null>(null);

  const setAuth = (newToken: string, newUserId: string, newPublicKey: PublicKey, newPrivateKey: PrivateKey) => {
    setToken(newToken);
    setUserId(newUserId);
    setPublicKey(newPublicKey);
    setPrivateKey(newPrivateKey);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('publicKey', JSON.stringify(newPublicKey));
    // Salvar a chave privada no IndexedDB
    savePrivateKey(newUserId, newPrivateKey, 'sua-senha-aqui'); // Substitua por uma senha segura
  };

  const setAuthFromStorage = async () => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedPublicKey = localStorage.getItem('publicKey');

    if (storedToken && storedUserId && storedPublicKey) {
      const parsedPublicKey: PublicKey = JSON.parse(storedPublicKey);
      const retrievedPrivateKey = await getPrivateKey(storedUserId, 'sua-senha-aqui'); // Substitua pela senha correta

      if (retrievedPrivateKey) {
        setToken(storedToken);
        setUserId(storedUserId);
        setPublicKey(parsedPublicKey);
        setPrivateKey(retrievedPrivateKey);
      } else {
        // Se a chave privada não for encontrada ou falhar na descriptografia, deslogue o usuário
        logout();
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setPublicKey(null);
    setPrivateKey(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('publicKey');
    // Limpar a chave privada do IndexedDB
    if (userId) {
      // Implementar a função clearPrivateKey se ainda não estiver implementada
      // clearPrivateKey(userId);
    }
  };

  return (
    <AuthContext.Provider value={{ token, userId, publicKey, privateKey, setAuth, setAuthFromStorage, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
