import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import funcUrls from '../../backend/func2url.json';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { planId, planName, price, isYearly } = location.state || {};

  const [isProcessing, setIsProcessing] = useState(false);

  if (!planId || !planName || !price) {
    navigate('/pricing');
    return null;
  }

  const handlePay = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch(funcUrls.payment, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id ? String(user.id) : '',
        },
        body: JSON.stringify({
          planId,
          amount: price,
          isYearly,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Не удалось создать заказ');
      }

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      navigate('/', { replace: true });
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Ошибка при переходе к оплате. Попробуйте ещё раз.'
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/pricing')}>
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад к тарифам
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              navigate('/auth');
            }}
          >
            <Icon name="LogOut" size={20} className="mr-2" />
            Выйти
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Оформление подписки</h2>

              <div className="space-y-6">
                <Card className="p-6 bg-[#e8e6dc] border-[#748c6d]/40">
                  <div className="flex gap-4">
                    <Icon name="ShieldCheck" size={48} className="text-[#748c6d] flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Безопасная оплата через Tribute
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        После нажатия кнопки вы перейдёте на защищённую страницу оплаты.
                        Доступны банковская карта, СБП и другие способы.
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>✓ Платёжные данные не хранятся на нашем сайте</li>
                        <li>✓ Мгновенная активация после оплаты</li>
                        <li>✓ Автопродление можно отменить в любой момент</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Separator />

                <Button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full h-14 text-lg"
                >
                  {isProcessing ? (
                    <>
                      <Icon name="Loader2" size={24} className="mr-2 animate-spin" />
                      Переход к оплате...
                    </>
                  ) : (
                    <>
                      <Icon name="Lock" size={20} className="mr-2" />
                      Перейти к оплате {price.toLocaleString('ru-RU')} ₽
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Нажимая кнопку, вы соглашаетесь с условиями автоматического продления подписки.
                  Отменить можно в любой момент в настройках аккаунта.
                </p>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 space-y-6 sticky top-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Детали заказа</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{planName}</p>
                      <p className="text-sm text-gray-600">
                        {isYearly ? 'Годовая подписка' : 'Месячная подписка'}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {price.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>

                  {isYearly && (
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <p className="text-sm text-emerald-700 font-medium">
                        🎉 Вы экономите {(price * 0.33).toLocaleString('ru-RU')} ₽ в год!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Подписка</span>
                  <span className="font-medium">{price.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Скидка</span>
                  <span className="font-medium text-emerald-600">0 ₽</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Итого</span>
                <span className="text-2xl font-bold text-gray-900">
                  {price.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle2" size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Отмена в любое время</p>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle2" size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Возврат в течение 14 дней</p>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle2" size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Безопасная оплата</p>
                </div>
              </div>

              <Card className="p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Shield" size={20} className="text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">Защита данных</span>
                </div>
                <p className="text-xs text-gray-600">
                  Ваши платежные данные защищены с помощью 256-битного шифрования SSL
                </p>
              </Card>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
