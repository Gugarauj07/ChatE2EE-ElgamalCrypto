import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth';
import { ElGamal } from '../utils/elgamal';
import { AuthContext } from '../contexts/AuthContext';
import { savePrivateKey } from '../services/keyStore';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    try {
      // Instanciar ElGamal e gerar chaves
      const elgamal = new ElGamal();
      const { publicKey, privateKey } = elgamal.generateKeys();

      const response = await register(username, password, publicKey);
      setSuccess(response.message);

      // Salvar a chave privada criptografada no IndexedDB usando a senha
      await savePrivateKey(response.userId, privateKey, password);

      // Armazenar as chaves no contexto (não no localStorage)
      setAuth(response.token, response.userId, publicKey, privateKey);

      // Redirecionar para a página de login após o registro bem-sucedido
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      if (err.response) {
        // Erro retornado pelo servidor
        setError(err.response.data.error || 'Erro ao realizar registro');
      } else {
        // Erro de rede ou outro
        setError('Erro ao realizar registro. Tente novamente mais tarde.');
      }
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
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          Registrar
        </button>
        <p className="mt-4 text-center">
          Já tem uma conta? <Link to="/" className="text-blue-500">Faça Login</Link>
        </p>
      </form>
    </div>
  );
}
