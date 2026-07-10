export interface Habit {
  id: number;
  title: string;
  category: string;
  goal: string;
  goal_days: number;
  days_of_week: number[];
  times_per_day: number;
  created_at: string;
  completed_today: boolean;
  current_streak: number;
  total_completions: number;
  completions_today: number;
  day_progress: number;
  week_progress: number;
  month_progress: number;
  reminder_enabled: boolean;
  reminder_time: string;
  reminder_channel: 'telegram' | 'email';
}

export interface HabitTemplate {
  id: number;
  title: string;
  category: string;
  description: string;
}

export interface NewHabitData {
  title: string;
  category: string;
  goal: string;
  goal_days: number;
  days_of_week: number[];
  times_per_day: number;
  reminder_enabled: boolean;
  reminder_time: string;
  reminder_channel: 'telegram' | 'email';
}

export const CATEGORIES = [
  'Здоровье',
  'Фитнес',
  'Питание',
  'Сон',
  'Продуктивность',
  'Обучение',
  'Саморазвитие',
  'Социальное',
];

export const WEEKDAYS = [
  { id: 1, name: 'Пн', full: 'Понедельник' },
  { id: 2, name: 'Вт', full: 'Вторник' },
  { id: 3, name: 'Ср', full: 'Среда' },
  { id: 4, name: 'Чт', full: 'Четверг' },
  { id: 5, name: 'Пт', full: 'Пятница' },
  { id: 6, name: 'Сб', full: 'Суббота' },
  { id: 0, name: 'Вс', full: 'Воскресенье' },
];