import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  popular?: boolean;
  icon: string;
}

export default function Pricing() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Базовый',
      description: 'Для начала пути к здоровью',
      priceMonthly: 0,
      priceYearly: 0,
      icon: 'Heart',
      features: [
        'Базовый трекер активности',
        'Дневник питания',
        '3 рецепта в неделю',
        'Базовые упражнения',
        'Доступ к сообществу'
      ]
    },
    {
      id: 'premium',
      name: 'Премиум',
      description: 'Полный контроль над здоровьем',
      priceMonthly: 990,
      priceYearly: 7990,
      icon: 'Sparkles',
      popular: true,
      features: [
        'Всё из базового тарифа',
        'Персональный план питания',
        'Индивидуальные тренировки',
        'Неограниченные рецепты',
        'AI-помощник Николай',
        'Трекер сна и восстановления',
        'Детальная аналитика',
        'Поддержка 24/7'
      ]
    },
    {
      id: 'family',
      name: 'Семейный',
      description: 'Здоровье для всей семьи',
      priceMonthly: 1490,
      priceYearly: 11990,
      icon: 'Users',
      features: [
        'Всё из премиум тарифа',
        'До 5 аккаунтов',
        'Семейные планы питания',
        'Детские программы',
        'Совместные цели',
        'Приоритетная поддержка',
        'Скидка 50% на каждый аккаунт'
      ]
    }
  ];

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    
    if (planId === 'free') {
      navigate('/');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const price = isYearly ? plan.priceYearly : plan.priceMonthly;
    
    navigate('/checkout', { 
      state: { 
        planId, 
        planName: plan.name, 
        price,
        isYearly 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex justify-end">
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
        <div className="text-center space-y-4">
          <Badge className="mx-auto">Тарифные планы</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Выберите свой план
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Начните путь к здоровому образу жизни с тарифом, который подходит именно вам
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : ''}>
              Ежемесячно
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : ''}>
              Ежегодно
            </Label>
            {isYearly && (
              <Badge variant="secondary" className="bg-[#e8e6dc] text-[#5a7052]">
                Экономия до 33%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;
            const monthlyPrice = isYearly ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;
            
            return (
              <Card
                key={plan.id}
                className={`relative p-8 transition-all duration-300 ${
                  plan.popular 
                    ? 'border-2 border-[#748c6d] shadow-2xl scale-105 md:scale-110' 
                    : 'hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#748c6d] text-white px-4 py-1">
                      <Icon name="Star" size={14} className="mr-1" />
                      Популярный
                    </Badge>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-[#748c6d] to-[#5a7052]' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      <Icon 
                        name={plan.icon as any} 
                        size={32} 
                        className={plan.popular ? 'text-white' : 'text-gray-600'} 
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>

                  <div className="text-center py-4">
                    {price === 0 ? (
                      <div className="text-4xl font-bold text-gray-900">Бесплатно</div>
                    ) : (
                      <>
                        <div className="text-5xl font-bold text-gray-900">
                          {monthlyPrice.toLocaleString('ru-RU')} ₽
                        </div>
                        <div className="text-gray-600 mt-1">
                          {isYearly ? `${price.toLocaleString('ru-RU')} ₽/год` : 'в месяц'}
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={selectedPlan === plan.id}
                    className={`w-full h-12 text-lg ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-[#748c6d] to-[#5a7052] hover:from-[#5a7052] hover:to-[#4a5f42]' 
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {selectedPlan === plan.id ? (
                      <>
                        <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                        Загрузка...
                      </>
                    ) : price === 0 ? (
                      'Начать бесплатно'
                    ) : (
                      'Выбрать план'
                    )}
                  </Button>

                  <div className="space-y-3 pt-4 border-t">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Icon 
                          name="CheckCircle2" 
                          size={20} 
                          className={`flex-shrink-0 ${
                            plan.popular ? 'text-[#748c6d]' : 'text-gray-400'
                          }`}
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icon name="HelpCircle" size={32} className="text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Не можете определиться?</h3>
              <p className="text-gray-700">
                Начните с бесплатного тарифа и обновите план в любой момент. Все данные сохранятся.
              </p>
            </div>
            <Button variant="outline" size="lg" onClick={() => handleSelectPlan('free')}>
              Начать бесплатно
            </Button>
          </div>
        </Card>

        <div className="text-center space-y-4 pt-8">
          <h3 className="text-xl font-semibold text-gray-900">Часто задаваемые вопросы</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              { q: 'Можно ли отменить подписку?', a: 'Да, в любой момент без объяснения причин' },
              { q: 'Есть ли пробный период?', a: 'Да, 7 дней бесплатно для премиум тарифа' },
              { q: 'Какие способы оплаты?', a: 'Карты, Apple Pay, Google Pay, СБП' },
              { q: 'Возврат средств?', a: 'Полный возврат в течение 14 дней' }
            ].map((faq, index) => (
              <Card key={index} className="p-4 text-left">
                <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}