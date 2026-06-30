import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { LiveLogs } from "@/components/LiveLogs";
import { useNutritionMenu } from "./nutrition/useNutritionMenu";
import NutritionHeader from "./nutrition/NutritionHeader";
import NutritionMenuTabs from "./nutrition/NutritionMenuTabs";

interface OldRecipe {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
  cookTime: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
}

interface NutritionSectionProps {
  recipes: OldRecipe[];
  selectedRecipe: number | null;
  setSelectedRecipe: (id: number | null) => void;
  mealPlan: { [key: string]: number };
  setMealPlan: (plan: { [key: string]: number }) => void;
}

export default function NutritionSection({
  recipes: _recipes,
  selectedRecipe,
  setSelectedRecipe,
  mealPlan: _mealPlan,
  setMealPlan: _setMealPlan,
}: NutritionSectionProps) {
  const navigate = useNavigate();

  const {
    logs,
    clearLogs,
    menu,
    weekDates,
    isLoading,
    isGenerating,
    meals,
    activeDragItem,
    generateMenu,
    clearMenu,
    deleteRecipe,
    getRecipesForMeal,
    getTotalCaloriesForMeal,
    handleDragStart,
    handleDragEnd,
  } = useNutritionMenu();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon
          name="Loader2"
          size={48}
          className="animate-spin text-[#748c6d]"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <NutritionHeader
        isGenerating={isGenerating}
        hasMenu={menu.length > 0}
        onGenerate={generateMenu}
        onClear={clearMenu}
        onAdd={() => navigate("/recipes")}
      />

      <NutritionMenuTabs
        menu={menu}
        weekDates={weekDates}
        meals={meals}
        activeDragItem={activeDragItem}
        onGenerate={generateMenu}
        getRecipesForMeal={getRecipesForMeal}
        getTotalCaloriesForMeal={getTotalCaloriesForMeal}
        onDelete={deleteRecipe}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      <LiveLogs logs={logs} onClear={clearLogs} position="bottom-right" />
    </div>
  );
}
