import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

interface Habit {
  name: string;
  progress: number;
  streak: number;
}

interface Article {
  title: string;
  category: string;
  readTime: string;
}

interface Workout {
  id: number;
  title: string;
  duration: string;
  level: string;
  category: string;
}

interface Meal {
  id: number;
  name: string;
  calories: number;
  time: string;
}

interface DashboardSectionProps {
  habits: Habit[];
  articles: Article[];
  workouts: Workout[];
  meals: Meal[];
  onSectionChange: (section: string) => void;
}

export default function DashboardSection({ 
  habits, 
  articles, 
  workouts, 
  meals,
  onSectionChange 
}: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Добро пожаловать в Nikolife! 🌿</h2>
        <p className="text-gray-600">Ваш персональный помощник для здорового образа жизни</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Icon name="Flame" size={24} className="text-emerald-600" />
            </div>
            <Badge>Сегодня</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">Сожжено калорий</p>
          <p className="text-3xl font-bold text-gray-900">1,240</p>
          <p className="text-sm text-emerald-600 mt-2">↑ 12% от вчера</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Icon name="Activity" size={24} className="text-blue-600" />
            </div>
            <Badge>7 дней</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">Тренировок</p>
          <p className="text-3xl font-bold text-gray-900">5</p>
          <p className="text-sm text-blue-600 mt-2">Цель: 6/неделя</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Icon name="Target" size={24} className="text-purple-600" />
            </div>
            <Badge>Прогресс</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">До цели</p>
          <p className="text-3xl font-bold text-gray-900">-3.2 кг</p>
          <p className="text-sm text-purple-600 mt-2">Осталось 1.8 кг</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Icon name="Moon" size={24} className="text-orange-600" />
            </div>
            <Badge>Вчера</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">Сон</p>
          <p className="text-3xl font-bold text-gray-900">7.5 ч</p>
          <p className="text-sm text-orange-600 mt-2">Хорошо</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Привычки</h3>
            <Button variant="ghost" size="sm">
              <Icon name="Plus" size={16} className="mr-1" />
              Добавить
            </Button>
          </div>

          <div className="space-y-4">
            {habits.map((habit, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="CheckCircle2" size={20} className="text-emerald-500" />
                    <span className="font-medium text-gray-900">{habit.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Flame" size={16} className="text-orange-500" />
                    <span className="text-sm font-semibold text-gray-700">{habit.streak} дней</span>
                  </div>
                </div>
                <Progress value={habit.progress} className="h-2" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Рекомендации</h3>
            <Button variant="ghost" size="sm" onClick={() => onSectionChange('library')}>
              Все статьи
            </Button>
          </div>

          <div className="space-y-3">
            {articles.map((article, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {article.category}
                    </Badge>
                    <h4 className="font-semibold text-gray-900 mb-1">{article.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Icon name="Clock" size={14} />
                      {article.readTime}
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={20} className="text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Популярные тренировки</h3>
            <Button variant="ghost" size="sm" onClick={() => onSectionChange('workouts')}>
              Все тренировки
            </Button>
          </div>

          <div className="space-y-3">
            {workouts.map((workout) => (
              <Card key={workout.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Dumbbell" size={24} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{workout.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        {workout.duration}
                      </div>
                      <Badge variant="secondary" className="text-xs">{workout.level}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">План питания на сегодня</h3>
            <Button variant="ghost" size="sm" onClick={() => onSectionChange('nutrition')}>
              Все рецепты
            </Button>
          </div>

          <div className="space-y-3">
            {meals.map((meal) => (
              <Card key={meal.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Utensils" size={24} className="text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{meal.time}</Badge>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{meal.name}</h4>
                    <p className="text-sm text-gray-600">{meal.calories} ккал</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
