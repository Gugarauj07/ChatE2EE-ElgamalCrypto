import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useNavigate } from 'react-router-dom';
import { UserPlus as UserPlusIcon } from 'lucide-react';
import { ElGamal } from '../../utils/elgamal';
import { encryptPrivateKey } from '../../utils/cryptoUtils';
import { PublicKey } from '../../utils/elgamal';

const RegisterForm = () => {
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      const elgamal = new ElGamal();
      const { publicKey, privateKey } = elgamal.generateKeys();

      const encPrivateKey = await encryptPrivateKey(privateKey, password);

      const registrationData = {
        username,
        password,
        publicKey: publicKey as PublicKey,
        encrypted_private_key: encPrivateKey,
      };

      const response = await api.post('/auth/register', registrationData);

      if (!response.data.user?.id || !response.data.user?.publicKey) {
        throw new Error('Dados do usuário incompletos na resposta do servidor');
      }

      setAuthData({
        token: response.data.token,
        privateKey: privateKey,
        user: {
          id: response.data.user.id,
          username: response.data.user.username,
          publicKey: publicKey as PublicKey
        }
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao registrar');
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <UserPlusIcon className="w-12 h-12 text-green-500" />
        <h2 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">Chat E2EE</h2>
      </div>
      {error && <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <Input
          type="password"
          placeholder="Confirmar Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <Button type="submit" className="w-full py-2 text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
          Registrar
        </Button>
      </form>
      <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
        Já tem uma conta?{' '}
        <a href="/login" className="text-green-500 hover:underline">
          Faça login
        </a>
      </p>
    </div>
  );
};

export default RegisterForm;