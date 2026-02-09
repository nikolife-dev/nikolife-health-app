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
import Icon from '@/components/ui/icon';

interface Exercise {
  name: string;
  sets: string;
  rest_seconds: number;
}

interface WorkoutData {
  title: string;
  description: string;
  category: 'cardio' | 'strength' | 'flexibility';
  duration_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  calories: number;
  published_date: string;
  video_base64: string;
}

interface WorkoutFormFieldsProps {
  newWorkout: WorkoutData;
  setNewWorkout: (workout: WorkoutData) => void;
  exercises: Exercise[];
  addExercise: () => void;
  removeExercise: (index: number) => void;
  updateExercise: (index: number, field: keyof Exercise, value: string | number) => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function WorkoutFormFields({
  newWorkout,
  setNewWorkout,
  exercises,
  addExercise,
  removeExercise,
  updateExercise,
  handleVideoUpload,
}: WorkoutFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="workout-title">Название</Label>
        <Input
          id="workout-title"
          placeholder="Название тренировки"
          value={newWorkout.title}
          onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="workout-description">Описание</Label>
        <Textarea
          id="workout-description"
          placeholder="Описание тренировки"
          value={newWorkout.description}
          onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="workout-category">Категория</Label>
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
          <Label htmlFor="workout-difficulty">Сложность</Label>
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
          <Label htmlFor="workout-duration">Длительность (мин)</Label>
          <Input
            id="workout-duration"
            type="number"
            placeholder="30"
            value={newWorkout.duration_minutes || ''}
            onChange={(e) => setNewWorkout({ ...newWorkout, duration_minutes: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="workout-calories">Калории</Label>
          <Input
            id="workout-calories"
            type="number"
            placeholder="250"
            value={newWorkout.calories || ''}
            onChange={(e) => setNewWorkout({ ...newWorkout, calories: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="workout-date">Дата публикации</Label>
        <Input
          id="workout-date"
          type="date"
          value={newWorkout.published_date}
          onChange={(e) => setNewWorkout({ ...newWorkout, published_date: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="workout-video">Видео (необязательно)</Label>
        <Input
          id="workout-video"
          type="file"
          accept="video/mp4"
          onChange={handleVideoUpload}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Упражнения</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExercise}
            disabled={exercises.length >= 10}
          >
            <Icon name="Plus" size={14} className="mr-1" />
            Добавить
          </Button>
        </div>

        {exercises.map((exercise, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              <Input
                placeholder="Название упражнения"
                value={exercise.name}
                onChange={(e) => updateExercise(index, 'name', e.target.value)}
              />
            </div>
            <div className="w-32">
              <Input
                placeholder="Подходы"
                value={exercise.sets}
                onChange={(e) => updateExercise(index, 'sets', e.target.value)}
              />
            </div>
            <div className="w-24">
              <Input
                type="number"
                placeholder="Отдых (сек)"
                value={exercise.rest_seconds || ''}
                onChange={(e) => updateExercise(index, 'rest_seconds', parseInt(e.target.value) || 0)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeExercise(index)}
              disabled={exercises.length === 1}
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}