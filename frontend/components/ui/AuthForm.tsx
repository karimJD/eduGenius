'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, GraduationCap, BookOpen, ChevronRight } from 'lucide-react';

interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
}

export function AuthForm({ type, onSubmit }: AuthFormProps) {
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await onSubmit(formData);
    
    if (!result.success) {
      setError(result.error || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
    >
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 mb-6 group transition-all duration-300 hover:scale-110">
          <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
          {type === 'login' ? 'Welcome Back' : 'Join EduGenius'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          {type === 'login' ? 'Log in to your academic dashboard' : 'Create your account to start learning'}
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm flex items-center gap-3"
        >
          <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {type === 'register' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">First Name</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Last Name</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="email"
              required
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300"
              placeholder="name@school.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Password</label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="password"
              required
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </div>

        {type === 'register' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1 text-center">I am joining as a...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'student' })}
                className={`group relative overflow-hidden px-4 py-4 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-2 ${
                  formData.role === 'student'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-zinc-800'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${formData.role === 'student' ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600'}`}>
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="font-bold tracking-tight">Student</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'teacher' })}
                className={`group relative overflow-hidden px-4 py-4 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-2 ${
                  formData.role === 'teacher'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-zinc-800'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${formData.role === 'teacher' ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600'}`}>
                  <School className="w-6 h-6" />
                </div>
                <span className="font-bold tracking-tight">Teacher</span>
              </button>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-6 mt-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-2xl border-none shadow-xl shadow-zinc-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <>
              <span>{type === 'login' ? 'Sign In to EduGenius' : 'Create My Account'}</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {type === 'login' ? (
          <>
            New to EduGenius?{' '}
            <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-bold transition-all">
              Join for free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-bold transition-all">
              Sign in here
            </Link>
          </>
        )}
      </div>
    </motion.div>
  );
}
