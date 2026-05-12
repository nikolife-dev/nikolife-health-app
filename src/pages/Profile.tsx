import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import funcUrls from '../../backend/func2url.json';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import SubscriptionCard from '@/components/profile/SubscriptionCard';
import PricingComparison from '@/components/profile/PricingComparison';

export default function Profile() {
  const navigate = useNavigate();
  const { logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const { logs, clearLogs, logInfo, logSuccess, logError, logWarning } = useLiveLogs();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    avatar: '',
    telegram_username: '',
    selected_plan: '',
    receive_notifications: true
  });
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    receive_notifications: true
  });

  const [onboardingData, setOnboardingData] = useState({
    goal: '',
    activityLevel: '',
    age: '',
    weight: '',
    height: '',
    dietPreference: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    goal: '',
    activityLevel: '',
    age: '',
    weight: '',
    height: '',
    dietPreference: ''
  });

  const getPlanDetails = (planId: string) => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextBillingDate = nextMonth.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

    const plans: Record<string, { id: string; name: string; icon: string; price: number | string; nextBilling?: string; features: string[] }> = {
      'free': {
        id: 'free',
        name: 'Базовый',
        icon: 'Heart',
        price: 'Бесплатно',
        features: [
          'Базовые тренировки',
          'Простые рецепты',
          'Трекер привычек',
          'Общие советы'
        ]
      },
      'premium': {
        id: 'premium',
        name: 'Премиум',
        icon: 'Sparkles',
        price: 990,
        nextBilling: nextBillingDate,
        features: [
          'Персональный план питания',
          'Индивидуальные тренировки',
          'Неограниченные рецепты',
          'AI-помощник Николай',
          'Трекер сна и восстановления',
          'Детальная аналитика'
        ]
      },
      'family': {
        id: 'family',
        name: 'Семейный',
        icon: 'Users',
        price: 1490,
        nextBilling: nextBillingDate,
        features: [
          'Все возможности Премиум',
          'До 5 человек',
          'Семейные тренировки',
          'Общий план питания',
          'Семейная статистика',
          'Приоритетная поддержка'
        ]
      }
    };
    return plans[planId] || plans['free'];
  };

  const currentPlan = getPlanDetails(userProfile.selected_plan || 'free');

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
      email: userProfile.email,
      receive_notifications: userProfile.receive_notifications !== false
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
      logInfo(`Headers: X-Authorization=Bearer ${token.substring(0, 15)}...`);
      const response = await fetch(funcUrls.profile, {
        method: 'GET',
        headers: {
          'X-Authorization': `Bearer ${token}`
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
          
          if (data.user.onboarding_data) {
            logInfo('Данные онбординга найдены');
            setOnboardingData(data.user.onboarding_data);
            setSettingsForm(data.user.onboarding_data);
          } else {
            logWarning('Данные онбординга отсутствуют');
          }
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
        email: editForm.email,
        receive_notifications: editForm.receive_notifications
      };
      logInfo(`Body запроса: ${JSON.stringify(requestBody)}`);
      logInfo(`Headers: X-Authorization=Bearer ${token.substring(0, 15)}...`);
      
      const response = await fetch(funcUrls.profile, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
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
        await refreshUser();
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

  const handleSettingsClick = () => {
    logInfo('Открытие диалога настроек онбординга');
    setSettingsForm({
      goal: onboardingData.goal || '',
      activityLevel: onboardingData.activityLevel || '',
      age: onboardingData.age || '',
      weight: onboardingData.weight || '',
      height: onboardingData.height || '',
      dietPreference: onboardingData.dietPreference || ''
    });
    setIsSettingsDialogOpen(true);
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    logInfo('Начало сохранения настроек онбординга');
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      logError('Токен не найден при попытке сохранения настроек');
      setIsSavingSettings(false);
      return;
    }
    
    logInfo(`Новые данные онбординга: ${JSON.stringify(settingsForm)}`);
    
    try {
      logInfo('Отправка PUT запроса на /profile endpoint с onboarding_data');
      const requestBody = {
        onboarding_data: settingsForm
      };
      logInfo(`Body запроса: ${JSON.stringify(requestBody)}`);
      
      const response = await fetch(funcUrls.profile, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      logInfo(`Получен ответ: status=${response.status} ${response.statusText}`);
      const data = await response.json();
      logInfo(`Данные ответа: ${JSON.stringify(data).substring(0, 150)}...`);

      if (response.ok && data.success) {
        logSuccess('Настройки успешно обновлены на сервере');
        setOnboardingData(settingsForm);
        setIsSettingsDialogOpen(false);
        logInfo('Диалог настроек закрыт');
        
        toast({
          title: 'Настройки обновлены',
          description: 'Ваши данные успешно сохранены',
        });
      } else {
        logError(`Не удалось сохранить настройки: ${data.error || 'unknown error'}`);
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось сохранить настройки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      logError(`Критическая ошибка сохранения настроек: ${error instanceof Error ? error.message : 'unknown'}`);
      console.error('Settings update error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      logInfo('Завершение операции сохранения настроек (setIsSavingSettings=false)');
      setIsSavingSettings(false);
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
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 min-h-[44px]"
          >
            <Icon name="ArrowLeft" size={20} />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 min-h-[44px]"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-1 space-y-6">
            <ProfileHeader 
              userProfile={userProfile}
              currentPlan={currentPlan}
              onEditClick={handleEditClick}
              onSettingsClick={handleSettingsClick}
            />
            <ProfileStats userStats={userStats} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <SubscriptionCard 
              currentPlan={currentPlan}
              onChangePlan={() => navigate('/pricing')}
            />
            <PricingComparison 
              currentPlanId={userProfile.selected_plan || 'free'}
              onViewAllPlans={() => navigate('/pricing')}
            />
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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

            <div className="flex items-center justify-between p-3 rounded-lg border border-[#748c6d]/20 bg-[#748c6d]/5">
              <div className="space-y-0.5">
                <Label htmlFor="notifications-toggle" className="text-sm font-medium cursor-pointer">Получать рассылки</Label>
                <p className="text-xs text-[#4a5446]/60">Уведомления и новости в Telegram</p>
              </div>
              <Switch
                id="notifications-toggle"
                checked={editForm.receive_notifications}
                onCheckedChange={(checked) => setEditForm({ ...editForm, receive_notifications: checked })}
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

      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Настройки профиля</DialogTitle>
            <DialogDescription>
              Измените ваши цели и параметры здоровья
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Главная цель</Label>
              <Select value={settingsForm.goal} onValueChange={(value) => setSettingsForm({ ...settingsForm, goal: value })}>
                <SelectTrigger id="goal">
                  <SelectValue placeholder="Выберите цель" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_weight">Снижение веса</SelectItem>
                  <SelectItem value="gain_muscle">Набор мышечной массы</SelectItem>
                  <SelectItem value="maintain">Поддержание формы</SelectItem>
                  <SelectItem value="improve_health">Улучшение общего здоровья</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityLevel">Уровень активности</Label>
              <Select value={settingsForm.activityLevel} onValueChange={(value) => setSettingsForm({ ...settingsForm, activityLevel: value })}>
                <SelectTrigger id="activityLevel">
                  <SelectValue placeholder="Выберите уровень активности" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Малоактивный (офисная работа)</SelectItem>
                  <SelectItem value="light">Легкая активность (1-2 тренировки/неделю)</SelectItem>
                  <SelectItem value="moderate">Умеренная активность (3-4 тренировки/неделю)</SelectItem>
                  <SelectItem value="active">Активный (5-6 тренировок/неделю)</SelectItem>
                  <SelectItem value="very_active">Очень активный (ежедневные тренировки)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Возраст (лет)</Label>
                <Input
                  id="age"
                  type="number"
                  value={settingsForm.age}
                  onChange={(e) => setSettingsForm({ ...settingsForm, age: e.target.value })}
                  placeholder="25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Вес (кг)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={settingsForm.weight}
                  onChange={(e) => setSettingsForm({ ...settingsForm, weight: e.target.value })}
                  placeholder="70"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Рост (см)</Label>
                <Input
                  id="height"
                  type="number"
                  value={settingsForm.height}
                  onChange={(e) => setSettingsForm({ ...settingsForm, height: e.target.value })}
                  placeholder="175"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietPreference">Предпочтения в питании</Label>
              <Select value={settingsForm.dietPreference} onValueChange={(value) => setSettingsForm({ ...settingsForm, dietPreference: value })}>
                <SelectTrigger id="dietPreference">
                  <SelectValue placeholder="Выберите тип питания" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_preference">Без ограничений</SelectItem>
                  <SelectItem value="vegetarian">Вегетарианство</SelectItem>
                  <SelectItem value="vegan">Веганство</SelectItem>
                  <SelectItem value="pescatarian">Пескетарианство</SelectItem>
                  <SelectItem value="keto">Кето-диета</SelectItem>
                  <SelectItem value="paleo">Палео-диета</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSettingsDialogOpen(false)}
              disabled={isSavingSettings}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="bg-gradient-to-r from-[#748c6d] to-[#5a7052] hover:from-[#5a7052] hover:to-[#4a5f42]"
            >
              {isSavingSettings ? (
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