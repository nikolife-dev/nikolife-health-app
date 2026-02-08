import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
}

interface WeekDate {
  day_number: number;
  date: string;
  day_name: string;
}

export default function Recipes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddToMenu, setShowAddToMenu] = useState(false);
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [isAddingToMenu, setIsAddingToMenu] = useState(false);

  const categories = ['завтрак', 'обед', 'ужин'];
  const meals = { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин' };
  
  // Для бесплатного тарифа - ограничение 30 рецептов
  const isFreeUser = user?.selected_plan === 'free';
  const recipeLimit = isFreeUser ? 30 : 1000;

  useEffect(() => {
    loadRecipes();
    loadWeekDates();
  }, [category]);

  useEffect(() => {
    // Если пришли с параметрами для добавления в меню
    const addToMenu = searchParams.get('addToMenu');
    const day = searchParams.get('day');
    const meal = searchParams.get('meal');
    
    if (addToMenu === 'true' && day && meal) {
      setSelectedDay(parseInt(day));
      setSelectedMeal(meal);
    }
  }, [searchParams]);

  const loadWeekDates = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(
        'https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6',
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
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      params.append('limit', recipeLimit.toString());

      const response = await fetch(
        `https://functions.poehali.dev/1fb55aac-7fec-4f7c-a5a0-625b2cfed416?${params}`,
        {
          headers: token ? { 'X-Auth-Token': token } : {}
        }
      );

      const data = await response.json();
      if (data.recipes) {
        setRecipes(data.recipes);
      }
    } catch (error) {
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
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: 'Требуется авторизация',
          description: 'Войдите, чтобы добавлять в избранное',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(
        `https://functions.poehali.dev/1fb55aac-7fec-4f7c-a5a0-625b2cfed416/${recipeId}/favorite`,
        {
          method: 'POST',
          headers: { 'X-Auth-Token': token }
        }
      );

      const data = await response.json();
      if (data.success) {
        setRecipes(recipes.map(r =>
          r.id === recipeId ? { ...r, is_favorite: data.is_favorite } : r
        ));
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить избранное',
        variant: 'destructive'
      });
    }
  };

  const openAddToMenuDialog = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowAddToMenu(true);
  };

  const addToMenu = async () => {
    if (!selectedRecipe || !selectedDay || !selectedMeal) return;

    setIsAddingToMenu(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        'https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6',
        {
          method: 'POST',
          headers: { 
            'X-Auth-Token': token!, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            day_of_week: selectedDay,
            meal_type: selectedMeal,
            recipe_id: selectedRecipe.id
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({ 
          title: 'Добавлено!', 
          description: 'Рецепт добавлен в план питания' 
        });
        setShowAddToMenu(false);
        setSelectedRecipe(null);
        
        // Если пришли с параметрами, возвращаемся на главную с секцией "Питание"
        if (searchParams.get('addToMenu') === 'true') {
          navigate('/?section=nutrition');
        }
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить в план',
        variant: 'destructive'
      });
    } finally {
      setIsAddingToMenu(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <Icon name="ArrowLeft" size={20} />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Все рецепты</h1>
          <div className="w-24" />
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

        <Card className="p-6">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Поиск рецептов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadRecipes()}
              className="max-w-xs"
            />
            <Button onClick={loadRecipes}>
              <Icon name="Search" size={20} className="mr-2" />
              Найти
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Badge
              className={`cursor-pointer ${!category ? 'bg-[#748c6d]' : 'bg-gray-300'}`}
              onClick={() => setCategory('')}
            >
              Все
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                className={`cursor-pointer ${category === cat ? 'bg-[#748c6d]' : 'bg-gray-300'}`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                      onClick={() => toggleFavorite(recipe.id)}
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

                  <Button
                    onClick={() => openAddToMenuDialog(recipe)}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    <Icon name="CalendarPlus" size={16} className="mr-2" />
                    Добавить в план питания
                  </Button>
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

      {/* Add to Menu Dialog */}
      <Dialog open={showAddToMenu} onOpenChange={setShowAddToMenu}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить в план питания</DialogTitle>
            <DialogDescription>
              Выберите день и прием пищи для рецепта "{selectedRecipe?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Day Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите день
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {weekDates.map((day) => (
                  <button
                    key={day.day_number}
                    onClick={() => setSelectedDay(day.day_number)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedDay === day.day_number
                        ? 'border-[#748c6d] bg-[#748c6d] bg-opacity-10'
                        : 'border-gray-300 hover:border-[#748c6d]'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{day.day_name}</p>
                    <p className="text-sm text-gray-600">{formatDate(day.date)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите прием пищи
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(meals).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMeal(key)}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      selectedMeal === key
                        ? 'border-[#748c6d] bg-[#748c6d] bg-opacity-10'
                        : 'border-gray-300 hover:border-[#748c6d]'
                    }`}
                  >
                    <p className="font-medium text-sm">{label}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={addToMenu}
              disabled={!selectedDay || !selectedMeal || isAddingToMenu}
              className="w-full bg-[#748c6d] hover:bg-[#5a7052]"
            >
              {isAddingToMenu ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                'Добавить'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}