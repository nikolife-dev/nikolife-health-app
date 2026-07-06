import funcUrls from '../../../../backend/func2url.json';
export const USERS_API = funcUrls['admin-users'];

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
  receive_notifications: boolean;
  message_limit: number;
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
  receive_notifications?: boolean;
}

export interface UserFormData {
  name: string;
  email: string;
  telegram_username: string;
  selected_plan: string;
  is_admin: boolean;
  receive_notifications: boolean;
  password: string;
  health_parameters: HealthParameters;
}