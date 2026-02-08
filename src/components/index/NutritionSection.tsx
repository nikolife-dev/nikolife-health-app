/* NutritionSection with cross-day & cross-meal drag-and-drop */
// Основано на предыдущей версии с DEBUG
// Добавлено:
// - перенос между приёмами пищи
// - перенос между днями
// - корректный пересчёт position в обеих ячейках

// ВАЖНО: backend пока НЕ вызывается — изменения только в UI-state

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
  cooking_time: number;
  calories: number;
}

interface MenuItem {
  id: number;
  day_of_week: number;
  meal_type: string;
  position: number;
  recipe: Recipe;
}

interface WeekDate {
  day_number: number;
  date: string;
  day_name: string;
}

const DEBUG = true;

export default function NutritionSection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logInfo } = useLiveLogs();

  const dbg = (msg: string, data?: unknown) => {
    if (!DEBUG) return;
    try {
      // @ts-ignore
      data ? logInfo(msg, data) : logInfo(msg);
    } catch {
      logInfo(msg);
    }
  };

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    dbg("[INIT] mounted");
  }, []);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
    dbg("[DND] dragStart", { id: e.active.id });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);

    if (!over) {
      dbg("[DND] drop cancelled");
      return;
    }

    const aId = String(active.id);
    const oId = String(over.id);

    if (aId === oId) return;

    const activeItem = menu.find((m) => String(m.id) === aId);
    const overItem = menu.find((m) => String(m.id) === oId);

    if (!activeItem || !overItem) {
      dbg("[DND] item not found", { aId, oId });
      return;
    }

    const sourceKey = `${activeItem.day_of_week}_${activeItem.meal_type}`;
    const targetKey = `${overItem.day_of_week}_${overItem.meal_type}`;

    dbg("[DND] move", { sourceKey, targetKey });

    const sourceItems = menu
      .filter(
        (m) =>
          m.day_of_week === activeItem.day_of_week &&
          m.meal_type === activeItem.meal_type,
      )
      .sort((a, b) => a.position - b.position);

    const targetItems =
      sourceKey === targetKey
        ? sourceItems
        : menu
            .filter(
              (m) =>
                m.day_of_week === overItem.day_of_week &&
                m.meal_type === overItem.meal_type,
            )
            .sort((a, b) => a.position - b.position);

    const fromIndex = sourceItems.findIndex((m) => m.id === activeItem.id);
    const toIndex = targetItems.findIndex((m) => m.id === overItem.id);

    if (fromIndex === -1 || toIndex === -1) return;

    const movedItem = { ...activeItem };

    let newSource = sourceItems.slice();
    newSource.splice(fromIndex, 1);

    let newTarget = sourceKey === targetKey ? newSource : targetItems.slice();

    newTarget.splice(toIndex, 0, movedItem);

    // пересчёт позиций
    newSource = newSource.map((item, idx) => ({ ...item, position: idx + 1 }));
    newTarget = newTarget.map((item, idx) => ({
      ...item,
      position: idx + 1,
      day_of_week: overItem.day_of_week,
      meal_type: overItem.meal_type,
    }));

    setMenu((prev) =>
      prev.map((item) => {
        if (item.id === movedItem.id) {
          return {
            ...item,
            day_of_week: overItem.day_of_week,
            meal_type: overItem.meal_type,
            position: newTarget.find((x) => x.id === item.id)!.position,
          };
        }
        const s = newSource.find((x) => x.id === item.id);
        if (s) return s;
        const t = newTarget.find((x) => x.id === item.id);
        if (t) return t;
        return item;
      }),
    );

    toast({
      title: "Перемещено",
      description: "Рецепт перенесён",
    });

    dbg("[DND] done");
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-6 text-sm text-gray-500">
        Drag & Drop между днями и приёмами пищи включён
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="border rounded-lg p-3 bg-white shadow-lg">
            {menu.find((m) => String(m.id) === activeId)?.recipe.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
