import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { decryptPrivateKey } from '@/utils/cryptoUtils'
import { useSignUp } from '@clerk/clerk-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

export default function Register() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setAuthState } = useAuth()

  // Primeiro passo: Registro no Clerk
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    try {
      // Iniciar processo de signup no Clerk
      await signUp.create({
        emailAddress,
        password,
      })

      // Iniciar verificação de email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setPendingVerification(true)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: "Não foi possível criar sua conta. Tente novamente."
      })
    }
  }

  // Segundo passo: Verificação e geração das chaves ElGamal
  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    try {
      // Verificar código de email
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status !== "complete") {
        throw new Error("Erro na verificação do email")
      }

      // Após verificação bem sucedida, gerar chaves ElGamal
      const response = await authService.register(emailAddress, password)

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

      // Ativar a sessão no Clerk
      await setActive({ session: completeSignUp.createdSessionId })

      toast({
        title: "Registro realizado com sucesso!",
        description: "Bem-vindo ao Chat E2E"
      })

      navigate('/')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: "Código inválido ou erro ao gerar chaves."
      })
    }
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
              Criar conta
            </Button>
          </form>
        ) : (
          <form onSubmit={onPressVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-white">Código de Verificação</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="bg-gray-800 text-white border border-gray-700"
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