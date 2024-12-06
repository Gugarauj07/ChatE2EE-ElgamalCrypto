import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { decryptPrivateKey } from '@/utils/cryptoUtils'
import { useSignIn } from '@clerk/clerk-react'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

export default function Login() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setAuthState } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    try {
      // Autenticar com Clerk
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (result.status === "complete") {
        // Após autenticação bem sucedida no Clerk, buscar dados do nosso backend
        const response = await authService.login(emailAddress, password)

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

        // Ativar a sessão no Clerk
        await setActive({ session: result.createdSessionId })

        navigate('/')
      } else {
        throw new Error("Erro na autenticação")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Verifique suas credenciais e tente novamente."
      })
    }
  }

  if (!isLoaded) {
    return null
  }

  return (
    <Card className="bg-black/40 backdrop-blur-sm border-gray-800">
      <CardHeader>
        <h2 className="text-2xl font-semibold text-center text-white">
          Entrar
        </h2>
        <p className="text-gray-400 text-center">
          Digite suas credenciais para acessar sua conta
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-200">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              required
              className="bg-gray-900/50 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-900/50 border-gray-700 text-white"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Entrar
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          variant="link"
          onClick={() => navigate('/register')}
          className="text-blue-400 hover:text-blue-300"
        >
          Não tem uma conta? Registre-se
        </Button>
      </CardFooter>
    </Card>
  )
}