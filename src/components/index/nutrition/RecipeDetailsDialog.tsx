import { useState } from "react";
import funcUrls from '../../../../backend/func2url.json';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  id: number;
  title: string;
  description: string;
  cooking_time: number;
  servings: number;
  calories: number;
  image_url?: string;
  category: string;
  ingredients?: string[];
  instructions?: string;
}

interface WeekDate {
  day_number: number;
  date: string;
  day_name: string;
}

interface RecipeDetailsDialogProps {
  recipe: Recipe | null;
  onClose: () => void;
  weekDates?: WeekDate[];
}

export default function RecipeDetailsDialog({
  recipe,
  onClose,
  weekDates = [],
}: RecipeDetailsDialogProps) {
  const { toast } = useToast();
  const [showAddToMenu, setShowAddToMenu] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const meals = { breakfast: "Завтрак", lunch: "Обед", dinner: "Ужин" };

  if (!recipe) return null;

  const addToMenu = async () => {
    if (!selectedDay || !selectedMeal) {
      toast({
        title: "Выберите день и прием пищи",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        funcUrls['weekly-menu'],
        {
          method: "POST",
          headers: {
            "X-Auth-Token": token!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            day_of_week: selectedDay,
            meal_type: selectedMeal,
            recipe_id: recipe.id,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Добавлено!",
          description: "Рецепт добавлен в план питания",
        });
        onClose();
      } else {
        throw new Error(data.error || "Ошибка добавления");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось добавить в план",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  return (
    <Dialog open={!!recipe} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{recipe.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Icon name="Clock" size={14} className="mr-1" />
              {recipe.cooking_time} мин
            </Badge>
            <Badge variant="secondary">
              <Icon name="Users" size={14} className="mr-1" />
              {recipe.servings} порций
            </Badge>
            <Badge variant="secondary">
              <Icon name="Flame" size={14} className="mr-1" />
              {recipe.calories} ккал
            </Badge>
            <Badge variant="secondary">{recipe.category}</Badge>
          </div>

          {recipe.image_url && (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {recipe.description && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Описание</h3>
              <p className="text-gray-600">{recipe.description}</p>
            </div>
          )}

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Icon name="ShoppingBasket" size={20} />
                Ингредиенты
              </h3>
              <ul className="space-y-2">
                {recipe.ingredients.flatMap((ingredient) =>
                  ingredient.includes('\n')
                    ? ingredient.split('\n')
                    : ingredient.split(',')
                ).map((item, index) => item.trim()).filter(Boolean).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Icon
                      name="Check"
                      size={16}
                      className="text-[#748c6d] mt-1 flex-shrink-0"
                    />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recipe.instructions && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Icon name="ChefHat" size={20} />
                Способ приготовления
              </h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                {recipe.instructions}
              </div>
            </div>
          )}

          {!showAddToMenu ? (
            <Button
              onClick={() => setShowAddToMenu(true)}
              className="w-full bg-[#748c6d] hover:bg-[#5a7052]"
            >
              <Icon name="Plus" size={20} className="mr-2" />
              Добавить в план питания
            </Button>
          ) : (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold">Добавить в план питания</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    День недели
                  </label>
                  <Select
                    value={selectedDay?.toString()}
                    onValueChange={(value) => setSelectedDay(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите день" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDates.map((day) => (
                        <SelectItem
                          key={day.day_number}
                          value={day.day_number.toString()}
                        >
                          {day.day_name} - {formatDate(day.date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Прием пищи
                  </label>
                  <Select
                    value={selectedMeal || ""}
                    onValueChange={setSelectedMeal}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите прием" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(meals).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={addToMenu}
                  disabled={!selectedDay || !selectedMeal || isAdding}
                  className="flex-1 bg-[#748c6d] hover:bg-[#5a7052]"
                >
                  {isAdding ? (
                    <>
                      <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                      Добавление...
                    </>
                  ) : (
                    <>
                      <Icon name="Check" size={20} className="mr-2" />
                      Добавить
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowAddToMenu(false)}
                  variant="outline"
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}