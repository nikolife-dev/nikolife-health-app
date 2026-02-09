import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface PricingComparisonProps {
  onViewAllPlans: () => void;
}

export default function PricingComparison({ onViewAllPlans }: PricingComparisonProps) {
  return (
    <Card className="p-8">
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Сравнение тарифов</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Icon name="Heart" size={24} className="text-gray-600" />
              </div>
              <h4 className="font-bold text-gray-900">Базовый</h4>
              <div className="text-2xl font-bold text-gray-900">Бесплатно</div>
              <p className="text-xs text-gray-600">Для начинающих</p>
            </div>
          </div>

          <div className="p-6 border-2 border-[#748c6d] rounded-xl bg-gradient-to-br from-[#748c6d] to-[#5a7052] relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Badge className="bg-white text-[#748c6d]">Текущий</Badge>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                <Icon name="Sparkles" size={24} className="text-white" />
              </div>
              <h4 className="font-bold text-white">Премиум</h4>
              <div className="text-2xl font-bold text-white">990 ₽</div>
              <p className="text-xs text-white text-opacity-90">Полный доступ</p>
            </div>
          </div>

          <div className="p-6 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Icon name="Users" size={24} className="text-gray-600" />
              </div>
              <h4 className="font-bold text-gray-900">Семейный</h4>
              <div className="text-2xl font-bold text-gray-900">1 490 ₽</div>
              <p className="text-xs text-gray-600">До 5 человек</p>
            </div>
          </div>
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
