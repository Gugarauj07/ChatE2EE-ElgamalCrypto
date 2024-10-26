import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';
import { ElGamal, PrivateKey } from '../utils/elgamal';
import { AuthContext } from '../contexts/AuthContext';
import { getPrivateKey } from '../services/keyStore';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await login(username, password);
      const { token, userId, publicKey } = response;

      // Recuperar a chave privada criptografada do IndexedDB
      const encryptedPrivateKey = await getPrivateKey(userId, password);
      if (!encryptedPrivateKey) {
        setError('Chave privada não encontrada. Por favor, registre-se novamente.');
        return;
      }

      // Desencriptar a chave privada usando a senha
      // (A função getPrivateKey já realiza o processo de descriptografia)
      const privateKey = encryptedPrivateKey;

      setAuth(token, userId, publicKey, privateKey);
      navigate('/chat');
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.error || 'Erro ao realizar login');
      } else {
        setError('Erro ao realizar login. Tente novamente mais tarde.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
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
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Entrar
        </button>
        <p className="mt-4 text-center">
          Não tem uma conta? <Link to="/register" className="text-blue-500">Registre-se</Link>
        </p>
      </form>
    </div>
  );
}
