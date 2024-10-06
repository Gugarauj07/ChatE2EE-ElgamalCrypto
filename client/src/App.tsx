import { ThemeProvider } from "./components/theme-provider"
import Setup from './pages/Setup';
import './index.css';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground">
        <Setup />
      </div>
    </ThemeProvider>
  )
}