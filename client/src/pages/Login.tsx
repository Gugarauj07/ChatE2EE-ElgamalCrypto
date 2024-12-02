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
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        <p className="text-sm text-muted-foreground text-center">
          Entre com suas credenciais para acessar sua conta
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="seu_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={() => navigate('/register')}>
          Não tem uma conta? Registre-se
        </Button>
      </CardFooter>
    </Card>
  )
}