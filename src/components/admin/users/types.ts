export const USERS_API = 'https://functions.poehali.dev/56005ce0-e77d-47e1-937e-21f0247bf260';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  last_login: string | null;
  telegram_username: string | null;
  selected_plan: string;
  is_admin: boolean;
  auth_type: 'email' | 'telegram';
}

export interface HealthParameters {
  goal: string;
  activity_level: string;
  age: string;
  weight: string;
  height: string;
  diet_preference: string;
}

export interface UserDetail extends User {
  goal?: string;
  activity_level?: string;
  age?: number;
  weight?: number;
  height?: number;
  diet_preference?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  telegram_username: string;
  selected_plan: string;
  is_admin: boolean;
  password: string;
  health_parameters: HealthParameters;
}
