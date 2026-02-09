import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const RECIPES_API = 'https://functions.poehali.dev/1fb55aac-7fec-4f7c-a5a0-625b2cfed416';

interface Recipe {
  id: number;
  title: string;
  description: string;
  cooking_time: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image_url: string | null;
  category: string;
  ingredients: string[];
  instructions: string;
  is_active: boolean;
}

interface EditRecipeDialogProps {
  open: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRecipeDialog({
  open,
  recipe,
  onClose,
  onSuccess,
}: EditRecipeDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'обед',
    cooking_time: '',
    servings: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    ingredients: '',
    instructions: '',
    is_active: true,
  });

  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title,
        description: recipe.description || '',
        category: recipe.category,
        cooking_time: recipe.cooking_time.toString(),
        servings: recipe.servings.toString(),
        calories: recipe.calories.toString(),
        protein: recipe.protein.toString(),
        carbs: recipe.carbs.toString(),
        fats: recipe.fats.toString(),
        ingredients: recipe.ingredients.join('\n'),
        instructions: recipe.instructions || '',
        is_active: recipe.is_active,
      });
      setImagePreview(recipe.image_url);
    }
  }, [recipe]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !recipe) {
      toast({
        title: 'Заполните обязательные поля',
        description: 'Название и категория обязательны',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');

      const ingredients = formData.ingredients
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.trim());

      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        cooking_time: parseInt(formData.cooking_time) || 0,
        servings: parseInt(formData.servings) || 1,
        calories: parseInt(formData.calories) || 0,
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fats: parseFloat(formData.fats) || 0,
        ingredients,
        instructions: formData.instructions,
        is_active: formData.is_active,
      };

      if (imageFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        const base64 = await base64Promise;
        payload.image_base64 = base64;
      }

      const response = await fetch(`${RECIPES_API}/${recipe.id}`, {
        method: 'PUT',
        headers: {
          'X-Auth-Token': token!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Успешно!',
          description: 'Рецепт обновлен',
        });
        onSuccess();
      } else {
        throw new Error(data.error || 'Ошибка обновления рецепта');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description:
          error instanceof Error ? error.message : 'Не удалось обновить рецепт',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать рецепт</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label>Активен (виден пользователям)</Label>
          </div>

          <div>
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Название рецепта"
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Краткое описание"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Категория *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="завтрак">Завтрак</SelectItem>
                  <SelectItem value="обед">Обед</SelectItem>
                  <SelectItem value="ужин">Ужин</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cooking_time">Время приготовления (мин)</Label>
              <Input
                id="cooking_time"
                type="number"
                value={formData.cooking_time}
                onChange={(e) =>
                  setFormData({ ...formData, cooking_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="servings">Количество порций</Label>
              <Input
                id="servings"
                type="number"
                value={formData.servings}
                onChange={(e) =>
                  setFormData({ ...formData, servings: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="calories">Калории (ккал)</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) =>
                  setFormData({ ...formData, calories: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="protein">Белки (г)</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                value={formData.protein}
                onChange={(e) =>
                  setFormData({ ...formData, protein: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="carbs">Углеводы (г)</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                value={formData.carbs}
                onChange={(e) =>
                  setFormData({ ...formData, carbs: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="fats">Жиры (г)</Label>
              <Input
                id="fats"
                type="number"
                step="0.1"
                value={formData.fats}
                onChange={(e) =>
                  setFormData({ ...formData, fats: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="image">Фото рецепта</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="ingredients">Ингредиенты (каждый с новой строки)</Label>
            <Textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={(e) =>
                setFormData({ ...formData, ingredients: e.target.value })
              }
              placeholder="Молоко 200 мл&#10;Яйца 2 шт&#10;Мука 150 г"
              rows={5}
            />
          </div>

          <div>
            <Label htmlFor="instructions">Способ приготовления</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              placeholder="Подробное описание процесса приготовления..."
              rows={6}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-[#748c6d] hover:bg-[#5a7052]"
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Check" size={20} className="mr-2" />
                  Сохранить
                </>
              )}
            </Button>
            <Button onClick={onClose} variant="outline">
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
