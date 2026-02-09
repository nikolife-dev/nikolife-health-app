import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Exercise {
  name: string;
  duration: string;
  rest: string;
}

interface Workout {
  id: number;
  title: string;
  duration: string;
  level: string;
  category: string;
  description: string;
  calories: number;
  exercises: Exercise[];
  videoPlaceholder: boolean;
}

interface WorkoutSectionProps {
  workouts: Workout[];
  selectedWorkout: number | null;
  setSelectedWorkout: (id: number | null) => void;
  workoutProgress: number[];
  setWorkoutProgress: (progress: number[]) => void;
}

export default function WorkoutSection({
  workouts,
  selectedWorkout,
  setSelectedWorkout,
  workoutProgress,
  setWorkoutProgress
}: WorkoutSectionProps) {
  const handleStartWorkout = () => {
    setWorkoutProgress(new Array(workouts.find(w => w.id === selectedWorkout)?.exercises.length || 0).fill(0));
  };

  const handleCompleteExercise = (index: number) => {
    const newProgress = [...workoutProgress];
    newProgress[index] = 100;
    setWorkoutProgress(newProgress);
  };

  return (
    <div className="space-y-6">
      {selectedWorkout === null ? (
        <>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Тренировки</h2>
            <p className="text-gray-600">Выберите тренировку и начните заниматься</p>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="cardio">Кардио</TabsTrigger>
              <TabsTrigger value="strength">Сила</TabsTrigger>
              <TabsTrigger value="flexibility">Гибкость</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {workouts.map((workout) => (
                <Card key={workout.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedWorkout(workout.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Icon name="Dumbbell" className="text-emerald-600" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{workout.title}</h3>
                          <p className="text-sm text-gray-600">{workout.category}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{workout.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="Clock" size={14} />
                          {workout.duration}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="TrendingUp" size={14} />
                          {workout.level}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="Flame" size={14} />
                          {workout.calories} ккал
                        </Badge>
                      </div>
                    </div>
                    <Icon name="ChevronRight" className="text-gray-400 ml-4" size={24} />
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="cardio" className="space-y-4 mt-6">
              {workouts.filter(w => w.category === 'Кардио').map((workout) => (
                <Card key={workout.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedWorkout(workout.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Icon name="Dumbbell" className="text-emerald-600" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{workout.title}</h3>
                          <p className="text-sm text-gray-600">{workout.category}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{workout.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="Clock" size={14} />
                          {workout.duration}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="TrendingUp" size={14} />
                          {workout.level}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="Flame" size={14} />
                          {workout.calories} ккал
                        </Badge>
                      </div>
                    </div>
                    <Icon name="ChevronRight" className="text-gray-400 ml-4" size={24} />
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="strength" className="space-y-4 mt-6">
              {workouts.filter(w => w.category === 'Сила').map((workout) => (
                <Card key={workout.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedWorkout(workout.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Icon name="Dumbbell" className="text-emerald-600" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{workout.title}</h3>
                          <p className="text-sm text-gray-600">{workout.category}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{workout.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="Clock" size={14} />
                          {workout.duration}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="TrendingUp" size={14} />
                          {workout.level}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="Flame" size={14} />
                          {workout.calories} ккал
                        </Badge>
                      </div>
                    </div>
                    <Icon name="ChevronRight" className="text-gray-400 ml-4" size={24} />
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="flexibility" className="space-y-4 mt-6">
              {workouts.filter(w => w.category === 'Гибкость').map((workout) => (
                <Card key={workout.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedWorkout(workout.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Icon name="Dumbbell" className="text-emerald-600" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{workout.title}</h3>
                          <p className="text-sm text-gray-600">{workout.category}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{workout.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="Clock" size={14} />
                          {workout.duration}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="TrendingUp" size={14} />
                          {workout.level}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="Flame" size={14} />
                          {workout.calories} ккал
                        </Badge>
                      </div>
                    </div>
                    <Icon name="ChevronRight" className="text-gray-400 ml-4" size={24} />
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <>
          {(() => {
            const workout = workouts.find(w => w.id === selectedWorkout);
            if (!workout) return null;

            return (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => setSelectedWorkout(null)}>
                    <Icon name="ArrowLeft" size={20} className="mr-2" />
                    Назад
                  </Button>
                </div>

                <Card className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                      <Icon name="Dumbbell" className="text-emerald-600" size={40} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{workout.title}</h2>
                      <p className="text-gray-600 mb-4">{workout.description}</p>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="Clock" size={14} />
                          {workout.duration}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="TrendingUp" size={14} />
                          {workout.level}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Icon name="Flame" size={14} />
                          {workout.calories} ккал
                        </Badge>
                        <Badge className="bg-emerald-600">{workout.category}</Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {workout.videoPlaceholder && (
                  <Card className="p-0 overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="h-20 w-20 rounded-full bg-white/80 flex items-center justify-center mx-auto">
                          <Icon name="Play" size={32} className="text-emerald-600" />
                        </div>
                        <p className="text-gray-600 font-medium">Видео тренировки</p>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Упражнения</h3>
                  <div className="space-y-3">
                    {workout.exercises.map((exercise, index) => (
                      <Card key={index} className="p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-emerald-600">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <Icon name="Clock" size={14} />
                                  {exercise.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Icon name="Coffee" size={14} />
                                  Отдых: {exercise.rest}
                                </span>
                              </div>
                            </div>
                          </div>
                          {workoutProgress.length > 0 && (
                            <Button 
                              variant={workoutProgress[index] === 100 ? "secondary" : "default"} 
                              size="sm"
                              onClick={() => handleCompleteExercise(index)}
                              disabled={workoutProgress[index] === 100}
                            >
                              {workoutProgress[index] === 100 ? (
                                <>
                                  <Icon name="CheckCircle2" size={16} className="mr-1" />
                                  Выполнено
                                </>
                              ) : (
                                'Выполнить'
                              )}
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>

                {workoutProgress.length === 0 ? (
                  <Button className="w-full h-14 text-lg" onClick={handleStartWorkout}>
                    <Icon name="Play" size={20} className="mr-2" />
                    Начать тренировку
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {workoutProgress.every(p => p === 100) && (
                      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center">
                            <Icon name="Trophy" size={32} className="text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Тренировка завершена!</h3>
                            <p className="text-gray-600">Отличная работа! Вы сожгли {workout.calories} калорий</p>
                          </div>
                        </div>
                      </Card>
                    )}
                    <Button className="w-full h-14 text-lg" variant="outline" onClick={() => setSelectedWorkout(null)}>
                      Вернуться к тренировкам
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
