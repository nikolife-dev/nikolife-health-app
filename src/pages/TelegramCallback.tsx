import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';

export default function TelegramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processTelegramAuth = async () => {
      try {
        console.log('[TG CALLBACK] Начало обработки Telegram авторизации');
        // Получаем параметры от Telegram
        const id = searchParams.get('id');
        const first_name = searchParams.get('first_name');
        const last_name = searchParams.get('last_name');
        const username = searchParams.get('username');
        const photo_url = searchParams.get('photo_url');
        const auth_date = searchParams.get('auth_date');
        const hash = searchParams.get('hash');
        
        console.log('[TG CALLBACK] Параметры:', { id, first_name, username });

        if (!id || !hash) {
          setError('Неверные данные авторизации');
          setIsProcessing(false);
          return;
        }

        // Отправляем данные на backend для проверки и авторизации
        const response = await fetch('https://functions.poehali.dev/5d61e550-4be2-483e-a685-bb7eaaaea724', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            telegram_auth: true,
            id: parseInt(id),
            first_name,
            last_name: last_name || undefined,
            username: username || undefined,
            photo_url: photo_url || undefined,
            auth_date: parseInt(auth_date || '0'),
            hash
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || 'Ошибка авторизации через Telegram');
          setIsProcessing(false);
          return;
        }

        const data = await response.json();
        console.log('[TG CALLBACK] Ответ от backend:', data);

        if (data.success && data.token) {
          localStorage.setItem('auth_token', data.token);
          
          // Небольшая задержка для красоты
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Проверяем последовательность: онбординг → pricing → главная
          const isNewUser = !data.user?.selected_plan;
          const onboardingCompleted = data.user?.onboarding_completed || localStorage.getItem('onboarding_completed') === 'true';
          
          console.log('[TG CALLBACK] Статус пользователя:', { 
            isNewUser, 
            onboardingCompleted, 
            selected_plan: data.user?.selected_plan,
            onboarding_from_db: data.user?.onboarding_completed 
          });
          
          if (isNewUser) {
            // Новый пользователь
            if (!onboardingCompleted) {
              console.log('[TG CALLBACK] Новый пользователь → /onboarding');
              navigate('/onboarding', { replace: true });
            } else {
              console.log('[TG CALLBACK] Новый пользователь с onboarding → /pricing');
              navigate('/pricing', { replace: true });
            }
          } else {
            // Существующий пользователь с выбранным планом
            console.log('[TG CALLBACK] Существующий пользователь → /');
            navigate('/', { replace: true });
          }
        } else {
          setError(data.error || 'Ошибка авторизации через Telegram');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Telegram auth error:', err);
        setError('Произошла ошибка при авторизации');
        setIsProcessing(false);
      }
    };

    processTelegramAuth();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="AlertCircle" size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Ошибка авторизации</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/auth')}
              className="w-full px-4 py-2 bg-[#748c6d] text-white rounded-lg hover:bg-[#5a7052] transition-colors"
            >
              Вернуться к входу
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d] mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Авторизация через Telegram</h2>
          <p className="text-gray-600">Пожалуйста, подождите...</p>
        </div>
      </Card>
    </div>
  );
}