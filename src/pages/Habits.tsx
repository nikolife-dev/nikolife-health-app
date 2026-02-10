import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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

interface HabitTemplate {
  id: number;
  title: string;
  category: string;
  description: string;
}

const CATEGORIES = [
  'Здоровье',
  'Фитнес',
  'Питание',
  'Сон',
  'Продуктивность',
  'Обучение',
  'Саморазвитие',
  'Социальное',
];

const WEEKDAYS = [
  { id: 1, name: 'Пн', full: 'Понедельник' },
  { id: 2, name: 'Вт', full: 'Вторник' },
  { id: 3, name: 'Ср', full: 'Среда' },
  { id: 4, name: 'Чт', full: 'Четверг' },
  { id: 5, name: 'Пт', full: 'Пятница' },
  { id: 6, name: 'Сб', full: 'Суббота' },
  { id: 0, name: 'Вс', full: 'Воскресенье' },
];

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
  
  const [newHabit, setNewHabit] = useState({
    title: '',
    category: '',
    goal: '',
    goal_days: 30,
    days_of_week: [] as number[],
    times_per_day: 1,
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
        'https://functions.poehali.dev/19a5d173-2a31-481c-9899-a29eee8fe3de',
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
        'https://functions.poehali.dev/d15446be-71b4-42e4-8976-d49d651ef653'
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
        'https://functions.poehali.dev/19a5d173-2a31-481c-9899-a29eee8fe3de',
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
        `https://functions.poehali.dev/19a5d173-2a31-481c-9899-a29eee8fe3de?habit_id=${editingHabit.id}`,
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
        `https://functions.poehali.dev/19a5d173-2a31-481c-9899-a29eee8fe3de?habit_id=${habitId}`,
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
        `https://functions.poehali.dev/19a5d173-2a31-481c-9899-a29eee8fe3de?habit_id=${habitId}&action=complete`,
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

  const filteredHabits = selectedCategory
    ? habits.filter((h) => h.category === selectedCategory)
    : habits;

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
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 min-h-[44px]"
          >
            <Icon name="ArrowLeft" size={20} />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Привычки
          </h1>
          <div className="flex gap-2">
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="min-h-[44px]">
                  <Icon name="BookOpen" size={20} className="mr-2" />
                  Шаблоны
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Выберите привычку из списка</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {CATEGORIES.map((cat) => {
                    const catTemplates = templates.filter((t) => t.category === cat);
                    if (catTemplates.length === 0) return null;
                    return (
                      <div key={cat}>
                        <h3 className="font-semibold text-lg mb-2">{cat}</h3>
                        <div className="space-y-2">
                          {catTemplates.map((template) => (
                            <Card
                              key={template.id}
                              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => createFromTemplate(template)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{template.title}</h4>
                                  <p className="text-sm text-gray-600">
                                    {template.description}
                                  </p>
                                </div>
                                <Icon name="Plus" size={20} />
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex gap-2">
              <Dialog open={isMyHabitsDialogOpen} onOpenChange={setIsMyHabitsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="min-h-[44px]">
                    <Icon name="List" size={20} className="mr-2" />
                    Мои привычки
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Мои привычки</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {habits.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-gray-500">У вас пока нет привычек</p>
                      </Card>
                    ) : (
                      habits.map((habit) => (
                        <Card key={habit.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold">{habit.title}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {habit.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{habit.goal}</p>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                <span>🔥 {habit.current_streak} дней</span>
                                <span>✅ {habit.total_completions} выполнений</span>
                                <span>📅 {habit.goal_days} дней цель</span>
                                <span>🔁 {habit.times_per_day}×/день</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {WEEKDAYS.map((day) => (
                                  <span
                                    key={day.id}
                                    className={`px-2 py-1 rounded text-xs ${
                                      habit.days_of_week.includes(day.id)
                                        ? 'bg-[#748c6d] text-white'
                                        : 'bg-gray-200 text-gray-400'
                                    }`}
                                  >
                                    {day.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  openEditDialog(habit);
                                  setIsMyHabitsDialogOpen(false);
                                }}
                                className="min-h-[36px]"
                              >
                                <Icon name="Edit" size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm(`Удалить привычку "${habit.title}"?`)) {
                                    deleteHabit(habit.id);
                                  }
                                }}
                                className="min-h-[36px]"
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="min-h-[44px]">
                    <Icon name="Plus" size={20} className="mr-2" />
                    Создать
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Создать привычку</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Название привычки</Label>
                    <Input
                      value={newHabit.title}
                      onChange={(e) =>
                        setNewHabit({ ...newHabit, title: e.target.value })
                      }
                      placeholder="Утренняя зарядка"
                      maxLength={40}
                    />
                  </div>

                  <div>
                    <Label>Категория</Label>
                    <Select
                      value={newHabit.category}
                      onValueChange={(val) =>
                        setNewHabit({ ...newHabit, category: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Цель</Label>
                    <Input
                      value={newHabit.goal}
                      onChange={(e) =>
                        setNewHabit({ ...newHabit, goal: e.target.value })
                      }
                      placeholder="Делать зарядку каждый день"
                      maxLength={40}
                    />
                  </div>

                  <div>
                    <Label>Количество дней для достижения</Label>
                    <Input
                      type="number"
                      min={30}
                      max={360}
                      value={newHabit.goal_days}
                      onChange={(e) =>
                        setNewHabit({
                          ...newHabit,
                          goal_days: Math.max(30, parseInt(e.target.value) || 30),
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Дни недели</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {WEEKDAYS.map((day) => (
                        <Badge
                          key={day.id}
                          className={`cursor-pointer min-h-[36px] px-4 ${
                            newHabit.days_of_week.includes(day.id)
                              ? 'bg-[#748c6d]'
                              : 'bg-gray-300'
                          }`}
                          onClick={() => toggleDayOfWeek(day.id)}
                        >
                          {day.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Сколько раз в день</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={newHabit.times_per_day}
                      onChange={(e) =>
                        setNewHabit({
                          ...newHabit,
                          times_per_day: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  <Button onClick={createHabit} className="w-full min-h-[44px]">
                    Создать привычку
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Редактировать привычку</DialogTitle>
                </DialogHeader>
                {editingHabit && (
                  <div className="space-y-4">
                    <div>
                      <Label>Название</Label>
                      <Input
                        value={editingHabit.title}
                        onChange={(e) =>
                          setEditingHabit({ ...editingHabit, title: e.target.value })
                        }
                        placeholder="Название привычки"
                        maxLength={30}
                      />
                    </div>

                    <div>
                      <Label>Категория</Label>
                      <Select
                        value={editingHabit.category}
                        onValueChange={(val) =>
                          setEditingHabit({ ...editingHabit, category: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Цель</Label>
                      <Input
                        value={editingHabit.goal}
                        onChange={(e) =>
                          setEditingHabit({ ...editingHabit, goal: e.target.value })
                        }
                        placeholder="Делать зарядку каждый день"
                        maxLength={40}
                      />
                    </div>

                    <div>
                      <Label>Количество дней для достижения</Label>
                      <Input
                        type="number"
                        min={30}
                        max={360}
                        value={editingHabit.goal_days}
                        onChange={(e) =>
                          setEditingHabit({
                            ...editingHabit,
                            goal_days: Math.max(30, parseInt(e.target.value) || 30),
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Дни недели</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {WEEKDAYS.map((day) => (
                          <Badge
                            key={day.id}
                            className={`cursor-pointer min-h-[36px] px-4 ${
                              editingHabit.days_of_week.includes(day.id)
                                ? 'bg-[#748c6d]'
                                : 'bg-gray-300'
                            }`}
                            onClick={() => toggleEditDayOfWeek(day.id)}
                          >
                            {day.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Сколько раз в день</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={editingHabit.times_per_day}
                        onChange={(e) =>
                          setEditingHabit({
                            ...editingHabit,
                            times_per_day: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>

                    <Button onClick={updateHabit} className="w-full min-h-[44px]">
                      Сохранить изменения
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge
                className={`cursor-pointer min-h-[36px] px-3 ${
                  !selectedCategory ? 'bg-[#748c6d]' : 'bg-gray-300'
                }`}
                onClick={() => setSelectedCategory('')}
              >
                Все
              </Badge>
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  className={`cursor-pointer min-h-[36px] px-3 ${
                    selectedCategory === cat ? 'bg-[#748c6d]' : 'bg-gray-300'
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <Tabs value={progressView} onValueChange={(v) => setProgressView(v as 'day' | 'week' | 'month')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">День</TabsTrigger>
            <TabsTrigger value="week">Неделя (7 дн.)</TabsTrigger>
            <TabsTrigger value="month">Месяц (30 дн.)</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
              </div>
            ) : (() => {
              const today = new Date().getDay();
              const todayHabits = filteredHabits.filter(h => h.days_of_week.includes(today));
              
              if (todayHabits.length === 0) {
                return (
                  <Card className="p-8 text-center">
                    <Icon
                      name="CalendarCheck"
                      size={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <h3 className="text-lg font-semibold text-gray-700">
                      На сегодня привычек нет
                    </h3>
                    <p className="text-gray-500 mt-2">
                      Отдыхайте! Или создайте новую привычку
                    </p>
                  </Card>
                );
              }
              
              return todayHabits.map((habit) => {
                const progress = calculateProgress(habit);

                return (
                  <Card key={habit.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold">{habit.title}</h3>
                          <Badge variant="outline">{habit.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{habit.goal}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>🔥 {habit.current_streak} дней</span>
                          <span>✅ {habit.total_completions} выполнений</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => toggleCompletion(habit.id)}
                        className={`w-full p-6 rounded-2xl border-2 transition-all active:scale-95 ${
                          habit.completions_today >= habit.times_per_day
                            ? 'bg-[#748c6d] border-[#748c6d] shadow-lg'
                            : 'bg-white border-gray-300 hover:border-[#748c6d] hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <Icon
                            name={habit.completions_today >= habit.times_per_day ? 'CheckCircle2' : 'Circle'}
                            size={32}
                            className={habit.completions_today >= habit.times_per_day ? 'text-white' : 'text-gray-400'}
                          />
                          <span className={`text-lg font-semibold ${
                            habit.completions_today >= habit.times_per_day ? 'text-white' : 'text-gray-700'
                          }`}>
                            {habit.completions_today >= habit.times_per_day ? 'Цель достигнута!' : `Отметить (${habit.completions_today}/${habit.times_per_day})`}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className={habit.completions_today >= habit.times_per_day ? 'text-white/90' : 'text-gray-600'}>
                              Прогресс за день: {Math.round(habit.day_progress)}%
                            </span>
                            <span className={habit.completions_today >= habit.times_per_day ? 'text-white/90' : 'text-gray-600'}>
                              Осталось дней:{' '}
                              {Math.max(
                                0,
                                habit.goal_days -
                                  Math.floor(
                                    (new Date().getTime() -
                                      new Date(habit.created_at).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )
                              )}
                            </span>
                          </div>
                          <div className={`w-full rounded-full h-3 ${
                            habit.completions_today >= habit.times_per_day ? 'bg-white/30' : 'bg-gray-200'
                          }`}>
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                habit.completions_today >= habit.times_per_day ? 'bg-white' : 'bg-[#748c6d]'
                              }`}
                              style={{ width: `${habit.day_progress}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="flex gap-1 mt-4">
                      {WEEKDAYS.map((day) => {
                        const isToday = day.id === today;
                        const isScheduled = habit.days_of_week.includes(day.id);
                        
                        return (
                          <div
                            key={day.id}
                            className={`flex-1 text-center py-2 rounded text-xs font-medium transition-all ${
                              isToday && isScheduled
                                ? 'bg-[#748c6d] text-white ring-2 ring-[#748c6d] ring-offset-2 scale-110'
                                : isToday
                                ? 'bg-gray-400 text-white ring-2 ring-gray-400 ring-offset-2 scale-110'
                                : isScheduled
                                ? 'bg-[#748c6d]/70 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {day.name}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(habit)}
                        className="flex-1 min-h-[40px]"
                      >
                        <Icon name="Edit" size={16} className="mr-2" />
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Удалить привычку?')) {
                            deleteHabit(habit.id);
                          }
                        }}
                        className="min-h-[40px]"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>

                    {habit.times_per_day > 1 && (
                      <div className="mt-3 text-sm text-gray-600 text-center">
                        {habit.times_per_day}× в день
                      </div>
                    )}
                  </Card>
                );
              });
            })()}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
              </div>
            ) : (
              filteredHabits.map((habit) => (
                <Card key={habit.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{habit.title}</h3>
                        <Badge variant="outline">{habit.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{habit.goal}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>🔥 {habit.current_streak} дней</span>
                        <span>✅ {habit.total_completions} выполнений</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#748c6d] to-[#8da582] text-white">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <Icon name="TrendingUp" size={32} className="text-white" />
                        <span className="text-lg font-semibold">
                          Прогресс за неделю
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/90">
                            Выполнено: {Math.round(habit.week_progress)}%
                          </span>
                          <span className="text-white/90">
                            {habit.completions_today}/{habit.times_per_day} сегодня
                          </span>
                        </div>
                        <div className="w-full rounded-full h-3 bg-white/30">
                          <div
                            className="h-3 rounded-full bg-white transition-all duration-500"
                            style={{ width: `${habit.week_progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {WEEKDAYS.map((day) => {
                        const isScheduled = habit.days_of_week.includes(day.id);
                        const today = new Date().getDay();
                        const isToday = day.id === today;
                        
                        return (
                          <div
                            key={day.id}
                            className={`flex-1 text-center py-2 rounded text-xs font-medium transition-all ${
                              isToday && isScheduled
                                ? 'bg-[#748c6d] text-white ring-2 ring-[#748c6d] ring-offset-2 scale-110'
                                : isToday
                                ? 'bg-gray-400 text-white ring-2 ring-gray-400 ring-offset-2 scale-110'
                                : isScheduled
                                ? 'bg-[#748c6d]/70 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {day.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
              </div>
            ) : (
              filteredHabits.map((habit) => (
                <Card key={habit.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{habit.title}</h3>
                        <Badge variant="outline">{habit.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{habit.goal}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>🔥 {habit.current_streak} дней</span>
                        <span>✅ {habit.total_completions} выполнений</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#6b7c64] to-[#8da582] text-white">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <Icon name="Calendar" size={32} className="text-white" />
                        <span className="text-lg font-semibold">
                          Прогресс за месяц
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/90">
                            Выполнено: {Math.round(habit.month_progress)}%
                          </span>
                          <span className="text-white/90">
                            Цель: {habit.goal_days} дней
                          </span>
                        </div>
                        <div className="w-full rounded-full h-3 bg-white/30">
                          <div
                            className="h-3 rounded-full bg-white transition-all duration-500"
                            style={{ width: `${habit.month_progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {WEEKDAYS.map((day) => {
                        const isScheduled = habit.days_of_week.includes(day.id);
                        const today = new Date().getDay();
                        const isToday = day.id === today;
                        
                        return (
                          <div
                            key={day.id}
                            className={`flex-1 text-center py-2 rounded text-xs font-medium transition-all ${
                              isToday && isScheduled
                                ? 'bg-[#748c6d] text-white ring-2 ring-[#748c6d] ring-offset-2 scale-110'
                                : isToday
                                ? 'bg-gray-400 text-white ring-2 ring-gray-400 ring-offset-2 scale-110'
                                : isScheduled
                                ? 'bg-[#748c6d]/70 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {day.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <LiveLogs logs={logs} onClear={clearLogs} />
      </div>
    </div>
  );
}