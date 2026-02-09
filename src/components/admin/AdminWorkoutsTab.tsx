import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

const WORKOUTS_API = 'https://functions.poehali.dev/10bc33f4-9e4c-47aa-a7b9-5097af1fdfeb';

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

interface Exercise {
  name: string;
  sets: string;
  rest_seconds: number;
}

export default function AdminWorkoutsTab() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutCategory, setWorkoutCategory] = useState<string>('all');
  const [isAddWorkoutDialogOpen, setIsAddWorkoutDialogOpen] = useState(false);
  const [isEditWorkoutDialogOpen, setIsEditWorkoutDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [newWorkout, setNewWorkout] = useState({
    title: '',
    description: '',
    category: 'cardio' as 'cardio' | 'strength' | 'flexibility',
    duration_minutes: 0,
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    calories: 0,
    published_date: new Date().toISOString().split('T')[0],
    video_base64: ''
  });
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: '', rest_seconds: 0 }
  ]);

  useEffect(() => {
    loadWorkouts();
  }, [workoutCategory]);

  const loadWorkouts = async () => {
    try {
      const url = workoutCategory === 'all'
        ? WORKOUTS_API
        : `${WORKOUTS_API}?category=${workoutCategory}`;
      const response = await fetch(url);
      const data = await response.json();
      setWorkouts(data);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  };

  const handleAddWorkout = async () => {
    try {
      const workoutData = {
        ...newWorkout,
        exercises: exercises.filter(ex => ex.name && ex.sets)
      };

      const response = await fetch(WORKOUTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData)
      });

      if (response.ok) {
        setIsAddWorkoutDialogOpen(false);
        setNewWorkout({
          title: '',
          description: '',
          category: 'cardio',
          duration_minutes: 0,
          difficulty: 'beginner',
          calories: 0,
          published_date: new Date().toISOString().split('T')[0],
          video_base64: ''
        });
        setExercises([{ name: '', sets: '', rest_seconds: 0 }]);
        loadWorkouts();
      }
    } catch (error) {
      console.error('Failed to add workout:', error);
    }
  };

  const addExercise = () => {
    if (exercises.length < 10) {
      setExercises([...exercises, { name: '', sets: '', rest_seconds: 0 }]);
    }
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1] || '';
        setNewWorkout({ ...newWorkout, video_base64: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditWorkout = async (workout: Workout) => {
    try {
      const response = await fetch(`${WORKOUTS_API}?id=${workout.id}`);
      const data = await response.json();
      
      setEditingWorkout(data);
      setNewWorkout({
        title: data.title,
        description: data.description || '',
        category: data.category,
        duration_minutes: data.duration_minutes,
        difficulty: data.difficulty,
        calories: data.calories,
        published_date: data.published_date,
        video_base64: ''
      });
      
      interface ExerciseResponse {
        exercise_name: string;
        sets: string;
        rest_seconds: number;
      }

      if (data.exercises && data.exercises.length > 0) {
        setExercises(data.exercises.map((ex: ExerciseResponse) => ({
          name: ex.exercise_name,
          sets: ex.sets,
          rest_seconds: ex.rest_seconds
        })));
      } else {
        setExercises([{ name: '', sets: '', rest_seconds: 0 }]);
      }
      
      setIsEditWorkoutDialogOpen(true);
    } catch (error) {
      console.error('Failed to load workout:', error);
    }
  };

  const handleUpdateWorkout = async () => {
    if (!editingWorkout) return;

    try {
      const updateData: Partial<Workout> = {
        title: newWorkout.title,
        description: newWorkout.description,
        category: newWorkout.category,
        duration_minutes: newWorkout.duration_minutes,
        difficulty: newWorkout.difficulty,
        calories: newWorkout.calories,
        published_date: newWorkout.published_date
      };

      const response = await fetch(`${WORKOUTS_API}?id=${editingWorkout.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setIsEditWorkoutDialogOpen(false);
        setEditingWorkout(null);
        setNewWorkout({
          title: '',
          description: '',
          category: 'cardio',
          duration_minutes: 0,
          difficulty: 'beginner',
          calories: 0,
          published_date: new Date().toISOString().split('T')[0],
          video_base64: ''
        });
        setExercises([{ name: '', sets: '', rest_seconds: 0 }]);
        loadWorkouts();
      }
    } catch (error) {
      console.error('Failed to update workout:', error);
    }
  };

  const handleDeleteVideo = async () => {
    if (!editingWorkout || !editingWorkout.video_url) return;
    if (!confirm('Удалить видео?')) return;

    setEditingWorkout({ ...editingWorkout, video_url: null });
  };

  return (
    <TabsContent value="trainings" className="space-y-4">
      <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#748c6d]">Тренировки</CardTitle>
              <CardDescription>Управление программами тренировок</CardDescription>
            </div>
            <Dialog open={isAddWorkoutDialogOpen} onOpenChange={setIsAddWorkoutDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#748c6d] hover:bg-[#5f7459]">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить тренировку
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Добавить новую тренировку</DialogTitle>
                  <DialogDescription>Заполните информацию о тренировке</DialogDescription>
                </DialogHeader>
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

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddWorkoutDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button
                      className="bg-[#748c6d] hover:bg-[#5f7459]"
                      onClick={handleAddWorkout}
                      disabled={!newWorkout.title || !newWorkout.duration_minutes || !newWorkout.calories}
                    >
                      Добавить
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Сложность</TableHead>
                <TableHead className="text-right">Время</TableHead>
                <TableHead className="text-right">Калории</TableHead>
                <TableHead className="text-right">Просмотры</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#4a5446]/60">
                    Нет тренировок
                  </TableCell>
                </TableRow>
              ) : (
                workouts.map((workout) => (
                  <TableRow key={workout.id}>
                    <TableCell className="font-medium text-[#4a5446]">
                      {workout.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#748c6d]/30">
                        {workout.category === 'cardio' && 'Кардио'}
                        {workout.category === 'strength' && 'Сила'}
                        {workout.category === 'flexibility' && 'Гибкость'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#748c6d]/30">
                        {workout.difficulty === 'beginner' && 'Начальный'}
                        {workout.difficulty === 'intermediate' && 'Средний'}
                        {workout.difficulty === 'advanced' && 'Продвинутый'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{workout.duration_minutes} мин</TableCell>
                    <TableCell className="text-right">{workout.calories} ккал</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{workout.view_count}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditWorkout(workout)}
                        >
                          <Icon name="Pencil" size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditWorkoutDialogOpen} onOpenChange={setIsEditWorkoutDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <Button variant="outline" onClick={() => setIsEditWorkoutDialogOpen(false)}>
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
    </TabsContent>
  );
}
