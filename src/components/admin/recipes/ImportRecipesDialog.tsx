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
  user_groups: string;
  image_url_import: string;
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

  // Читаем все строки как массивы (без авто-заголовков)
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Ищем строку-заголовок — ту, где есть 'title'
  let headerIdx = -1;
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i].map(c => String(c ?? '').trim().toLowerCase());
    if (row.includes('title')) { headerIdx = i; break; }
  }
  if (headerIdx === -1) return [];

  const headers = raw[headerIdx].map(c => String(c ?? '').trim());
  const dataRows = raw.slice(headerIdx + 1);

  const getByHeader = (row: unknown[], candidates: string[]): string => {
    for (const c of candidates) {
      const idx = headers.findIndex(h => h.toLowerCase() === c.toLowerCase());
      if (idx !== -1) return String(row[idx] ?? '').trim();
    }
    return '';
  };

  return dataRows
    .map(row => ({
      title: getByHeader(row, ['title']),
      servings: getByHeader(row, ['servings']),
      cooking_time: getByHeader(row, ['time']),
      steps: getByHeader(row, ['steps']),
      ingredients: getByHeader(row, ['ingredients']),
      categories: getByHeader(row, ['categories']),
      user_groups: getByHeader(row, ['user_groups']),
      image_url_import: getByHeader(row, ['image']),
      weight_per_serving: getByHeader(row, ['грамм на 1 п', 'грамм на 1п', 'грамм на 1 порц', 'грамм на 1 порцию']),
      calories: getByHeader(row, ['КБЖУ на 1 п', 'КБЖУ на 1п']),
      protein: getByHeader(row, ['Б на 1 п', 'Б на 1п']),
      fats: getByHeader(row, ['Ж на 1 п', 'Ж на 1п']),
      carbs: getByHeader(row, ['У на 1 п', 'У на 1п', 'У на 1 порцию']),
      calories_100: getByHeader(row, ['КБЖУ на 100', 'КГБЖУ на 100', 'КБЖУ на 100 г']),
      protein_100: getByHeader(row, ['Б на 100', 'Б на 100 г']),
      fats_100: getByHeader(row, ['Ж на 100', 'Ж на 100 г']),
      carbs_100: getByHeader(row, ['У на 100', 'У на 100 г']),
    }))
    .filter(r => r.title);
}

// Парсит одну строку CSV с учётом кавычек и переносов внутри полей
function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

// Разбивает весь CSV-текст на строки с учётом переносов внутри кавычек
function splitCsvRows(text: string, sep: string): string[][] {
  const rows: string[][] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
      cur += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      if (cur.trim()) rows.push(parseCsvLine(cur, sep));
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) rows.push(parseCsvLine(cur, sep));
  return rows;
}

function parseCsv(text: string): ParsedRecipe[] {
  // Автоопределение разделителя по первой строке
  const firstLine = text.split('\n')[0];
  const sep = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  const rows = splitCsvRows(text, sep);
  if (rows.length < 2) return [];

  const header = rows[0].map(h => h.replace(/^"|"$/g, '').trim());

  const getCol = (row: string[], candidates: string[]) => {
    for (const c of candidates) {
      const idx = header.findIndex(h => h.toLowerCase() === c.toLowerCase());
      if (idx !== -1) return (row[idx] || '').replace(/^"|"$/g, '').trim();
    }
    return '';
  };

  return rows.slice(1).map(row => ({
    title: getCol(row, ['title']),
    servings: getCol(row, ['servings']),
    cooking_time: getCol(row, ['time']),
    steps: getCol(row, ['steps']),
    ingredients: getCol(row, ['ingredients']),
    categories: getCol(row, ['categories']),
    user_groups: getCol(row, ['user_groups']),
    image_url_import: getCol(row, ['image']),
    weight_per_serving: getCol(row, ['грамм на 1 п', 'грамм на 1п', 'грамм на 1 порц', 'грамм на 1 порцию']),
    calories: getCol(row, ['КБЖУ на 1 п', 'КБЖУ на 1п']),
    protein: getCol(row, ['Б на 1 п', 'Б на 1п']),
    fats: getCol(row, ['Ж на 1 п', 'Ж на 1п']),
    carbs: getCol(row, ['У на 1 п', 'У на 1п', 'У на 1 порцию']),
    calories_100: getCol(row, ['КБЖУ на 100', 'КГБЖУ на 100', 'КБЖУ на 100 г']),
    protein_100: getCol(row, ['Б на 100', 'Б на 100 г']),
    fats_100: getCol(row, ['Ж на 100', 'Ж на 100 г']),
    carbs_100: getCol(row, ['У на 100', 'У на 100 г']),
  })).filter(r => r.title);
}

type DuplicateDecision = 'replace' | 'skip' | 'add';

interface Duplicate {
  id: number;
  title: string;
}

export default function ImportRecipesDialog({ open, onOpenChange, onSuccess }: ImportRecipesDialogProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [recipes, setRecipes] = useState<ParsedRecipe[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [decisions, setDecisions] = useState<Record<string, DuplicateDecision>>({});

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

  const buildPayload = () => recipes.map(r => ({
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
    user_groups: r.user_groups || '',
    image_url: r.image_url_import || null,
  }));

  // Шаг 1 — проверка дублей
  const handleCheck = async () => {
    if (!recipes.length) return;
    setIsChecking(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${RECIPES_API}?action=check_duplicates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token! },
        body: JSON.stringify({ titles: recipes.map(r => r.title) }),
      });
      const data = await res.json();
      if (data.duplicates?.length > 0) {
        setDuplicates(data.duplicates);
        const initial: Record<string, DuplicateDecision> = {};
        data.duplicates.forEach((d: Duplicate) => { initial[d.title] = 'replace'; });
        setDecisions(initial);
      } else {
        await doImport({});
      }
    } catch {
      toast({ title: 'Ошибка проверки', variant: 'destructive' });
    } finally {
      setIsChecking(false);
    }
  };

  // Шаг 2 — импорт с решениями
  const doImport = async (dec: Record<string, DuplicateDecision>) => {
    setIsImporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${RECIPES_API}?action=bulk_import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token! },
        body: JSON.stringify({ recipes: buildPayload(), decisions: dec }),
      });
      const data = await response.json();
      if (response.ok) {
        setDuplicates([]);
        setResult({ inserted: data.inserted, errors: data.errors || [] });
        toast({ title: 'Импорт завершён', description: `Добавлено рецептов: ${data.inserted}` });
        onSuccess();
      } else {
        throw new Error(data.error || 'Ошибка импорта');
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось импортировать', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setRecipes([]);
    setFileName('');
    setResult(null);
    setDuplicates([]);
    setDecisions({});
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
          )}

          {duplicates.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 overflow-hidden">
              <div className="px-4 py-2 bg-yellow-100 text-sm font-medium text-yellow-800 flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} />
                Найдены совпадения по названию — выберите действие для каждого
              </div>
              <div className="divide-y">
                {duplicates.map(d => (
                  <div key={d.id} className="flex items-center justify-between px-4 py-3 gap-4">
                    <span className="text-sm font-medium text-gray-800 flex-1">{d.title}</span>
                    <div className="flex gap-2">
                      {(['replace', 'add', 'skip'] as DuplicateDecision[]).map(opt => (
                        <button
                          key={opt}
                          onClick={() => setDecisions(prev => ({ ...prev, [d.title]: opt }))}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            decisions[d.title] === opt
                              ? opt === 'replace' ? 'bg-blue-600 text-white border-blue-600'
                                : opt === 'add' ? 'bg-[#748c6d] text-white border-[#748c6d]'
                                : 'bg-gray-500 text-white border-gray-500'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {opt === 'replace' ? 'Заменить' : opt === 'add' ? 'Оставить оба' : 'Пропустить'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            {result ? (
              <Button className="bg-[#748c6d] hover:bg-[#5a7052]" onClick={handleClose}>
                <Icon name="Check" size={14} className="mr-1.5" />
                ОК
              </Button>
            ) : (
            <Button variant="outline" onClick={handleClose} disabled={isImporting || isChecking}>
              Отменить
            </Button>
            )}
            {!result && (duplicates.length > 0 ? (
              <Button
                className="bg-[#748c6d] hover:bg-[#5a7052]"
                onClick={() => doImport(decisions)}
                disabled={isImporting}
              >
                {isImporting ? (
                  <><Icon name="Loader2" size={14} className="mr-1.5 animate-spin" />Импорт...</>
                ) : (
                  <><Icon name="Check" size={14} className="mr-1.5" />Импортировать</>
                )}
              </Button>
            ) : (
              <Button
                className="bg-[#748c6d] hover:bg-[#5a7052]"
                onClick={handleCheck}
                disabled={isChecking || isImporting || recipes.length === 0}
              >
                {isChecking ? (
                  <><Icon name="Loader2" size={14} className="mr-1.5 animate-spin" />Проверка...</>
                ) : (
                  <><Icon name="Check" size={14} className="mr-1.5" />Подтвердить {recipes.length > 0 ? `(${recipes.length})` : ''}</>
                )}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}