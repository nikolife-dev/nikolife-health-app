import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { UserFormData } from './types';

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: UserFormData;
  onFormChange: (data: UserFormData) => void;
  mode: 'add' | 'edit';
}

export default function UserFormDialog({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  mode
}: UserFormDialogProps) {
  const updateForm = (updates: Partial<UserFormData>) => {
    onFormChange({ ...formData, ...updates });
  };

  const updateHealthParams = (updates: Partial<UserFormData['health_parameters']>) => {
    onFormChange({
      ...formData,
      health_parameters: { ...formData.health_parameters, ...updates }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Добавить пользователя' : 'Редактировать пользователя'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Создайте нового пользователя системы' : 'Измените данные пользователя'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-name`}>Имя</Label>
            <Input
              id={`${mode}-name`}
              value={formData.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              placeholder={mode === 'add' ? 'Введите имя' : 'Имя пользователя'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${mode}-email`}>Email</Label>
            <Input
              id={`${mode}-email`}
              type="email"
              value={formData.email}
              onChange={(e) => updateForm({ email: e.target.value })}
              placeholder={mode === 'add' ? 'Введите email' : 'email@example.com'}
            />
          </div>

          {mode === 'add' && (
            <div className="space-y-2">
              <Label htmlFor="add-password">Пароль (временный)</Label>
              <Input
                id="add-password"
                type="text"
                value={formData.password}
                onChange={(e) => updateForm({ password: e.target.value })}
                placeholder="Введите пароль"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`${mode}-telegram`}>Telegram Username</Label>
            <Input
              id={`${mode}-telegram`}
              value={formData.telegram_username}
              onChange={(e) => updateForm({ telegram_username: e.target.value })}
              placeholder="@username (необязательно)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${mode}-plan`}>Тарифный план</Label>
            <Select
              value={formData.selected_plan}
              onValueChange={(value) => updateForm({ selected_plan: value })}
            >
              <SelectTrigger id={`${mode}-plan`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Бесплатный</SelectItem>
                <SelectItem value="basic">Базовый</SelectItem>
                <SelectItem value="premium">Премиум</SelectItem>
                <SelectItem value="family">Семейный</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${mode}-admin`}
              checked={formData.is_admin}
              onCheckedChange={(checked) => updateForm({ is_admin: checked as boolean })}
            />
            <Label htmlFor={`${mode}-admin`} className="cursor-pointer">
              {mode === 'add' ? 'Администратор' : 'Права администратора'}
            </Label>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">
              Параметры здоровья {mode === 'add' && '(необязательно)'}
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`${mode}-goal`}>Цель</Label>
                <Select
                  value={formData.health_parameters.goal}
                  onValueChange={(value) => updateHealthParams({ goal: value })}
                >
                  <SelectTrigger id={`${mode}-goal`}>
                    <SelectValue placeholder="Выберите цель" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_weight">Снижение веса</SelectItem>
                    <SelectItem value="gain_muscle">Набор мышечной массы</SelectItem>
                    <SelectItem value="maintain">Поддержание формы</SelectItem>
                    <SelectItem value="improve_health">Улучшение здоровья</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${mode}-activity`}>Уровень активности</Label>
                <Select
                  value={formData.health_parameters.activity_level}
                  onValueChange={(value) => updateHealthParams({ activity_level: value })}
                >
                  <SelectTrigger id={`${mode}-activity`}>
                    <SelectValue placeholder="Выберите уровень" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Малоактивный</SelectItem>
                    <SelectItem value="light">Легкая активность</SelectItem>
                    <SelectItem value="moderate">Умеренная</SelectItem>
                    <SelectItem value="active">Активный</SelectItem>
                    <SelectItem value="very_active">Очень активный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor={`${mode}-age`}>Возраст</Label>
                  <Input
                    id={`${mode}-age`}
                    type="number"
                    value={formData.health_parameters.age}
                    onChange={(e) => updateHealthParams({ age: e.target.value })}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${mode}-weight`}>Вес (кг)</Label>
                  <Input
                    id={`${mode}-weight`}
                    type="number"
                    value={formData.health_parameters.weight}
                    onChange={(e) => updateHealthParams({ weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${mode}-height`}>Рост (см)</Label>
                  <Input
                    id={`${mode}-height`}
                    type="number"
                    value={formData.health_parameters.height}
                    onChange={(e) => updateHealthParams({ height: e.target.value })}
                    placeholder="175"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${mode}-diet`}>Питание</Label>
                <Select
                  value={formData.health_parameters.diet_preference}
                  onValueChange={(value) => updateHealthParams({ diet_preference: value })}
                >
                  <SelectTrigger id={`${mode}-diet`}>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_preference">Без ограничений</SelectItem>
                    <SelectItem value="vegetarian">Вегетарианство</SelectItem>
                    <SelectItem value="vegan">Веганство</SelectItem>
                    <SelectItem value="pescatarian">Пескетарианство</SelectItem>
                    <SelectItem value="keto">Кето-диета</SelectItem>
                    <SelectItem value="paleo">Палео-диета</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.name.trim() || !formData.email.trim()}
            className="bg-gradient-to-r from-[#748c6d] to-[#5a7052] hover:from-[#5a7052] hover:to-[#4a5f42]"
          >
            {mode === 'add' && <Icon name="Plus" size={16} className="mr-2" />}
            {mode === 'add' ? 'Создать' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
