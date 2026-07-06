import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import funcUrls from '../../backend/func2url.json';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import IndexSidebar from '@/components/index/IndexSidebar';
import DashboardSection from '@/components/index/DashboardSection';
import WorkoutSection from '@/components/index/WorkoutSection';
import NutritionSection from '@/components/index/NutritionSection';
import LibrarySection from '@/components/index/LibrarySection';
import CommunitySection from '@/components/index/CommunitySection';
import MentalHealthSection from '@/components/index/MentalHealthSection';
import ProgressSection from '@/components/index/ProgressSection';
import SupportSection from '@/components/index/SupportSection';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';

interface Habit {
  id: number;
  title: string;
  category: string;
  goal: string;
  goal_days: number;
  days_of_week: number[];
  times_per_day: number;
  created_at: string;
  completed_today: boolean;
  current_streak: number;
  total_completions: number;
  completions_today: number;
  day_progress: number;
  week_progress: number;
  month_progress: number;
}

export default function Index() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const [favoritePodcasts, setFavoritePodcasts] = useState<number[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoadingHabits, setIsLoadingHabits] = useState(false);

  useEffect(() => {
    loadTodayHabits();
  }, []);

  const loadTodayHabits = async () => {
    setIsLoadingHabits(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoadingHabits(false);
        return;
      }

      const response = await fetch(
        funcUrls.habits,
        {
          headers: { 'X-Auth-Token': token },
        }
      );

      const data = await response.json();
      if (data.habits) {
        const today = new Date().getDay();
        const todayHabits = data.habits
          .filter((h: Habit) => h.days_of_week.includes(today))
          .filter((h: Habit) => h.completions_today < h.times_per_day)
          .slice(0, 4);
        setHabits(todayHabits);
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
    }
    setIsLoadingHabits(false);
  };

  const toggleHabitCompletion = async (habitId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(
        `${funcUrls.habits}?habit_id=${habitId}&action=complete`,
        {
          method: 'POST',
          headers: { 'X-Auth-Token': token },
        }
      );

      const data = await response.json();
      if (data.success) {
        loadTodayHabits();
      }
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

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
        ? funcUrls.articles
        : `${funcUrls.articles}?category=${articleCategory}`;
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
      type: 'assistant' as const,
      description: 'Задайте вопрос по здоровью, тренировкам и питанию'
    },
    { 
      id: 1,
      name: 'Кухня Nikolife', 
      lastMessage: 'Поделилась рецептом здорового завтрака!', 
      time: '15 мин', 
      unread: 3,
      type: 'community' as const,
      description: 'Делитесь рецептами, советами по питанию и обсуждайте кулинарию'
    },
  ];

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
                  <Icon name="Menu" size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-white p-0">
                <IndexSidebar activeSection={activeSection} setActiveSection={handleSectionChange} />
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold text-emerald-600">Nikolife</h1>
            <div className="w-[44px]" />
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <IndexSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        </div>

        <main className="flex-1 overflow-hidden mt-[64px] lg:mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 lg:p-8">
              {activeSection === 'dashboard' && (
                <DashboardSection 
                  habits={habits}
                  articles={articles}
                  workouts={workouts}
                  meals={meals}
                  onSectionChange={setActiveSection}
                  onToggleHabit={toggleHabitCompletion}
                  isLoadingHabits={isLoadingHabits}
                />
              )}

              {activeSection === 'library' && (
                <LibrarySection
                  articles={articles}
                  selectedArticle={selectedArticle}
                  setSelectedArticle={setSelectedArticle}
                  articleCategory={articleCategory}
                  setArticleCategory={setArticleCategory}
                />
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
                <CommunitySection chats={chats} />
              )}

              {activeSection === 'mental' && (
                <MentalHealthSection
                  favoritePodcasts={favoritePodcasts}
                  setFavoritePodcasts={setFavoritePodcasts}
                />
              )}

              {activeSection === 'progress' && (
                <ProgressSection />
              )}

              {activeSection === 'support' && (
                <SupportSection />
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
      
      <LiveLogs logs={logs} onClear={clearLogs} position="bottom-right" />
    </div>
  );
}