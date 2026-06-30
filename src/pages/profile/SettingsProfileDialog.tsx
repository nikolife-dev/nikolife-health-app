import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface SettingsForm {
  goal: string;
  activityLevel: string;
  age: string;
  weight: string;
  height: string;
  dietPreference: string;
}

interface SettingsProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settingsForm: SettingsForm;
  setSettingsForm: (form: SettingsForm) => void;
  isSavingSettings: boolean;
  onSave: () => void;
}

export default function SettingsProfileDialog({
  open,
  onOpenChange,
  settingsForm,
  setSettingsForm,
  isSavingSettings,
  onSave,
}: SettingsProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Настройки профиля</DialogTitle>
          <DialogDescription>
            Измените ваши цели и параметры здоровья
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Главная цель</Label>
            <Select value={settingsForm.goal} onValueChange={(value) => setSettingsForm({ ...settingsForm, goal: value })}>
              <SelectTrigger id="goal">
                <SelectValue placeholder="Выберите цель" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lose_weight">Снижение веса</SelectItem>
                <SelectItem value="gain_muscle">Набор мышечной массы</SelectItem>
                <SelectItem value="maintain">Поддержание формы</SelectItem>
                <SelectItem value="improve_health">Улучшение общего здоровья</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityLevel">Уровень активности</Label>
            <Select value={settingsForm.activityLevel} onValueChange={(value) => setSettingsForm({ ...settingsForm, activityLevel: value })}>
              <SelectTrigger id="activityLevel">
                <SelectValue placeholder="Выберите уровень активности" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Малоактивный (офисная работа)</SelectItem>
                <SelectItem value="light">Легкая активность (1-2 тренировки/неделю)</SelectItem>
                <SelectItem value="moderate">Умеренная активность (3-4 тренировки/неделю)</SelectItem>
                <SelectItem value="active">Активный (5-6 тренировок/неделю)</SelectItem>
                <SelectItem value="very_active">Очень активный (ежедневные тренировки)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Возраст (лет)</Label>
              <Input
                id="age"
                type="number"
                value={settingsForm.age}
                onChange={(e) => setSettingsForm({ ...settingsForm, age: e.target.value })}
                placeholder="25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Вес (кг)</Label>
              <Input
                id="weight"
                type="number"
                value={settingsForm.weight}
                onChange={(e) => setSettingsForm({ ...settingsForm, weight: e.target.value })}
                placeholder="70"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Рост (см)</Label>
              <Input
                id="height"
                type="number"
                value={settingsForm.height}
                onChange={(e) => setSettingsForm({ ...settingsForm, height: e.target.value })}
                placeholder="175"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietPreference">Предпочтения в питании</Label>
            <Select value={settingsForm.dietPreference} onValueChange={(value) => setSettingsForm({ ...settingsForm, dietPreference: value })}>
              <SelectTrigger id="dietPreference">
                <SelectValue placeholder="Выберите тип питания" />
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSavingSettings}
          >
            Отмена
          </Button>
          <Button
            onClick={onSave}
            disabled={isSavingSettings}
            className="bg-gradient-to-r from-[#748c6d] to-[#5a7052] hover:from-[#5a7052] hover:to-[#4a5f42]"
          >
            {isSavingSettings ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
