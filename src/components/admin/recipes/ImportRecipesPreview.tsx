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
import { ParsedRecipe } from './importRecipesParsers';

interface ImportRecipesPreviewProps {
  fileRef: React.RefObject<HTMLInputElement>;
  fileName: string;
  recipes: ParsedRecipe[];
  result: { inserted: number; errors: string[] } | null;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ImportRecipesPreview({
  fileRef,
  fileName,
  recipes,
  result,
  onFile,
}: ImportRecipesPreviewProps) {
  return (
    <>
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
          onChange={onFile}
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
    </>
  );
}
