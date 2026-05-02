'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from './button';
import { ArrowRight, GraduationCap } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white dark:bg-zinc-950 font-sans">
      {/* Background Patterns */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/10 to-transparent pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 mb-8">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Empowering the next generation</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-6 leading-[1.1]">
            Master Any Subject with <br />
            <span className="text-blue-600">
              Intelligent AI Tutors
            </span>
          </h1>
          
          <p className="mt-6 text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your course material and let our advanced AI generate interactive quizzes, 
            summaries, and personalized learning paths instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 w-full sm:w-auto">
                Start Learning Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="h-14 px-8 text-lg border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 w-full sm:w-auto font-semibold">
                View Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
