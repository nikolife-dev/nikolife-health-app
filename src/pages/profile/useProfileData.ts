import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import funcUrls from '../../../backend/func2url.json';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLiveLogs } from '@/components/LiveLogs';

export function useProfileData() {
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

  return {
    navigate,
    logs,
    clearLogs,
    isLoggingOut,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isSettingsDialogOpen,
    setIsSettingsDialogOpen,
    isSaving,
    isSavingSettings,
    userProfile,
    isLoadingProfile,
    editForm,
    setEditForm,
    settingsForm,
    setSettingsForm,
    currentPlan,
    userStats,
    handleLogout,
    handleEditClick,
    handleSaveProfile,
    handleSettingsClick,
    handleSaveSettings,
  };
}
