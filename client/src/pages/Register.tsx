import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { keyGenService } from '@/services/keyGenService'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { EncryptedLoading } from '@/components/ui/encrypted-loading'
import { Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setAuthState } = useAuth()
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [usernameErrors, setUsernameErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'form' | 'generating' | 'submitting'>('form')

  // Inicia o processo de geração de chaves quando o componente é montado
  useEffect(() => {
    // Limpar o worker quando o componente for desmontado
    return () => {
      keyGenService.terminate();
    };
  }, []);

  // Função de validação de senha
  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const errors = []
    if (password.length < minLength) errors.push(`Mínimo de ${minLength} caracteres`)
    if (!hasUpperCase) errors.push("Uma letra maiúscula")
    if (!hasLowerCase) errors.push("Uma letra minúscula")
    if (!hasNumbers) errors.push("Um número")
    if (!hasSpecialChar) errors.push("Um caractere especial")

    return errors
  }

  // Função de validação de username
  const validateUsername = (username: string) => {
    const minLength = 3
    const maxLength = 20
    const validFormat = /^[a-zA-Z0-9_]+$/.test(username)

    const errors = []
    if (username.length < minLength) errors.push(`Mínimo de ${minLength} caracteres`)
    if (username.length > maxLength) errors.push(`Máximo de ${maxLength} caracteres`)
    if (!validFormat) errors.push("Apenas letras, números e underscore")

    return errors
  }

  // Função de registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    try {
      // Mostrar loading imediatamente
      setIsLoading(true)

      // Validar senha e username antes de prosseguir
      const passwordErrs = validatePassword(password)
      const usernameErrs = validateUsername(username)

      if (passwordErrs.length > 0 || usernameErrs.length > 0) {
        setPasswordErrors(passwordErrs)
        setUsernameErrors(usernameErrs)
        setIsLoading(false) // Desliga o loading se houver erros de validação
        return
      }

      // Alterar para o passo de geração de chaves
      setStep('generating');

      // Gerar chaves em segundo plano usando Web Worker
      const { publicKey, privateKey, encryptedPrivateKey } = await keyGenService.generateKeysAsync(password);

      // Alterar para o passo de submissão ao servidor
      setStep('submitting');

      // Registrar via backend personalizado
      const response = await authService.registerWithKeys(
        username,
        password,
        publicKey,
        encryptedPrivateKey
      );

      // Atualizar o contexto com as informações do usuário
      await setAuthState(
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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde."
      })
      setIsLoading(false) // Garantir que o loading seja desligado em caso de erro
      setStep('form');
    }
  }

  // Renderiza a tela de loading apropriada dependendo do passo atual
  if (isLoading) {
    return (
      <Card className="w-full bg-gray-900/70 backdrop-blur-sm border-gray-800 shadow-xl">
        <CardContent>
          {step === 'generating' && (
            <EncryptedLoading text="Gerando chaves" />
          )}
          {step === 'submitting' && (
            <EncryptedLoading text="Registrando" />
          )}
          {step === 'form' && (
            <EncryptedLoading text="Processando" />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900/70 backdrop-blur-sm border-gray-800 shadow-xl">
      <CardHeader className="space-y-1 pb-2">
        <h2 className="text-xl md:text-2xl font-bold text-center text-white">Criar conta</h2>
        <p className="text-xs md:text-sm text-gray-400 text-center">
          Preencha os dados abaixo para criar sua conta
        </p>
      </CardHeader>
      <CardContent className="pb-4 px-4 md:px-6">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-200 text-sm md:text-base">Nome de usuário</Label>
            <Input
              id="username"
              type="text"
              placeholder="seu_username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setUsernameErrors(validateUsername(e.target.value))
              }}
              required
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 text-sm md:text-base h-9 md:h-10"
            />
            {usernameErrors.length > 0 && (
              <div className="text-xs md:text-sm text-red-400 mt-2">
                <ul className="list-disc list-inside">
                  {usernameErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200 text-sm md:text-base">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordErrors(validatePassword(e.target.value))
                }}
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
            {passwordErrors.length > 0 && (
              <div className="text-xs md:text-sm text-red-400 mt-2">
                <p>A senha deve conter:</p>
                <ul className="list-disc list-inside">
                  {passwordErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-sm md:text-base py-2 h-9 md:h-10"
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "Criar conta"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-gray-800 pt-4 px-4 md:px-6">
        <Button
          variant="link"
          onClick={() => navigate('/login')}
          className="text-blue-400 hover:text-blue-300 text-sm md:text-base"
        >
          Já tem uma conta? Faça login
        </Button>
      </CardFooter>
    </Card>
  )
}