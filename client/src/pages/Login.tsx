import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { decryptPrivateKey } from '@/utils/cryptoUtils'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setAuthState } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await authService.login(username, password)

      // Descriptografar a chave privada
      const privateKey = await decryptPrivateKey(
        response.encryptedPrivateKey,
        password
      )

      // Atualizar o contexto com as informações necessárias
      await setAuthState(
        response.user.id,
        response.publicKey,
        privateKey,
        response.token
      )

      // Aguardar um tick para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 0))

      navigate('/')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Verifique suas credenciais e tente novamente."
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="username" className="block text-white text-sm font-medium mb-1">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="seu_username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        />
      </div>
      <div>
        <Label htmlFor="password" className="block text-white text-sm font-medium mb-1">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        />
      </div>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition duration-200">
        Entrar
      </Button>
      <div className="text-center">
        <Button variant="link" onClick={() => navigate('/register')} className="text-white underline">
          Não tem uma conta? Registre-se
        </Button>
      </div>
    </form>
  )
}