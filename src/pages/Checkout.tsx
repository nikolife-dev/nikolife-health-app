import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { planId, planName, price, isYearly } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!planId || !planName || !price) {
    navigate('/pricing');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          amount: price,
          isYearly,
          paymentMethod,
          cardDetails: paymentMethod === 'card' ? {
            number: cardNumber,
            expiry: cardExpiry,
            cvv: cardCvv,
            holder: cardHolder
          } : null
        })
      });

      const result = await response.json();

      if (result.success) {
        navigate('/payment-success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      alert('Ошибка обработки платежа. Попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pricing')}
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад к тарифам
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              logout();
              navigate('/login');
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

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Способ оплаты</h3>
                  
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      <Card 
                        className={`p-4 cursor-pointer transition-all ${
                          paymentMethod === 'card' ? 'border-[#748c6d] border-2 bg-[#e8e6dc]' : ''
                        }`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <div className="flex items-center space-x-4">
                          <RadioGroupItem value="card" id="card" />
                          <Icon name="CreditCard" size={24} className="text-[#748c6d]" />
                          <Label htmlFor="card" className="flex-1 cursor-pointer">
                            Банковская карта
                          </Label>
                        </div>
                      </Card>

                      <Card 
                        className={`p-4 cursor-pointer transition-all ${
                          paymentMethod === 'sbp' ? 'border-[#748c6d] border-2 bg-[#e8e6dc]' : ''
                        }`}
                        onClick={() => setPaymentMethod('sbp')}
                      >
                        <div className="flex items-center space-x-4">
                          <RadioGroupItem value="sbp" id="sbp" />
                          <Icon name="Smartphone" size={24} className="text-[#748c6d]" />
                          <Label htmlFor="sbp" className="flex-1 cursor-pointer">
                            Система быстрых платежей (СБП)
                          </Label>
                        </div>
                      </Card>

                      <Card 
                        className={`p-4 cursor-pointer transition-all ${
                          paymentMethod === 'wallet' ? 'border-[#748c6d] border-2 bg-[#e8e6dc]' : ''
                        }`}
                        onClick={() => setPaymentMethod('wallet')}
                      >
                        <div className="flex items-center space-x-4">
                          <RadioGroupItem value="wallet" id="wallet" />
                          <Icon name="Wallet" size={24} className="text-[#748c6d]" />
                          <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                            Apple Pay / Google Pay
                          </Label>
                        </div>
                      </Card>
                    </div>
                  </RadioGroup>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg font-semibold text-gray-900">Данные карты</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Номер карты</Label>
                      <div className="relative">
                        <Input
                          id="cardNumber"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          required
                          className="h-12 pr-12"
                          maxLength={19}
                        />
                        <Icon name="CreditCard" size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardExpiry">Срок действия</Label>
                        <Input
                          id="cardExpiry"
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          required
                          className="h-12"
                          maxLength={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input
                          id="cardCvv"
                          type="text"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          required
                          className="h-12"
                          maxLength={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardHolder">Имя владельца</Label>
                      <Input
                        id="cardHolder"
                        type="text"
                        placeholder="IVAN IVANOV"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'sbp' && (
                  <Card className="p-6 bg-blue-50 border-blue-200 animate-fade-in">
                    <div className="flex gap-4">
                      <Icon name="Smartphone" size={48} className="text-blue-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Оплата через СБП</h4>
                        <p className="text-sm text-gray-700 mb-3">
                          После подтверждения заказа откроется приложение вашего банка для завершения оплаты
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>✓ Мгновенный перевод</li>
                          <li>✓ Без комиссии</li>
                          <li>✓ Безопасно</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}

                {paymentMethod === 'wallet' && (
                  <Card className="p-6 bg-purple-50 border-purple-200 animate-fade-in">
                    <div className="flex gap-4">
                      <Icon name="Wallet" size={48} className="text-purple-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Цифровой кошелек</h4>
                        <p className="text-sm text-gray-700 mb-3">
                          Оплата через Apple Pay или Google Pay. Быстро и безопасно.
                        </p>
                        <div className="flex gap-4 mt-4">
                          <div className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold">
                             Pay
                          </div>
                          <div className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-semibold">
                            G Pay
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                <Separator />

                <Button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full h-14 text-lg"
                >
                  {isProcessing ? (
                    <>
                      <Icon name="Loader2" size={24} className="mr-2 animate-spin" />
                      Обработка платежа...
                    </>
                  ) : (
                    <>
                      <Icon name="Lock" size={20} className="mr-2" />
                      Оплатить {price.toLocaleString('ru-RU')} ₽
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Нажимая кнопку, вы соглашаетесь с условиями автоматического продления подписки.
                  Отменить можно в любой момент в настройках аккаунта.
                </p>
              </form>
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