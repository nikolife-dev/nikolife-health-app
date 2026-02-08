import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

const ARTICLES_API = 'https://functions.poehali.dev/cea33162-065b-4e11-8767-9b4ffd23fa04';
const WORKOUTS_API = 'https://functions.poehali.dev/10bc33f4-9e4c-47aa-a7b9-5097af1fdfeb';

interface Article {
  id: number;
  title: string;
  category: 'nutrition' | 'training' | 'health';
  content: string;
  published_date: string;
  view_count: number;
  created_at: string;
}

interface Workout {
  id: number;
  title: string;
  description: string;
  category: 'cardio' | 'strength' | 'flexibility';
  published_date: string;
  duration_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  calories: number;
  video_url: string | null;
  view_count: number;
  created_at: string;
}

interface Exercise {
  name: string;
  sets: string;
  rest_seconds: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'nutrition' as 'nutrition' | 'training' | 'health',
    content: '',
    published_date: new Date().toISOString().split('T')[0]
  });

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutCategory, setWorkoutCategory] = useState<string>('all');
  const [isAddWorkoutDialogOpen, setIsAddWorkoutDialogOpen] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    title: '',
    description: '',
    category: 'cardio' as 'cardio' | 'strength' | 'flexibility',
    duration_minutes: 0,
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    calories: 0,
    published_date: new Date().toISOString().split('T')[0],
    video_base64: ''
  });
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: '', rest_seconds: 0 }
  ]);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  useEffect(() => {
    loadWorkouts();
  }, [workoutCategory]);

  const loadArticles = async () => {
    try {
      const url = selectedCategory === 'all' 
        ? ARTICLES_API 
        : `${ARTICLES_API}?category=${selectedCategory}`;
      const response = await fetch(url);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  };

  const handleAddArticle = async () => {
    try {
      const response = await fetch(ARTICLES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle)
      });
      
      if (response.ok) {
        setIsAddDialogOpen(false);
        setNewArticle({
          title: '',
          category: 'nutrition',
          content: '',
          published_date: new Date().toISOString().split('T')[0]
        });
        loadArticles();
      }
    } catch (error) {
      console.error('Failed to add article:', error);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Удалить статью?')) return;
    
    try {
      const response = await fetch(`${ARTICLES_API}?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadArticles();
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const loadWorkouts = async () => {
    try {
      const url = workoutCategory === 'all'
        ? WORKOUTS_API
        : `${WORKOUTS_API}?category=${workoutCategory}`;
      const response = await fetch(url);
      const data = await response.json();
      setWorkouts(data);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  };

  const handleAddWorkout = async () => {
    try {
      const workoutData = {
        ...newWorkout,
        exercises: exercises.filter(ex => ex.name && ex.sets)
      };

      const response = await fetch(WORKOUTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData)
      });

      if (response.ok) {
        setIsAddWorkoutDialogOpen(false);
        setNewWorkout({
          title: '',
          description: '',
          category: 'cardio',
          duration_minutes: 0,
          difficulty: 'beginner',
          calories: 0,
          published_date: new Date().toISOString().split('T')[0],
          video_base64: ''
        });
        setExercises([{ name: '', sets: '', rest_seconds: 0 }]);
        loadWorkouts();
      }
    } catch (error) {
      console.error('Failed to add workout:', error);
    }
  };

  const addExercise = () => {
    if (exercises.length < 10) {
      setExercises([...exercises, { name: '', sets: '', rest_seconds: 0 }]);
    }
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1] || '';
        setNewWorkout({ ...newWorkout, video_base64: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const stats: Array<{
    title: string;
    value: string;
    change: string;
    icon: string;
    trend: string;
  }> = [
    {
      title: 'Всего пользователей',
      value: '1,284',
      change: '+12.5%',
      icon: 'Users',
      trend: 'up'
    },
    {
      title: 'Активных подписок',
      value: '847',
      change: '+8.2%',
      icon: 'CreditCard',
      trend: 'up'
    },
    {
      title: 'Доход (месяц)',
      value: '₽838,530',
      change: '+15.3%',
      icon: 'TrendingUp',
      trend: 'up'
    },
    {
      title: 'Новые за 7 дней',
      value: '156',
      change: '+23.1%',
      icon: 'UserPlus',
      trend: 'up'
    }
  ];

  const recentUsers = [
    {
      id: 1,
      name: 'Алексей Иванов',
      email: 'alexey@example.com',
      plan: 'Премиум',
      status: 'active',
      joinedDate: '15.02.2026',
      lastActive: '2 часа назад'
    },
    {
      id: 2,
      name: 'Мария Петрова',
      email: 'maria@example.com',
      plan: 'Стандарт',
      status: 'active',
      joinedDate: '14.02.2026',
      lastActive: '5 часов назад'
    },
    {
      id: 3,
      name: 'Дмитрий Сидоров',
      email: 'dmitry@example.com',
      plan: 'Премиум',
      status: 'active',
      joinedDate: '13.02.2026',
      lastActive: '1 день назад'
    },
    {
      id: 4,
      name: 'Елена Васильева',
      email: 'elena@example.com',
      plan: 'Базовый',
      status: 'inactive',
      joinedDate: '12.02.2026',
      lastActive: '3 дня назад'
    },
    {
      id: 5,
      name: 'Сергей Козлов',
      email: 'sergey@example.com',
      plan: 'Стандарт',
      status: 'active',
      joinedDate: '11.02.2026',
      lastActive: '6 часов назад'
    }
  ];

  const subscriptions = [
    {
      id: 1,
      user: 'Алексей Иванов',
      plan: 'Премиум',
      amount: '₽990',
      status: 'active',
      nextBilling: '15.03.2026',
      startDate: '15.01.2026'
    },
    {
      id: 2,
      user: 'Мария Петрова',
      plan: 'Стандарт',
      amount: '₽690',
      status: 'active',
      nextBilling: '14.03.2026',
      startDate: '14.01.2026'
    },
    {
      id: 3,
      user: 'Дмитрий Сидоров',
      plan: 'Премиум',
      amount: '₽990',
      status: 'active',
      nextBilling: '13.03.2026',
      startDate: '13.01.2026'
    },
    {
      id: 4,
      user: 'Елена Васильева',
      plan: 'Базовый',
      amount: '₽390',
      status: 'cancelled',
      nextBilling: '-',
      startDate: '12.01.2026'
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">Активен</Badge>;
    }
    if (status === 'cancelled') {
      return <Badge variant="secondary">Отменена</Badge>;
    }
    return <Badge variant="secondary">Неактивен</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#748c6d] mb-2">
              Панель администратора
            </h1>
            <p className="text-[#4a5446]">
              Управление пользователями и подписками
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Icon name="ArrowLeft" size={20} />
            На главную
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#4a5446]">
                  {stat.title}
                </CardTitle>
                <Icon name={stat.icon} size={20} className="text-[#748c6d]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#748c6d]">{stat.value}</div>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                  <Icon name="TrendingUp" size={14} />
                  {stat.change} от прошлого месяца
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur">
            <TabsTrigger value="users" className="gap-2">
              <Icon name="Users" size={18} />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Icon name="CreditCard" size={18} />
              Подписки
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Icon name="BarChart3" size={18} />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2">
              <Icon name="BookOpen" size={18} />
              Библиотека
            </TabsTrigger>
            <TabsTrigger value="trainings" className="gap-2">
              <Icon name="Dumbbell" size={18} />
              Тренировки
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="gap-2">
              <Icon name="Apple" size={18} />
              Питание
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#748c6d]">Пользователи</CardTitle>
                    <CardDescription>
                      Управление учетными записями пользователей
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Поиск..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                    <Button className="bg-[#748c6d] hover:bg-[#5f7459]">
                      <Icon name="UserPlus" size={18} className="mr-2" />
                      Добавить
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>План</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата регистрации</TableHead>
                      <TableHead>Последняя активность</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-[#748c6d]">{user.name}</div>
                            <div className="text-sm text-[#4a5446]/60">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#748c6d]/20">
                            {user.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-[#4a5446]/80">{user.joinedDate}</TableCell>
                        <TableCell className="text-[#4a5446]/80">{user.lastActive}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Icon name="MoreHorizontal" size={18} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <CardTitle className="text-[#748c6d]">Подписки</CardTitle>
                <CardDescription>
                  Активные и отмененные подписки
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>План</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Следующий платеж</TableHead>
                      <TableHead>Дата начала</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium text-[#748c6d]">
                          {sub.user}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#748c6d]/20">
                            {sub.plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-[#748c6d]">
                          {sub.amount}
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell className="text-[#4a5446]/80">{sub.nextBilling}</TableCell>
                        <TableCell className="text-[#4a5446]/80">{sub.startDate}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Icon name="MoreHorizontal" size={18} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <CardTitle className="text-[#748c6d]">Аналитика</CardTitle>
                <CardDescription>
                  Графики и статистика (в разработке)
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-[#4a5446]/60">
                  <Icon name="BarChart3" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Раздел аналитики будет добавлен позже</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#748c6d]">Библиотека</CardTitle>
                    <CardDescription>
                      Управление статьями по категориям
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все категории</SelectItem>
                        <SelectItem value="nutrition">Питание</SelectItem>
                        <SelectItem value="training">Тренировки</SelectItem>
                        <SelectItem value="health">Здоровье</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#748c6d] hover:bg-[#5f7459]">
                          <Icon name="Plus" size={18} className="mr-2" />
                          Добавить статью
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Новая статья</DialogTitle>
                          <DialogDescription>
                            Добавьте статью в библиотеку
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Название</Label>
                            <Input
                              id="title"
                              value={newArticle.title}
                              onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                              placeholder="Введите название статьи"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="category">Категория</Label>
                            <Select 
                              value={newArticle.category} 
                              onValueChange={(value: 'nutrition' | 'training' | 'health') => 
                                setNewArticle({...newArticle, category: value})
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nutrition">Питание</SelectItem>
                                <SelectItem value="training">Тренировки</SelectItem>
                                <SelectItem value="health">Здоровье</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="date">Дата публикации</Label>
                            <Input
                              id="date"
                              type="date"
                              value={newArticle.published_date}
                              onChange={(e) => setNewArticle({...newArticle, published_date: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="content">Текст статьи</Label>
                            <Textarea
                              id="content"
                              value={newArticle.content}
                              onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                              placeholder="Введите содержание статьи"
                              rows={8}
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                              Отмена
                            </Button>
                            <Button 
                              className="bg-[#748c6d] hover:bg-[#5f7459]"
                              onClick={handleAddArticle}
                              disabled={!newArticle.title || !newArticle.content}
                            >
                              Добавить
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Дата публикации</TableHead>
                      <TableHead className="text-right">Просмотры</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-[#4a5446]/60">
                          Нет статей
                        </TableCell>
                      </TableRow>
                    ) : (
                      articles.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium text-[#4a5446]">
                            {article.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-[#748c6d]/30">
                              {article.category === 'nutrition' && 'Питание'}
                              {article.category === 'training' && 'Тренировки'}
                              {article.category === 'health' && 'Здоровье'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[#4a5446]/80">
                            {new Date(article.published_date).toLocaleDateString('ru-RU')}
                          </TableCell>
                          <TableCell className="text-right text-[#4a5446]/80">
                            <div className="flex items-center justify-end gap-1">
                              <Icon name="Eye" size={14} />
                              {article.view_count}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteArticle(article.id)}
                            >
                              <Icon name="Trash2" size={16} className="text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainings" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#748c6d]">Тренировки</CardTitle>
                    <CardDescription>
                      Управление программами тренировок
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={workoutCategory} onValueChange={setWorkoutCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все категории</SelectItem>
                        <SelectItem value="cardio">Кардио</SelectItem>
                        <SelectItem value="strength">Сила</SelectItem>
                        <SelectItem value="flexibility">Гибкость</SelectItem>
                      </SelectContent>
                    </Select>

                    <Dialog open={isAddWorkoutDialogOpen} onOpenChange={setIsAddWorkoutDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#748c6d] hover:bg-[#5f7459]">
                          <Icon name="Plus" size={18} className="mr-2" />
                          Добавить тренировку
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Новая тренировка</DialogTitle>
                          <DialogDescription>
                            Добавьте тренировку в библиотеку
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="workout-title">Название</Label>
                            <Input
                              id="workout-title"
                              value={newWorkout.title}
                              onChange={(e) => setNewWorkout({...newWorkout, title: e.target.value})}
                              placeholder="Название тренировки"
                            />
                          </div>

                          <div>
                            <Label htmlFor="workout-description">Описание</Label>
                            <Textarea
                              id="workout-description"
                              value={newWorkout.description}
                              onChange={(e) => setNewWorkout({...newWorkout, description: e.target.value})}
                              placeholder="Краткое описание тренировки"
                              rows={2}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="workout-category">Категория</Label>
                              <Select
                                value={newWorkout.category}
                                onValueChange={(value: 'cardio' | 'strength' | 'flexibility') =>
                                  setNewWorkout({...newWorkout, category: value})
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cardio">Кардио</SelectItem>
                                  <SelectItem value="strength">Сила</SelectItem>
                                  <SelectItem value="flexibility">Гибкость</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="workout-difficulty">Уровень сложности</Label>
                              <Select
                                value={newWorkout.difficulty}
                                onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                                  setNewWorkout({...newWorkout, difficulty: value})
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="beginner">Начальный</SelectItem>
                                  <SelectItem value="intermediate">Средний</SelectItem>
                                  <SelectItem value="advanced">Продвинутый</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="workout-duration">Время (мин)</Label>
                              <Input
                                id="workout-duration"
                                type="number"
                                value={newWorkout.duration_minutes || ''}
                                onChange={(e) => setNewWorkout({...newWorkout, duration_minutes: parseInt(e.target.value) || 0})}
                              />
                            </div>

                            <div>
                              <Label htmlFor="workout-calories">Калории</Label>
                              <Input
                                id="workout-calories"
                                type="number"
                                value={newWorkout.calories || ''}
                                onChange={(e) => setNewWorkout({...newWorkout, calories: parseInt(e.target.value) || 0})}
                              />
                            </div>

                            <div>
                              <Label htmlFor="workout-date">Дата публикации</Label>
                              <Input
                                id="workout-date"
                                type="date"
                                value={newWorkout.published_date}
                                onChange={(e) => setNewWorkout({...newWorkout, published_date: e.target.value})}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="workout-video">Видео (опционально)</Label>
                            <Input
                              id="workout-video"
                              type="file"
                              accept="video/mp4"
                              onChange={handleVideoUpload}
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Упражнения</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addExercise}
                                disabled={exercises.length >= 10}
                              >
                                <Icon name="Plus" size={14} className="mr-1" />
                                Добавить
                              </Button>
                            </div>

                            {exercises.map((exercise, index) => (
                              <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1">
                                  <Input
                                    placeholder="Название упражнения"
                                    value={exercise.name}
                                    onChange={(e) => updateExercise(index, 'name', e.target.value)}
                                  />
                                </div>
                                <div className="w-32">
                                  <Input
                                    placeholder="Подходы"
                                    value={exercise.sets}
                                    onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                                  />
                                </div>
                                <div className="w-24">
                                  <Input
                                    type="number"
                                    placeholder="Отдых (сек)"
                                    value={exercise.rest_seconds || ''}
                                    onChange={(e) => updateExercise(index, 'rest_seconds', parseInt(e.target.value) || 0)}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeExercise(index)}
                                  disabled={exercises.length === 1}
                                >
                                  <Icon name="X" size={16} />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsAddWorkoutDialogOpen(false)}>
                              Отмена
                            </Button>
                            <Button
                              className="bg-[#748c6d] hover:bg-[#5f7459]"
                              onClick={handleAddWorkout}
                              disabled={!newWorkout.title || !newWorkout.duration_minutes || !newWorkout.calories}
                            >
                              Добавить
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Сложность</TableHead>
                      <TableHead className="text-right">Время</TableHead>
                      <TableHead className="text-right">Калории</TableHead>
                      <TableHead className="text-right">Просмотры</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workouts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-[#4a5446]/60">
                          Нет тренировок
                        </TableCell>
                      </TableRow>
                    ) : (
                      workouts.map((workout) => (
                        <TableRow key={workout.id}>
                          <TableCell className="font-medium text-[#4a5446]">
                            {workout.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-[#748c6d]/30">
                              {workout.category === 'cardio' && 'Кардио'}
                              {workout.category === 'strength' && 'Сила'}
                              {workout.category === 'flexibility' && 'Гибкость'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {workout.difficulty === 'beginner' && 'Начальный'}
                              {workout.difficulty === 'intermediate' && 'Средний'}
                              {workout.difficulty === 'advanced' && 'Продвинутый'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-[#4a5446]/80">
                            {workout.duration_minutes} мин
                          </TableCell>
                          <TableCell className="text-right text-[#4a5446]/80">
                            {workout.calories} ккал
                          </TableCell>
                          <TableCell className="text-right text-[#4a5446]/80">
                            <div className="flex items-center justify-end gap-1">
                              <Icon name="Eye" size={14} />
                              {workout.view_count}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <CardTitle className="text-[#748c6d]">Питание</CardTitle>
                <CardDescription>
                  Управление рецептами и планами питания
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-[#4a5446]/60">
                  <Icon name="Apple" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Раздел питания будет настроен позже</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}