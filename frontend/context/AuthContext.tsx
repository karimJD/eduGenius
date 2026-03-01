'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (firstName: string, lastName: string, email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from local storage", error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      console.log({data})
      
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      setUser(data);
      
      if (data.role === 'admin') router.push('/admin/dashboard');
      else if (data.role === 'teacher') router.push('/teacher/dashboard');
      else router.push('/student/dashboard');

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string, role: string = 'student') => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      setUser(data);
      
      if (data.role === 'admin') router.push('/admin/dashboard');
      else if (data.role === 'teacher') router.push('/teacher/dashboard');
      else router.push('/student/dashboard');

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
