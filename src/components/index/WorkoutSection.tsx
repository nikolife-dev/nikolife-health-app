import { useState, useEffect } from 'react';
import funcUrls from '../../../backend/func2url.json';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

const WORKOUTS_API = funcUrls.workouts;

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
    <div className="space-y-4 sm:space-y-6">
      {selectedWorkout === null ? (
        <>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Тренировки</h2>
            <p className="text-sm sm:text-base text-gray-600">Выберите тренировку и начните заниматься</p>
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
                <Card className="p-6 sm:p-12">
                  <div className="text-center text-gray-500">
                    <Icon name="Dumbbell" size={40} className="mx-auto mb-4 opacity-50 sm:w-12 sm:h-12" />
                    <p className="text-sm sm:text-base">Тренировок пока нет</p>
                  </div>
                </Card>
              ) : (
                workouts.map((workout) => (
                  <Card key={workout.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedWorkout(workout.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Icon name="Dumbbell" className="text-emerald-600" size={20} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base sm:text-xl font-semibold text-gray-900 truncate">{workout.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-600">{getCategoryLabel(workout.category)}</p>
                          </div>
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2">{workout.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Icon name="Clock" size={12} />
                            <span className="text-xs">{workout.duration_minutes} мин</span>
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Icon name="TrendingUp" size={12} />
                            <span className="text-xs hidden sm:inline">{getDifficultyLabel(workout.difficulty)}</span>
                            <span className="text-xs sm:hidden">{workout.difficulty === 'beginner' ? 'Нач.' : workout.difficulty === 'intermediate' ? 'Сред.' : 'Прод.'}</span>
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Icon name="Flame" size={12} />
                            <span className="text-xs">{workout.calories}</span>
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Icon name="Eye" size={12} />
                            <span className="text-xs">{workout.view_count}</span>
                          </Badge>
                        </div>
                      </div>
                      <Icon name="ChevronRight" className="text-gray-400 flex-shrink-0" size={20} />
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>


          </Tabs>
        </>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <Button variant="ghost" onClick={() => setSelectedWorkout(null)} className="mb-4 min-h-[44px]">
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            <span className="text-sm sm:text-base">Назад к списку</span>
          </Button>

          {selectedWorkoutDetails && (
            <>
              <Card className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-3">
                    {getCategoryLabel(selectedWorkoutDetails.category)}
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                    {selectedWorkoutDetails.title}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6">
                    {selectedWorkoutDetails.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Icon name="Clock" size={18} />
                      <span className="font-medium text-sm sm:text-base">{selectedWorkoutDetails.duration_minutes} мин</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Icon name="TrendingUp" size={18} />
                      <span className="font-medium text-sm sm:text-base">{getDifficultyLabel(selectedWorkoutDetails.difficulty)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Icon name="Flame" size={18} />
                      <span className="font-medium text-sm sm:text-base">{selectedWorkoutDetails.calories} ккал</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Icon name="Eye" size={18} />
                      <span className="font-medium text-sm sm:text-base">{selectedWorkoutDetails.view_count}</span>
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
                      <Icon name="Play" size={48} className="mx-auto mb-4 text-gray-400 sm:w-16 sm:h-16" />
                      <p className="text-sm sm:text-base text-gray-500">Видео тренировки</p>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Упражнения</h2>
                  {workoutProgress.length === 0 ? (
                    <Button onClick={handleStartWorkout} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] w-full sm:w-auto">
                      <Icon name="Play" size={18} className="mr-2" />
                      <span className="text-sm sm:text-base">Начать тренировку</span>
                    </Button>
                  ) : (
                    <Badge className="bg-emerald-600 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm">
                      {workoutProgress.filter(p => p === 100).length} / {workoutProgress.length} выполнено
                    </Badge>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {selectedWorkoutDetails.exercises?.map((exercise, index) => (
                    <Card key={index} className={`p-4 sm:p-6 ${workoutProgress[index] === 100 ? 'bg-emerald-50 border-emerald-200' : ''}`}>
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{exercise.exercise_name}</h3>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <Icon name="Repeat" size={14} />
                              <span className="whitespace-nowrap">{exercise.sets}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <Icon name="Timer" size={14} />
                              <span className="whitespace-nowrap">Отдых: {exercise.rest_seconds} сек</span>
                            </span>
                          </div>
                        </div>
                        {workoutProgress.length > 0 && (
                          <Button
                            variant={workoutProgress[index] === 100 ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleCompleteExercise(index)}
                            disabled={workoutProgress[index] === 100}
                            className={`min-h-[44px] w-full sm:w-auto ${workoutProgress[index] === 100 ? 'bg-emerald-600 text-white border-emerald-600' : ''}`}
                          >
                            {workoutProgress[index] === 100 ? (
                              <>
                                <Icon name="Check" size={16} className="mr-2" />
                                <span className="text-sm sm:text-base">Выполнено</span>
                              </>
                            ) : (
                              <span className="text-sm sm:text-base">Отметить</span>
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