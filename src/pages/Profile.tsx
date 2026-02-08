import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const { logs, clearLogs, logInfo, logSuccess, logError, logWarning } = useLiveLogs();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    avatar: '',
    telegram_username: '',
    selected_plan: ''
  });
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });

  const currentPlan = {
    id: 'premium',
    name: 'Премиум',
    icon: 'Sparkles',
    price: 990,
    nextBilling: '15 марта 2026',
    features: [
      'Персональный план питания',
      'Индивидуальные тренировки',
      'Неограниченные рецепты',
      'AI-помощник Николай',
      'Трекер сна и восстановления',
      'Детальная аналитика'
    ]
  };

  const userStats = {
    workoutsCompleted: 24,
    totalWorkouts: 30,
    streakDays: 12,
    caloriesTracked: 85,
    recipesUsed: 18
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logInfo('Начало процесса выхода из системы');
    try {
      logInfo('Вызов функции logout()...');
      await logout();
      logSuccess('Выход выполнен успешно');
      logInfo('Очистка токена из localStorage');
      localStorage.removeItem('auth_token');
      logInfo('Перенаправление на страницу авторизации');
      navigate('/auth');
    } catch (error) {
      logError(`Ошибка при выходе: ${error instanceof Error ? error.message : 'неизвестная'}`);
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    logInfo('Инициализация страницы профиля');
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditClick = () => {
    logInfo('Открытие диалога редактирования профиля');
    logInfo(`Текущие данные: name="${userProfile.name}", email="${userProfile.email}"`);
    setEditForm({
      name: userProfile.name,
      email: userProfile.email
    });
    setIsEditDialogOpen(true);
  };

  const loadProfile = async () => {
    logInfo('Загрузка профиля пользователя...');
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      logError('Токен авторизации не найден в localStorage');
      logWarning('Перенаправление на страницу авторизации');
      navigate('/auth');
      return;
    }
    
    logInfo(`Токен найден: ${token.substring(0, 10)}...`);

    try {
      logInfo('Отправка GET запроса на /profile endpoint');
      const response = await fetch('https://functions.poehali.dev/85f035ff-be32-471e-ad21-ad58c128096c', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logInfo(`Получен ответ: status=${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        logInfo(`Данные профиля получены: ${JSON.stringify(data).substring(0, 150)}...`);
        
        if (data.success) {
          logSuccess(`Профиль загружен успешно: user=${data.user.name}, email=${data.user.email}`);
          logInfo(`План: ${data.user.selected_plan || 'не выбран'}`);
          logInfo(`Telegram: ${data.user.telegram_username || 'не привязан'}`);
          setUserProfile(data.user);
        } else {
          logError('Ответ содержит success=false');
        }
      } else {
        logError(`HTTP ошибка ${response.status}: перенаправление на /login`);
        navigate('/login');
      }
    } catch (error) {
      logError(`Критическая ошибка загрузки профиля: ${error instanceof Error ? error.message : 'unknown'}`);
      console.error('Profile load error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить профиль',
        variant: 'destructive'
      });
    } finally {
      logInfo('Завершение загрузки профиля (setIsLoadingProfile=false)');
      setIsLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    logInfo('Начало сохранения профиля');
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      logError('Токен не найден при попытке сохранения');
      setIsSaving(false);
      return;
    }
    
    logInfo(`Изменения: name="${editForm.name}" (было "${userProfile.name}")`);
    logInfo(`Изменения: email="${editForm.email}" (было "${userProfile.email}")`);
    
    try {
      logInfo('Отправка PUT запроса на /profile endpoint');
      const requestBody = {
        name: editForm.name,
        email: editForm.email
      };
      logInfo(`Body запроса: ${JSON.stringify(requestBody)}`);
      
      const response = await fetch('https://functions.poehali.dev/85f035ff-be32-471e-ad21-ad58c128096c', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      logInfo(`Получен ответ: status=${response.status} ${response.statusText}`);
      const data = await response.json();
      logInfo(`Данные ответа: ${JSON.stringify(data).substring(0, 150)}...`);

      if (response.ok && data.success) {
        logSuccess('Профиль успешно обновлён на сервере');
        logInfo(`Новые данные: name="${data.user.name}", email="${data.user.email}"`);
        setUserProfile(data.user);
        setIsEditDialogOpen(false);
        logInfo('Диалог редактирования закрыт');
        
        toast({
          title: 'Профиль обновлен',
          description: 'Ваши данные успешно сохранены',
        });
      } else {
        logError(`Не удалось сохранить: ${data.error || 'unknown error'}`);
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось сохранить данные',
          variant: 'destructive'
        });
      }
    } catch (error) {
      logError(`Критическая ошибка сохранения: ${error instanceof Error ? error.message : 'unknown'}`);
      console.error('Profile update error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить данные',
        variant: 'destructive'
      });
    } finally {
      logInfo('Завершение операции сохранения (setIsSaving=false)');
      setIsSaving(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Icon name="ArrowLeft" size={20} />
            Назад
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
          >
            {isLoggingOut ? (
              <>
                <Icon name="Loader2" size={20} className="animate-spin" />
                Выход...
              </>
            ) : (
              <>
                <Icon name="LogOut" size={20} />
                Выйти
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="w-32 h-32">
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-[#748c6d] to-[#5a7052] text-white">
                    {userProfile.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
                  <p className="text-gray-600 mt-1">{userProfile.email}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleEditClick}
                  className="w-full gap-2"
                >
                  <Icon name="Edit2" size={16} />
                  Редактировать профиль
                </Button>
                <Badge className="bg-gradient-to-r from-[#748c6d] to-[#5a7052] text-white">
                  <Icon name={currentPlan.icon as "Sparkles"} size={14} className="mr-1" />
                  {currentPlan.name}
                </Badge>
              </div>
            </Card>

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
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Текущий тариф</h2>
                    <p className="text-gray-600">Управляйте своей подпиской</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#748c6d] to-[#5a7052] flex items-center justify-center">
                    <Icon name={currentPlan.icon as "Sparkles"} size={32} className="text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-[#e8e6dc] to-[#d8d5c5] rounded-xl">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Тарифный план</div>
                    <div className="text-3xl font-bold text-gray-900">{currentPlan.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Стоимость</div>
                    <div className="text-3xl font-bold text-gray-900">{currentPlan.price} ₽</div>
                    <div className="text-sm text-gray-600">в месяц</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Следующее списание</div>
                    <div className="text-lg font-semibold text-gray-900">{currentPlan.nextBilling}</div>
                  </div>
                  <div className="flex items-end">
                    <Badge variant="outline" className="border-[#748c6d] text-[#748c6d]">
                      <Icon name="CheckCircle2" size={14} className="mr-1" />
                      Активна
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Возможности вашего тарифа</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                        <Icon name="CheckCircle2" size={20} className="flex-shrink-0 text-[#748c6d] mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="flex-1 h-12 bg-gradient-to-r from-[#748c6d] to-[#5a7052] hover:from-[#5a7052] hover:to-[#4a5f42]"
                  >
                    <Icon name="Sparkles" size={20} className="mr-2" />
                    Изменить тариф
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    <Icon name="CreditCard" size={20} className="mr-2" />
                    Управление оплатой
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Сравнение тарифов</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Icon name="Heart" size={24} className="text-gray-600" />
                      </div>
                      <h4 className="font-bold text-gray-900">Базовый</h4>
                      <div className="text-2xl font-bold text-gray-900">Бесплатно</div>
                      <p className="text-xs text-gray-600">Для начинающих</p>
                    </div>
                  </div>

                  <div className="p-6 border-2 border-[#748c6d] rounded-xl bg-gradient-to-br from-[#748c6d] to-[#5a7052] relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white text-[#748c6d]">Текущий</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                        <Icon name="Sparkles" size={24} className="text-white" />
                      </div>
                      <h4 className="font-bold text-white">Премиум</h4>
                      <div className="text-2xl font-bold text-white">990 ₽</div>
                      <p className="text-xs text-white text-opacity-90">Полный доступ</p>
                    </div>
                  </div>

                  <div className="p-6 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Icon name="Users" size={24} className="text-gray-600" />
                      </div>
                      <h4 className="font-bold text-gray-900">Семейный</h4>
                      <div className="text-2xl font-bold text-gray-900">1 490 ₽</div>
                      <p className="text-xs text-gray-600">До 5 человек</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate('/pricing')}
                  className="w-full h-12"
                >
                  Посмотреть все тарифы
                  <Icon name="ArrowRight" size={20} className="ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
            <DialogDescription>
              Измените свои личные данные
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Полное имя</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Введите ваше имя"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Введите ваш email"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving || !editForm.name.trim() || !editForm.email.trim()}
              className="bg-gradient-to-r from-[#748c6d] to-[#5a7052] hover:from-[#5a7052] hover:to-[#4a5f42]"
            >
              {isSaving ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <LiveLogs logs={logs} onClear={clearLogs} position="bottom-right" />
    </div>
  );
}