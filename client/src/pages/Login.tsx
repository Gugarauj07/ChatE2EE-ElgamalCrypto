import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { login as loginService } from '../services/auth';
import ClipLoader from 'react-spinners/ClipLoader';
import { getPrivateKey } from '../services/keyStore';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginService(username, password);
      const { token, userId, publicKey } = response;

      // Recuperar a chave privada do IndexedDB
      const privateKey = await getPrivateKey(userId, password);
      if (!privateKey) {
        setError('Chave privada não encontrada. Por favor, registre-se novamente.');
        setIsLoading(false);
        return;
      }

      setAuth(token, userId, publicKey, privateKey);
      navigate('/chat');
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.error || 'Erro ao realizar login');
      } else {
        setError('Erro ao realizar login. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl mb-4 text-center">Login</h2>
        {error && (
          <div className="mb-4 text-red-500 text-center">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700">Nome de Usuário</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded mt-1"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded mt-1"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <ClipLoader size={20} color="#ffffff" /> : 'Entrar'}
        </button>
        <p className="mt-4 text-center">
          Não tem uma conta? <Link to="/register" className="text-blue-500">Registre-se</Link>
        </p>
      </form>
    </div>
  );
}
