import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface NutritionHeaderProps {
  isGenerating: boolean;
  hasMenu: boolean;
  onGenerate: () => void;
  onClear: () => void;
  onAdd: () => void;
}

export default function NutritionHeader({
  isGenerating,
  hasMenu,
  onGenerate,
  onClear,
  onAdd,
}: NutritionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          План питания
        </h2>
        <p className="text-sm sm:text-base text-gray-600">Моё меню на неделю</p>
      </div>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-[#748c6d] hover:bg-[#5a7052] min-h-[44px] flex-1 sm:flex-none"
        >
          {isGenerating ? (
            <>
              <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
              <span className="text-sm sm:text-base">Генерация...</span>
            </>
          ) : (
            <>
              <Icon name="Wand2" size={18} className="mr-2" />
              <span className="text-sm sm:text-base">Сгенерировать</span>
            </>
          )}
        </Button>
        {hasMenu && (
          <Button variant="outline" onClick={onClear} className="min-h-[44px] flex-1 sm:flex-none">
            <Icon name="Trash2" size={18} className="mr-2" />
            <span className="text-sm sm:text-base">Очистить</span>
          </Button>
        )}
        <Button variant="outline" onClick={onAdd} className="min-h-[44px] flex-1 sm:flex-none">
          <Icon name="Plus" size={18} className="mr-2" />
          <span className="text-sm sm:text-base">Добавить</span>
        </Button>
      </div>
    </div>
  );
}
