import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export default function ProgressSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Ваш прогресс</h2>
        <p className="text-gray-600">Отслеживайте достижения и статистику</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Вес</h3>
            <Icon name="TrendingDown" className="text-emerald-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">68.2 кг</p>
          <p className="text-sm text-emerald-600">-3.2 кг за месяц</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Активность</h3>
            <Icon name="Activity" className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">21</p>
          <p className="text-sm text-blue-600">тренировок в месяц</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Стрик</h3>
            <Icon name="Flame" className="text-orange-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">14</p>
          <p className="text-sm text-orange-600">дней подряд</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Статистика за 30 дней</h3>
        <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">График прогресса</p>
        </div>
      </Card>
    </div>
  );
}
