import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute() {
  const { userId } = useAuth()

  // Se não houver userId, redireciona para o login
  if (!userId) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}