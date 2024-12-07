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
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    // Verificar se está bloqueado
    if (lockoutUntil && new Date() < lockoutUntil) {
      const timeLeft = Math.ceil((lockoutUntil.getTime() - new Date().getTime()) / 1000);
      toast({
        variant: "destructive",
        title: "Conta temporariamente bloqueada",
        description: `Tente novamente em ${timeLeft} segundos`
      });
      return;
    }

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
      setLoginAttempts(prev => prev + 1);

      // Após 5 tentativas, bloquear por 5 minutos
      if (loginAttempts >= 4) {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() + 5);
        setLockoutUntil(lockoutTime);
        setLoginAttempts(0);
      }

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
    <Card className="w-full bg-gray-900/70 backdrop-blur-sm border-gray-800 shadow-xl">
      <CardHeader className="space-y-1 pb-2">
        <h2 className="text-2xl font-bold text-center text-white">
          Entrar
        </h2>
        <p className="text-sm text-gray-400 text-center">
          Digite suas credenciais para acessar sua conta
        </p>
      </CardHeader>
      <CardContent className="pb-4">
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
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
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
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Entrar
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-gray-800 pt-4">
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