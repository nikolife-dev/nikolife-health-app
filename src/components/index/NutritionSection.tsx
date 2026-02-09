import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
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
import DraggableRecipe from "./nutrition/DraggableRecipe";
import DayCard from "./nutrition/DayCard";
import RecipeDetailsDialog from "./nutrition/RecipeDetailsDialog";
import RecipeCard from "./nutrition/RecipeCard";
import MealPlanControls from "./nutrition/MealPlanControls";

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

  const DEBUG = true;

  const dbg = (message: string, data?: unknown) => {
    if (!DEBUG) return;
    try {
      if (data === undefined) logInfo(message);
      // @ts-expect-error - logInfo может не принимать второй параметр
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

      let data: { success?: boolean; error?: string; message?: string } | null =
        null;
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

      logSuccess("[DEL] success");
      toast({ title: "Успешно!", description: "Блюдо удалено из меню" });

      setMenu((prev) => prev.filter((item) => item.id !== menuItemId));
    } catch (error) {
      logError(
        `[DEL] exception: ${error instanceof Error ? error.message : "unknown"}`,
      );
      console.error("Delete error:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось удалить блюдо",
        variant: "destructive",
      });
      dbg("[DEL] exception payload", { error });
    }
  };

  const clearMenu = async () => {
    dbg("[CLEAR] clearMenu: start");
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        logError("[CLEAR] no auth token");
        toast({
          title: "Ошибка",
          description: "Нет токена авторизации",
          variant: "destructive",
        });
        return;
      }

      const url =
        "https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6/clear";
      dbg("[CLEAR] request", { url, method: "POST" });

      const response = await fetch(url, {
        method: "POST",
        headers: { "X-Auth-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      dbg("[CLEAR] response", { status: response.status, ok: response.ok });
      const data = await response.json();
      dbg("[CLEAR] json", data);

      if (!response.ok) {
        logError(`[CLEAR] failed: ${data.error || "unknown"}`);
        throw new Error(data.error || "Ошибка очистки меню");
      }

      if (data.success) {
        logSuccess("[CLEAR] success");
        toast({
          title: "Успешно!",
          description: "Меню очищено",
        });
        setMenu([]);
        setWeekDates([]);
      } else {
        logError("[CLEAR] not successful");
        throw new Error(data.error || "Не удалось очистить меню");
      }
    } catch (error) {
      logError(
        `[CLEAR] exception: ${error instanceof Error ? error.message : "unknown"}`,
      );
      console.error("Clear menu error:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось очистить меню",
        variant: "destructive",
      });
      dbg("[CLEAR] exception payload", { error });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    dbg("[DND] DragStart", { id: event.active.id });
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    dbg("[DND] DragEnd", {
      activeId: active.id,
      overId: over?.id,
      hasOver: !!over,
    });

    setActiveId(null);

    if (!over) {
      dbg("[DND] no drop target");
      return;
    }

    const sourceId = String(active.id);
    const [sourceDayStr, sourceMealType] = sourceId.split("-");
    const sourceDay = parseInt(sourceDayStr, 10);

    const targetId = String(over.id);
    const [targetDayStr, targetMealType] = targetId.split("-");
    const targetDay = parseInt(targetDayStr, 10);

    dbg("[DND] Parsed identifiers", {
      sourceDay,
      sourceMealType,
      targetDay,
      targetMealType,
    });

    if (sourceId === targetId) {
      dbg("[DND] dropped to same slot => no-op");
      return;
    }

    const sourceItems = menu.filter(
      (m) => m.day_of_week === sourceDay && m.meal_type === sourceMealType,
    );
    const targetItems = menu.filter(
      (m) => m.day_of_week === targetDay && m.meal_type === targetMealType,
    );

    dbg("[DND] matched items", {
      source: sourceItems.length,
      target: targetItems.length,
    });

    const optimisticUpdate = menu.map((item) => {
      if (item.day_of_week === sourceDay && item.meal_type === sourceMealType) {
        return { ...item, day_of_week: targetDay, meal_type: targetMealType };
      }
      if (item.day_of_week === targetDay && item.meal_type === targetMealType) {
        return { ...item, day_of_week: sourceDay, meal_type: sourceMealType };
      }
      return item;
    });

    setMenu(optimisticUpdate);
    dbg("[DND] applied optimistic update");

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        logError("[DND] no auth token");
        toast({
          title: "Ошибка",
          description: "Нет токена авторизации",
          variant: "destructive",
        });
        setMenu(menu);
        return;
      }

      const sourceRecipeId = sourceItems[0]?.id;
      const targetRecipeId = targetItems[0]?.id;

      if (!sourceRecipeId) {
        dbg("[DND] source slot is empty => no server call needed");
        return;
      }

      const url =
        "https://functions.poehali.dev/04c8bc71-af39-4f0e-9d65-323dba4a29b6/swap";
      dbg("[DND] request", { url, method: "POST" });

      const body: {
        source_id: number;
        target_day: number;
        target_meal: string;
        target_id?: number;
      } = {
        source_id: sourceRecipeId,
        target_day: targetDay,
        target_meal: targetMealType,
      };

      if (targetRecipeId) {
        body.target_id = targetRecipeId;
      }

      dbg("[DND] request body", body);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "X-Auth-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      dbg("[DND] response", { status: response.status, ok: response.ok });
      const data = await response.json();
      dbg("[DND] json", data);

      if (!response.ok) {
        logError(`[DND] swap failed: ${data.error || "unknown"}`);
        throw new Error(data.error || "Ошибка перестановки");
      }

      if (data.success) {
        logSuccess("[DND] swap success");
        await loadMenu();
      } else {
        logError("[DND] swap not successful");
        throw new Error(data.error || "Не удалось переставить блюда");
      }
    } catch (error) {
      logError(
        `[DND] exception: ${error instanceof Error ? error.message : "unknown"}`,
      );
      console.error("Drag end error:", error);
      setMenu(menu);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось переставить блюда",
        variant: "destructive",
      });
      dbg("[DND] exception payload", { error });
    }
  };

  const [selectedRecipeDetail, setSelectedRecipeDetail] =
    useState<Recipe | null>(null);

  const getMenuForDay = (dayNum: number) => {
    return menu.filter((m) => m.day_of_week === dayNum);
  };

  const formatDate = (dayNum: number) => {
    const wd = weekDates.find((w) => w.day_number === dayNum);
    return wd ? `${wd.date} (${wd.day_name})` : `День ${dayNum}`;
  };

  const getMealCalories = (dayNum: number, mealType: string) => {
    const items = menu.filter(
      (m) => m.day_of_week === dayNum && m.meal_type === mealType,
    );
    return items.reduce((sum, item) => sum + item.recipe.calories, 0);
  };

  const getMealIcon = (mealType: string) => {
    if (mealType === "breakfast") return "Coffee";
    if (mealType === "lunch") return "UtensilsCrossed";
    if (mealType === "dinner") return "Moon";
    return "UtensilsCrossed";
  };

  const activeDragItem = activeId
    ? menu.find((m) => {
        const [dayStr, mealType] = activeId.split("-");
        const day = parseInt(dayStr, 10);
        return m.day_of_week === day && m.meal_type === mealType;
      })
    : null;

  if (!localStorage.getItem("auth_token")) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Питание</h2>
          <p className="text-gray-600">
            Планируйте своё питание на неделю вперёд
          </p>
        </div>
        <Card className="p-8">
          <div className="text-center">
            <Icon
              name="Lock"
              size={48}
              className="mx-auto mb-4 text-gray-400"
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Войдите в систему
            </h3>
            <p className="text-gray-600 mb-6">
              Для доступа к планировщику питания необходима авторизация
            </p>
            <MealPlanControls
              isGenerating={false}
              hasMenu={false}
              onGenerate={() => navigate("/auth")}
              onClear={() => {}}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Питание</h2>
          <p className="text-gray-600">
            Планируйте своё питание на неделю вперёд
          </p>
        </div>

        <Tabs defaultValue="plan" className="w-full">
          <TabsList>
            <TabsTrigger value="plan">План питания</TabsTrigger>
            <TabsTrigger value="recipes">Рецепты</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="space-y-6 mt-6">
            <MealPlanControls
              isGenerating={isGenerating}
              hasMenu={menu.length > 0}
              onGenerate={generateMenu}
              onClear={clearMenu}
            />

            {isLoading && (
              <Card className="p-12">
                <div className="text-center">
                  <Icon
                    name="Loader2"
                    size={48}
                    className="mx-auto mb-4 text-emerald-600 animate-spin"
                  />
                  <p className="text-gray-600">Загрузка меню...</p>
                </div>
              </Card>
            )}

            {!isLoading && menu.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <Icon
                    name="UtensilsCrossed"
                    size={48}
                    className="mx-auto mb-4 text-gray-400"
                  />
                  <p className="text-gray-600">
                    Меню пока пусто. Сгенерируйте план питания на неделю!
                  </p>
                </div>
              </Card>
            )}

            {!isLoading && menu.length > 0 && (
              <div className="space-y-6">
                {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                  const dayMenu = getMenuForDay(dayNum);
                  if (dayMenu.length === 0) return null;
                  return (
                    <DayCard
                      key={dayNum}
                      dayNum={dayNum}
                      formatDate={formatDate}
                      meals={meals}
                      getMealIcon={getMealIcon}
                      menu={menu}
                      getMealCalories={getMealCalories}
                      deleteRecipe={deleteRecipe}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menu
                .map((item) => item.recipe)
                .filter(
                  (recipe, index, self) =>
                    self.findIndex((r) => r.id === recipe.id) === index,
                )
                .map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => setSelectedRecipeDetail(recipe)}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        <RecipeDetailsDialog
          recipe={selectedRecipeDetail}
          onClose={() => setSelectedRecipeDetail(null)}
        />
      </div>

      <DragOverlay>
        {activeDragItem && (
          <DraggableRecipe recipe={activeDragItem.recipe} isOverlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}
