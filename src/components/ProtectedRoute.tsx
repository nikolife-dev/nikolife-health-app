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

  // Проверяем последовательность: онбординг → pricing → главная
  const onboardingCompleted = user?.onboarding_completed === true;
  const hasPlan = !!user?.selected_plan;
  
  console.log('[PROTECTED ROUTE]', {
    path: location.pathname,
    user_id: user?.id,
    onboarding_completed: onboardingCompleted,
    selected_plan: user?.selected_plan,
    hasPlan,
    requiresPlan
  });
  
  // ВАЖНО: Если план уже выбран, пропускаем проверки онбординга
  // Это позволяет пользователям с планом попадать сразу на главную
  if (hasPlan) {
    console.log('[PROTECTED ROUTE] План выбран, доступ разрешен');
    return <>{children}</>;
  }
  
  // Если план НЕ выбран, проверяем онбординг
  // Если не прошел онбординг и это не страница онбординга
  if (!onboardingCompleted && location.pathname !== '/onboarding') {
    console.log('[PROTECTED ROUTE] Редирект на /onboarding (не пройден)');
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // Если онбординг пройден, но тариф не выбран, и это не /pricing
  if (onboardingCompleted && !hasPlan && location.pathname !== '/pricing') {
    console.log('[PROTECTED ROUTE] Редирект на /pricing (нет плана)');
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  // Если требуется тариф и он не выбран
  if (requiresPlan && !hasPlan) {
    console.log('[PROTECTED ROUTE] Редирект на /pricing (requiresPlan)');
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }
  
  console.log('[PROTECTED ROUTE] Доступ разрешен к', location.pathname);

  return <>{children}</>;
}