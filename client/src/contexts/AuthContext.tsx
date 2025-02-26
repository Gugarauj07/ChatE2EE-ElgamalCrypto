import { createContext, useContext, useState, useEffect } from 'react'
import { PublicKey, PrivateKey } from '@/utils/elgamal'
import { encryptForLocalStorage, decryptFromLocalStorage } from '@/utils/cryptoUtils'
import { websocketService } from '@/services/websocketService'

interface AuthState {
  userId: string | null
  publicKey: PublicKey | null
  privateKey: PrivateKey | null
  token: string | null
}

interface AuthContextType extends AuthState {
  setAuthState: (userId: string, publicKey: PublicKey, privateKey: PrivateKey, token: string) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem('token')
    const encryptedPrivateKey = localStorage.getItem('encryptedPrivateKeyLocal')

    if (token && encryptedPrivateKey) {
      decryptFromLocalStorage(encryptedPrivateKey)
        .then(privateKeyStr => {
          const privateKey = JSON.parse(privateKeyStr) as PrivateKey
          setAuthState(prev => ({ ...prev, privateKey }))
        })
        .catch(console.error)
    }

    return {
      userId: localStorage.getItem('userId'),
      publicKey: JSON.parse(localStorage.getItem('publicKey') || 'null'),
      privateKey: null,
      token
    }
  })

  const setAuthStateAndPersist = async (
    userId: string,
    publicKey: PublicKey,
    privateKey: PrivateKey,
    token: string
  ) => {
    const encryptedPrivateKeyLocal = await encryptForLocalStorage(
      JSON.stringify(privateKey)
    )

    localStorage.setItem('userId', userId)
    localStorage.setItem('publicKey', JSON.stringify(publicKey))
    localStorage.setItem('token', token)
    localStorage.setItem('encryptedPrivateKeyLocal', encryptedPrivateKeyLocal)

    setAuthState({
      userId,
      publicKey,
      privateKey,
      token
    })
  }

  const clearAuth = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('publicKey')
    localStorage.removeItem('token')
    localStorage.removeItem('encryptedPrivateKeyLocal')

    setAuthState({
      userId: null,
      publicKey: null,
      privateKey: null,
      token: null
    })
  }

  const contextValue: AuthContextType = {
    ...authState,
    setAuthState: setAuthStateAndPersist,
    clearAuth
  }

  useEffect(() => {
    if (authState.userId) {
      websocketService.connect(authState.userId)
    }

    return () => {
      websocketService.disconnect()
    }
  }, [authState.userId])

  return (
    <AuthContext.Provider value={contextValue}>
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
