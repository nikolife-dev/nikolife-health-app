import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import IndexSidebar from '@/components/index/IndexSidebar';
import DashboardSection from '@/components/index/DashboardSection';
import WorkoutSection from '@/components/index/WorkoutSection';
import NutritionSection from '@/components/index/NutritionSection';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';

export default function Index() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { logs, clearLogs, logInfo } = useLiveLogs();
  
  useEffect(() => {
    logInfo('Загрузка главной страницы');
    const section = searchParams.get('section');
    if (section) {
      logInfo(`Переход на секцию: ${section}`);
      setActiveSection(section);
    }
  }, [searchParams]);
  
  const [selectedWorkout, setSelectedWorkout] = useState<number | null>(null);
  const [workoutProgress, setWorkoutProgress] = useState<number[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [mealPlan, setMealPlan] = useState<{[key: string]: number}>({});

  const habits = [
    { name: 'Утренняя зарядка', progress: 85, streak: 12 },
    { name: 'Медитация', progress: 70, streak: 8 },
    { name: 'Стакан воды', progress: 100, streak: 21 },
    { name: 'Здоровый сон', progress: 60, streak: 5 },
  ];

  const workouts = [
    { 
      id: 0,
      title: 'HIIT тренировка', 
      duration: '20 мин', 
      level: 'Средний', 
      category: 'Кардио',
      description: 'Высокоинтенсивная интервальная тренировка для сжигания калорий',
      calories: 280,
      exercises: [
        { name: 'Прыжки с разведением', duration: '45 сек', rest: '15 сек' },
        { name: 'Бёрпи', duration: '45 сек', rest: '15 сек' },
        { name: 'Высокие колени', duration: '45 сек', rest: '15 сек' },
        { name: 'Планка', duration: '45 сек', rest: '15 сек' },
      ],
      videoPlaceholder: true
    },
    { 
      id: 1,
      title: 'Йога для спины', 
      duration: '30 мин', 
      level: 'Начальный', 
      category: 'Гибкость',
      description: 'Комплекс упражнений для укрепления и расслабления спины',
      calories: 150,
      exercises: [
        { name: 'Поза кошки-коровы', duration: '2 мин', rest: '30 сек' },
        { name: 'Поза ребенка', duration: '3 мин', rest: '30 сек' },
        { name: 'Скрутка лежа', duration: '2 мин', rest: '30 сек' },
        { name: 'Поза собаки мордой вниз', duration: '2 мин', rest: '30 сек' },
      ],
      videoPlaceholder: true
    },
    { 
      id: 2,
      title: 'Силовая тренировка', 
      duration: '45 мин', 
      level: 'Продвинутый', 
      category: 'Сила',
      description: 'Комплексная силовая тренировка на все группы мышц',
      calories: 380,
      exercises: [
        { name: 'Приседания', duration: '3 подхода × 12', rest: '60 сек' },
        { name: 'Отжимания', duration: '3 подхода × 15', rest: '60 сек' },
        { name: 'Выпады', duration: '3 подхода × 10', rest: '60 сек' },
        { name: 'Планка с подъемом рук', duration: '3 подхода × 30 сек', rest: '60 сек' },
      ],
      videoPlaceholder: true
    },
  ];

  const recipes = [
    { 
      id: 0,
      name: 'Овсянка с ягодами', 
      calories: 320, 
      protein: 12, 
      carbs: 54,
      fats: 6,
      time: 'Завтрак',
      cookTime: '10 мин',
      difficulty: 'Легко',
      ingredients: ['100г овсяных хлопьев', '200мл молока', '50г черники', '50г малины', '1 ст.л. меда'],
      steps: ['Залейте овсянку молоком и варите 5-7 минут', 'Добавьте ягоды и мед', 'Перемешайте и подавайте теплым']
    },
    { 
      id: 1,
      name: 'Куриный салат', 
      calories: 450, 
      protein: 35, 
      carbs: 25,
      fats: 18,
      time: 'Обед',
      cookTime: '20 мин',
      difficulty: 'Средне',
      ingredients: ['150г куриной грудки', '100г листьев салата', '1 огурец', '1 помидор', 'Оливковое масло', 'Лимонный сок'],
      steps: ['Отварите или запеките куриную грудку', 'Нарежьте овощи и курицу', 'Смешайте с салатными листьями', 'Заправьте маслом и лимонным соком']
    },
    { 
      id: 2,
      name: 'Лосось с овощами', 
      calories: 520, 
      protein: 42, 
      carbs: 20,
      fats: 28,
      time: 'Ужин',
      cookTime: '25 мин',
      difficulty: 'Средне',
      ingredients: ['200г филе лосося', '150г брокколи', '100г моркови', 'Специи по вкусу', 'Лимон'],
      steps: ['Запекайте лосось в духовке при 180°C 15 минут', 'Приготовьте овощи на пару', 'Подавайте с лимоном']
    },
    { 
      id: 3,
      name: 'Греческий йогурт с орехами', 
      calories: 280, 
      protein: 18, 
      carbs: 22,
      fats: 12,
      time: 'Завтрак',
      cookTime: '5 мин',
      difficulty: 'Легко',
      ingredients: ['200г греческого йогурта', '30г грецких орехов', '20г миндаля', '1 ст.л. меда', 'Корица'],
      steps: ['Выложите йогурт в миску', 'Добавьте измельченные орехи', 'Полейте медом и посыпьте корицей']
    },
    { 
      id: 4,
      name: 'Киноа с овощами', 
      calories: 380, 
      protein: 14, 
      carbs: 58,
      fats: 10,
      time: 'Обед',
      cookTime: '30 мин',
      difficulty: 'Легко',
      ingredients: ['100г киноа', '1 болгарский перец', '1 цукини', 'Чеснок', 'Оливковое масло'],
      steps: ['Отварите киноа согласно инструкции', 'Обжарьте нарезанные овощи с чесноком', 'Смешайте киноа с овощами']
    },
    { 
      id: 5,
      name: 'Запеченная индейка', 
      calories: 480, 
      protein: 45, 
      carbs: 18,
      fats: 22,
      time: 'Ужин',
      cookTime: '35 мин',
      difficulty: 'Средне',
      ingredients: ['200г филе индейки', '150г батата', 'Розмарин', 'Чеснок', 'Оливковое масло'],
      steps: ['Замаринуйте индейку со специями', 'Запекайте с бататом при 190°C 30 минут', 'Подавайте с зеленью']
    },
  ];

  const meals = recipes.slice(0, 3);

  interface Article {
    id: number;
    title: string;
    category: 'nutrition' | 'training' | 'health';
    content: string;
    published_date: string;
    view_count: number;
  }

  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleCategory, setArticleCategory] = useState<string>('all');

  useEffect(() => {
    if (activeSection === 'library') {
      loadArticles();
    }
  }, [articleCategory, activeSection]);

  const loadArticles = async () => {
    try {
      const url = articleCategory === 'all'
        ? 'https://functions.poehali.dev/cea33162-065b-4e11-8767-9b4ffd23fa04'
        : `https://functions.poehali.dev/cea33162-065b-4e11-8767-9b4ffd23fa04?category=${articleCategory}`;
      const response = await fetch(url);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Failed to load articles:', error);
      setArticles([]);
    }
  };

  const chats = [
    { 
      id: 0,
      name: 'Помощник Николай', 
      lastMessage: 'Здравствуйте! Чем могу помочь с вашим здоровьем?', 
      time: 'сейчас', 
      unread: 0,
      type: 'assistant',
      description: 'Задайте вопрос по здоровью, тренировкам и питанию'
    },
    { 
      id: 1,
      name: 'Кухня Nikolife', 
      lastMessage: 'Поделилась рецептом здорового завтрака!', 
      time: '15 мин', 
      unread: 3,
      type: 'community',
      description: 'Делитесь рецептами, советами по питанию и обсуждайте кулинарию'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="flex h-screen">
        <IndexSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-8">
              {activeSection === 'dashboard' && (
                <DashboardSection 
                  habits={habits}
                  articles={articles}
                  workouts={workouts}
                  meals={meals}
                  onSectionChange={setActiveSection}
                />
              )}

              {activeSection === 'library' && (
                <div className="space-y-6">
                  {!selectedArticle ? (
                    <>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Библиотека знаний</h2>
                        <p className="text-gray-600">Статьи о здоровье, питании и тренировках</p>
                      </div>

                      <Tabs value={articleCategory} onValueChange={setArticleCategory} className="w-full">
                        <TabsList>
                          <TabsTrigger value="all">Все</TabsTrigger>
                          <TabsTrigger value="nutrition">Питание</TabsTrigger>
                          <TabsTrigger value="training">Тренировки</TabsTrigger>
                          <TabsTrigger value="health">Здоровье</TabsTrigger>
                        </TabsList>

                        <TabsContent value={articleCategory} className="space-y-4 mt-6">
                          {articles.length === 0 ? (
                            <Card className="p-12">
                              <div className="text-center text-gray-500">
                                <Icon name="BookOpen" size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Статей пока нет</p>
                              </div>
                            </Card>
                          ) : (
                            articles.map((article) => (
                              <Card 
                                key={article.id} 
                                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => setSelectedArticle(article)}
                              >
                                <div className="flex items-start gap-4">
                                  <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Icon name="BookOpen" className="text-purple-600" size={24} />
                                  </div>
                                  <div className="flex-1">
                                    <Badge variant="secondary" className="mb-2">
                                      {article.category === 'nutrition' && 'Питание'}
                                      {article.category === 'training' && 'Тренировки'}
                                      {article.category === 'health' && 'Здоровье'}
                                    </Badge>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Icon name="Calendar" size={14} />
                                        {new Date(article.published_date).toLocaleDateString('ru-RU')}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Icon name="Eye" size={14} />
                                        {article.view_count} просмотров
                                      </span>
                                    </div>
                                  </div>
                                  <Icon name="ChevronRight" className="text-gray-400" size={24} />
                                </div>
                              </Card>
                            ))
                          )}
                        </TabsContent>
                      </Tabs>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <Button 
                        variant="ghost" 
                        onClick={() => setSelectedArticle(null)}
                        className="mb-4"
                      >
                        <Icon name="ArrowLeft" size={18} className="mr-2" />
                        Назад к списку
                      </Button>

                      <Card className="p-8">
                        <Badge variant="secondary" className="mb-4">
                          {selectedArticle.category === 'nutrition' && 'Питание'}
                          {selectedArticle.category === 'training' && 'Тренировки'}
                          {selectedArticle.category === 'health' && 'Здоровье'}
                        </Badge>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                          {selectedArticle.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-8">
                          <span className="flex items-center gap-1">
                            <Icon name="Calendar" size={14} />
                            {new Date(selectedArticle.published_date).toLocaleDateString('ru-RU')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Eye" size={14} />
                            {selectedArticle.view_count} просмотров
                          </span>
                        </div>
                        <div className="prose prose-lg max-w-none">
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {selectedArticle.content}
                          </p>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'workouts' && (
                <WorkoutSection 
                  workouts={workouts}
                  selectedWorkout={selectedWorkout}
                  setSelectedWorkout={setSelectedWorkout}
                  workoutProgress={workoutProgress}
                  setWorkoutProgress={setWorkoutProgress}
                />
              )}

              {activeSection === 'nutrition' && (
                <NutritionSection 
                  recipes={recipes}
                  selectedRecipe={selectedRecipe}
                  setSelectedRecipe={setSelectedRecipe}
                  mealPlan={mealPlan}
                  setMealPlan={setMealPlan}
                />
              )}

              {activeSection === 'community' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Сообщество</h2>
                    <p className="text-gray-600">Общайтесь и делитесь опытом</p>
                  </div>

                  <div className="space-y-4">
                    {chats.map((chat) => (
                      <Card key={chat.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
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
              )}

              {activeSection === 'progress' && (
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
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
      
      <LiveLogs logs={logs} onClear={clearLogs} position="bottom-right" />
    </div>
  );
}