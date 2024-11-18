import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ContactProvider } from './contexts/ContactContext.tsx'
import { ConversationProvider } from './contexts/ConversationContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ContactProvider>
        <ConversationProvider>
          <App />
        </ConversationProvider>
      </ContactProvider>
    </AuthProvider>
  </React.StrictMode>,
)
