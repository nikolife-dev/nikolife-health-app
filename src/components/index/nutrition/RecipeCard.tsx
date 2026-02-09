import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

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

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <Card
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name="UtensilsCrossed" className="text-emerald-600" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{recipe.title}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {recipe.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Icon name="Clock" size={12} className="mr-1" />
              {recipe.cooking_time} мин
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Icon name="Flame" size={12} className="mr-1" />
              {recipe.calories} ккал
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
