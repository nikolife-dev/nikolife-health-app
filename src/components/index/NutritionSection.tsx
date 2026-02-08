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
  } = useSortable({ id: String(menuItem.id) }); // ✅ string id for dnd-kit stability

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

  /**
   * ========================
   * DEBUG / DETAILED LOGGING
   * ========================
   */
  const DEBUG = true;

  const dbg = (message: string, data?: unknown) => {
    if (!DEBUG) return;
    try {
      if (data === undefined) logInfo(message);
      // @ts-ignore
      else logInfo(message, data);
    } catch {
      try {
        logInfo(`${message} :: ${JSON.stringify(data)}`);
      } catch {
        logInfo(`${message} :: [unserializable payload]`);
      }
    }
  };

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const meals = {
    breakfast: "Завтрак",
    lunch: "Обед",
    dinner: "Ужин",
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  useEffect(() => {
    dbg("[INIT] NutritionSection mounted");
    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMenu = async () => {
    setIsLoading(true);
    dbg("[MENU] loadMenu: start");
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        logError("[MENU] loadMenu: no auth token");
        setIsLoading(false);
        return;
      }

      const url =
        "https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6";
      dbg("[MENU] loadMenu: fetch", { url });

      const response = await fetch(url, { headers: { "X-Auth-Token": token } });
      dbg("[MENU] loadMenu: response", {
        status: response.status,
        ok: response.ok,
      });

      const data = await response.json();
      dbg("[MENU] loadMenu: json", {
        hasMenu: !!data?.menu,
        menuLength: Array.isArray(data?.menu) ? data.menu.length : null,
        hasWeekDates: !!data?.week_dates,
        weekDatesLength: Array.isArray(data?.week_dates)
          ? data.week_dates.length
          : null,
      });

      if (data.menu) {
        logSuccess(`[MENU] loaded: ${data.menu.length} items`);
        setMenu(data.menu);
        if (data.week_dates) setWeekDates(data.week_dates);
      } else {
        dbg("[MENU] loadMenu: no menu in response", data);
      }
    } catch (error) {
      logError("[MENU] loadMenu: failed");
      console.error("Failed to load menu:", error);
      dbg("[MENU] loadMenu: exception", { error });
    } finally {
      setIsLoading(false);
      dbg("[MENU] loadMenu: end");
    }
  };

  const generateMenu = async () => {
    setIsGenerating(true);
    dbg("[GEN] generateMenu: start");
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        logError("[GEN] no auth token");
        toast({
          title: "Требуется авторизация",
          description: "Войдите в систему для генерации меню",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const url =
        "https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6/generate";
      dbg("[GEN] request", { url, method: "POST" });

      const response = await fetch(url, {
        method: "POST",
        headers: { "X-Auth-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      dbg("[GEN] response", { status: response.status, ok: response.ok });
      const data = await response.json();
      dbg("[GEN] json", data);

      if (!response.ok) {
        logError(`[GEN] failed: ${data.error || "unknown"}`);
        throw new Error(data.error || "Ошибка генерации меню");
      }

      if (data.success) {
        logSuccess(`[GEN] success: generated_count=${data.generated_count}`);
        toast({
          title: "Успешно!",
          description: `Сгенерировано ${data.generated_count} блюд`,
        });
        await loadMenu();
      } else {
        logError("[GEN] not successful");
        throw new Error(data.error || "Не удалось сгенерировать меню");
      }
    } catch (error) {
      logError(
        `[GEN] exception: ${error instanceof Error ? error.message : "unknown"}`,
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
      dbg("[GEN] exception payload", { error });
    } finally {
      setIsGenerating(false);
      dbg("[GEN] generateMenu: end");
    }
  };

  const deleteRecipe = async (menuItemId: number) => {
    dbg("[DEL] deleteRecipe: start", { menuItemId });

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        logError("[DEL] no auth token");
        toast({
          title: "Ошибка",
          description: "Нет токена авторизации",
          variant: "destructive",
        });
        return;
      }

      const url = `https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6/${menuItemId}`;
      dbg("[DEL] request", { url, method: "DELETE" });

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "X-Auth-Token": token,
          Accept: "application/json",
        },
      });

      dbg("[DEL] response meta", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      const rawText = await response.text();
      dbg("[DEL] response rawText", rawText || "[empty body]");

      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        dbg("[DEL] response is NOT JSON");
      }

      dbg("[DEL] parsed json", data);

      if (!response.ok) {
        const msg =
          data?.error || data?.message || rawText || `HTTP ${response.status}`;

        logError(`[DEL] HTTP error: ${msg}`);
        toast({
          title: "Ошибка удаления",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      // success даже если backend вернул 204 No Content
      const success = data?.success ?? true;

      if (success) {
        logSuccess("[DEL] success");
        setMenu((prev) => prev.filter((item) => item.id !== menuItemId));
        toast({ title: "Удалено", description: "Рецепт удален из плана" });
      } else {
        const msg = data?.error || data?.message || "success=false";
        logError(`[DEL] failed: ${msg}`);
        toast({
          title: "Ошибка удаления",
          description: msg,
          variant: "destructive",
        });
      }
    } catch (error) {
      logError("[DEL] exception");
      dbg("[DEL] exception payload", { error });
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось удалить рецепт",
        variant: "destructive",
      });
    } finally {
      dbg("[DEL] deleteRecipe: end");
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
    dbg("[DND] dragStart", { activeId: event.active?.id });
    setActiveId(String(event.active.id));
  };

  /**
   * ✅ Cross-cell drag-and-drop:
   * - reorder within one meal/day
   * - move between meals
   * - move between days
   *
   * NOTE: With current markup, a drop target exists only on items.
   * Dropping into an empty cell needs droppable containers (can add next).
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    dbg("[DND] dragEnd raw", {
      activeId: active?.id,
      overId: over?.id,
    });

    if (!over) {
      dbg("[DND] drop cancelled: over is null/undefined");
      return;
    }

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    if (activeIdStr === overIdStr) {
      dbg("[DND] drop ignored: same element", { activeIdStr, overIdStr });
      return;
    }

    const activeItem = menu.find((m) => String(m.id) === activeIdStr);
    const overItem = menu.find((m) => String(m.id) === overIdStr);

    if (!activeItem || !overItem) {
      logError("[DND] item(s) not found in menu");
      dbg("[DND] not found details", {
        activeIdStr,
        overIdStr,
        activeFound: !!activeItem,
        overFound: !!overItem,
        menuIds: menu.map((m) => m.id),
      });
      return;
    }

    const sourceCell = {
      day: activeItem.day_of_week,
      meal: activeItem.meal_type,
    };
    const targetCell = { day: overItem.day_of_week, meal: overItem.meal_type };
    const sameCell =
      sourceCell.day === targetCell.day && sourceCell.meal === targetCell.meal;

    dbg("[DND] resolved items", {
      active: { id: activeItem.id, ...sourceCell, pos: activeItem.position },
      over: { id: overItem.id, ...targetCell, pos: overItem.position },
      sameCell,
    });

    const sourceItems = menu
      .filter(
        (m) =>
          m.day_of_week === sourceCell.day && m.meal_type === sourceCell.meal,
      )
      .sort((a, b) => a.position - b.position);

    const targetItems = sameCell
      ? sourceItems
      : menu
          .filter(
            (m) =>
              m.day_of_week === targetCell.day &&
              m.meal_type === targetCell.meal,
          )
          .sort((a, b) => a.position - b.position);

    const fromIndex = sourceItems.findIndex(
      (m) => String(m.id) === activeIdStr,
    );
    const toIndex = targetItems.findIndex((m) => String(m.id) === overIdStr);

    dbg("[DND] indexes", { fromIndex, toIndex });

    if (fromIndex === -1 || toIndex === -1) {
      logError("[DND] invalid indexes");
      dbg("[DND] invalid indexes details", { activeIdStr, overIdStr });
      return;
    }

    const moved = { ...activeItem };

    // Remove from source
    const newSource = sourceItems.slice();
    newSource.splice(fromIndex, 1);

    // Target base
    const newTarget = sameCell ? newSource.slice() : targetItems.slice();
    // Insert into target at toIndex
    newTarget.splice(toIndex, 0, moved);

    // Normalize positions
    const normalizedSource = newSource.map((it, idx) => ({
      ...it,
      position: idx + 1,
    }));
    const normalizedTarget = newTarget.map((it, idx) => ({
      ...it,
      position: idx + 1,
      day_of_week: targetCell.day,
      meal_type: targetCell.meal,
    }));

    dbg("[DND] normalized", {
      source: normalizedSource.map((x) => ({ id: x.id, pos: x.position })),
      target: normalizedTarget.map((x) => ({ id: x.id, pos: x.position })),
    });

    setMenu((prev) => {
      const sourceMap = new Map<number, MenuItem>(
        normalizedSource.map((x) => [x.id, x]),
      );
      const targetMap = new Map<number, MenuItem>(
        normalizedTarget.map((x) => [x.id, x]),
      );

      return prev.map((item) => {
        // moved item обязательно в target
        const inTarget = targetMap.get(item.id);
        if (inTarget) return inTarget;

        const inSource = sourceMap.get(item.id);
        if (inSource) return inSource;

        return item;
      });
    });

    logSuccess("[DND] menu updated");
    toast({
      title: "Готово",
      description: sameCell ? "Рецепты поменялись местами" : "Рецепт перенесён",
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
                                  items={mealRecipes.map((m) => String(m.id))}
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
                      {
                        menu.find((m) => String(m.id) === activeId)?.recipe
                          .title
                      }
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
