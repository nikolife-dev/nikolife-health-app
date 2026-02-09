import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface PricingComparisonProps {
  currentPlanId: string;
  onViewAllPlans: () => void;
}

export default function PricingComparison({ currentPlanId, onViewAllPlans }: PricingComparisonProps) {
  const plans = [
    {
      id: 'free',
      name: 'Базовый',
      icon: 'Heart',
      price: 'Бесплатно',
      description: 'Для начинающих'
    },
    {
      id: 'premium',
      name: 'Премиум',
      icon: 'Sparkles',
      price: '990 ₽',
      description: 'Полный доступ'
    },
    {
      id: 'family',
      name: 'Семейный',
      icon: 'Users',
      price: '1 490 ₽',
      description: 'До 5 человек'
    }
  ];

  return (
    <Card className="p-8">
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Сравнение тарифов</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            
            return (
              <div 
                key={plan.id}
                className={`p-6 border-2 rounded-xl relative overflow-hidden transition-colors ${
                  isCurrent
                    ? 'border-[#748c6d] bg-gradient-to-br from-[#748c6d] to-[#5a7052]'
                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white text-[#748c6d]">Текущий</Badge>
                  </div>
                )}
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isCurrent ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                  }`}>
                    <Icon 
                      name={plan.icon as 'Heart' | 'Sparkles' | 'Users'} 
                      size={24} 
                      className={isCurrent ? 'text-white' : 'text-gray-600'} 
                    />
                  </div>
                  <h4 className={`font-bold ${isCurrent ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h4>
                  <div className={`text-2xl font-bold ${isCurrent ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </div>
                  <p className={`text-xs ${
                    isCurrent ? 'text-white text-opacity-90' : 'text-gray-600'
                  }`}>
                    {plan.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          onClick={onViewAllPlans}
          className="w-full h-12"
        >
          Посмотреть все тарифы
          <Icon name="ArrowRight" size={20} className="ml-2" />
        </Button>
      </div>
    </Card>
  );
}