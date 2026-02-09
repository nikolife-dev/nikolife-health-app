import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import DraggableRecipe from "./DraggableRecipe";

interface Recipe {
  id: number;
  title: string;
  description: string;
  cooking_time: number;
  servings: number;
  calories: number;
  image_url?: string;
  category: string;
}

interface MenuItem {
  id: number;
  day_of_week: number;
  meal_type: string;
  position: number;
  notes?: string;
  recipe: Recipe;
}

interface MealCardProps {
  mealKey: string;
  label: string;
  mealRecipes: MenuItem[];
  totalCalories: number;
  onDelete: (id: number) => void;
  onAddClick: () => void;
}

export default function MealCard({
  mealKey,
  label,
  mealRecipes,
  totalCalories,
  onDelete,
  onAddClick
}: MealCardProps) {
  const getMealIcon = (key: string) => {
    if (key === "breakfast") return "Coffee";
    if (key === "lunch") return "UtensilsCrossed";
    return "Moon";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-base sm:text-lg text-gray-700 flex items-center gap-2">
          <Icon name={getMealIcon(mealKey)} size={18} className="sm:w-5 sm:h-5" />
          <span className="truncate">{label}</span>
        </h4>
        {mealRecipes.length > 0 && (
          <div className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
            <Icon name="Flame" size={14} className="text-orange-500" />
            <span
              className={`font-medium ${totalCalories > 600 ? "text-red-600" : "text-gray-600"}`}
            >
              {totalCalories} ккал
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 min-h-[100px]">
        {mealRecipes.length > 0 ? (
          <SortableContext
            items={mealRecipes.map((m) => String(m.id))}
            strategy={verticalListSortingStrategy}
          >
            {mealRecipes.map((meal) => (
              <DraggableRecipe key={meal.id} menuItem={meal} onDelete={onDelete} />
            ))}
          </SortableContext>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Не выбрано</p>
          </div>
        )}

        {mealRecipes.length < 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            onClick={onAddClick}
          >
            <Icon name="Plus" size={16} className="mr-1" />
            Добавить
          </Button>
        )}
      </div>
    </div>
  );
}