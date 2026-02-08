import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: number;
  day_of_week: number;
  meal_type: string;
  recipe: {
    id: number;
    title: string;
    cooking_time: number;
    calories: number;
  };
}

export default function WeeklyMenu() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekStart, setWeekStart] = useState('');

  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const meals = { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус' };

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await fetch(
        'https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6',
        { headers: { 'X-Auth-Token': token } }
      );

      const data = await response.json();
      if (data.menu) {
        setMenu(data.menu);
        setWeekStart(data.week_start_date);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить меню',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMenu = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        'https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6/generate',
        {
          method: 'POST',
          headers: { 'X-Auth-Token': token!, 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Успешно!', description: `Сгенерировано ${data.generated_count} блюд` });
        loadMenu();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сгенерировать меню',
        variant: 'destructive'
      });
    }
  };

  const getMenuForDay = (day: number) => {
    return menu.filter(m => m.day_of_week === day);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <Icon name="ArrowLeft" size={20} />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Меню на неделю</h1>
          <Button onClick={generateMenu} className="bg-[#748c6d] hover:bg-[#5a7052]">
            <Icon name="Wand2" size={20} className="mr-2" />
            Сгенерировать
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
          </div>
        ) : (
          <div className="space-y-6">
            {days.map((day, index) => {
              const dayMenu = getMenuForDay(index + 1);
              return (
                <Card key={index} className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{day}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(meals).map(([key, label]) => {
                      const meal = dayMenu.find(m => m.meal_type === key);
                      return (
                        <div key={key} className="border rounded-lg p-4 bg-white">
                          <h4 className="font-semibold text-sm text-gray-500 mb-2">{label}</h4>
                          {meal ? (
                            <div>
                              <p className="font-medium text-gray-900">{meal.recipe.title}</p>
                              <div className="flex gap-3 text-xs text-gray-500 mt-2">
                                <span className="flex items-center gap-1">
                                  <Icon name="Clock" size={12} />
                                  {meal.recipe.cooking_time}м
                                </span>
                                <span className="flex items-center gap-1">
                                  <Icon name="Flame" size={12} />
                                  {meal.recipe.calories} ккал
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm">Не выбрано</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
