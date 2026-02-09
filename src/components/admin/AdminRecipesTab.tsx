import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';
import AddRecipeDialog from './recipes/AddRecipeDialog';
import EditRecipeDialog from './recipes/EditRecipeDialog';

const RECIPES_API = 'https://functions.poehali.dev/1fb55aac-7fec-4f7c-a5a0-625b2cfed416';

interface Recipe {
  id: number;
  title: string;
  description: string;
  cooking_time: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image_url: string | null;
  category: string[];
  ingredients: string[];
  instructions: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminRecipesTab() {
  const { toast } = useToast();
  const { logs, clearLogs, logInfo, logSuccess, logError } = useLiveLogs();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const categories = [
    'all',
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

  useEffect(() => {
    loadRecipes();
  }, [category]);

  const loadRecipes = async () => {
    setIsLoading(true);
    logInfo(`[LOAD] Загрузка рецептов: category=${category}, search=${search || 'нет'}`);
    
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (search) params.append('search', search);
      params.append('limit', '1000');

      const url = `${RECIPES_API}${params.toString() ? '?' + params.toString() : ''}`;
      logInfo(`[LOAD] URL: ${url}`);

      const response = await fetch(url, {
        headers: token ? { 'X-Auth-Token': token } : {}
      });

      const data = await response.json();
      
      if (data.recipes) {
        logSuccess(`[LOAD] Загружено ${data.recipes.length} рецептов`);
        setRecipes(data.recipes);
      } else {
        logError('[LOAD] Нет поля recipes в ответе');
      }
    } catch (error) {
      logError(`[LOAD] Ошибка: ${error instanceof Error ? error.message : 'unknown'}`);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить рецепты',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот рецепт?')) return;

    console.log('[DeleteRecipe] Начало удаления рецепта', { id });
    logInfo(`[DELETE] Удаление рецепта #${id}`);
    
    try {
      const token = localStorage.getItem('auth_token');
      console.log('[DeleteRecipe] Токен получен', { hasToken: !!token });
      
      const url = `${RECIPES_API}?id=${id}`;
      console.log('[DeleteRecipe] Отправка DELETE запроса', { url, id });
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': token! }
      });

      console.log('[DeleteRecipe] Ответ получен', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText 
      });

      if (response.ok) {
        console.log('[DeleteRecipe] ✅ Рецепт успешно удален');
        logSuccess(`[DELETE] Рецепт #${id} удален`);
        toast({ title: 'Успешно', description: 'Рецепт удален' });
        loadRecipes();
      } else {
        const data = await response.json();
        console.error('[DeleteRecipe] ❌ Ошибка от сервера', { error: data.error, data });
        logError(`[DELETE] Ошибка: ${data.error || 'unknown'}`);
        throw new Error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('[DeleteRecipe] ❌ Ошибка при удалении', { 
        error, 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined 
      });
      logError(`[DELETE] Exception: ${error instanceof Error ? error.message : 'unknown'}`);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить рецепт',
        variant: 'destructive'
      });
    }
    console.log('[DeleteRecipe] Завершение операции');
  };

  const handleEdit = (recipe: Recipe) => {
    logInfo(`[EDIT] Открытие редактирования рецепта #${recipe.id}`);
    setEditingRecipe(recipe);
    setIsEditDialogOpen(true);
  };

  const handleToggleActive = async (recipe: Recipe) => {
    const newStatus = !recipe.is_active;
    logInfo(`[TOGGLE] Изменение статуса рецепта #${recipe.id}: ${recipe.is_active ? 'Активен' : 'Скрыт'} → ${newStatus ? 'Активен' : 'Скрыт'}`);
    
    try {
      const token = localStorage.getItem('auth_token');
      const url = `${RECIPES_API}?id=${recipe.id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'X-Auth-Token': token!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (response.ok) {
        logSuccess(`[TOGGLE] Статус рецепта #${recipe.id} изменен на: ${newStatus ? 'Активен' : 'Скрыт'}`);
        toast({ 
          title: 'Успешно', 
          description: `Рецепт ${newStatus ? 'активирован' : 'скрыт'}` 
        });
        loadRecipes();
      } else {
        const data = await response.json();
        logError(`[TOGGLE] Ошибка: ${data.error || 'unknown'}`);
        throw new Error(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      logError(`[TOGGLE] Exception: ${error instanceof Error ? error.message : 'unknown'}`);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось изменить статус',
        variant: 'destructive'
      });
    }
  };

  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      'Гарниры': 'bg-amber-500/10 text-amber-700',
      'Десерты': 'bg-pink-500/10 text-pink-700',
      'Завтраки': 'bg-yellow-500/10 text-yellow-700',
      'Закуски': 'bg-lime-500/10 text-lime-700',
      'Ланч-боксы': 'bg-teal-500/10 text-teal-700',
      'Напитки': 'bg-cyan-500/10 text-cyan-700',
      'Основные блюда': 'bg-orange-500/10 text-orange-700',
      'Перекусы': 'bg-green-500/10 text-green-700',
      'Салаты': 'bg-emerald-500/10 text-emerald-700',
      'Смузи': 'bg-purple-500/10 text-purple-700',
      'Соусы и заправки': 'bg-red-500/10 text-red-700',
      'Супы': 'bg-blue-500/10 text-blue-700',
      'Хлеб без глютена': 'bg-stone-500/10 text-stone-700'
    };
    return colors[cat] || 'bg-gray-500/10 text-gray-700';
  };

  return (
    <TabsContent value="nutrition" className="space-y-4">
      <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#748c6d]">Рецепты</CardTitle>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-[#748c6d] hover:bg-[#5a7052]"
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить рецепт
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadRecipes()}
              className="flex-1 max-w-md"
            />
            <Button onClick={loadRecipes} variant="outline" className="min-h-[44px]">
              <Icon name="Search" size={18} className="mr-2" />
              Найти
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                className={`cursor-pointer ${
                  category === cat
                    ? 'bg-[#748c6d] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setCategory(cat)}
                style={{ minHeight: '36px', padding: '8px 16px' }}
              >
                {cat === 'all' ? 'Все' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Badge>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Фото</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Калории</TableHead>
                  <TableHead>Порции</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Рецепты не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  recipes.map((recipe) => (
                    <TableRow key={recipe.id}>
                      <TableCell>
                        {recipe.image_url ? (
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Icon name="ImageOff" size={24} className="text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-[#4a5446]">
                        {recipe.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {recipe.category && Array.isArray(recipe.category) && recipe.category.length > 0 ? (
                            recipe.category.map((cat, idx) => (
                              <Badge key={idx} className={getCategoryBadge(cat)}>
                                {cat}
                              </Badge>
                            ))
                          ) : (
                            <Badge className="bg-gray-500/10 text-gray-700">Без категории</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#4a5446]/80">
                        {recipe.cooking_time} мин
                      </TableCell>
                      <TableCell className="text-[#4a5446]/80">
                        {recipe.calories} ккал
                      </TableCell>
                      <TableCell className="text-[#4a5446]/80">
                        {recipe.servings}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            recipe.is_active
                              ? 'bg-green-500/10 text-green-700 cursor-pointer hover:bg-green-500/20 min-h-[36px] px-3'
                              : 'bg-gray-500/10 text-gray-700 cursor-pointer hover:bg-gray-500/20 min-h-[36px] px-3'
                          }
                          onClick={() => handleToggleActive(recipe)}
                        >
                          {recipe.is_active ? 'Активен' : 'Скрыт'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(recipe)}
                            className="min-w-[44px] min-h-[44px]"
                          >
                            <Icon name="Pencil" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(recipe.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 min-w-[44px] min-h-[44px]"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddRecipeDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          loadRecipes();
        }}
      />

      <EditRecipeDialog
        open={isEditDialogOpen}
        recipe={editingRecipe}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingRecipe(null);
        }}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          setEditingRecipe(null);
          loadRecipes();
        }}
      />

      <LiveLogs logs={logs} onClear={clearLogs} position="bottom-right" />
    </TabsContent>
  );
}