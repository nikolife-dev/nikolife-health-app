import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const CATEGORIES = [
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

interface CategorySelectorProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  maxSelection?: number;
}

export default function CategorySelector({
  selectedCategories,
  onChange,
  maxSelection = 3
}: CategorySelectorProps) {
  const handleToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter(c => c !== category));
    } else {
      if (selectedCategories.length < maxSelection) {
        onChange([...selectedCategories, category]);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Категории * (выберите от 1 до {maxSelection})</Label>
        <span className="text-sm text-gray-500">
          Выбрано: {selectedCategories.length}/{maxSelection}
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto p-2 border rounded-md">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category);
          const isDisabled = !isSelected && selectedCategories.length >= maxSelection;
          
          return (
            <div
              key={category}
              className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
              }`}
              onClick={() => !isDisabled && handleToggle(category)}
            >
              <Checkbox
                id={category}
                checked={isSelected}
                disabled={isDisabled}
                onCheckedChange={() => !isDisabled && handleToggle(category)}
              />
              <label
                htmlFor={category}
                className="text-sm cursor-pointer select-none"
              >
                {category}
              </label>
            </div>
          );
        })}
      </div>
      
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-gray-600">Выбранные:</span>
          {selectedCategories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="cursor-pointer hover:bg-gray-300"
              onClick={() => handleToggle(category)}
            >
              {category} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
