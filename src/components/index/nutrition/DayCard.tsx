import { Card } from "@/components/ui/card";
import MealCard from "./MealCard";

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

interface WeekDate {
  day_number: number;
  date: string;
  day_name: string;
}

interface DayCardProps {
  day: WeekDate;
  meals: { [key: string]: string };
  getRecipesForMeal: (dayNumber: number, mealType: string) => MenuItem[];
  getTotalCaloriesForMeal: (dayNumber: number, mealType: string) => number;
  onDelete: (id: number) => void;
  onAddClick: () => void;
}

export default function DayCard({
  day,
  meals,
  getRecipesForMeal,
  getTotalCaloriesForMeal,
  onDelete,
  onAddClick
}: DayCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{day.day_name}</h3>
        <p className="text-gray-600">{formatDate(day.date)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(meals).map(([key, label]) => {
          const mealRecipes = getRecipesForMeal(day.day_number, key);
          const totalCalories = getTotalCaloriesForMeal(day.day_number, key);

          return (
            <MealCard
              key={key}
              mealKey={key}
              label={label}
              mealRecipes={mealRecipes}
              totalCalories={totalCalories}
              onDelete={onDelete}
              onAddClick={onAddClick}
            />
          );
        })}
      </div>
    </Card>
  );
}
