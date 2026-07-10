import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
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
import { Switch } from '@/components/ui/switch';
import { Habit, HabitTemplate, NewHabitData, CATEGORIES, WEEKDAYS, TIMEZONES } from './types';

interface ReminderValue {
  reminder_enabled: boolean;
  reminder_time: string;
  reminder_channel: 'telegram' | 'email';
  reminder_timezone: string;
}

function ReminderFields({
  value,
  onChange,
}: {
  value: ReminderValue;
  onChange: (patch: Partial<ReminderValue>) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Bell" size={18} className="text-[#748c6d]" />
          <Label className="cursor-pointer">Напоминание</Label>
        </div>
        <Switch
          checked={value.reminder_enabled}
          onCheckedChange={(checked) => onChange({ reminder_enabled: checked })}
        />
      </div>
      {value.reminder_enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">Время</Label>
              <Input
                type="time"
                value={value.reminder_time || '09:00'}
                onChange={(e) => onChange({ reminder_time: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Канал</Label>
              <Select
                value={value.reminder_channel}
                onValueChange={(val) =>
                  onChange({ reminder_channel: val as 'telegram' | 'email' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Часовой пояс</Label>
            <Select
              value={value.reminder_timezone || '+03:00'}
              onValueChange={(val) => onChange({ reminder_timezone: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: HabitTemplate[];
  onSelectTemplate: (template: HabitTemplate) => void;
}

export function TemplateDialog({ open, onOpenChange, templates, onSelectTemplate }: TemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Выберите привычку из списка</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const catTemplates = templates.filter((t) => t.category === cat);
            if (catTemplates.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="font-semibold text-lg mb-2">{cat}</h3>
                <div className="space-y-2">
                  {catTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onSelectTemplate(template)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.title}</h4>
                          <p className="text-sm text-gray-600">
                            {template.description}
                          </p>
                        </div>
                        <Icon name="Plus" size={20} />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MyHabitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: Habit[];
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: number) => void;
}

export function MyHabitsDialog({ open, onOpenChange, habits, onEdit, onDelete }: MyHabitsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Мои привычки</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {habits.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">У вас пока нет привычек</p>
            </Card>
          ) : (
            habits.map((habit) => (
              <Card key={habit.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{habit.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {habit.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{habit.goal}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>🔥 {habit.current_streak} дней</span>
                      <span>✅ {habit.total_completions} выполнений</span>
                      <span>📅 {habit.goal_days} дней цель</span>
                      <span>🔁 {habit.times_per_day}x/день</span>
                      {habit.reminder_enabled && (
                        <span>🔔 {habit.reminder_time} · {habit.reminder_channel === 'email' ? 'E-mail' : 'Telegram'}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {WEEKDAYS.map((day) => (
                        <span
                          key={day.id}
                          className={`px-2 py-1 rounded text-xs ${
                            habit.days_of_week.includes(day.id)
                              ? 'bg-[#748c6d] text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {day.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onEdit(habit);
                        onOpenChange(false);
                      }}
                      className="min-h-[36px]"
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm(`Удалить привычку "${habit.title}"?`)) {
                          onDelete(habit.id);
                        }
                      }}
                      className="min-h-[36px]"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CreateHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newHabit: NewHabitData;
  setNewHabit: (habit: NewHabitData) => void;
  onCreateHabit: () => void;
  onToggleDayOfWeek: (day: number) => void;
}

export function CreateHabitDialog({
  open,
  onOpenChange,
  newHabit,
  setNewHabit,
  onCreateHabit,
  onToggleDayOfWeek,
}: CreateHabitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать привычку</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Название привычки</Label>
            <Input
              value={newHabit.title}
              onChange={(e) =>
                setNewHabit({ ...newHabit, title: e.target.value })
              }
              placeholder="Утренняя зарядка"
              maxLength={40}
            />
          </div>
          <div>
            <Label>Категория</Label>
            <Select
              value={newHabit.category}
              onValueChange={(val) =>
                setNewHabit({ ...newHabit, category: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Цель</Label>
            <Input
              value={newHabit.goal}
              onChange={(e) =>
                setNewHabit({ ...newHabit, goal: e.target.value })
              }
              placeholder="Делать зарядку каждый день"
              maxLength={40}
            />
          </div>
          <div>
            <Label>Количество дней для достижения</Label>
            <Input
              type="number"
              min={30}
              max={360}
              value={newHabit.goal_days}
              onChange={(e) =>
                setNewHabit({
                  ...newHabit,
                  goal_days: Math.max(30, parseInt(e.target.value) || 30),
                })
              }
            />
          </div>
          <div>
            <Label>Дни недели</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {WEEKDAYS.map((day) => (
                <Badge
                  key={day.id}
                  className={`cursor-pointer min-h-[36px] px-4 ${
                    newHabit.days_of_week.includes(day.id)
                      ? 'bg-[#748c6d]'
                      : 'bg-gray-300'
                  }`}
                  onClick={() => onToggleDayOfWeek(day.id)}
                >
                  {day.name}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>Сколько раз в день</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={newHabit.times_per_day}
              onChange={(e) =>
                setNewHabit({
                  ...newHabit,
                  times_per_day: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
          <ReminderFields
            value={newHabit}
            onChange={(patch) => setNewHabit({ ...newHabit, ...patch })}
          />
          <Button onClick={onCreateHabit} className="w-full min-h-[44px]">
            Создать привычку
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EditHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingHabit: Habit | null;
  setEditingHabit: (habit: Habit | null) => void;
  onUpdateHabit: () => void;
  onToggleEditDayOfWeek: (day: number) => void;
}

export function EditHabitDialog({
  open,
  onOpenChange,
  editingHabit,
  setEditingHabit,
  onUpdateHabit,
  onToggleEditDayOfWeek,
}: EditHabitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать привычку</DialogTitle>
        </DialogHeader>
        {editingHabit && (
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input
                value={editingHabit.title}
                onChange={(e) =>
                  setEditingHabit({ ...editingHabit, title: e.target.value })
                }
                placeholder="Название привычки"
                maxLength={30}
              />
            </div>
            <div>
              <Label>Категория</Label>
              <Select
                value={editingHabit.category}
                onValueChange={(val) =>
                  setEditingHabit({ ...editingHabit, category: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Цель</Label>
              <Input
                value={editingHabit.goal}
                onChange={(e) =>
                  setEditingHabit({ ...editingHabit, goal: e.target.value })
                }
                placeholder="Делать зарядку каждый день"
                maxLength={40}
              />
            </div>
            <div>
              <Label>Количество дней для достижения</Label>
              <Input
                type="number"
                min={30}
                max={360}
                value={editingHabit.goal_days}
                onChange={(e) =>
                  setEditingHabit({
                    ...editingHabit,
                    goal_days: Math.max(30, parseInt(e.target.value) || 30),
                  })
                }
              />
            </div>
            <div>
              <Label>Дни недели</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {WEEKDAYS.map((day) => (
                  <Badge
                    key={day.id}
                    className={`cursor-pointer min-h-[36px] px-4 ${
                      editingHabit.days_of_week.includes(day.id)
                        ? 'bg-[#748c6d]'
                        : 'bg-gray-300'
                    }`}
                    onClick={() => onToggleEditDayOfWeek(day.id)}
                  >
                    {day.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Сколько раз в день</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={editingHabit.times_per_day}
                onChange={(e) =>
                  setEditingHabit({
                    ...editingHabit,
                    times_per_day: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <ReminderFields
              value={editingHabit}
              onChange={(patch) => setEditingHabit({ ...editingHabit, ...patch })}
            />
            <Button onClick={onUpdateHabit} className="w-full min-h-[44px]">
              Сохранить изменения
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}