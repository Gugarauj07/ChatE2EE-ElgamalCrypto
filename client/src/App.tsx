import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from "./components/theme-provider"
import './index.css';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>

      </Router>
    </ThemeProvider>
  )
}