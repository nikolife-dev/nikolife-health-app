import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import AddWorkoutDialog from './workouts/AddWorkoutDialog';
import EditWorkoutDialog from './workouts/EditWorkoutDialog';

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
            <AddWorkoutDialog
              isOpen={isAddWorkoutDialogOpen}
              onOpenChange={setIsAddWorkoutDialogOpen}
              newWorkout={newWorkout}
              setNewWorkout={setNewWorkout}
              exercises={exercises}
              addExercise={addExercise}
              removeExercise={removeExercise}
              updateExercise={updateExercise}
              handleVideoUpload={handleVideoUpload}
              handleAddWorkout={handleAddWorkout}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                          className="min-w-[44px] min-h-[44px]"
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
          </div>
        </CardContent>
      </Card>

      <EditWorkoutDialog
        isOpen={isEditWorkoutDialogOpen}
        onOpenChange={setIsEditWorkoutDialogOpen}
        editingWorkout={editingWorkout}
        newWorkout={newWorkout}
        setNewWorkout={setNewWorkout}
        handleVideoUpload={handleVideoUpload}
        handleUpdateWorkout={handleUpdateWorkout}
        handleDeleteVideo={handleDeleteVideo}
      />
    </TabsContent>
  );
}