// client/src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';
import { PublicKey, PrivateKey } from '../utils/elgamal';
import { clearPrivateKey } from '../services/keyStore';

interface AuthContextType {
  token: string | null;
  userId: string | null;
  publicKey: PublicKey | null;
  privateKey: PrivateKey | null;
  setAuth: (token: string | null, userId: string | null, publicKey?: PublicKey, privateKey?: PrivateKey) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  userId: null,
  publicKey: null,
  privateKey: null,
  setAuth: () => {},
  logout: () => Promise.resolve(),
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [privateKey, setPrivateKey] = useState<PrivateKey | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    if (storedToken) setToken(storedToken);
    if (storedUserId) setUserId(storedUserId);
    // As chaves não são armazenadas no localStorage por questões de segurança
  }, []);

  const setAuth = (newToken: string | null, newUserId: string | null, newPublicKey?: PublicKey, newPrivateKey?: PrivateKey) => {
    setToken(newToken);
    setUserId(newUserId);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }

    if (newUserId) {
      localStorage.setItem('userId', newUserId);
    } else {
      localStorage.removeItem('userId');
    }

    if (newPublicKey) {
      setPublicKey(newPublicKey);
    }

    if (newPrivateKey) {
      setPrivateKey(newPrivateKey);
    }
  };

  const logout = async () => {
    if (userId) {
      await clearPrivateKey(userId);
    }
    setToken(null);
    setUserId(null);
    setPublicKey(null);
    setPrivateKey(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{ token, userId, publicKey, privateKey, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
