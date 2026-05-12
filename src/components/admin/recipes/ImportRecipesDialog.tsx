import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import funcUrls from '../../../../backend/func2url.json';

const RECIPES_API = funcUrls.recipes;

interface CsvRecipe {
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  cooking_time: string;
  servings: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  category: string;
  image_url: string;
}

interface ImportRecipesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CSV_COLUMNS = [
  'title', 'description', 'ingredients', 'instructions',
  'cooking_time', 'servings', 'calories', 'protein', 'carbs', 'fats',
  'category', 'image_url'
];

function parseCsv(text: string): CsvRecipe[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].split(';').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    header.forEach((col, i) => {
      row[col] = values[i] || '';
    });
    return row as unknown as CsvRecipe;
  }).filter(r => r.title);
}

export default function ImportRecipesDialog({ open, onOpenChange, onSuccess }: ImportRecipesDialogProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [recipes, setRecipes] = useState<CsvRecipe[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      setRecipes(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (!recipes.length) return;
    setIsImporting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const payload = recipes.map(r => ({
        title: r.title,
        description: r.description || '',
        ingredients: r.ingredients || '',
        instructions: r.instructions || '',
        cooking_time: r.cooking_time ? parseInt(r.cooking_time) : null,
        servings: r.servings ? parseInt(r.servings) : 1,
        calories: r.calories ? parseInt(r.calories) : null,
        protein: r.protein ? parseFloat(r.protein) : null,
        carbs: r.carbs ? parseFloat(r.carbs) : null,
        fats: r.fats ? parseFloat(r.fats) : null,
        category: r.category || '',
        image_url: r.image_url || null,
      }));

      const response = await fetch(`${RECIPES_API}?action=bulk_import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token!,
        },
        body: JSON.stringify({ recipes: payload }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ inserted: data.inserted, errors: data.errors || [] });
        toast({
          title: 'Импорт завершён',
          description: `Добавлено рецептов: ${data.inserted}`,
        });
        onSuccess();
      } else {
        throw new Error(data.error || 'Ошибка импорта');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось импортировать',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setRecipes([]);
    setFileName('');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const header = CSV_COLUMNS.join(';');
    const example = [
      'Овсяная каша',
      'Питательный завтрак',
      'Овсяные хлопья 100г; Молоко 200мл; Банан 1шт',
      'Залить хлопья молоком. Довести до кипения. Добавить банан.',
      '10',
      '1',
      '320',
      '12',
      '55',
      '6',
      'Завтраки',
      '',
    ].join(';');
    const blob = new Blob([header + '\n' + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipes_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#748c6d]">Импорт рецептов из CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 border-2 border-dashed border-[#748c6d]/30 rounded-lg bg-[#748c6d]/5">
            <Icon name="FileSpreadsheet" size={32} className="text-[#748c6d] shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                Загрузите CSV-файл с рецептами
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Разделитель столбцов — точка с запятой (;). Кодировка — UTF-8.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Icon name="Download" size={14} className="mr-1.5" />
                Шаблон
              </Button>
              <Button
                size="sm"
                className="bg-[#748c6d] hover:bg-[#5a7052]"
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="Upload" size={14} className="mr-1.5" />
                Выбрать файл
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {fileName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Icon name="FileCheck" size={16} className="text-[#748c6d]" />
              <span>{fileName}</span>
              <Badge variant="outline" className="ml-auto">
                {recipes.length} рецептов
              </Badge>
            </div>
          )}

          {result && (
            <div className={`p-3 rounded-lg text-sm ${result.errors.length ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="font-medium text-green-800">
                ✓ Успешно добавлено: {result.inserted} рецептов
              </p>
              {result.errors.length > 0 && (
                <div className="mt-1 text-yellow-700">
                  <p className="font-medium">Ошибки ({result.errors.length}):</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {recipes.length > 0 && (
            <>
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Предпросмотр ({recipes.length} строк)
                </div>
                <div className="overflow-x-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Название</TableHead>
                        <TableHead className="text-xs">Категория</TableHead>
                        <TableHead className="text-xs">Калории</TableHead>
                        <TableHead className="text-xs">Б/Ж/У</TableHead>
                        <TableHead className="text-xs">Время</TableHead>
                        <TableHead className="text-xs">Ингредиенты</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipes.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium max-w-[150px] truncate">
                            {r.title || <span className="text-red-500">—</span>}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.category ? (
                              <Badge variant="outline" className="text-xs">{r.category.split(';')[0]}</Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-xs">{r.calories || '—'}</TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {r.protein || '?'}/{r.fats || '?'}/{r.carbs || '?'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.cooking_time ? `${r.cooking_time} мин` : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 max-w-[180px] truncate">
                            {r.ingredients || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Отмена
                </Button>
                <Button
                  className="bg-[#748c6d] hover:bg-[#5a7052]"
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Импорт...
                    </>
                  ) : (
                    <>
                      <Icon name="CheckCircle" size={16} className="mr-2" />
                      Импортировать {recipes.length} рецептов
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {!recipes.length && !fileName && (
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">Обязательные столбцы:</p>
              <p><span className="font-mono bg-gray-100 px-1 rounded">title</span> — название рецепта</p>
              <p className="font-medium text-gray-700 mt-2">Необязательные столбцы:</p>
              <p className="text-gray-500">
                description, ingredients (через ;), instructions, cooking_time, servings, calories, protein, carbs, fats, category (через ;), image_url
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
