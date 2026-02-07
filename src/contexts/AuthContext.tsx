import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  telegram_id?: number;
  telegram_username?: string;
  selected_plan?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, telegramData?: { telegram_id?: number; telegram_username?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_API_URL = 'https://functions.poehali.dev/5d61e550-4be2-483e-a685-bb7eaaaea724';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(AUTH_API_URL, {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
    } finally {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
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