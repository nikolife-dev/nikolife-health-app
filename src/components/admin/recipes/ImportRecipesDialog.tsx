import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import funcUrls from '../../../../backend/func2url.json';
import {
  ParsedRecipe,
  DuplicateDecision,
  Duplicate,
  parseSteps,
  normalizeFloat,
  normalizeInt,
  parseExcel,
  parseCsv,
} from './importRecipesParsers';
import ImportRecipesPreview from './ImportRecipesPreview';
import ImportDuplicatesResolver from './ImportDuplicatesResolver';

const RECIPES_API = funcUrls.recipes;

interface ImportRecipesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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
          <ImportRecipesPreview
            fileRef={fileRef}
            fileName={fileName}
            recipes={recipes}
            result={result}
            onFile={handleFile}
          />

          <ImportDuplicatesResolver
            duplicates={duplicates}
            decisions={decisions}
            setDecisions={setDecisions}
          />

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
