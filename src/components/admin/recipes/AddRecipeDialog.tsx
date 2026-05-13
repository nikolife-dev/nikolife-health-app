import { useState } from 'react';
import funcUrls from '../../../../backend/func2url.json';
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
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import CategorySelector from './CategorySelector';
import ImageDropzone from './ImageDropzone';

const RECIPES_API = funcUrls.recipes;

interface AddRecipeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddRecipeDialog({
  open,
  onClose,
  onSuccess,
}: AddRecipeDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copyImageToStorage, setCopyImageToStorage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categories: [] as string[],
    cooking_time: '',
    servings: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    ingredients: '',
    instructions: '',
  });

  const handleImageSelected = (file: File) => {
    setImageFile(file);
    setImageUrl(null);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUrlSelected = (url: string, copy: boolean) => {
    setImageFile(null);
    setImageUrl(url);
    setCopyImageToStorage(copy);
    setImagePreview(url);
  };

  const handleImageClear = () => {
    setImageFile(null);
    setImageUrl(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.title || formData.categories.length === 0) {
      toast({
        title: 'Заполните обязательные поля',
        description: 'Название и минимум одна категория обязательны',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    console.log('[AddRecipe] Начало создания рецепта');

    try {
      const token = localStorage.getItem('auth_token');
      console.log('[AddRecipe] Токен получен', { hasToken: !!token });

      const ingredients = formData.ingredients
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.trim());

      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: formData.categories,
        cooking_time: parseInt(formData.cooking_time) || 0,
        servings: parseInt(formData.servings) || 1,
        calories: parseInt(formData.calories) || 0,
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fats: parseFloat(formData.fats) || 0,
        ingredients,
        instructions: formData.instructions,
      };

      console.log('[AddRecipe] Payload подготовлен', { 
        hasImage: !!imageFile, 
        ingredientsCount: ingredients.length,
        imageSize: imageFile ? `${(imageFile.size / 1024).toFixed(2)} KB` : 'нет'
      });

      if (imageFile) {
        if (imageFile.size > 5 * 1024 * 1024) {
          throw new Error('Размер изображения не должен превышать 5 МБ');
        }
        
        console.log('[AddRecipe] Конвертация изображения в base64', { 
          fileName: imageFile.name, 
          fileSize: `${(imageFile.size / 1024).toFixed(2)} KB`
        });
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        const base64 = await base64Promise;
        payload.image_base64 = base64;
        console.log('[AddRecipe] Изображение конвертировано', { base64Length: `${(base64.length / 1024).toFixed(2)} KB` });
      } else if (imageUrl) {
        if (copyImageToStorage) {
          payload.image_url_import = imageUrl;
        } else {
          payload.image_url = imageUrl;
        }
      }

      const payloadSize = JSON.stringify(payload).length;
      console.log('[AddRecipe] Отправка POST запроса', { 
        url: RECIPES_API,
        payloadSize: `${(payloadSize / 1024).toFixed(2)} KB`
      });

      const response = await fetch(RECIPES_API, {
        method: 'POST',
        headers: {
          'X-Auth-Token': token!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[AddRecipe] Ответ получен', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText 
      });

      if (response.status === 413) {
        throw new Error('Запрос слишком большой. Попробуйте загрузить изображение меньшего размера (до 1 МБ)');
      }

      const data = await response.json();
      console.log('[AddRecipe] Данные распарсены', { data });

      if (response.ok && data.success) {
        console.log('[AddRecipe] ✅ Рецепт успешно создан');
        toast({
          title: 'Успешно!',
          description: 'Рецепт добавлен',
        });
        onSuccess();
      } else {
        console.error('[AddRecipe] ❌ Ошибка от сервера', { 
          error: data.error, 
          data 
        });
        throw new Error(data.error || 'Ошибка создания рецепта');
      }
    } catch (error) {
      console.error('[AddRecipe] ❌ Ошибка при создании', { 
        error, 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined 
      });
      
      let errorMessage = 'Не удалось создать рецепт';
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch') {
          errorMessage = 'Ошибка соединения с сервером. Проверьте размер изображения (не более 1 МБ)';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      console.log('[AddRecipe] Завершение операции');
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      categories: [],
      cooking_time: '',
      servings: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      ingredients: '',
      instructions: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Добавить рецепт</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <CategorySelector
            selectedCategories={formData.categories}
            onChange={(categories) =>
              setFormData({ ...formData, categories })
            }
          />

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
            <Label>Фото рецепта</Label>
            <div className="mt-1">
              <ImageDropzone
                imagePreview={imagePreview}
                onFileSelected={handleImageSelected}
                onUrlSelected={handleUrlSelected}
                onClear={handleImageClear}
              />
            </div>
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
                  Создание...
                </>
              ) : (
                <>
                  <Icon name="Check" size={20} className="mr-2" />
                  Создать
                </>
              )}
            </Button>
            <Button onClick={handleClose} variant="outline">
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}