import { ElGamal } from '@/utils/elgamal'
import { encryptPrivateKey } from '@/utils/cryptoUtils'

interface AuthResponse {
  token: string
  user: {
    id: string
    username: string
  }
  publicKey: {
    p: string
    g: string
    y: string
  }
  encryptedPrivateKey: string
}

export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8080'

export const authService = {
  async register(username: string, password: string) {
    // Gerar par de chaves ElGamal
    const elgamal = new ElGamal()
    const { publicKey, privateKey } = elgamal

    // Criptografar chave privada com a senha do usuário
    const encryptedPrivateKey = await encryptPrivateKey(privateKey, password)

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        publicKey,
        encryptedPrivateKey
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro no registro')
    }

    return await response.json() as AuthResponse
  },

  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Credenciais inválidas')
    }

    const data = await response.json() as AuthResponse
    return data
  }
}