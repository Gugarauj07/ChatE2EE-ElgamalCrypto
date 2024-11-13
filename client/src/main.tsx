import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ContactProvider } from './contexts/ContactContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ContactProvider>
        <App />
      </ContactProvider>
    </AuthProvider>
  </React.StrictMode>,
)
