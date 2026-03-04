import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLaunchParams, useInitData } from '@vkruglikov/react-telegram-web-app';
import { authApi } from '@/services/api';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: true
  });

  const initData = useInitData();
  const [lp] = useLaunchParams();

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authApi.getMe();
          setState({
            user: response.data.user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          localStorage.removeItem('token');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  const login = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Get initData from Telegram WebApp
      const initDataRaw = lp?.initDataRaw || '';
      
      if (!initDataRaw) {
        // For development - mock login
        console.log('No initData available, using mock login');
        const mockUser: User = {
          id: 1,
          telegramId: 123456,
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
          role: 'client',
          phone: '+79001234567'
        };
        setState({
          user: mockUser,
          token: 'mock-token',
          isAuthenticated: true,
          isLoading: false
        });
        localStorage.setItem('token', 'mock-token');
        return;
      }

      const response = await authApi.telegramAuth(initDataRaw);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const updateUser = (userData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null
    }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
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
