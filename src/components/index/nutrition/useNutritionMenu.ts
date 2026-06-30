import { useState, useEffect } from "react";
import funcUrls from '../../../../backend/func2url.json';
import { useToast } from "@/hooks/use-toast";
import { useLiveLogs } from "@/components/LiveLogs";
import {
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";

export interface Recipe {
  id: number;
  title: string;
  description: string;
  cooking_time: number;
  servings: number;
  calories: number;
  image_url?: string;
  category: string;
}

export interface MenuItem {
  id: number;
  day_of_week: number;
  meal_type: string;
  position: number;
  notes?: string;
  recipe: Recipe;
}

export interface WeekDate {
  day_number: number;
  date: string;
  day_name: string;
}

export function useNutritionMenu() {
  const { toast } = useToast();
  const { logs, clearLogs, logInfo, logSuccess, logError } = useLiveLogs();

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

      const url = funcUrls['weekly-menu'];
      dbg("[MENU] loadMenu: fetch", { url });

      const response = await fetch(url, { headers: { "X-Auth-Token": token } });
      dbg("[MENU] loadMenu: response", {
        status: response.status,
        ok: response.ok,
      });

      const data = await response.json();

      console.log("[MENU] RAW RESPONSE:", JSON.stringify(data, null, 2));
      logInfo(`[MENU] Response keys: ${Object.keys(data || {}).join(", ")}`);

      if (data?.error) {
        logError(`[MENU] Backend error: ${data.error}`);
      }

      logInfo(`[MENU] Has menu? ${!!data?.menu} (type: ${typeof data?.menu}, isArray: ${Array.isArray(data?.menu)})`);
      logInfo(`[MENU] Has week_dates? ${!!data?.week_dates} (type: ${typeof data?.week_dates}, isArray: ${Array.isArray(data?.week_dates)})`);

      if (data?.menu) {
        logInfo(`[MENU] menu length: ${Array.isArray(data.menu) ? data.menu.length : 'not array'}`);
        if (Array.isArray(data.menu) && data.menu.length > 0) {
          logInfo(`[MENU] First menu item: ${JSON.stringify(data.menu[0])}`);
        }
      }

      if (data?.week_dates) {
        logInfo(`[MENU] week_dates length: ${Array.isArray(data.week_dates) ? data.week_dates.length : 'not array'}`);
      }

      if (data?.menu && Array.isArray(data.menu)) {
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

      const url = `${funcUrls['weekly-menu']}?action=generate`;
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

      const url = `${funcUrls['weekly-menu']}?action=clear`;
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
    } finally {
      dbg("[CLEAR] clearMenu: end");
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

      const url = `${funcUrls['weekly-menu']}?id=${menuItemId}`;
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

      let data: { success?: boolean; error?: string; message?: string } | null = null;
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

  const handleDragStart = (event: DragStartEvent) => {
    dbg("[DND] dragStart", { activeId: event.active?.id });
    setActiveId(String(event.active.id));
  };

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

    const newSource = sourceItems.slice();
    newSource.splice(fromIndex, 1);

    const newTarget = sameCell ? newSource.slice() : targetItems.slice();
    newTarget.splice(toIndex, 0, moved);

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

  const activeDragItem = activeId ? menu.find((m) => String(m.id) === activeId) : null;

  return {
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
  };
}
