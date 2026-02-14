import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Habit, CATEGORIES, WEEKDAYS } from './types';

interface HabitProgressTabsProps {
  habits: Habit[];
  isLoading: boolean;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  progressView: 'day' | 'week' | 'month';
  setProgressView: (view: 'day' | 'week' | 'month') => void;
  onToggleCompletion: (habitId: number) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: number) => void;
  calculateProgress: (habit: Habit) => number;
}

export default function HabitProgressTabs({
  habits,
  isLoading,
  selectedCategory,
  setSelectedCategory,
  progressView,
  setProgressView,
  onToggleCompletion,
  onEditHabit,
  onDeleteHabit,
  calculateProgress,
}: HabitProgressTabsProps) {
  const filteredHabits = selectedCategory
    ? habits.filter((h) => h.category === selectedCategory)
    : habits;

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Badge
              className={`cursor-pointer min-h-[36px] px-3 ${
                !selectedCategory ? 'bg-[#748c6d]' : 'bg-gray-300'
              }`}
              onClick={() => setSelectedCategory('')}
            >
              Все
            </Badge>
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                className={`cursor-pointer min-h-[36px] px-3 ${
                  selectedCategory === cat ? 'bg-[#748c6d]' : 'bg-gray-300'
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <Tabs value={progressView} onValueChange={(v) => setProgressView(v as 'day' | 'week' | 'month')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day">День</TabsTrigger>
          <TabsTrigger value="week">Неделя (7 дн.)</TabsTrigger>
          <TabsTrigger value="month">Месяц (30 дн.)</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
            </div>
          ) : (() => {
            const today = new Date().getDay();
            const todayHabits = filteredHabits.filter(h => h.days_of_week.includes(today));
            
            if (todayHabits.length === 0) {
              return (
                <Card className="p-8 text-center">
                  <Icon
                    name="CalendarCheck"
                    size={48}
                    className="mx-auto text-gray-400 mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-700">
                    На сегодня привычек нет
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Отдыхайте! Или создайте новую привычку
                  </p>
                </Card>
              );
            }
            
            return todayHabits.map((habit) => {
              const progress = calculateProgress(habit);

              return (
                <Card key={habit.id} className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-bold">{habit.title}</h3>
                        <Badge variant="outline">{habit.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{habit.goal}</p>
                      <div className="flex gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                        <span>🔥 {habit.current_streak} дней</span>
                        <span>✅ {habit.total_completions} выполнений</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => onToggleCompletion(habit.id)}
                      className={`w-full p-4 sm:p-6 rounded-2xl border-2 transition-all active:scale-95 ${
                        habit.completions_today >= habit.times_per_day
                          ? 'bg-[#748c6d] border-[#748c6d] shadow-lg'
                          : 'bg-white border-gray-300 hover:border-[#748c6d] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <Icon
                          name={habit.completions_today >= habit.times_per_day ? 'CheckCircle2' : 'Circle'}
                          size={32}
                          className={habit.completions_today >= habit.times_per_day ? 'text-white' : 'text-gray-400'}
                        />
                        <span className={`text-lg font-semibold ${
                          habit.completions_today >= habit.times_per_day ? 'text-white' : 'text-gray-700'
                        }`}>
                          {habit.completions_today >= habit.times_per_day ? 'Цель достигнута!' : `Отметить (${habit.completions_today}/${habit.times_per_day})`}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={habit.completions_today >= habit.times_per_day ? 'text-white/90' : 'text-gray-600'}>
                            Прогресс за день: {Math.round(habit.day_progress)}%
                          </span>
                          <span className={habit.completions_today >= habit.times_per_day ? 'text-white/90' : 'text-gray-600'}>
                            Осталось дней:{' '}
                            {Math.max(
                              0,
                              habit.goal_days -
                                Math.floor(
                                  (new Date().getTime() -
                                    new Date(habit.created_at).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                            )}
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-3 ${
                          habit.completions_today >= habit.times_per_day ? 'bg-white/30' : 'bg-gray-200'
                        }`}>
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              habit.completions_today >= habit.times_per_day ? 'bg-white' : 'bg-[#748c6d]'
                            }`}
                            style={{ width: `${habit.day_progress}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="flex gap-1 mt-4">
                    {WEEKDAYS.map((day) => {
                      const isToday = day.id === today;
                      const isScheduled = habit.days_of_week.includes(day.id);
                      
                      return (
                        <div
                          key={day.id}
                          className={`flex-1 text-center py-2 rounded text-xs font-medium transition-all ${
                            isToday && isScheduled
                              ? 'bg-[#748c6d] text-white ring-2 ring-[#748c6d] ring-offset-2 scale-110'
                              : isToday
                              ? 'bg-gray-400 text-white ring-2 ring-gray-400 ring-offset-2 scale-110'
                              : isScheduled
                              ? 'bg-[#748c6d]/70 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {day.name}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditHabit(habit)}
                      className="flex-1 min-h-[40px]"
                    >
                      <Icon name="Edit" size={16} className="mr-2" />
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Удалить привычку?')) {
                          onDeleteHabit(habit.id);
                        }
                      }}
                      className="min-h-[40px]"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>

                  {habit.times_per_day > 1 && (
                    <div className="mt-3 text-sm text-gray-600 text-center">
                      {habit.times_per_day}× в день
                    </div>
                  )}
                </Card>
              );
            });
          })()}
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
            </div>
          ) : (
            filteredHabits.map((habit) => (
              <Card key={habit.id} className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold">{habit.title}</h3>
                      <Badge variant="outline">{habit.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{habit.goal}</p>
                    <div className="flex gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                      <span>🔥 {habit.current_streak} дней</span>
                      <span>✅ {habit.total_completions} выполнений</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[#748c6d] to-[#8da582] text-white">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Icon name="TrendingUp" size={32} className="text-white" />
                      <span className="text-lg font-semibold">
                        Прогресс за неделю
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/90">
                          Выполнено: {Math.round(habit.week_progress)}%
                        </span>
                        <span className="text-white/90">
                          {habit.completions_today}/{habit.times_per_day} сегодня
                        </span>
                      </div>
                      <div className="w-full rounded-full h-3 bg-white/30">
                        <div
                          className="h-3 rounded-full bg-white transition-all duration-500"
                          style={{ width: `${habit.week_progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {WEEKDAYS.map((day) => {
                      const isScheduled = habit.days_of_week.includes(day.id);
                      const today = new Date().getDay();
                      const isToday = day.id === today;
                      
                      return (
                        <div
                          key={day.id}
                          className={`flex-1 text-center py-2 rounded text-xs font-medium transition-all ${
                            isToday && isScheduled
                              ? 'bg-[#748c6d] text-white ring-2 ring-[#748c6d] ring-offset-2 scale-110'
                              : isToday
                              ? 'bg-gray-400 text-white ring-2 ring-gray-400 ring-offset-2 scale-110'
                              : isScheduled
                              ? 'bg-[#748c6d]/70 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {day.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
            </div>
          ) : (
            filteredHabits.map((habit) => (
              <Card key={habit.id} className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold">{habit.title}</h3>
                      <Badge variant="outline">{habit.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{habit.goal}</p>
                    <div className="flex gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                      <span>🔥 {habit.current_streak} дней</span>
                      <span>✅ {habit.total_completions} выполнений</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[#6b7c64] to-[#8da582] text-white">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Icon name="Calendar" size={32} className="text-white" />
                      <span className="text-lg font-semibold">
                        Прогресс за месяц
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/90">
                          Выполнено: {Math.round(habit.month_progress)}%
                        </span>
                        <span className="text-white/90">
                          Цель: {habit.goal_days} дней
                        </span>
                      </div>
                      <div className="w-full rounded-full h-3 bg-white/30">
                        <div
                          className="h-3 rounded-full bg-white transition-all duration-500"
                          style={{ width: `${habit.month_progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {WEEKDAYS.map((day) => {
                      const isScheduled = habit.days_of_week.includes(day.id);
                      const today = new Date().getDay();
                      const isToday = day.id === today;
                      
                      return (
                        <div
                          key={day.id}
                          className={`flex-1 text-center py-2 rounded text-xs font-medium transition-all ${
                            isToday && isScheduled
                              ? 'bg-[#748c6d] text-white ring-2 ring-[#748c6d] ring-offset-2 scale-110'
                              : isToday
                              ? 'bg-gray-400 text-white ring-2 ring-gray-400 ring-offset-2 scale-110'
                              : isScheduled
                              ? 'bg-[#748c6d]/70 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {day.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
