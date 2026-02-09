import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface MealPlanControlsProps {
  isGenerating: boolean;
  hasMenu: boolean;
  onGenerate: () => void;
  onClear: () => void;
}

export default function MealPlanControls({
  isGenerating,
  hasMenu,
  onGenerate,
  onClear,
}: MealPlanControlsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        {isGenerating ? (
          <>
            <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
            Генерирую...
          </>
        ) : (
          <>
            <Icon name="Sparkles" size={18} className="mr-2" />
            Сгенерировать меню
          </>
        )}
      </Button>
      {hasMenu && (
        <Button onClick={onClear} variant="outline">
          <Icon name="Trash2" size={18} className="mr-2" />
          Очистить меню
        </Button>
      )}
    </div>
  );
}
