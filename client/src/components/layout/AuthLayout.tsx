import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Chat E2E</h1>
          <p className="text-white/80">Mensagens seguras com criptografia ElGamal</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}