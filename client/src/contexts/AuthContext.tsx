import { createContext, useContext, useState } from 'react'
import { PublicKey, PrivateKey } from '@/utils/elgamal'

interface AuthState {
  userId: string | null
  publicKey: PublicKey | null
  privateKey: PrivateKey | null
  setAuthState: (userId: string, publicKey: PublicKey, privateKey: PrivateKey) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [privateKey, setPrivateKey] = useState<PrivateKey | null>(null)

  const setAuthState = (
    userId: string,
    publicKey: PublicKey,
    privateKey: PrivateKey
  ) => {
    setUserId(userId)
    setPublicKey(publicKey)
    setPrivateKey(privateKey)
  }

  const clearAuth = () => {
    setUserId(null)
    setPublicKey(null)
    setPrivateKey(null)
  }

  return (
    <AuthContext.Provider
      value={{
        userId,
        publicKey,
        privateKey,
        setAuthState,
        clearAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}