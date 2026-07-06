import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  telegram_id?: number;
  telegram_username?: string;
  selected_plan?: string;
  onboarding_completed?: boolean;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, telegramData?: { telegram_id?: number; telegram_username?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_API_URL = 'https://functions.poehali.dev/d33a823e-854d-4bbe-be97-af580ba01a06';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    console.log('[AUTH CONTEXT checkAuth] Токен:', token ? 'есть' : 'НЕТ');
    
    if (!token) {
      console.log('[AUTH CONTEXT checkAuth] Токен отсутствует, выход');
      setIsLoading(false);
      return;
    }

    try {
      console.log('[AUTH CONTEXT checkAuth] Отправка GET запроса...');
      const response = await fetch(AUTH_API_URL, {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });

      console.log('[AUTH CONTEXT checkAuth] Response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('[AUTH CONTEXT checkAuth] Данные получены:', userData);
        setUser(userData);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AUTH CONTEXT checkAuth] Ошибка ответа:', response.status, errorData);
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('[AUTH CONTEXT checkAuth] Exception:', error);
      localStorage.removeItem('auth_token');
    } finally {
      console.log('[AUTH CONTEXT checkAuth] Завершено, isLoading = false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    } else {
      throw new Error(data.error || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string, telegramData?: { telegram_id?: number; telegram_username?: string }) => {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        email, 
        password,
        telegram_id: telegramData?.telegram_id,
        telegram_username: telegramData?.telegram_username
      })
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    } else {
      throw new Error(data.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}