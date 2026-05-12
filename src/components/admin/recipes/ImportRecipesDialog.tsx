import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
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

interface ParsedRecipe {
  title: string;
  servings: string;
  cooking_time: string;
  steps: string;
  ingredients: string;
  categories: string;
  weight_per_serving: string;
  calories: string;
  protein: string;
  fats: string;
  carbs: string;
  calories_100: string;
  protein_100: string;
  fats_100: string;
  carbs_100: string;
}

interface ImportRecipesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function parseSteps(raw: string): string {
  if (!raw) return '';
  return raw
    .split(/\d+\)\s*/)
    .map(s => s.trim().replace(/[;.,]+$/, '').trim())
    .filter(Boolean)
    .join('\n');
}

function normalizeFloat(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function normalizeInt(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).replace(',', '.');
  const n = parseInt(s);
  return isNaN(n) ? null : n;
}

function findCol(row: Record<string, unknown>, candidates: string[]): string {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const found = keys.find(k => k.trim().toLowerCase() === c.trim().toLowerCase());
    if (found !== undefined) return String(row[found] ?? '').trim();
  }
  return '';
}

function parseExcel(buffer: ArrayBuffer): ParsedRecipe[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (rows.length > 0) {
    console.log('[ImportRecipes] Колонки в файле:', Object.keys(rows[0]));
    console.log('[ImportRecipes] Первая строка:', rows[0]);
  }

  return rows.map(row => {
    const g = (candidates: string[]) => findCol(row, candidates);
    return {
      title: g(['title']),
      servings: g(['servings']),
      cooking_time: g(['time']),
      steps: g(['steps']),
      ingredients: g(['ingredients']),
      categories: g(['categories']),
      weight_per_serving: g(['грамм на 1 п', 'грамм на 1п', 'грамм на 1 порц', 'грамм на 1 порцию']),
      calories: g(['КБЖУ на 1 п', 'КБЖУ на 1п', 'кбжу на 1 п']),
      protein: g(['Б на 1 п', 'Б на 1п', 'б на 1 п']),
      fats: g(['Ж на 1 п', 'Ж на 1п', 'ж на 1 п']),
      carbs: g(['У на 1 п', 'У на 1п', 'у на 1 п', 'У на 1 порцию']),
      calories_100: g(['КБЖУ на 100', 'кбжу на 100', 'КБЖУ на 100 г', 'КГБЖУ на 100']),
      protein_100: g(['Б на 100', 'б на 100', 'Б на 100 г']),
      fats_100: g(['Ж на 100', 'ж на 100', 'Ж на 100 г']),
      carbs_100: g(['У на 100', 'у на 100', 'У на 100 г']),
    };
  }).filter(r => r.title);
}

function parseCsv(text: string): ParsedRecipe[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));

  return lines.slice(1).map(line => {
    const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    header.forEach((col, i) => { row[col] = values[i] || ''; });
    return {
      title: row['title'] || '',
      servings: row['servings'] || '',
      cooking_time: row['time'] || '',
      steps: row['steps'] || '',
      ingredients: row['ingredients'] || '',
      categories: row['categories'] || '',
      weight_per_serving: row['грамм на 1 п'] || '',
      calories: row['КБЖУ на 1 п'] || '',
      protein: row['Б на 1 п'] || '',
      fats: row['Ж на 1 п'] || '',
      carbs: row['У на 1 п'] || '',
      calories_100: row['КБЖУ на 100'] || '',
      protein_100: row['Б на 100'] || '',
      fats_100: row['Ж на 100'] || '',
      carbs_100: row['У на 100'] || '',
    };
  }).filter(r => r.title);
}

export default function ImportRecipesDialog({ open, onOpenChange, onSuccess }: ImportRecipesDialogProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [recipes, setRecipes] = useState<ParsedRecipe[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (isXlsx) {
        const buffer = ev.target?.result as ArrayBuffer;
        const parsed = parseExcel(buffer);
        setRecipes(parsed);
      } else {
        const text = ev.target?.result as string;
        const parsed = parseCsv(text);
        setRecipes(parsed);
      }
    };

    if (isXlsx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleImport = async () => {
    if (!recipes.length) return;
    setIsImporting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const payload = recipes.map(r => ({
        title: r.title,
        description: '',
        ingredients: r.ingredients || '',
        instructions: parseSteps(r.steps),
        cooking_time: normalizeInt(r.cooking_time),
        servings: normalizeInt(r.servings) ?? 1,
        weight_per_serving: normalizeInt(r.weight_per_serving),
        calories: normalizeInt(r.calories),
        protein: normalizeFloat(r.protein),
        carbs: normalizeFloat(r.carbs),
        fats: normalizeFloat(r.fats),
        calories_100: normalizeInt(r.calories_100),
        protein_100: normalizeFloat(r.protein_100),
        fats_100: normalizeFloat(r.fats_100),
        carbs_100: normalizeFloat(r.carbs_100),
        category: r.categories || '',
        image_url: null,
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#748c6d]">Импорт рецептов из Excel / CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 border-2 border-dashed border-[#748c6d]/30 rounded-lg bg-[#748c6d]/5">
            <Icon name="FileSpreadsheet" size={32} className="text-[#748c6d] shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                Загрузите файл с рецептами
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Поддерживаются форматы .xlsx и .csv
              </p>
            </div>
            <Button
              size="sm"
              className="bg-[#748c6d] hover:bg-[#5a7052]"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="Upload" size={14} className="mr-1.5" />
              Выбрать файл
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
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
                        <TableHead className="text-xs">Порций</TableHead>
                        <TableHead className="text-xs">Мин</TableHead>
                        <TableHead className="text-xs">Категории</TableHead>
                        <TableHead className="text-xs">Г/п</TableHead>
                        <TableHead className="text-xs">Ккал/п</TableHead>
                        <TableHead className="text-xs">Б/Ж/У на п</TableHead>
                        <TableHead className="text-xs">Ккал/100</TableHead>
                        <TableHead className="text-xs">Б/Ж/У на 100</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipes.slice(0, 20).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium max-w-[130px] truncate">{r.title}</TableCell>
                          <TableCell className="text-xs">{r.servings}</TableCell>
                          <TableCell className="text-xs">{r.cooking_time}</TableCell>
                          <TableCell className="text-xs max-w-[90px] truncate">{r.categories}</TableCell>
                          <TableCell className="text-xs">{r.weight_per_serving}</TableCell>
                          <TableCell className="text-xs">{r.calories}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{r.protein} / {r.fats} / {r.carbs}</TableCell>
                          <TableCell className="text-xs">{r.calories_100}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{r.protein_100} / {r.fats_100} / {r.carbs_100}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {recipes.length > 20 && (
                  <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
                    Показаны первые 20 из {recipes.length} строк
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                  Отмена
                </Button>
                <Button
                  className="bg-[#748c6d] hover:bg-[#5a7052]"
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <Icon name="Loader2" size={14} className="mr-1.5 animate-spin" />
                      Импорт...
                    </>
                  ) : (
                    <>
                      <Icon name="Upload" size={14} className="mr-1.5" />
                      Импортировать {recipes.length} рецептов
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}