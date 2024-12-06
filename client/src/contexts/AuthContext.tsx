import { createContext, useContext, useState, useEffect } from 'react'
import { PublicKey, PrivateKey } from '@/utils/elgamal'
import { encryptForLocalStorage, decryptFromLocalStorage } from '@/utils/cryptoUtils'
import { useClerk, useUser } from '@clerk/clerk-react'

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
  const { signOut } = useClerk()
  const { user } = useUser()
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

  // Sincronizar com o estado do Clerk
  useEffect(() => {
    if (!user) {
      clearAuth()
    }
  }, [user])

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

  const clearAuth = async () => {
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

    // Fazer logout também no Clerk
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout no Clerk:', error)
    }
  }

  const contextValue: AuthContextType = {
    ...authState,
    setAuthState: setAuthStateAndPersist,
    clearAuth
  }

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