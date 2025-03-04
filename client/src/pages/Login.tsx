import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { decryptPrivateKey } from '@/utils/cryptoUtils'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { EncryptedLoading } from '@/components/ui/encrypted-loading'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setAuthState } = useAuth()
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verificar se está bloqueado
    if (lockoutUntil && new Date() < lockoutUntil) {
      const timeLeft = Math.ceil((lockoutUntil.getTime() - new Date().getTime()) / 1000)
      toast({
        variant: "destructive",
        title: "Conta temporariamente bloqueada",
        description: `Tente novamente em ${timeLeft} segundos`
      })
      return
    }

    try {
      setIsLoading(true)
      // Autenticar com o backend personalizado
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

      navigate('/')
    } catch (error: any) {
      setLoginAttempts(prev => prev + 1)

      // Após 5 tentativas, bloquear por 5 minutos
      if (loginAttempts >= 4) {
        const lockoutTime = new Date()
        lockoutTime.setMinutes(lockoutTime.getMinutes() + 5)
        setLockoutUntil(lockoutTime)
        setLoginAttempts(0)
      }

      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Verifique suas credenciais e tente novamente."
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full bg-gray-900/70 backdrop-blur-sm border-gray-800 shadow-xl">
        <CardContent>
          <EncryptedLoading text="Entrando" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900/70 backdrop-blur-sm border-gray-800 shadow-xl">
      <CardHeader className="space-y-1 pb-2">
        <h2 className="text-xl md:text-2xl font-bold text-center text-white">
          Entrar
        </h2>
        <p className="text-xs md:text-sm text-gray-400 text-center">
          Digite suas credenciais para acessar sua conta
        </p>
      </CardHeader>
      <CardContent className="pb-4 px-4 md:px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-200 text-sm md:text-base">Usuário</Label>
            <Input
              id="username"
              type="text"
              placeholder="seu_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 text-sm md:text-base h-9 md:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200 text-sm md:text-base">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 pr-10 text-sm md:text-base h-9 md:h-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-sm md:text-base py-2 h-9 md:h-10"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-gray-800 pt-4 px-4 md:px-6">
        <Button
          variant="link"
          onClick={() => navigate('/register')}
          className="text-blue-400 hover:text-blue-300 text-sm md:text-base"
        >
          Não tem uma conta? Registre-se
        </Button>
      </CardFooter>
    </Card>
  )
}