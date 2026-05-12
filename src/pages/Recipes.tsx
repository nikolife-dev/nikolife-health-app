import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import funcUrls from '../../backend/func2url.json';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';
import RecipeDetailsDialog from '@/components/index/nutrition/RecipeDetailsDialog';

interface Recipe {
  id: number;
  title: string;
  description: string;
  cooking_time: number;
  servings: number;
  calories: number;
  image_url: string;
  category: string;
  is_favorite: boolean;
  ingredients?: string[];
  instructions?: string;
}

interface WeekDate {
  day_number: number;
  date: string;
  day_name: string;
}

export default function Recipes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { logs, clearLogs, logInfo, logSuccess, logError } = useLiveLogs();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);

  const categories = [
    'Гарниры',
    'Десерты',
    'Завтраки',
    'Закуски',
    'Ланч-боксы',
    'Напитки',
    'Основные блюда',
    'Перекусы',
    'Салаты',
    'Смузи',
    'Соусы и заправки',
    'Супы',
    'Хлеб без глютена'
  ];
  
  // Для бесплатного тарифа - ограничение 30 рецептов
  const isFreeUser = user?.selected_plan === 'free';
  const recipeLimit = isFreeUser ? 30 : 1000;

  useEffect(() => {
    logInfo('Загрузка страницы рецептов');
    loadRecipes();
    loadWeekDates();
  }, [category]);



  const loadWeekDates = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(
        funcUrls['weekly-menu'],
        { headers: { 'X-Auth-Token': token } }
      );

      const data = await response.json();
      if (data.week_dates) {
        setWeekDates(data.week_dates);
      }
    } catch (error) {
      console.error('Failed to load week dates:', error);
    }
  };

  const loadRecipes = async () => {
    setIsLoading(true);
    logInfo(`Загрузка рецептов: category=${category || 'все'}, search=${search || 'нет'}`);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      params.append('limit', recipeLimit.toString());

      const response = await fetch(
        `${funcUrls.recipes}?${params}`,
        {
          headers: token ? { 'X-Auth-Token': token } : {}
        }
      );

      const data = await response.json();
      if (data.recipes) {
        logSuccess(`Загружено ${data.recipes.length} рецептов`);
        setRecipes(data.recipes);
      }
    } catch (error) {
      logError('Не удалось загрузить рецепты');
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить рецепты',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (recipeId: number) => {
    logInfo(`Переключение избранного для рецепта #${recipeId}`);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        logError('Нет токена авторизации');
        toast({
          title: 'Требуется авторизация',
          description: 'Войдите, чтобы добавлять в избранное',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(
        `${funcUrls.recipes}/${recipeId}/favorite`,
        {
          method: 'POST',
          headers: { 'X-Auth-Token': token }
        }
      );

      const data = await response.json();
      if (data.success) {
        logSuccess(`Избранное обновлено: ${data.is_favorite ? 'добавлено' : 'удалено'}`);
        setRecipes(recipes.map(r =>
          r.id === recipeId ? { ...r, is_favorite: data.is_favorite } : r
        ));
      }
    } catch (error) {
      logError('Не удалось обновить избранное');
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить избранное',
        variant: 'destructive'
      });
    }
  };







  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/?section=nutrition')} className="gap-2 min-h-[44px]">
            <Icon name="ArrowLeft" size={20} />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Все рецепты</h1>
          <div className="w-12 sm:w-24" />
        </div>

        {isFreeUser && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <strong>Бесплатный тариф:</strong> Доступно 30 рецептов.{' '}
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-[#748c6d] hover:underline font-semibold"
                  >
                    Обновите тариф
                  </button>
                  {' '}для полного доступа ко всем рецептам.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Поиск рецептов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadRecipes()}
              className="flex-1 max-w-xs"
            />
            <Button onClick={loadRecipes} className="min-h-[44px]">
              <Icon name="Search" size={20} className="mr-2" />
              Найти
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge
              className={`cursor-pointer min-h-[36px] px-3 ${!category ? 'bg-[#748c6d]' : 'bg-gray-300'}`}
              onClick={() => setCategory('')}
            >
              Все
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                className={`cursor-pointer min-h-[36px] px-3 ${category === cat ? 'bg-[#748c6d]' : 'bg-gray-300'}`}
                onClick={() => setCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Badge>
            ))}
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recipes.map((recipe) => (
              <Card 
                key={recipe.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedRecipe(recipe)}
              >
                {recipe.image_url && (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{recipe.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe.id);
                      }}
                      className="text-yellow-500 hover:text-yellow-600 transition-colors"
                    >
                      <Icon
                        name="Star"
                        size={24}
                        className={recipe.is_favorite ? 'fill-current' : ''}
                      />
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2">{recipe.description}</p>

                  <div className="flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Icon name="Clock" size={16} />
                      {recipe.cooking_time} мин
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Users" size={16} />
                      {recipe.servings} порц.
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Flame" size={16} />
                      {recipe.calories} ккал
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Badge className="bg-[#748c6d]">{recipe.category}</Badge>
                  </div>


                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && recipes.length === 0 && (
          <Card className="p-12 text-center">
            <Icon name="UtensilsCrossed" size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Рецепты не найдены</h3>
            <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
          </Card>
        )}
      </div>

      <RecipeDetailsDialog 
        recipe={selectedRecipe} 
        onClose={() => setSelectedRecipe(null)}
        weekDates={weekDates}
      />
      
      <LiveLogs logs={logs} onClear={clearLogs} position="bottom-right" />
    </div>
  );
}