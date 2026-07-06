import { useState, useEffect } from 'react';
import funcUrls from '../../../backend/func2url.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';
import AddRecipeDialog from './recipes/AddRecipeDialog';
import EditRecipeDialog from './recipes/EditRecipeDialog';
import ImportRecipesDialog from './recipes/ImportRecipesDialog';
import RecipesSettingsCard from './recipes/RecipesSettingsCard';
import RecipesToolbar from './recipes/RecipesToolbar';
import RecipesTable from './recipes/RecipesTable';
import { Recipe } from './recipes/recipesShared';

const RECIPES_API = funcUrls.recipes;

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

  return (
    <TabsContent value="nutrition" className="space-y-4">
      <RecipesSettingsCard
        basicLimitPerCategory={basicLimitPerCategory}
        setBasicLimitPerCategory={setBasicLimitPerCategory}
        saveSettings={saveSettings}
        isSavingLimit={isSavingLimit}
      />

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
          <RecipesToolbar
            lastImport={lastImport}
            handleUndoImport={handleUndoImport}
            isUndoing={isUndoing}
            search={search}
            setSearch={setSearch}
            loadRecipes={loadRecipes}
            category={category}
            setCategory={setCategory}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            handleBulkDelete={handleBulkDelete}
            isBulkDeleting={isBulkDeleting}
          />

          <RecipesTable
            isLoading={isLoading}
            recipes={recipes}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
            loadRecipes={loadRecipes}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleToggleActive={handleToggleActive}
          />
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
