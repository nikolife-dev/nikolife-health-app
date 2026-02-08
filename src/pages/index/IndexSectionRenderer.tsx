import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import WorkoutSection from '@/components/index/WorkoutSection';
import NutritionSection from '@/components/index/NutritionSection';
import { workouts, recipes, articles, chats } from './IndexDataProvider';

interface SectionRendererProps {
  activeSection: string;
  selectedWorkout: number | null;
  setSelectedWorkout: (id: number | null) => void;
  workoutProgress: number[];
  setWorkoutProgress: (progress: number[]) => void;
  selectedRecipe: number | null;
  setSelectedRecipe: (id: number | null) => void;
  mealPlan: {[key: string]: number};
  setMealPlan: (plan: {[key: string]: number}) => void;
  logInfo: (msg: string) => void;
}

export function IndexSectionRenderer({
  activeSection,
  selectedWorkout,
  setSelectedWorkout,
  workoutProgress,
  setWorkoutProgress,
  selectedRecipe,
  setSelectedRecipe,
  mealPlan,
  setMealPlan,
  logInfo,
}: SectionRendererProps) {
  
  // Библиотека знаний
  if (activeSection === 'library') {
    logInfo('📚 Рендер секции "Библиотека знаний"');
    logInfo(`  • Всего статей: ${articles.length}`);
    articles.forEach((article, i) => {
      logInfo(`    ${i+1}. "${article.title}" (${article.category}, ${article.readTime})`);
    });
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Библиотека знаний</h2>
          <p className="text-gray-600">Статьи о здоровье, питании и тренировках</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="nutrition">Питание</TabsTrigger>
            <TabsTrigger value="training">Тренировки</TabsTrigger>
            <TabsTrigger value="wellness">Здоровье</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {articles.map((article, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">{article.category}</Badge>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        {article.readTime}
                      </span>
                    </div>
                  </div>
                  <Icon name="ChevronRight" className="text-gray-400" size={24} />
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Тренировки
  if (activeSection === 'workouts') {
    logInfo('🏋️ Рендер секции "Тренировки"');
    logInfo(`  • Всего тренировок: ${workouts.length}`);
    logInfo(`  • Выбрана тренировка: ${selectedWorkout !== null ? `#${selectedWorkout} "${workouts[selectedWorkout]?.title}"` : 'нет'}`);
    logInfo(`  • Прогресс выполнения: ${workoutProgress.length} шагов`);
    
    return (
      <WorkoutSection 
        workouts={workouts}
        selectedWorkout={selectedWorkout}
        setSelectedWorkout={setSelectedWorkout}
        workoutProgress={workoutProgress}
        setWorkoutProgress={setWorkoutProgress}
      />
    );
  }

  // Питание
  if (activeSection === 'nutrition') {
    logInfo('🍽️ Рендер секции "Питание"');
    logInfo(`  • Всего рецептов: ${recipes.length}`);
    logInfo(`  • Выбран рецепт: ${selectedRecipe !== null ? `#${selectedRecipe} "${recipes[selectedRecipe]?.name}"` : 'нет'}`);
    logInfo(`  • Запланировано приёмов пищи: ${Object.keys(mealPlan).length}`);
    
    return (
      <NutritionSection 
        recipes={recipes}
        selectedRecipe={selectedRecipe}
        setSelectedRecipe={setSelectedRecipe}
        mealPlan={mealPlan}
        setMealPlan={setMealPlan}
      />
    );
  }

  // Сообщество
  if (activeSection === 'community') {
    logInfo('💬 Рендер секции "Сообщество"');
    logInfo(`  • Всего чатов: ${chats.length}`);
    chats.forEach((chat) => {
      logInfo(`    - "${chat.name}" (${chat.type}, ${chat.unread} непрочитанных)`);
    });
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Сообщество</h2>
          <p className="text-gray-600">Общайтесь и делитесь опытом</p>
        </div>

        <div className="space-y-4">
          {chats.map((chat) => (
            <Card 
              key={chat.id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                logInfo(`🖱️ Клик по чату: "${chat.name}" (${chat.type})`);
                logInfo(`  • Последнее сообщение: "${chat.lastMessage}"`);
                logInfo(`  • Время: ${chat.time}`);
              }}
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback className={chat.type === 'assistant' ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'}>
                    {chat.type === 'assistant' ? '🤖' : '👥'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{chat.name}</h3>
                      <p className="text-sm text-gray-600">{chat.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{chat.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <Badge className="mt-2 bg-emerald-600">{chat.unread} новых</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Прогресс
  if (activeSection === 'progress') {
    logInfo('📊 Рендер секции "Ваш прогресс"');
    logInfo('  • Метрики:');
    logInfo('    - Вес: 68.2 кг (-3.2 кг за месяц)');
    logInfo('    - Активность: 21 тренировок в месяц');
    logInfo('    - Стрик: 12 дней подряд');
    
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
            <p className="text-3xl font-bold text-gray-900 mb-2">12</p>
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

  return null;
}
