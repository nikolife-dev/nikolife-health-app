import { useState, useEffect } from 'react';
import funcUrls from '../../../backend/func2url.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import ImportRecipesDialog from './recipes/ImportRecipesDialog';
import QuickImageCell from './recipes/QuickImageCell';

const RECIPES_API = funcUrls.recipes;

interface Recipe {
  id: number;
  title: string;
  description: string;
  cooking_time: number | null;
  servings: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  image_url: string | null;
  category: string[];
  ingredients: string[];
  instructions: string;
  is_active: boolean;
  created_at: string;
  weight_per_serving: number | null;
  calories_100: number | null;
  protein_100: number | null;
  fats_100: number | null;
  carbs_100: number | null;
  user_groups: string | null;
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
  const [basicLimitPerCategory, setBasicLimitPerCategory] = useState<number>(3);
  const [isSavingLimit, setIsSavingLimit] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [lastImport, setLastImport] = useState<{ batch_id: string; count: number } | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

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
    loadSettings();
    loadLastImport();
  }, [category]);

  const loadLastImport = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${RECIPES_API}?action=last_import`, {
        headers: token ? { 'X-Auth-Token': token } : {}
      });
      const data = await res.json();
      setLastImport(data.last_import || null);
    } catch (e) {
      console.error('loadLastImport error', e);
    }
  };

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${RECIPES_API}?action=get_settings`, {
        headers: token ? { 'X-Auth-Token': token } : {}
      });
      const data = await res.json();
      if (data.settings?.basic_plan_recipes_per_category) {
        setBasicLimitPerCategory(Number(data.settings.basic_plan_recipes_per_category.value));
      }
    } catch (e) {
      console.error('loadSettings error', e);
    }
  };

  const saveSettings = async () => {
    setIsSavingLimit(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${RECIPES_API}?action=update_settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Auth-Token': token } : {}) },
        body: JSON.stringify({ basic_plan_recipes_per_category: basicLimitPerCategory })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Сохранено', description: 'Лимит обновлён' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setIsSavingLimit(false);
    }
  };

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

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === recipes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(recipes.map((r) => r.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Удалить выбранные рецепты (${selectedIds.length})?`)) return;

    setIsBulkDeleting(true);
    logInfo(`[BULK DELETE] Удаление ${selectedIds.length} рецептов`);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${RECIPES_API}?action=bulk_delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token! },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (res.ok) {
        logSuccess(`[BULK DELETE] Удалено ${data.deleted}`);
        toast({ title: 'Успешно', description: `Удалено рецептов: ${data.deleted}` });
        setSelectedIds([]);
        loadRecipes();
      } else {
        throw new Error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      logError(`[BULK DELETE] ${error instanceof Error ? error.message : 'unknown'}`);
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось удалить', variant: 'destructive' });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleUndoImport = async () => {
    if (!lastImport) return;
    if (!confirm(`Отменить последний импорт? Будет удалено рецептов: ${lastImport.count}`)) return;

    setIsUndoing(true);
    logInfo(`[UNDO IMPORT] Откат импорта ${lastImport.batch_id}`);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${RECIPES_API}?action=undo_import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token! },
        body: JSON.stringify({ batch_id: lastImport.batch_id }),
      });
      const data = await res.json();
      if (res.ok) {
        logSuccess(`[UNDO IMPORT] Удалено ${data.deleted}`);
        toast({ title: 'Импорт отменён', description: `Удалено рецептов: ${data.deleted}` });
        setSelectedIds([]);
        loadRecipes();
        loadLastImport();
      } else {
        throw new Error(data.error || 'Ошибка отмены импорта');
      }
    } catch (error) {
      logError(`[UNDO IMPORT] ${error instanceof Error ? error.message : 'unknown'}`);
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось отменить импорт', variant: 'destructive' });
    } finally {
      setIsUndoing(false);
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
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Icon name="Lock" size={16} className="text-[#748c6d]" />
              <span className="text-sm font-medium text-gray-700">Базовый тариф — рецептов в категории:</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={basicLimitPerCategory}
                onChange={(e) => setBasicLimitPerCategory(Number(e.target.value))}
                className="w-20 h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={saveSettings}
                disabled={isSavingLimit}
                className="bg-[#748c6d] hover:bg-[#5a7052] h-8 text-xs"
              >
                {isSavingLimit ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Сохранить'}
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">Премиум — без ограничений</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#748c6d]">Рецепты</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(true)}
                className="border-[#748c6d]/40 text-[#748c6d] hover:bg-[#748c6d]/10"
              >
                <Icon name="FileSpreadsheet" size={18} className="mr-2" />
                Импорт CSV
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-[#748c6d] hover:bg-[#5a7052]"
              >
                <Icon name="Plus" size={18} className="mr-2" />
                Добавить рецепт
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastImport && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <Icon name="History" size={20} className="text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Последний импорт</p>
                  <p className="text-xs text-orange-700">
                    Добавлено рецептов: {lastImport.count}. Можно удалить одним действием.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleUndoImport}
                disabled={isUndoing}
                className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
              >
                {isUndoing ? (
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                ) : (
                  <Icon name="Undo2" size={18} className="mr-2" />
                )}
                Отменить последний импорт
              </Button>
            </div>
          )}

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

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <span className="text-sm font-medium text-red-700">
                Выбрано рецептов: {selectedIds.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                  className="text-gray-600"
                >
                  Снять выделение
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isBulkDeleting ? (
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Icon name="Trash2" size={16} className="mr-2" />
                  )}
                  Удалить выбранные
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={recipes.length > 0 && selectedIds.length === recipes.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Выбрать все"
                    />
                  </TableHead>
                  <TableHead className="text-xs">Фото</TableHead>
                  <TableHead className="text-xs">Название</TableHead>
                  <TableHead className="text-xs">Категории</TableHead>
                  <TableHead className="text-xs">Мин</TableHead>
                  <TableHead className="text-xs">Порций</TableHead>
                  <TableHead className="text-xs">Г/п</TableHead>
                  <TableHead className="text-xs">Ккал/п</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Б/Ж/У на п</TableHead>
                  <TableHead className="text-xs">Ккал/100</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Б/Ж/У на 100</TableHead>
                  <TableHead className="text-xs">Статус</TableHead>
                  <TableHead className="text-xs text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      Рецепты не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  recipes.map((recipe) => (
                    <TableRow key={recipe.id} data-state={selectedIds.includes(recipe.id) ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(recipe.id)}
                          onCheckedChange={() => toggleSelect(recipe.id)}
                          aria-label={`Выбрать ${recipe.title}`}
                        />
                      </TableCell>
                      <TableCell>
                        <QuickImageCell
                          recipeId={recipe.id}
                          imageUrl={recipe.image_url}
                          recipeTitle={recipe.title}
                          onUpdated={loadRecipes}
                        />
                      </TableCell>
                      <TableCell className="text-xs font-medium text-[#4a5446] max-w-[140px]">
                        {recipe.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {recipe.category?.length > 0 ? (
                            recipe.category.map((cat, idx) => (
                              <Badge key={idx} className={`text-xs ${getCategoryBadge(cat)}`}>{cat}</Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[#4a5446]/80">{recipe.cooking_time ?? '—'}</TableCell>
                      <TableCell className="text-xs text-[#4a5446]/80">{recipe.servings ?? '—'}</TableCell>
                      <TableCell className="text-xs text-[#4a5446]/80">{recipe.weight_per_serving ?? '—'}</TableCell>
                      <TableCell className="text-xs text-[#4a5446]/80">{recipe.calories ?? '—'}</TableCell>
                      <TableCell className="text-xs text-[#4a5446]/80 whitespace-nowrap">
                        {recipe.protein ?? '—'} / {recipe.fats ?? '—'} / {recipe.carbs ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-[#4a5446]/80">{recipe.calories_100 ?? '—'}</TableCell>
                      <TableCell className="text-xs text-[#4a5446]/80 whitespace-nowrap">
                        {recipe.protein_100 ?? '—'} / {recipe.fats_100 ?? '—'} / {recipe.carbs_100 ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={recipe.is_active
                            ? 'text-xs bg-green-500/10 text-green-700 cursor-pointer hover:bg-green-500/20'
                            : 'text-xs bg-gray-500/10 text-gray-700 cursor-pointer hover:bg-gray-500/20'}
                          onClick={() => handleToggleActive(recipe)}
                        >
                          {recipe.is_active ? 'Активен' : 'Скрыт'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(recipe)} className="min-w-[36px] min-h-[36px]">
                            <Icon name="Pencil" size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(recipe.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 min-w-[36px] min-h-[36px]">
                            <Icon name="Trash2" size={14} />
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

      <ImportRecipesDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={() => {
          loadRecipes();
          loadLastImport();
        }}
      />

      <LiveLogs logs={logs} onClear={clearLogs} position="bottom-right" />
    </TabsContent>
  );
}