import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  // Aguarda carregar a sessão antes de decidir (evita redirect prematuro)
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-flixon-bg">
        <Spinner label="Verificando sessão..." />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-flixon-bg">
        <Spinner label="Carregando..." />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
