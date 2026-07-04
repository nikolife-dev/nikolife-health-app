import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface SubscriptionCardProps {
  currentPlan: {
    id: string;
    name: string;
    icon: string;
    price: number | string;
    nextBilling?: string;
    features: string[];
  };
  onChangePlan: () => void;
}

export default function SubscriptionCard({ currentPlan, onChangePlan }: SubscriptionCardProps) {
  const isFree = currentPlan.id === 'free';
  const displayPrice = typeof currentPlan.price === 'number' ? `${currentPlan.price} ₽` : currentPlan.price;
  
  return (
    <Card className="p-8">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-[#748c6d]">Ваш текущий тариф:</p>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-900">{currentPlan.name}</h2>
              <Badge className="bg-[#748c6d] text-white hover:bg-[#5a7052]">
                <Icon name="CheckCircle2" size={14} className="mr-1" />
                Активен
              </Badge>
            </div>
            <p className="text-gray-600">Управляйте своей подпиской</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#748c6d] to-[#5a7052] flex items-center justify-center shadow-lg">
            <Icon name={currentPlan.icon as "Sparkles" | "Heart" | "Users"} size={32} className="text-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-[#e8e6dc] to-[#d8d5c5] rounded-xl">
          <div>
            <div className="text-sm text-gray-600 mb-1">Тарифный план</div>
            <div className="text-3xl font-bold text-gray-900">{currentPlan.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Стоимость</div>
            <div className="text-3xl font-bold text-gray-900">{displayPrice}</div>
            {!isFree && <div className="text-sm text-gray-600">в месяц</div>}
          </div>
          {!isFree && currentPlan.nextBilling && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Следующее списание</div>
              <div className="text-lg font-semibold text-gray-900">{currentPlan.nextBilling}</div>
            </div>
          )}
          <div className="flex items-end">
            <Badge variant="outline" className="border-[#748c6d] text-[#748c6d]">
              <Icon name="CheckCircle2" size={14} className="mr-1" />
              Активна
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Возможности вашего тарифа</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <Icon name="CheckCircle2" size={20} className="flex-shrink-0 text-[#748c6d] mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex gap-4">
          <Button
            onClick={onChangePlan}
            className="flex-1 h-12 bg-gradient-to-r from-[#748c6d] to-[#5a7052] hover:from-[#5a7052] hover:to-[#4a5f42]"
          >
            <Icon name="Sparkles" size={20} className="mr-2" />
            Изменить тариф
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12"
          >
            <Icon name="CreditCard" size={20} className="mr-2" />
            Управление оплатой
          </Button>
        </div>
      </div>
    </Card>
  );
}