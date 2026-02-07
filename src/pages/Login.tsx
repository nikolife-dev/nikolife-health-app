import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

declare global {
  interface Window {
    TelegramLoginWidget: any;
  }
}

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'nikolife_health_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-auth-url', 'https://health.nikolife.ru/auth/telegram/callback');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-12 space-y-8 shadow-2xl">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#748c6d] to-[#5a7052] rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <Icon name="Heart" size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Добро пожаловать</h1>
          <p className="text-lg text-gray-600">Войдите через Telegram для доступа к личному кабинету</p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#748c6d] bg-opacity-10 flex items-center justify-center">
                  <Icon name="Shield" size={16} className="text-[#748c6d]" />
                </div>
                <span>Безопасно</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#748c6d] bg-opacity-10 flex items-center justify-center">
                  <Icon name="Zap" size={16} className="text-[#748c6d]" />
                </div>
                <span>Быстро</span>
              </div>
            </div>
          </div>

          <div 
            id="telegram-login-container" 
            className="flex justify-center items-center min-h-[50px]"
          />

          <div className="bg-[#748c6d] bg-opacity-5 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={18} className="text-[#748c6d] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Как войти:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Нажмите на кнопку входа через Telegram</li>
                  <li>Подтвердите вход в приложении Telegram</li>
                  <li>Вы автоматически попадете в личный кабинет</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Используя Telegram для входа, вы соглашаетесь с{' '}
            <a href="#" className="text-[#748c6d] hover:underline">
              политикой конфиденциальности
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}