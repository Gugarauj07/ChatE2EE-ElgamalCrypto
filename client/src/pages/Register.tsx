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

export default function Register() {
  const [emailAddress, setEmailAddress] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setAuthState } = useAuth()
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [usernameErrors, setUsernameErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
      setIsLoading(true)
      // Validar senha e username antes de prosseguir
      const passwordErrs = validatePassword(password)
      const usernameErrs = validateUsername(username)

      if (passwordErrs.length > 0 || usernameErrs.length > 0) {
        setPasswordErrors(passwordErrs)
        setUsernameErrors(usernameErrs)
        return
      }

      // Registrar via backend personalizado
      const response = await authService.register(emailAddress, username, password)

      // Se seu backend requer verificação de email, ajuste a lógica aqui
      setPendingVerification(true)
      toast({
        title: "Registro realizado com sucesso!",
        description: "Um código de verificação foi enviado para seu email."
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde."
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função de verificação de email (se aplicável)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    try {
      setIsLoading(true)
      // Verificar o código de verificação com o backend
      const response = await authService.verifyEmail(emailAddress, code)

      // Descriptografar a chave privada
      const privateKey = await decryptPrivateKey(
        response.encryptedPrivateKey,
        password
      )

      // Atualizar o contexto com as informações do usuário
      await setAuthState(
        response.user.id,
        response.publicKey,
        privateKey,
        response.token
      )

      toast({
        title: "Registro completo!",
        description: "Bem-vindo ao Chat E2E"
      })

      navigate('/')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: error instanceof Error ? error.message : "Código inválido ou erro ao verificar."
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full bg-gray-900/70 backdrop-blur-sm border-gray-800 shadow-xl">
        <CardContent>
          <EncryptedLoading text={pendingVerification ? "Verificando Email" : "Registrando"} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-gray-900/70 backdrop-blur-sm border-gray-800 shadow-xl">
      <CardHeader className="space-y-1 pb-2">
        <h2 className="text-2xl font-bold text-center text-white">Criar conta</h2>
        <p className="text-sm text-gray-400 text-center">
          {!pendingVerification
            ? "Preencha os dados abaixo para criar sua conta"
            : "Digite o código enviado ao seu email"}
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        {!pendingVerification ? (
          <form onSubmit={handleRegister} className="space-y-4">
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
              <Label htmlFor="username" className="text-gray-200">Nome de usuário</Label>
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
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
              {usernameErrors.length > 0 && (
                <div className="text-sm text-red-400 mt-2">
                  <ul className="list-disc list-inside">
                    {usernameErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordErrors(validatePassword(e.target.value))
                }}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
              {passwordErrors.length > 0 && (
                <div className="text-sm text-red-400 mt-2">
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Criar conta"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-white">Código de Verificação</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Verificar Email
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t border-gray-800 pt-4">
        <Button
          variant="link"
          onClick={() => navigate('/login')}
          className="text-blue-400 hover:text-blue-300"
        >
          Já tem uma conta? Faça login
        </Button>
      </CardFooter>
    </Card>
  )
}