import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { categories } from './recipesShared';

interface RecipesToolbarProps {
  lastImport: { batch_id: string; count: number } | null;
  handleUndoImport: () => void;
  isUndoing: boolean;
  search: string;
  setSearch: (value: string) => void;
  loadRecipes: () => void;
  category: string;
  setCategory: (value: string) => void;
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  handleBulkDelete: () => void;
  isBulkDeleting: boolean;
}

export default function RecipesToolbar({
  lastImport,
  handleUndoImport,
  isUndoing,
  search,
  setSearch,
  loadRecipes,
  category,
  setCategory,
  selectedIds,
  setSelectedIds,
  handleBulkDelete,
  isBulkDeleting,
}: RecipesToolbarProps) {
  return (
    <>
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
    </>
  );
}