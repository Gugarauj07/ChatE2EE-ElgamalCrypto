import { Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function ChatLayout() {
  const { clearAuth } = useAuth()

  const handleLogout = () => {
    clearAuth()
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Chat E2E</h1>
        <Button variant="ghost" onClick={handleLogout}>
          Sair
        </Button>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}