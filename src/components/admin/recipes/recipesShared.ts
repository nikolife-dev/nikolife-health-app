export interface Recipe {
  id: number;
  title: string;
  description: string;
  cooking_time: number | null;
  servings: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  image_url: string | null;
  category: string[];
  ingredients: string[];
  instructions: string;
  is_active: boolean;
  created_at: string;
  weight_per_serving: number | null;
  calories_100: number | null;
  protein_100: number | null;
  fats_100: number | null;
  carbs_100: number | null;
  user_groups: string | null;
}

export const categories = [
  'all',
  'Гарниры',
  'Десерты',
  'Завтраки',
  'Закуски',
  'Ланч-боксы',
  'Напитки',
  'Основные блюда',
  'Перекусы',
  'Салаты',
  'Смузи',
  'Соусы и заправки',
  'Супы',
  'Хлеб без глютена'
];

export const getCategoryBadge = (cat: string) => {
  const colors: Record<string, string> = {
    'Гарниры': 'bg-amber-500/10 text-amber-700',
    'Десерты': 'bg-pink-500/10 text-pink-700',
    'Завтраки': 'bg-yellow-500/10 text-yellow-700',
    'Закуски': 'bg-lime-500/10 text-lime-700',
    'Ланч-боксы': 'bg-teal-500/10 text-teal-700',
    'Напитки': 'bg-cyan-500/10 text-cyan-700',
    'Основные блюда': 'bg-orange-500/10 text-orange-700',
    'Перекусы': 'bg-green-500/10 text-green-700',
    'Салаты': 'bg-emerald-500/10 text-emerald-700',
    'Смузи': 'bg-purple-500/10 text-purple-700',
    'Соусы и заправки': 'bg-red-500/10 text-red-700',
    'Супы': 'bg-blue-500/10 text-blue-700',
    'Хлеб без глютена': 'bg-stone-500/10 text-stone-700'
  };
  return colors[cat] || 'bg-gray-500/10 text-gray-700';
};
