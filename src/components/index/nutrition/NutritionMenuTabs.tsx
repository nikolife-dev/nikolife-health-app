import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import DraggableRecipe from "./DraggableRecipe";
import DayCard from "./DayCard";
import type { MenuItem, WeekDate } from "./useNutritionMenu";

interface NutritionMenuTabsProps {
  menu: MenuItem[];
  weekDates: WeekDate[];
  meals: { breakfast: string; lunch: string; dinner: string };
  activeDragItem: MenuItem | null | undefined;
  onGenerate: () => void;
  getRecipesForMeal: (dayNumber: number, mealType: string) => MenuItem[];
  getTotalCaloriesForMeal: (dayNumber: number, mealType: string) => number;
  onDelete: (menuItemId: number) => void;
  onDragStart: Parameters<typeof DndContext>[0]["onDragStart"];
  onDragEnd: Parameters<typeof DndContext>[0]["onDragEnd"];
}

export default function NutritionMenuTabs({
  menu,
  weekDates,
  meals,
  activeDragItem,
  onGenerate,
  getRecipesForMeal,
  getTotalCaloriesForMeal,
  onDelete,
  onDragStart,
  onDragEnd,
}: NutritionMenuTabsProps) {
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  return (
    <Tabs defaultValue="week" className="w-full">
      <TabsList>
        <TabsTrigger value="week">Моё меню</TabsTrigger>
        <TabsTrigger value="recipes" onClick={() => navigate("/recipes")}>
          Все рецепты
        </TabsTrigger>
      </TabsList>

      <TabsContent value="week" className="space-y-4 sm:space-y-6 mt-6">
        {weekDates.length === 0 && menu.length === 0 ? (
          <Card className="p-6 sm:p-12 text-center">
            <Icon
              name="CalendarDays"
              size={48}
              className="mx-auto mb-4 text-gray-400 sm:w-16 sm:h-16"
            />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Меню пока пусто
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Сгенерируйте автоматический план питания или добавьте рецепты
              вручную
            </p>
            <Button
              onClick={onGenerate}
              className="bg-[#748c6d] hover:bg-[#5a7052] min-h-[44px] w-full sm:w-auto"
            >
              <Icon name="Wand2" size={18} className="mr-2" />
              <span className="text-sm sm:text-base">Сгенерировать план</span>
            </Button>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <div className="space-y-4 sm:space-y-6">
              {weekDates.map((day) => (
                <DayCard
                  key={day.day_number}
                  day={day}
                  meals={meals}
                  getRecipesForMeal={getRecipesForMeal}
                  getTotalCaloriesForMeal={getTotalCaloriesForMeal}
                  onDelete={onDelete}
                  onAddClick={() => navigate("/recipes")}
                />
              ))}
            </div>

            <DragOverlay>
              {activeDragItem ? (
                <DraggableRecipe
                  menuItem={activeDragItem}
                  onDelete={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </TabsContent>
    </Tabs>
  );
}
