import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "./components/theme-provider"
import './index.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Groups from './pages/Groups';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/groups" element={<Groups />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}
