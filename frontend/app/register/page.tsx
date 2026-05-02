'use client';

import { AuthForm } from '../../components/ui/AuthForm';
import { useAuth } from '../../context/AuthContext';
import Image from 'next/image';
import { BookOpen, GraduationCap, Users, Star, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();

  const handleRegister = async (data: any) => {
    return await register(data.firstName, data.lastName, data.email, data.password, data.role);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Left side: Content & Visual */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden border-r border-zinc-100 dark:border-zinc-800">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">EduGenius</span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-5xl font-extrabold text-zinc-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
              Start your <span className="text-blue-600">learning</span> journey today.
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Create your account in seconds and get access to exclusive educational resources and a global community.
            </p>
            
            <ul className="space-y-4">
              {[
                'Access to 1000+ premium courses',
                'Collaborate with expert educators',
                'AI-powered learning path optimization',
                'Join a community of 50k+ students',
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-auto flex justify-center">
          <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
            {/* CSS-based Abstract Illustration */}
            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full"></div>
            <div className="relative z-10 w-64 h-64 bg-white dark:bg-zinc-800 rounded-[3rem] shadow-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700 -rotate-6 animate-float">
               <Users className="w-32 h-32 text-blue-600" />
               <div className="absolute -top-4 -left-4 w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800 flex items-center justify-center rotate-12">
                 <GraduationCap className="w-10 h-10 text-blue-600" />
               </div>
               <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-zinc-50 dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800 flex items-center justify-center -rotate-12">
                 <Star className="w-12 h-12 text-blue-400" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex items-center justify-center p-8 relative overflow-hidden bg-white dark:bg-zinc-950">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">EduGenius</span>
        </div>

        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="w-full max-w-md relative z-10 py-12">
          <AuthForm type="register" onSubmit={handleRegister} />
        </div>
      </div>
    </div>
  );
}
