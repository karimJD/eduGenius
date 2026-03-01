'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

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
      className="w-full max-w-md p-8 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]"
    >
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
          {type === 'login' ? 'Welcome Back' : 'Join EduGenius'}
        </h2>
        <p className="text-gray-400 text-sm">
          {type === 'login' ? 'Enter your details to access your dashboard' : 'Start your personalized learning journey today'}
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {type === 'register' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 ml-1">First Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 ml-1">Last Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
          <input
            type="email"
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 ml-1">Password</label>
          <input
            type="password"
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        {type === 'register' && (
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 ml-1">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'student' })}
                className={`w-full py-3 rounded-xl border transition-all duration-300 flex items-center justify-center font-medium ${
                  formData.role === 'student'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/50'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'teacher' })}
                className={`w-full py-3 rounded-xl border transition-all duration-300 flex items-center justify-center font-medium ${
                  formData.role === 'teacher'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-500/50'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                Teacher
              </button>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl border-none shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            type === 'login' ? 'Sign In' : 'Create Account'
          )}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
        {type === 'login' ? (
          <>
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign up now
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </Link>
          </>
        )}
      </div>
    </motion.div>
  );
}
