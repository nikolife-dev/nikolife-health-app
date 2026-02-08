import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function WeeklyMenu() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const meals = {
    breakfast: "Завтрак",
    lunch: "Обед",
    dinner: "Ужин",
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        navigate("/auth");
        return;
      }

      const response = await fetch(
        "https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6",
        { headers: { "X-Auth-Token": token } },
      );

      const data = await response.json();
      if (data.menu) {
        setMenu(data.menu);
        if (data.week_dates) {
          setWeekDates(data.week_dates);
        }
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить меню",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMenu = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        "https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6/generate",
        {
          method: "POST",
          headers: {
            "X-Auth-Token": token!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Успешно!",
          description: `Сгенерировано ${data.generated_count} блюд`,
        });
        loadMenu();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать меню",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteRecipe = async (menuItemId: number) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast({
          title: "Ошибка",
          description: "Нет токена авторизации",
          variant: "destructive",
        });
        return;
      }

      const url = `https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6/${menuItemId}`;
      console.log("[DEL] request", { url, menuItemId });

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "X-Auth-Token": token,
          Accept: "application/json",
        },
      });

      console.log("[DEL] response", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      // читаем текст — так не упадём, даже если ответ не JSON / пустой
      const rawText = await response.text();
      console.log("[DEL] rawText", rawText);

      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
        console.log("[DEL] response is not JSON");
      }
      console.log("[DEL] parsed", data);

      if (!response.ok) {
        const msg =
          data?.error || data?.message || rawText || `HTTP ${response.status}`;
        toast({
          title: "Ошибка удаления",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      // успех даже если 204 No Content
      const success = data?.success ?? true;

      if (success) {
        setMenu((prev) => prev.filter((item) => item.id !== menuItemId));
        toast({ title: "Удалено", description: "Рецепт удален из плана" });
      } else {
        const msg = data?.error || data?.message || "success=false";
        toast({
          title: "Ошибка удаления",
          description: msg,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[DEL] exception", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось удалить рецепт",
        variant: "destructive",
      });
    }
  };

  const getMenuForDay = (dayNumber: number) => {
    return menu.filter((m) => m.day_of_week === dayNumber);
  };

  const getRecipesForMeal = (dayNumber: number, mealType: string) => {
    return menu
      .filter((m) => m.day_of_week === dayNumber && m.meal_type === mealType)
      .sort((a, b) => a.position - b.position);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center">
        <Icon
          name="Loader2"
          size={48}
          className="animate-spin text-[#748c6d]"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Icon name="ArrowLeft" size={20} />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Моё меню</h1>
          <Button
            onClick={generateMenu}
            disabled={isGenerating}
            className="bg-[#748c6d] hover:bg-[#5a7052]"
          >
            {isGenerating ? (
              <>
                <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Icon name="Wand2" size={20} className="mr-2" />
                Сгенерировать план
              </>
            )}
          </Button>
        </div>

        {/* Week Days */}
        <div className="space-y-6">
          {weekDates.map((day) => {
            const dayMenu = getMenuForDay(day.day_number);

            return (
              <Card key={day.day_number} className="p-6">
                {/* Day Header */}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {day.day_name}
                  </h3>
                  <p className="text-gray-600">{formatDate(day.date)}</p>
                </div>

                {/* Meals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(meals).map(([key, label]) => {
                    const mealRecipes = getRecipesForMeal(day.day_number, key);

                    return (
                      <div key={key} className="space-y-3">
                        <h4 className="font-semibold text-lg text-gray-700 flex items-center gap-2">
                          <Icon
                            name={
                              key === "breakfast"
                                ? "Coffee"
                                : key === "lunch"
                                  ? "UtensilsCrossed"
                                  : "Moon"
                            }
                            size={20}
                          />
                          {label}
                        </h4>

                        {/* Recipes List */}
                        <div className="space-y-2 min-h-[100px]">
                          {mealRecipes.length > 0 ? (
                            mealRecipes.map((meal) => (
                              <div
                                key={meal.id}
                                className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow group"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate">
                                      {meal.recipe.title}
                                    </p>
                                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                      <span className="flex items-center gap-1">
                                        <Icon name="Clock" size={12} />
                                        {meal.recipe.cooking_time}м
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Icon name="Flame" size={12} />
                                        {meal.recipe.calories} ккал
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => deleteRecipe(meal.id)}
                                    className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    title="Удалить"
                                  >
                                    <Icon name="X" size={18} />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                              <p className="text-gray-400 text-sm">
                                Не выбрано
                              </p>
                            </div>
                          )}

                          {/* Add Button */}
                          {mealRecipes.length < 5 && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/recipes?addToMenu=true&day=${day.day_number}&meal=${key}`,
                                )
                              }
                              className="w-full border-2 border-dashed border-[#748c6d] rounded-lg p-3 text-[#748c6d] hover:bg-[#748c6d] hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                              <Icon name="Plus" size={18} />
                              <span className="text-sm font-medium">
                                Добавить
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {weekDates.length === 0 && menu.length === 0 && (
          <Card className="p-12 text-center">
            <Icon
              name="CalendarDays"
              size={64}
              className="mx-auto mb-4 text-gray-400"
            />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Меню пока пусто
            </h3>
            <p className="text-gray-600 mb-6">
              Сгенерируйте автоматический план питания или добавьте рецепты
              вручную
            </p>
            <Button
              onClick={generateMenu}
              className="bg-[#748c6d] hover:bg-[#5a7052]"
            >
              <Icon name="Wand2" size={20} className="mr-2" />
              Сгенерировать план
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
