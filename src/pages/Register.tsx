import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id: number;
            username?: string;
          };
        };
      };
    };
  }
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [telegramData, setTelegramData] = useState<{ telegram_id?: number; telegram_username?: string }>();

  useEffect(() => {
    // Получаем данные из Telegram Web App если доступны
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      setTelegramData({
        telegram_id: user.id,
        telegram_username: user.username
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Пожалуйста, примите условия использования');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.name, formData.email, formData.password, telegramData);
      navigate('/onboarding');
    } catch (err) {
      setError('Ошибка регистрации. Возможно, email уже используется');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#748c6d] to-[#5a7052] rounded-2xl flex items-center justify-center mb-4">
            <Icon name="Heart" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Регистрация</h1>
          <p className="text-gray-600">Создайте аккаунт и начните свой путь к здоровью</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              type="text"
              placeholder="Иван Иванов"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-12"
            />
            <p className="text-xs text-gray-500">Минимум 8 символов</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="h-12"
            />
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, agreeToTerms: checked as boolean })
              }
            />
            <label htmlFor="terms" className="text-sm text-gray-600 leading-tight cursor-pointer">
              Я согласен с{' '}
              <Link to="/terms" className="text-[#748c6d] hover:underline">
                условиями использования
              </Link>{' '}
              и{' '}
              <Link to="/privacy" className="text-[#748c6d] hover:underline">
                политикой конфиденциальности
              </Link>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-lg" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                Создание аккаунта...
              </>
            ) : (
              'Создать аккаунт'
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">или</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full h-12" type="button">
            <Icon name="Mail" size={20} className="mr-2" />
            Зарегистрироваться через Google
          </Button>
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-600">Уже есть аккаунт? </span>
          <Link to="/login" className="text-[#748c6d] hover:text-[#5a7052] font-semibold">
            Войти
          </Link>
        </div>
      </Card>
    </div>
  );
}