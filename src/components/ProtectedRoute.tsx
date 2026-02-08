import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/icon';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPlan?: boolean;
}

export default function ProtectedRoute({ children, requiresPlan = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Если требуется тариф и он не выбран, редиректим на страницу тарифов
  if (requiresPlan && !user?.selected_plan) {
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}