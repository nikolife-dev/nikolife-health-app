import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

const WORKOUTS_API = 'https://functions.poehali.dev/10bc33f4-9e4c-47aa-a7b9-5097af1fdfeb';

interface Exercise {
  exercise_name: string;
  sets: string;
  rest_seconds: number;
}

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
  exercises?: Exercise[];
}

interface WorkoutSectionProps {
  workouts?: Workout[];
  selectedWorkout: number | null;
  setSelectedWorkout: (id: number | null) => void;
  workoutProgress: number[];
  setWorkoutProgress: (progress: number[]) => void;
}

export default function WorkoutSection({
  selectedWorkout,
  setSelectedWorkout,
  workoutProgress,
  setWorkoutProgress
}: WorkoutSectionProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutCategory, setWorkoutCategory] = useState<string>('all');
  const [selectedWorkoutDetails, setSelectedWorkoutDetails] = useState<Workout | null>(null);

  useEffect(() => {
    loadWorkouts();
  }, [workoutCategory]);

  useEffect(() => {
    if (selectedWorkout !== null) {
      loadWorkoutDetails(selectedWorkout);
    } else {
      setSelectedWorkoutDetails(null);
    }
  }, [selectedWorkout]);

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
      setWorkouts([]);
    }
  };

  const loadWorkoutDetails = async (id: number) => {
    try {
      const response = await fetch(`${WORKOUTS_API}?id=${id}`);
      const data = await response.json();
      setSelectedWorkoutDetails(data);
    } catch (error) {
      console.error('Failed to load workout details:', error);
    }
  };

  const handleStartWorkout = () => {
    setWorkoutProgress(new Array(selectedWorkoutDetails?.exercises?.length || 0).fill(0));
  };

  const handleCompleteExercise = (index: number) => {
    const newProgress = [...workoutProgress];
    newProgress[index] = 100;
    setWorkoutProgress(newProgress);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'cardio': return 'Кардио';
      case 'strength': return 'Сила';
      case 'flexibility': return 'Гибкость';
      default: return category;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Начальный';
      case 'intermediate': return 'Средний';
      case 'advanced': return 'Продвинутый';
      default: return difficulty;
    }
  };

  return (
    <div className="space-y-6">
      {selectedWorkout === null ? (
        <>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Тренировки</h2>
            <p className="text-gray-600">Выберите тренировку и начните заниматься</p>
          </div>

          <Tabs value={workoutCategory} onValueChange={setWorkoutCategory} className="w-full">
            <TabsList>
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="cardio">Кардио</TabsTrigger>
              <TabsTrigger value="strength">Сила</TabsTrigger>
              <TabsTrigger value="flexibility">Гибкость</TabsTrigger>
            </TabsList>

            <TabsContent value={workoutCategory} className="space-y-4 mt-6">
              {workouts.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center text-gray-500">
                    <Icon name="Dumbbell" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Тренировок пока нет</p>
                  </div>
                </Card>
              ) : (
                workouts.map((workout) => (
                  <Card key={workout.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedWorkout(workout.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Icon name="Dumbbell" className="text-emerald-600" size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{workout.title}</h3>
                            <p className="text-sm text-gray-600">{getCategoryLabel(workout.category)}</p>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4">{workout.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Icon name="Clock" size={14} />
                            {workout.duration_minutes} мин
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Icon name="TrendingUp" size={14} />
                            {getDifficultyLabel(workout.difficulty)}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Icon name="Flame" size={14} />
                            {workout.calories} ккал
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Icon name="Eye" size={14} />
                            {workout.view_count}
                          </Badge>
                        </div>
                      </div>
                      <Icon name="ChevronRight" className="text-gray-400 ml-4" size={24} />
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>


          </Tabs>
        </>
      ) : (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setSelectedWorkout(null)} className="mb-4">
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад к списку
          </Button>

          {selectedWorkoutDetails && (
            <>
              <Card className="p-8">
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-3">
                    {getCategoryLabel(selectedWorkoutDetails.category)}
                  </Badge>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {selectedWorkoutDetails.title}
                  </h1>
                  <p className="text-gray-600 text-lg mb-6">
                    {selectedWorkoutDetails.description}
                  </p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Icon name="Clock" size={20} />
                      <span className="font-medium">{selectedWorkoutDetails.duration_minutes} мин</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Icon name="TrendingUp" size={20} />
                      <span className="font-medium">{getDifficultyLabel(selectedWorkoutDetails.difficulty)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Icon name="Flame" size={20} />
                      <span className="font-medium">{selectedWorkoutDetails.calories} ккал</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Icon name="Eye" size={20} />
                      <span className="font-medium">{selectedWorkoutDetails.view_count} просмотров</span>
                    </div>
                  </div>
                </div>

                {selectedWorkoutDetails.video_url ? (
                  <div className="mb-8 rounded-lg overflow-hidden">
                    <video src={selectedWorkoutDetails.video_url} controls className="w-full aspect-video" />
                  </div>
                ) : (
                  <div className="mb-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="Play" size={64} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Видео тренировки</p>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Упражнения</h2>
                  {workoutProgress.length === 0 ? (
                    <Button onClick={handleStartWorkout} className="bg-emerald-600 hover:bg-emerald-700">
                      <Icon name="Play" size={18} className="mr-2" />
                      Начать тренировку
                    </Button>
                  ) : (
                    <Badge className="bg-emerald-600 text-white px-4 py-2">
                      {workoutProgress.filter(p => p === 100).length} / {workoutProgress.length} выполнено
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedWorkoutDetails.exercises?.map((exercise, index) => (
                    <Card key={index} className={`p-6 ${workoutProgress[index] === 100 ? 'bg-emerald-50 border-emerald-200' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{exercise.exercise_name}</h3>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <Icon name="Repeat" size={16} />
                              {exercise.sets}
                            </span>
                            <span className="flex items-center gap-2">
                              <Icon name="Timer" size={16} />
                              Отдых: {exercise.rest_seconds} сек
                            </span>
                          </div>
                        </div>
                        {workoutProgress.length > 0 && (
                          <Button
                            variant={workoutProgress[index] === 100 ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleCompleteExercise(index)}
                            disabled={workoutProgress[index] === 100}
                            className={workoutProgress[index] === 100 ? 'bg-emerald-600 text-white border-emerald-600' : ''}
                          >
                            {workoutProgress[index] === 100 ? (
                              <>
                                <Icon name="Check" size={16} className="mr-2" />
                                Выполнено
                              </>
                            ) : (
                              'Отметить'
                            )}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}