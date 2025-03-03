import { Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function ChatLayout() {
  const { clearAuth } = useAuth()

  const handleLogout = () => {
    clearAuth()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-300 shadow sticky top-0 z-50">
        <div className="container flex h-14 md:h-16 max-w-screen-2xl items-center px-3 md:px-4">
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Chat E2E</h1>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-1 md:gap-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 text-sm md:text-base"
            >
              <LogOut size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden xs:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}