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
  reminder_timezone: string;
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
  reminder_timezone: string;
}

export const TIMEZONES = [
  { value: '+02:00', label: 'Калининград (UTC+2)' },
  { value: '+03:00', label: 'Москва (UTC+3)' },
  { value: '+04:00', label: 'Самара (UTC+4)' },
  { value: '+05:00', label: 'Екатеринбург (UTC+5)' },
  { value: '+06:00', label: 'Омск (UTC+6)' },
  { value: '+07:00', label: 'Красноярск, Барнаул, Белокуриха (UTC+7)' },
  { value: '+08:00', label: 'Иркутск (UTC+8)' },
  { value: '+09:00', label: 'Якутск (UTC+9)' },
  { value: '+10:00', label: 'Владивосток (UTC+10)' },
  { value: '+11:00', label: 'Магадан (UTC+11)' },
  { value: '+12:00', label: 'Камчатка (UTC+12)' },
];

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