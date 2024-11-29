import { ElGamal } from '@/utils/elgamal'
import { encryptPrivateKey } from '@/utils/cryptoUtils'

interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
  publicKey: string
  encryptedPrivateKey: string
}

export const authService = {
  async register(email: string, password: string, name: string) {
    // Gerar par de chaves ElGamal
    const elgamal = new ElGamal()
    const { publicKey, privateKey } = elgamal

    // Criptografar chave privada com a senha do usuário
    const encryptedPrivateKey = await encryptPrivateKey(privateKey, password)

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        publicKey,
        encryptedPrivateKey
      })
    })

    if (!response.ok) {
      throw new Error('Erro no registro')
    }

    return await response.json() as AuthResponse
  },

  async login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      throw new Error('Credenciais inválidas')
    }

    return await response.json() as AuthResponse
  }
}