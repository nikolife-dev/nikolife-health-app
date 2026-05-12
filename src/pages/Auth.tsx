import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';

declare global {
  interface Window {
    TelegramLoginWidget: unknown;
  }
}

type AuthMode = 'login' | 'register' | 'reset';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const { logs, clearLogs, logInfo, logSuccess, logError, logWarning } = useLiveLogs();
  
  // Определяем режим из URL
  const getInitialMode = (): AuthMode => {
    if (location.pathname === '/register') return 'register';
    if (location.pathname === '/login') return 'login';
    return 'login';
  };
  
  const [mode, setMode] = useState<AuthMode>(getInitialMode());
  const [authMethod, setAuthMethod] = useState<'telegram' | 'email'>('telegram');
  const [isLoading, setIsLoading] = useState(false);
  
  // Логируем загрузку страницы Auth
  useEffect(() => {
    console.log('[AUTH PAGE] Страница загружена, path:', location.pathname, 'mode:', mode);
    logInfo(`Страница авторизации загружена: ${location.pathname}, режим: ${mode}`);
  }, []);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load Telegram widget
  useEffect(() => {
    if (authMethod === 'telegram') {
      logInfo('Загрузка Telegram виджета...');
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'nikolife_health_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-auth-url', 'https://with-nikolife.com/auth/telegram/callback');
      script.setAttribute('data-request-access', 'write');
      script.async = true;

      const container = document.getElementById('telegram-login-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(script);
        logSuccess('Telegram виджет добавлен в DOM');
      } else {
        logWarning('Контейнер telegram-login-container не найден');
      }

      return () => {
        if (container) {
          container.innerHTML = '';
          logInfo('Telegram виджет очищен');
        }
      };
    }
  }, [authMethod]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AUTH] handleEmailAuth вызван, mode:', mode, 'email:', email);
    setIsLoading(true);
    logInfo(`Начало авторизации: mode=${mode}, email=${email}`);

    try {
      if (mode === 'register') {
        // Регистрация
        if (password !== confirmPassword) {
          logError('Пароли не совпадают');
          toast({
            title: 'Ошибка',
            description: 'Пароли не совпадают',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        logInfo('Отправка запроса регистрации...');
        const response = await fetch('https://functions.poehali.dev/d33a823e-854d-4bbe-be97-af580ba01a06', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        logInfo(`Получен ответ: status=${response.status}`);
        const data = await response.json();
        logInfo(`Данные ответа: ${JSON.stringify(data).substring(0, 100)}...`);

        if (!response.ok || !data.success) {
          logError(`Ошибка регистрации: ${data.error || 'неизвестная ошибка'}`);
          throw new Error(data.error || 'Ошибка регистрации');
        }

        logSuccess('Регистрация успешна, сохранение токена...');
        console.log('[AUTH] Регистрация успешна, токен:', data.token);
        localStorage.setItem('auth_token', data.token);
        
        // КРИТИЧНО: обновляем контекст ПЕРЕД navigate!
        console.log('[AUTH] Вызов refreshUser() для обновления контекста...');
        logInfo('Обновление контекста пользователя...');
        await refreshUser();
        console.log('[AUTH] Контекст обновлён!');
        
        toast({
          title: 'Успешно!',
          description: 'Регистрация прошла успешно',
        });
        
        // Правильная последовательность: онбординг → pricing → главная
        const hasPlan = !!data.user?.selected_plan;
        const onboardingCompleted = data.user?.onboarding_completed === true;
        
        console.log('[AUTH] Проверка статуса:', { hasPlan, onboardingCompleted, user: data.user });
        logInfo(`Статус: hasPlan=${hasPlan}, onboardingCompleted=${onboardingCompleted}`);
        
        if (hasPlan) {
          console.log('[AUTH] Редирект на / (план выбран)');
          logInfo('Переход на главную (план выбран)');
          navigate('/', { replace: true });
        } else if (onboardingCompleted) {
          console.log('[AUTH] Редирект на /pricing (онбординг пройден)');
          logInfo('Переход на /pricing (онбординг пройден, план не выбран)');
          navigate('/pricing', { replace: true });
        } else {
          console.log('[AUTH] Редирект на /onboarding (новый пользователь)');
          logInfo('Переход на /onboarding (новый пользователь)');
          navigate('/onboarding', { replace: true });
        }
        console.log('[AUTH] navigate() вызван');

      } else if (mode === 'login') {
        // Вход
        logInfo('Отправка запроса на вход...');
        const response = await fetch('https://functions.poehali.dev/d33a823e-854d-4bbe-be97-af580ba01a06', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        logInfo(`Получен ответ: status=${response.status}`);
        const data = await response.json();
        logInfo(`Данные ответа: ${JSON.stringify(data).substring(0, 100)}...`);

        if (!response.ok || !data.success) {
          logError(`Ошибка входа: ${data.error || 'неверные данные'}`);
          throw new Error(data.error || 'Неверный email или пароль');
        }

        logSuccess('Вход успешен, сохранение токена...');
        console.log('[AUTH] Вход успешен, токен:', data.token);
        localStorage.setItem('auth_token', data.token);
        
        // КРИТИЧНО: обновляем контекст ПЕРЕД navigate!
        console.log('[AUTH] Вызов refreshUser() для обновления контекста...');
        logInfo('Обновление контекста пользователя...');
        await refreshUser();
        console.log('[AUTH] Контекст обновлён!');
        
        toast({
          title: 'Успешно!',
          description: 'Вы вошли в систему',
        });
        
        // Правильная последовательность: онбординг → pricing → главная
        const hasPlan = !!data.user?.selected_plan;
        const onboardingCompleted = data.user?.onboarding_completed === true;
        
        console.log('[AUTH] Проверка статуса:', { hasPlan, onboardingCompleted, user: data.user });
        logInfo(`Статус: hasPlan=${hasPlan}, onboardingCompleted=${onboardingCompleted}`);
        
        if (hasPlan) {
          console.log('[AUTH] Редирект на / (план выбран)');
          logInfo('Переход на главную (план выбран)');
          navigate('/', { replace: true });
        } else if (onboardingCompleted) {
          console.log('[AUTH] Редирект на /pricing (онбординг пройден)');
          logInfo('Переход на /pricing (онбординг пройден, план не выбран)');
          navigate('/pricing', { replace: true });
        } else {
          console.log('[AUTH] Редирект на /onboarding (онбординг не пройден)');
          logInfo('Переход на /onboarding (онбординг не пройден)');
          navigate('/onboarding', { replace: true });
        }
        console.log('[AUTH] navigate() вызван');

      } else if (mode === 'reset') {
        // Восстановление пароля
        logInfo('Отправка инструкций для восстановления пароля');
        toast({
          title: 'Инструкции отправлены',
          description: 'Проверьте вашу почту для восстановления пароля',
        });
        setMode('login');
      }

    } catch (error) {
      logError(`Критическая ошибка: ${error instanceof Error ? error.message : 'неизвестная'}`);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Произошла ошибка',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailForm = () => (
    <form onSubmit={handleEmailAuth} className="space-y-4">
      {mode === 'register' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            required
            disabled={isLoading}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={isLoading}
        />
      </div>

      {mode !== 'reset' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
        </div>
      )}

      {mode === 'register' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-[#748c6d] hover:bg-[#5a7052]"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
            Загрузка...
          </>
        ) : mode === 'login' ? (
          'Войти'
        ) : mode === 'register' ? (
          'Зарегистрироваться'
        ) : (
          'Отправить инструкции'
        )}
      </Button>

      <div className="text-center space-y-2 text-sm">
        {mode === 'login' && (
          <>
            <button
              type="button"
              onClick={() => setMode('reset')}
              className="text-[#748c6d] hover:underline block w-full"
            >
              Забыли пароль?
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className="text-gray-600 hover:text-gray-900 block w-full"
            >
              Нет аккаунта? <span className="text-[#748c6d] font-semibold">Регистрация</span>
            </button>
          </>
        )}

        {mode === 'register' && (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-gray-600 hover:text-gray-900 block w-full"
          >
            Уже есть аккаунт? <span className="text-[#748c6d] font-semibold">Войти</span>
          </button>
        )}

        {mode === 'reset' && (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-[#748c6d] hover:underline block w-full"
          >
            Вернуться к входу
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#748c6d] to-[#5a7052] rounded-2xl flex items-center justify-center shadow-lg">
            <Icon name="Heart" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'login' ? 'Добро пожаловать' : mode === 'register' ? 'Регистрация' : 'Восстановление пароля'}
          </h1>
          <p className="text-gray-600">
            {mode === 'login'
              ? 'Войдите в личный кабинет'
              : mode === 'register'
              ? 'Создайте новый аккаунт'
              : 'Введите ваш email для восстановления'}
          </p>
        </div>

        {/* Auth Method Toggle */}
        {mode !== 'reset' && (
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setAuthMethod('telegram')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                authMethod === 'telegram'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon name="MessageCircle" className="inline mr-2 h-4 w-4" />
              Telegram
            </button>
            <button
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                authMethod === 'email'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon name="Mail" className="inline mr-2 h-4 w-4" />
              Email
            </button>
          </div>
        )}

        {/* Auth Content */}
        <div className="space-y-4">
          {authMethod === 'telegram' && mode !== 'reset' ? (
            <>
              <div
                id="telegram-login-container"
                className="flex justify-center items-center min-h-[50px]"
              />

              <div className="bg-[#748c6d] bg-opacity-5 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="Info" size={18} className="text-[#748c6d] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">Вход через Telegram:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600">
                      <li>Нажмите на кнопку входа</li>
                      <li>Подтвердите в приложении Telegram</li>
                      <li>Автоматически попадете в кабинет</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">или используйте email</span>
                </div>
              </div>

              <Button
                onClick={() => setAuthMethod('email')}
                variant="outline"
                className="w-full"
              >
                <Icon name="Mail" className="mr-2 h-4 w-4" />
                Войти через Email
              </Button>
            </>
          ) : (
            renderEmailForm()
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Используя сервис, вы соглашаетесь с{' '}
            <a href="#" className="text-[#748c6d] hover:underline">
              политикой конфиденциальности
            </a>
          </p>
        </div>
      </Card>

      <LiveLogs logs={logs} onClear={clearLogs} position="inline" />
    </div>
  );
}