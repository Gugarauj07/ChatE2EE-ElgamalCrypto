import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import useAuth from './hooks/useAuth';
import { ContactProvider } from './contexts/ContactContext';
import { ConversationProvider } from './contexts/ConversationContext';

const App = () => {
  const { token } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={
            token ? (
              <ContactProvider>
                <ConversationProvider>
                  <Dashboard />
                </ConversationProvider>
              </ContactProvider>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
