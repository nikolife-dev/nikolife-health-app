import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import WorkoutFormFields from './WorkoutFormFields';

interface Exercise {
  name: string;
  sets: string;
  rest_seconds: number;
}

interface AddWorkoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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
  exercises: Exercise[];
  addExercise: () => void;
  removeExercise: (index: number) => void;
  updateExercise: (index: number, field: keyof Exercise, value: string | number) => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddWorkout: () => void;
}

export default function AddWorkoutDialog({
  isOpen,
  onOpenChange,
  newWorkout,
  setNewWorkout,
  exercises,
  addExercise,
  removeExercise,
  updateExercise,
  handleVideoUpload,
  handleAddWorkout,
}: AddWorkoutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
        <WorkoutFormFields
          newWorkout={newWorkout}
          setNewWorkout={setNewWorkout}
          exercises={exercises}
          addExercise={addExercise}
          removeExercise={removeExercise}
          updateExercise={updateExercise}
          handleVideoUpload={handleVideoUpload}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
      </DialogContent>
    </Dialog>
  );
}
