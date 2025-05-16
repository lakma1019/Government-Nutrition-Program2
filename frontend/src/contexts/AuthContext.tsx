'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define user type
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'dataEntryOfficer' | 'verificationOfficer';
  is_active?: 'yes' | 'no';
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  setUserAndToken: (user: User, token: string) => void;
  logout: () => void;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  login: async () => {},
  setUserAndToken: () => {},
  logout: () => {},
  clearError: () => {},
});

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        // Check for user in localStorage
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // Clear potentially corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user and token
        setUser(data.user);
        setToken(data.token);

        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        // Redirect based on role
        if (data.user.role === 'admin') {
          router.push('/admin_dashboard');
        } else if (data.user.role === 'dataEntryOfficer') {
          router.push('/deo_dashboard');
        } else if (data.user.role === 'verificationOfficer') {
          router.push('vo_dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Set user and token directly (for use with CSRF protected login)
  const setUserAndToken = (user: User, token: string) => {
    // Store user and token
    setUser(user);
    setToken(token);

    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);

    // Also store token in user object for backward compatibility
    const userWithToken = { ...user, token };
    localStorage.setItem('user', JSON.stringify(userWithToken));

    console.log('Auth token stored in localStorage:', token);
    console.log('User with token stored in localStorage');

    // Redirect based on role
    if (user.role === 'admin') {
      router.push('/admin_dashboard');
    } else if (user.role === 'dataEntryOfficer') {
      router.push('/deo_dashboard');
    } else if (user.role === 'verificationOfficer') {
      router.push('vo_dashboard');
    }
  };

  // Logout function
  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // Redirect to login
    router.push('/login');
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    setUserAndToken,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
