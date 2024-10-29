import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { register as registerService } from '../services/auth';
import ClipLoader from 'react-spinners/ClipLoader';
import { ElGamal } from '../utils/elgamal';
import { savePrivateKey } from '../services/keyStore';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem!');
      setIsLoading(false);
      return;
    }

    try {
      const elgamal = new ElGamal();
      const { publicKey, privateKey } = elgamal.generateKeys();

      const response = await registerService(username, password, publicKey);
      setSuccess(response.message);

      // Salvar a chave privada no IndexedDB
      await savePrivateKey(response.userId, privateKey, password);

      setAuth(response.token, response.userId, publicKey, privateKey);

      setTimeout(() => {
        navigate('/chat');
      }, 2000);
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.error || 'Erro ao realizar registro');
      } else {
        setError('Erro ao realizar registro. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl mb-4 text-center">Registro</h2>
        {error && (
          <div className="mb-4 text-red-500 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-green-500 text-center">
            {success}
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
        <div className="mb-4">
          <label className="block text-gray-700">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded mt-1"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700">Confirmar Senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded mt-1"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <ClipLoader size={20} color="#ffffff" /> : 'Registrar'}
        </button>
        <p className="mt-4 text-center">
          Já tem uma conta? <Link to="/login" className="text-blue-500">Faça Login</Link>
        </p>
      </form>
    </div>
  );
}
