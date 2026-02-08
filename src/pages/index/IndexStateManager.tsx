import { useState } from 'react';
import { workouts, recipes } from './IndexDataProvider';

interface UseIndexStateReturn {
  selectedWorkout: number | null;
  setSelectedWorkout: (id: number | null, logInfo: (msg: string) => void) => void;
  workoutProgress: number[];
  setWorkoutProgress: (progress: number[], logInfo: (msg: string) => void) => void;
  selectedRecipe: number | null;
  setSelectedRecipe: (id: number | null, logInfo: (msg: string) => void) => void;
  mealPlan: {[key: string]: number};
  setMealPlan: (plan: {[key: string]: number}, logInfo: (msg: string) => void) => void;
}

export function useIndexState(): UseIndexStateReturn {
  const [selectedWorkout, setSelectedWorkoutRaw] = useState<number | null>(null);
  const [workoutProgress, setWorkoutProgressRaw] = useState<number[]>([]);
  const [selectedRecipe, setSelectedRecipeRaw] = useState<number | null>(null);
  const [mealPlan, setMealPlanRaw] = useState<{[key: string]: number}>({});

  const setSelectedWorkout = (id: number | null, logInfo: (msg: string) => void) => {
    logInfo(`🎯 Выбор тренировки: ${id !== null ? `#${id} "${workouts[id]?.title}"` : 'отмена'}`);
    if (id !== null) {
      const workout = workouts[id];
      logInfo(`  • Длительность: ${workout?.duration}`);
      logInfo(`  • Уровень: ${workout?.level}`);
      logInfo(`  • Категория: ${workout?.category}`);
      logInfo(`  • Калории: ${workout?.calories} ккал`);
      logInfo(`  • Упражнений: ${workout?.exercises?.length || 0}`);
    }
    setSelectedWorkoutRaw(id);
  };

  const setWorkoutProgress = (progress: number[], logInfo: (msg: string) => void) => {
    logInfo(`📈 Обновление прогресса тренировки: ${progress.length} упражнений выполнено`);
    logInfo(`  • Прогресс: ${progress.join(', ')}`);
    setWorkoutProgressRaw(progress);
  };

  const setSelectedRecipe = (id: number | null, logInfo: (msg: string) => void) => {
    logInfo(`🎯 Выбор рецепта: ${id !== null ? `#${id} "${recipes[id]?.name}"` : 'отмена'}`);
    if (id !== null) {
      const recipe = recipes[id];
      logInfo(`  • Калории: ${recipe?.calories} ккал`);
      logInfo(`  • Белки: ${recipe?.protein}г, Углеводы: ${recipe?.carbs}г, Жиры: ${recipe?.fats}г`);
      logInfo(`  • Время приготовления: ${recipe?.cookTime}`);
      logInfo(`  • Сложность: ${recipe?.difficulty}`);
      logInfo(`  • Ингредиентов: ${recipe?.ingredients?.length || 0}`);
    }
    setSelectedRecipeRaw(id);
  };

  const setMealPlan = (plan: {[key: string]: number}, logInfo: (msg: string) => void) => {
    logInfo(`📅 Обновление плана питания`);
    logInfo(`  • Приёмов пищи запланировано: ${Object.keys(plan).length}`);
    Object.entries(plan).forEach(([time, recipeId]) => {
      logInfo(`    - ${time}: рецепт #${recipeId} "${recipes[recipeId]?.name}"`);
    });
    setMealPlanRaw(plan);
  };

  return {
    selectedWorkout,
    setSelectedWorkout,
    workoutProgress,
    setWorkoutProgress,
    selectedRecipe,
    setSelectedRecipe,
    mealPlan,
    setMealPlan,
  };
}
