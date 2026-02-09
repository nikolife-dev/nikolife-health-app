import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface RecipeDetailsDialogProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export default function RecipeDetailsDialog({
  recipe,
  onClose,
}: RecipeDetailsDialogProps) {
  if (!recipe) return null;

  return (
    <Dialog open={!!recipe} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{recipe.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Icon name="Clock" size={14} className="mr-1" />
              {recipe.cooking_time} мин
            </Badge>
            <Badge variant="secondary">
              <Icon name="Users" size={14} className="mr-1" />
              {recipe.servings} порций
            </Badge>
            <Badge variant="secondary">
              <Icon name="Flame" size={14} className="mr-1" />
              {recipe.calories} ккал
            </Badge>
            <Badge variant="secondary">{recipe.category}</Badge>
          </div>
          {recipe.image_url && (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
          <div>
            <h3 className="font-semibold mb-2">Описание</h3>
            <p className="text-gray-600">{recipe.description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
