import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { decryptPrivateKey } from '@/utils/cryptoUtils'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setAuthState } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: "As senhas não coincidem"
      })
      return
    }

    try {
      const response = await authService.register(username, password)

      // Descriptografar a chave privada
      const privateKey = await decryptPrivateKey(
        response.encryptedPrivateKey,
        password
      )

      // Atualizar o contexto
      setAuthState(
        response.user.id,
        response.publicKey,
        privateKey,
        response.token
      )

      toast({
        title: "Registro realizado com sucesso!",
        description: "Bem-vindo ao Chat E2E"
      })

      navigate('/')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: "Não foi possível criar sua conta. Tente novamente."
      })
    }
  }

  return (
    <Card className="w-full bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-md rounded-lg shadow-lg p-6">
      <CardHeader className="space-y-1">
        <h2 className="text-2xl font-bold text-center text-white">Criar conta</h2>
        <p className="text-sm text-white/80 text-center">
          Preencha os dados abaixo para criar sua conta
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Username</Label>
            <Input
              id="username"
              placeholder="Escolha um username único"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Criar conta
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={() => navigate('/login')} className="text-white underline">
          Já tem uma conta? Faça login
        </Button>
      </CardFooter>
    </Card>
  )
}