import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { useLiveLogs } from "@/components/LiveLogs";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

interface DraggableRecipeProps {
  menuItem: MenuItem;
  onDelete: (id: number) => void;
}

function DraggableRecipe({ menuItem, onDelete }: DraggableRecipeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: menuItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow group cursor-move"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">
            {menuItem.recipe.title}
          </p>
          <div className="flex gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Icon name="Clock" size={12} />
              {menuItem.recipe.cooking_time}м
            </span>
            <span className="flex items-center gap-1">
              <Icon name="Flame" size={12} />
              {menuItem.recipe.calories} ккал
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(menuItem.id);
          }}
          className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          title="Удалить"
        >
          <Icon name="X" size={18} />
        </button>
      </div>
    </div>
  );
}

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
  const { toast } = useToast();
  const { logInfo, logSuccess, logError } = useLiveLogs();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const meals = {
    breakfast: "Завтрак",
    lunch: "Обед",
    dinner: "Ужин",
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setIsLoading(true);
    logInfo("Загрузка меню на неделю...");
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        logError("Нет токена авторизации");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        "https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6",
        { headers: { "X-Auth-Token": token } },
      );

      const data = await response.json();
      if (data.menu) {
        logSuccess(`Меню загружено: ${data.menu.length} блюд`);
        setMenu(data.menu);
        if (data.week_dates) {
          setWeekDates(data.week_dates);
        }
      }
    } catch (error) {
      logError("Ошибка загрузки меню");
      console.error("Failed to load menu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMenu = async () => {
    setIsGenerating(true);
    logInfo("Запуск генерации меню на неделю...");
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        logError("Нет токена авторизации");
        toast({
          title: "Требуется авторизация",
          description: "Войдите в систему для генерации меню",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      logInfo("Отправка запроса на генерацию...");
      const response = await fetch(
        "https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6/generate",
        {
          method: "POST",
          headers: {
            "X-Auth-Token": token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      logInfo(`Ответ получен: status=${response.status}`);
      const data = await response.json();
      if (!response.ok) {
        logError(`Ошибка генерации: ${data.error || "unknown"}`);
        throw new Error(data.error || "Ошибка генерации меню");
      }

      if (data.success) {
        logSuccess(`Генерация завершена: ${data.generated_count} блюд`);
        toast({
          title: "Успешно!",
          description: `Сгенерировано ${data.generated_count} блюд`,
        });
        await loadMenu();
      } else {
        logError("Генерация не удалась");
        throw new Error(data.error || "Не удалось сгенерировать меню");
      }
    } catch (error) {
      logError(
        `Критическая ошибка генерации: ${error instanceof Error ? error.message : "unknown"}`,
      );
      console.error("Generate menu error:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось сгенерировать меню",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteRecipe = async (menuItemId: number) => {
    logInfo(`Удаление рецепта из меню: ID=${menuItemId}`);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6/${menuItemId}`,
        {
          method: "DELETE",
          //правка X-Auth-Token
          headers: { "X-Auth-Token": token! },
        },
      );

      const data = await response.json();
      if (data.success) {
        logSuccess("Рецепт успешно удален");
        setMenu(menu.filter((item) => item.id !== menuItemId));
        toast({
          title: "Удалено",
          description: "Рецепт удален из плана",
        });
      }
    } catch (error) {
      logError("Не удалось удалить рецепт");
      toast({
        title: "Ошибка",
        description: "Не удалось удалить рецепт",
        variant: "destructive",
      });
    }
  };

  const getRecipesForMeal = (dayNumber: number, mealType: string) => {
    return menu
      .filter((m) => m.day_of_week === dayNumber && m.meal_type === mealType)
      .sort((a, b) => a.position - b.position);
  };

  const getTotalCaloriesForMeal = (dayNumber: number, mealType: string) => {
    const recipes = getRecipesForMeal(dayNumber, mealType);
    return recipes.reduce((sum, item) => sum + (item.recipe.calories || 0), 0);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Логика для перемещения рецепта между разными ячейками
    // Пока оставим простую реализацию - можно расширить позже
    toast({
      title: "Перемещение",
      description: "Функция drag-and-drop активна",
    });
  };

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            План питания
          </h2>
          <p className="text-gray-600">Моё меню на неделю</p>
        </div>
        <div className="flex gap-2">
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
                Сгенерировать
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => navigate("/recipes")}>
            <Icon name="Plus" size={20} className="mr-2" />
            Добавить рецепт
          </Button>
        </div>
      </div>

      <Tabs defaultValue="week" className="w-full">
        <TabsList>
          <TabsTrigger value="week">Моё меню</TabsTrigger>
          <TabsTrigger value="recipes" onClick={() => navigate("/recipes")}>
            Все рецепты
          </TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-6 mt-6">
          {weekDates.length === 0 && menu.length === 0 ? (
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
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-6">
                {weekDates.map((day) => (
                  <Card key={day.day_number} className="p-6">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {day.day_name}
                      </h3>
                      <p className="text-gray-600">{formatDate(day.date)}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(meals).map(([key, label]) => {
                        const mealRecipes = getRecipesForMeal(
                          day.day_number,
                          key,
                        );

                        const totalCalories = getTotalCaloriesForMeal(
                          day.day_number,
                          key,
                        );

                        return (
                          <div key={key} className="space-y-3">
                            <div className="flex items-center justify-between">
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
                              {mealRecipes.length > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Icon
                                    name="Flame"
                                    size={14}
                                    className="text-orange-500"
                                  />
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
                                  items={mealRecipes.map((m) => m.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {mealRecipes.map((meal) => (
                                    <DraggableRecipe
                                      key={meal.id}
                                      menuItem={meal}
                                      onDelete={deleteRecipe}
                                    />
                                  ))}
                                </SortableContext>
                              ) : (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                  <p className="text-gray-400 text-sm">
                                    Не выбрано
                                  </p>
                                </div>
                              )}

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

                    {/* Итого за день */}
                    {menu.filter((m) => m.day_of_week === day.day_number)
                      .length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Итого за день:
                          </span>
                          <div className="flex items-center gap-1">
                            <Icon
                              name="Flame"
                              size={16}
                              className="text-orange-500"
                            />
                            <span className="text-lg font-bold text-gray-900">
                              {Object.keys(meals).reduce(
                                (sum, key) =>
                                  sum +
                                  getTotalCaloriesForMeal(day.day_number, key),
                                0,
                              )}{" "}
                              ккал
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <DragOverlay>
                {activeId ? (
                  <div className="border rounded-lg p-3 bg-white shadow-lg">
                    <p className="font-medium text-gray-900 text-sm">
                      {menu.find((m) => m.id === activeId)?.recipe.title}
                    </p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
