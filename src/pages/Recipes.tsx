import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

export default function Recipes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const categories = ['завтрак', 'обед', 'ужин', 'перекус'];
  
  // Для бесплатного тарифа - ограничение 30 рецептов
  const isFreeUser = user?.selected_plan === 'free';
  const recipeLimit = isFreeUser ? 30 : 1000;

  useEffect(() => {
    loadRecipes();
  }, [category]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <Icon name="ArrowLeft" size={20} />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Рецепты</h1>
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
                        name={recipe.is_favorite ? 'Star' : 'Star'}
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

                  <Badge className="bg-[#748c6d]">{recipe.category}</Badge>
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
    </div>
  );
}