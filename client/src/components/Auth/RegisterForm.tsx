import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useNavigate } from 'react-router-dom';
import { ElGamal } from '../../utils/elgamal';
import { encryptPrivateKey } from '../../utils/cryptoUtils';

const RegisterForm = () => {
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(password !== confirmPassword){
      setError('As senhas não coincidem');
      return;
    }

    try {
      // Gerar chaves ElGamal
      const elgamal = new ElGamal();
      const { publicKey, privateKey } = elgamal.generateKeys();

      // Criptografar a chave privada com a senha
      const encPrivateKey = await encryptPrivateKey(privateKey, password);

      // Preparar os dados para envio
      const registrationData = {
        username,
        password,
        public_key: publicKey,
        encrypted_private_key: encPrivateKey,
      };

      const response = await api.post('/auth/register', registrationData);

      // Definir os dados de autenticação diretamente
      setAuthData({
        token: response.data.token,
        privateKey: privateKey // Usar a chave privada já gerada
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao registrar');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200">Registro</h2>
      {error && <div className="text-red-500">{error}</div>}
      <Input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Confirmar Senha"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <Button type="submit" className="mt-4">
        Registrar
      </Button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Já tem uma conta?{' '}
        <a href="/login" className="text-blue-500 hover:underline">
          Faça login
        </a>
      </p>
    </form>
  );
};

export default RegisterForm;