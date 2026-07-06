import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import QuickImageCell from './QuickImageCell';
import { Recipe, getCategoryBadge } from './recipesShared';

interface RecipesTableProps {
  isLoading: boolean;
  recipes: Recipe[];
  selectedIds: number[];
  toggleSelect: (id: number) => void;
  toggleSelectAll: () => void;
  loadRecipes: () => void;
  handleEdit: (recipe: Recipe) => void;
  handleDelete: (id: number) => void;
  handleToggleActive: (recipe: Recipe) => void;
}

export default function RecipesTable({
  isLoading,
  recipes,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  loadRecipes,
  handleEdit,
  handleDelete,
  handleToggleActive,
}: RecipesTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
      </div>
    );
  }

  return (
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
  );
}
