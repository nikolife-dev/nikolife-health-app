import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface Workout {
  id: number;
  title: string;
  description: string;
  category: 'cardio' | 'strength' | 'flexibility';
  published_date: string;
  duration_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  calories: number;
  video_url: string | null;
  view_count: number;
  created_at: string;
}

interface EditWorkoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingWorkout: Workout | null;
  newWorkout: {
    title: string;
    description: string;
    category: 'cardio' | 'strength' | 'flexibility';
    duration_minutes: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    calories: number;
    published_date: string;
    video_base64: string;
  };
  setNewWorkout: (workout: {
    title: string;
    description: string;
    category: 'cardio' | 'strength' | 'flexibility';
    duration_minutes: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    calories: number;
    published_date: string;
    video_base64: string;
  }) => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateWorkout: () => void;
  handleDeleteVideo: () => void;
}

export default function EditWorkoutDialog({
  isOpen,
  onOpenChange,
  editingWorkout,
  newWorkout,
  setNewWorkout,
  handleVideoUpload,
  handleUpdateWorkout,
  handleDeleteVideo,
}: EditWorkoutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Редактировать тренировку</DialogTitle>
          <DialogDescription>Измените информацию о тренировке</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-workout-title">Название</Label>
            <Input
              id="edit-workout-title"
              value={newWorkout.title}
              onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="edit-workout-description">Описание</Label>
            <Textarea
              id="edit-workout-description"
              value={newWorkout.description}
              onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-workout-category">Категория</Label>
              <Select
                value={newWorkout.category}
                onValueChange={(value) => setNewWorkout({ ...newWorkout, category: value as 'cardio' | 'strength' | 'flexibility' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardio">Кардио</SelectItem>
                  <SelectItem value="strength">Сила</SelectItem>
                  <SelectItem value="flexibility">Гибкость</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-workout-difficulty">Сложность</Label>
              <Select
                value={newWorkout.difficulty}
                onValueChange={(value) => setNewWorkout({ ...newWorkout, difficulty: value as 'beginner' | 'intermediate' | 'advanced' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Начальный</SelectItem>
                  <SelectItem value="intermediate">Средний</SelectItem>
                  <SelectItem value="advanced">Продвинутый</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-workout-duration">Длительность (мин)</Label>
              <Input
                id="edit-workout-duration"
                type="number"
                value={newWorkout.duration_minutes || ''}
                onChange={(e) => setNewWorkout({ ...newWorkout, duration_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="edit-workout-calories">Калории</Label>
              <Input
                id="edit-workout-calories"
                type="number"
                value={newWorkout.calories || ''}
                onChange={(e) => setNewWorkout({ ...newWorkout, calories: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-workout-date">Дата публикации</Label>
            <Input
              id="edit-workout-date"
              type="date"
              value={newWorkout.published_date}
              onChange={(e) => setNewWorkout({ ...newWorkout, published_date: e.target.value })}
            />
          </div>

          {editingWorkout?.video_url && (
            <div className="p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Video" size={20} className="text-emerald-600" />
                  <span className="text-sm text-emerald-700">Видео загружено</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteVideo}
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="edit-video">Загрузить новое видео</Label>
            <Input
              id="edit-video"
              type="file"
              accept="video/mp4"
              onChange={handleVideoUpload}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button
              className="bg-[#748c6d] hover:bg-[#5f7459]"
              onClick={handleUpdateWorkout}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}