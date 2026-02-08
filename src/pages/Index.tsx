import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import IndexSidebar from '@/components/index/IndexSidebar';
import DashboardSection from '@/components/index/DashboardSection';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';
import { habits, workouts, recipes, articles, chats, meals } from './index/IndexDataProvider';
import { useIndexState } from './index/IndexStateManager';
import { IndexSectionRenderer } from './index/IndexSectionRenderer';

export default function Index() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { logs, clearLogs, logInfo, logSuccess, logError, logWarning } = useLiveLogs();
  
  // Инициализация состояния через кастомный хук
  const {
    selectedWorkout,
    setSelectedWorkout: setSelectedWorkoutRaw,
    workoutProgress,
    setWorkoutProgress: setWorkoutProgressRaw,
    selectedRecipe,
    setSelectedRecipe: setSelectedRecipeRaw,
    mealPlan,
    setMealPlan: setMealPlanRaw,
  } = useIndexState();

  // Обертки для state setters с логированием
  const setSelectedWorkout = (id: number | null) => setSelectedWorkoutRaw(id, logInfo);
  const setWorkoutProgress = (progress: number[]) => setWorkoutProgressRaw(progress, logInfo);
  const setSelectedRecipe = (id: number | null) => setSelectedRecipeRaw(id, logInfo);
  const setMealPlan = (plan: {[key: string]: number}) => setMealPlanRaw(plan, logInfo);
  
  // Логирование инициализации страницы
  useEffect(() => {
    logInfo('🚀 Инициализация главной страницы приложения');
    logInfo(`📍 Текущий URL: ${window.location.href}`);
    logInfo(`🖥️ User Agent: ${navigator.userAgent.substring(0, 50)}...`);
    logInfo(`📱 Размер экрана: ${window.innerWidth}x${window.innerHeight}`);
    logInfo(`🌐 Язык: ${navigator.language}`);
    
    // Проверка авторизации
    const token = localStorage.getItem('auth_token');
    if (token) {
      logSuccess(`🔐 Токен авторизации найден: ${token.substring(0, 15)}...`);
      logInfo(`  • Длина токена: ${token.length} символов`);
    } else {
      logWarning('⚠️ Токен авторизации не найден в localStorage');
    }
    
    // Проверка параметров URL
    const section = searchParams.get('section');
    const allParams = Array.from(searchParams.entries());
    
    if (allParams.length > 0) {
      logInfo(`🔗 Параметры URL: ${JSON.stringify(Object.fromEntries(allParams))}`);
    } else {
      logInfo('🔗 Параметры URL отсутствуют');
    }
    
    if (section) {
      logInfo(`📂 Переход на секцию из URL: "${section}"`);
      setActiveSection(section);
    } else {
      logInfo('📂 Секция по умолчанию: "dashboard"');
    }
    
    logSuccess('✅ Главная страница успешно загружена');
    
    // Логирование при размонтировании
    return () => {
      logInfo('👋 Размонтирование главной страницы');
    };
  }, [searchParams]);

  // Логирование инициализации данных
  useEffect(() => {
    logInfo(`📊 Данные инициализированы:`);
    logInfo(`  • Привычки: ${habits.length} шт.`);
    logInfo(`  • Тренировки: ${workouts.length} шт.`);
    logInfo(`  • Рецепты: ${recipes.length} шт.`);
    logInfo(`  • Статьи: ${articles.length} шт.`);
    logInfo(`  • Чаты: ${chats.length} шт.`);
    
    // Детали по привычкам
    logInfo('📌 Детали привычек:');
    habits.forEach((habit, i) => {
      logInfo(`  ${i+1}. "${habit.name}": ${habit.progress}% (стрик: ${habit.streak} дн.)`);
    });
    
    // Детали по тренировкам
    logInfo('💪 Детали тренировок:');
    workouts.forEach((workout, i) => {
      logInfo(`  ${i+1}. "${workout.title}": ${workout.duration}, ${workout.level}, ${workout.calories} ккал`);
    });
  }, []);

  // Расширенное логирование смены секции
  const handleSectionChange = (newSection: string) => {
    logInfo(`🔄 Смена секции: "${activeSection}" → "${newSection}"`);
    
    // Детальная информация по секциям
    const sectionDetails: Record<string, string> = {
      dashboard: 'Главная панель (привычки, статистика)',
      workouts: 'Тренировки (HIIT, йога, силовые)',
      nutrition: 'Питание (меню на неделю, рецепты)',
      library: 'Библиотека знаний',
      chats: 'Чаты и сообщества',
      analytics: 'Аналитика и прогресс',
      profile: 'Профиль пользователя'
    };
    
    logInfo(`📂 Открывается: ${sectionDetails[newSection] || 'Неизвестная секция'}`);
    setActiveSection(newSection);
    logSuccess(`✅ Секция "${newSection}" успешно активирована`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="flex h-screen">
        <IndexSidebar activeSection={activeSection} setActiveSection={handleSectionChange} />

        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-8">
              {activeSection === 'dashboard' && (
                <DashboardSection 
                  habits={habits}
                  articles={articles}
                  workouts={workouts}
                  meals={meals}
                  onSectionChange={(section: string) => {
                    logInfo(`🖱️ Клик по быстрому переходу в DashboardSection → "${section}"`);
                    handleSectionChange(section);
                  }}
                />
              )}

              <IndexSectionRenderer 
                activeSection={activeSection}
                selectedWorkout={selectedWorkout}
                setSelectedWorkout={setSelectedWorkout}
                workoutProgress={workoutProgress}
                setWorkoutProgress={setWorkoutProgress}
                selectedRecipe={selectedRecipe}
                setSelectedRecipe={setSelectedRecipe}
                mealPlan={mealPlan}
                setMealPlan={setMealPlan}
                logInfo={logInfo}
              />
            </div>
          </ScrollArea>
        </main>
      </div>
      
      <LiveLogs logs={logs} onClear={clearLogs} position="bottom-right" />
    </div>
  );
}
