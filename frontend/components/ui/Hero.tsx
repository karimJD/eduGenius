'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from './button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-300">AI-Powered Learning Revolution</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            Master Any Subject with <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              Intelligent AI Tutors
            </span>
          </h1>
          
          <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Upload your course material and let our advanced AI generate interactive quizzes, 
            summaries, and personalized learning paths instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="h-12 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center gap-2">
                Start Learning Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="h-12 px-8 text-lg border-white/20 text-white hover:bg-white/10">
                View Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
