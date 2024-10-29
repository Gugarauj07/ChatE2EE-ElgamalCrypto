import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatHome from './pages/ChatHome';
import Chat from './pages/Chat';
import GroupChat from './pages/GroupChat';
import CreateGroup from './pages/CreateGroup';
import Groups from './pages/Groups';
import { AuthContext } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

const App: React.FC = () => {
  const { token, setAuthFromStorage } = useContext(AuthContext);

  useEffect(() => {
    setAuthFromStorage();
  }, [setAuthFromStorage]);

  return (
    <Router>
      <Routes>
        {/* Rotas de Autenticação */}
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/chat" replace />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to="/chat" replace />} />

        {/* Rotas Protegidas com Layout Principal */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="chat" element={<ChatHome />} />
          <Route path="chat/:userId" element={<Chat />} />
          <Route path="groups" element={<Groups />} />
          <Route path="groups/create" element={<CreateGroup />} />
          <Route path="groups/:groupId" element={<GroupChat />} />
        </Route>

        {/* Redirecionamento padrão */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
