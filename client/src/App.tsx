import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from "./components/theme-provider"
import Setup from './pages/Setup';
import Chat from './pages/Chat';
import './index.css';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<Setup />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}