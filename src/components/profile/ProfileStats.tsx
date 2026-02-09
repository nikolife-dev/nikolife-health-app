import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

interface ProfileStatsProps {
  userStats: {
    workoutsCompleted: number;
    totalWorkouts: number;
    streakDays: number;
    caloriesTracked: number;
    recipesUsed: number;
  };
}

export default function ProfileStats({ userStats }: ProfileStatsProps) {
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Ваша статистика</h3>
      <Separator />
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Завершено тренировок</span>
            <span className="font-semibold text-gray-900">
              {userStats.workoutsCompleted}/{userStats.totalWorkouts}
            </span>
          </div>
          <Progress value={(userStats.workoutsCompleted / userStats.totalWorkouts) * 100} className="h-2" />
        </div>

        <div className="flex items-center justify-between p-3 bg-[#e8e6dc] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#748c6d] to-[#5a7052] flex items-center justify-center">
              <Icon name="Flame" size={20} className="text-white" />
            </div>
            <span className="font-medium text-gray-900">Серия дней</span>
          </div>
          <span className="text-2xl font-bold text-[#748c6d]">{userStats.streakDays}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">{userStats.caloriesTracked}%</div>
            <div className="text-xs text-gray-600 mt-1">Учет калорий</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">{userStats.recipesUsed}</div>
            <div className="text-xs text-gray-600 mt-1">Рецептов</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
