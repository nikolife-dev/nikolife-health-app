import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import funcUrls from '../../backend/func2url.json';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';
import { Habit, HabitTemplate, NewHabitData } from '@/components/habits/types';
import {
  TemplateDialog,
  MyHabitsDialog,
  CreateHabitDialog,
  EditHabitDialog,
} from '@/components/habits/HabitDialogs';
import HabitProgressTabs from '@/components/habits/HabitProgressTabs';

export default function Habits() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { logs, clearLogs, logInfo, logSuccess, logError } = useLiveLogs();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [progressView, setProgressView] = useState<'day' | 'week' | 'month'>('day');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isMyHabitsDialogOpen, setIsMyHabitsDialogOpen] = useState(false);
  
  const [newHabit, setNewHabit] = useState<NewHabitData>({
    title: '',
    category: '',
    goal: '',
    goal_days: 30,
    days_of_week: [],
    times_per_day: 1,
    reminder_enabled: false,
    reminder_time: '09:00',
    reminder_channel: 'telegram',
  });

  useEffect(() => {
    logInfo('Загрузка страницы привычек');
    loadHabits();
    loadTemplates();
  }, []);

  const loadHabits = async () => {
    setIsLoading(true);
    logInfo('Начало загрузки привычек');
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        logError('Токен авторизации не найден');
        return;
      }
      logInfo(`Токен найден: ${token.substring(0, 10)}...`);

      logInfo('Отправка запроса на загрузку привычек');
      const response = await fetch(
        funcUrls.habits,
        { headers: { 'X-Auth-Token': token } }
      );

      logInfo(`Статус ответа: ${response.status}`);
      const data = await response.json();
      logInfo(`Получены данные: ${JSON.stringify(data).substring(0, 100)}`);
      
      if (data.habits) {
        logSuccess(`Загружено ${data.habits.length} привычек`);
        setHabits(data.habits);
      } else {
        logError('Нет привычек в ответе');
      }
    } catch (error) {
      logError(`Ошибка загрузки привычек: ${error}`);
      console.error('Failed to load habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    logInfo('Начало загрузки шаблонов');
    try {
      const response = await fetch(
        funcUrls['habit-templates']
      );

      logInfo(`Статус загрузки шаблонов: ${response.status}`);
      const data = await response.json();
      
      if (data.templates) {
        logSuccess(`Загружено ${data.templates.length} шаблонов`);
        setTemplates(data.templates);
      } else {
        logError('Нет шаблонов в ответе');
      }
    } catch (error) {
      logError(`Ошибка загрузки шаблонов: ${error}`);
      console.error('Failed to load templates:', error);
    }
  };

  const createHabit = async () => {
    logInfo('Попытка создания привычки');
    logInfo(`Данные привычки: ${JSON.stringify(newHabit)}`);
    
    if (!newHabit.title || !newHabit.category || !newHabit.goal || newHabit.days_of_week.length === 0) {
      logError('Не все обязательные поля заполнены');
      logError(`title: ${newHabit.title}, category: ${newHabit.category}, goal: ${newHabit.goal}, days: ${newHabit.days_of_week.length}`);
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        logError('Нет токена авторизации');
        return;
      }
      logInfo(`Токен для создания: ${token.substring(0, 10)}...`);

      logInfo('Отправка POST запроса на создание привычки');
      const response = await fetch(
        funcUrls.habits,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token,
          },
          body: JSON.stringify(newHabit),
        }
      );

      logInfo(`Статус ответа создания: ${response.status}`);
      const data = await response.json();
      logInfo(`Ответ сервера: ${JSON.stringify(data)}`);
      
      if (data.success) {
        logSuccess(`Привычка успешно создана! ID: ${data.id}`);
        toast({
          title: 'Успешно!',
          description: 'Привычка создана',
        });
        setIsCreateDialogOpen(false);
        setNewHabit({
          title: '',
          category: '',
          goal: '',
          goal_days: 30,
          days_of_week: [],
          times_per_day: 1,
          reminder_enabled: false,
          reminder_time: '09:00',
          reminder_channel: 'telegram',
        });
        loadHabits();
      } else {
        logError(`Ошибка создания: ${data.error || 'Неизвестная ошибка'}`);
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать привычку',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logError(`Исключение при создании привычки: ${error}`);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать привычку',
        variant: 'destructive',
      });
    }
  };

  const createFromTemplate = async (template: HabitTemplate) => {
    logInfo(`Выбран шаблон: ${template.title} (${template.category})`);
    setNewHabit({
      ...newHabit,
      title: template.title,
      category: template.category,
    });
    setIsTemplateDialogOpen(false);
    setIsCreateDialogOpen(true);
    logInfo('Диалог создания привычки открыт');
  };

  const updateHabit = async () => {
    if (!editingHabit) return;
    
    logInfo('Попытка обновления привычки');
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        logError('Нет токена');
        return;
      }

      const response = await fetch(
        `${funcUrls.habits}?habit_id=${editingHabit.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token,
          },
          body: JSON.stringify({
            title: editingHabit.title,
            category: editingHabit.category,
            goal: editingHabit.goal,
            goal_days: editingHabit.goal_days,
            days_of_week: editingHabit.days_of_week,
            times_per_day: editingHabit.times_per_day,
            reminder_enabled: editingHabit.reminder_enabled,
            reminder_time: editingHabit.reminder_time,
            reminder_channel: editingHabit.reminder_channel,
          }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        logSuccess('Привычка обновлена');
        toast({ title: 'Успех', description: 'Привычка обновлена' });
        setIsEditDialogOpen(false);
        setEditingHabit(null);
        loadHabits();
      } else {
        logError(data.error || 'Не удалось обновить');
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить привычку',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logError(`Исключение: ${error}`);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить привычку',
        variant: 'destructive',
      });
    }
  };

  const deleteHabit = async (habitId: number) => {
    logInfo(`Удаление привычки #${habitId}`);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        logError('Нет токена');
        return;
      }

      const response = await fetch(
        `${funcUrls.habits}?habit_id=${habitId}`,
        {
          method: 'DELETE',
          headers: { 'X-Auth-Token': token },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        logSuccess('Привычка удалена');
        toast({ title: 'Успех', description: 'Привычка удалена' });
        loadHabits();
      } else {
        logError(data.error || 'Не удалось удалить');
      }
    } catch (error) {
      logError(`Ошибка удаления: ${error}`);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить привычку',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setIsEditDialogOpen(true);
  };

  const toggleEditDayOfWeek = (day: number) => {
    if (!editingHabit) return;
    
    if (editingHabit.days_of_week.includes(day)) {
      setEditingHabit({
        ...editingHabit,
        days_of_week: editingHabit.days_of_week.filter((d) => d !== day),
      });
    } else {
      setEditingHabit({
        ...editingHabit,
        days_of_week: [...editingHabit.days_of_week, day].sort(),
      });
    }
  };

  const toggleCompletion = async (habitId: number) => {
    logInfo(`Переключение выполнения привычки #${habitId}`);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        logError('Нет токена для отметки выполнения');
        return;
      }

      logInfo('Отправка запроса на отметку выполнения');
      const response = await fetch(
        `${funcUrls.habits}?habit_id=${habitId}&action=complete`,
        {
          method: 'POST',
          headers: { 'X-Auth-Token': token },
        }
      );

      logInfo(`Статус отметки выполнения: ${response.status}`);
      const data = await response.json();
      logInfo(`Результат: ${JSON.stringify(data)}`);
      
      if (data.success) {
        logSuccess(`Выполнений сегодня: ${data.completions_today}`);
        loadHabits();
      } else {
        logError('Не удалось обновить статус');
      }
    } catch (error) {
      logError(`Ошибка обновления статуса: ${error}`);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive',
      });
    }
  };

  const calculateProgress = (habit: Habit) => {
    const daysPassed = Math.min(
      Math.floor(
        (new Date().getTime() - new Date(habit.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      habit.goal_days
    );
    const expectedCompletions = daysPassed * habit.times_per_day;
    const progress = expectedCompletions > 0
      ? Math.round((habit.total_completions / expectedCompletions) * 100)
      : 0;
    return Math.min(progress, 100);
  };

  const toggleDayOfWeek = (day: number) => {
    if (newHabit.days_of_week.includes(day)) {
      const newDays = newHabit.days_of_week.filter((d) => d !== day);
      logInfo(`День ${day} удален. Выбранные дни: ${JSON.stringify(newDays)}`);
      setNewHabit({
        ...newHabit,
        days_of_week: newDays,
      });
    } else {
      const newDays = [...newHabit.days_of_week, day].sort();
      logInfo(`День ${day} добавлен. Выбранные дни: ${JSON.stringify(newDays)}`);
      setNewHabit({
        ...newHabit,
        days_of_week: newDays,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 min-h-[44px] flex-shrink-0"
          >
            <Icon name="ArrowLeft" size={20} />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex-1 text-center">
            Привычки
          </h1>

          <div className="md:hidden flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
                  <Icon name="Menu" size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsTemplateDialogOpen(true)}>
                  <Icon name="BookOpen" size={16} className="mr-2" />
                  Шаблоны
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsMyHabitsDialogOpen(true)}>
                  <Icon name="List" size={16} className="mr-2" />
                  Мои привычки
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden md:flex gap-2 flex-shrink-0">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setIsTemplateDialogOpen(true)}>
              <Icon name="BookOpen" size={20} className="mr-2" />
              Шаблоны
            </Button>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setIsMyHabitsDialogOpen(true)}>
              <Icon name="List" size={16} className="mr-2" />
              Мои привычки
            </Button>
            <Button className="min-h-[44px]" onClick={() => setIsCreateDialogOpen(true)}>
              <Icon name="Plus" size={20} className="mr-2" />
              Создать
            </Button>
          </div>
        </div>

        <TemplateDialog
          open={isTemplateDialogOpen}
          onOpenChange={setIsTemplateDialogOpen}
          templates={templates}
          onSelectTemplate={createFromTemplate}
        />

        <MyHabitsDialog
          open={isMyHabitsDialogOpen}
          onOpenChange={setIsMyHabitsDialogOpen}
          habits={habits}
          onEdit={openEditDialog}
          onDelete={deleteHabit}
        />

        <CreateHabitDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          newHabit={newHabit}
          setNewHabit={setNewHabit}
          onCreateHabit={createHabit}
          onToggleDayOfWeek={toggleDayOfWeek}
        />

        <EditHabitDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          editingHabit={editingHabit}
          setEditingHabit={setEditingHabit}
          onUpdateHabit={updateHabit}
          onToggleEditDayOfWeek={toggleEditDayOfWeek}
        />

        <HabitProgressTabs
          habits={habits}
          isLoading={isLoading}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          progressView={progressView}
          setProgressView={setProgressView}
          onToggleCompletion={toggleCompletion}
          onEditHabit={openEditDialog}
          onDeleteHabit={deleteHabit}
          calculateProgress={calculateProgress}
        />

        <LiveLogs logs={logs} onClear={clearLogs} />
      </div>
    </div>
  );
}