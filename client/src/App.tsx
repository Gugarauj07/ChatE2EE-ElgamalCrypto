import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import Login from './pages/Login'
import Register from './pages/Register'
import ChatLayout from './components/layout/ChatLayout'
import AuthLayout from './components/layout/AuthLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ChatLayout />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
