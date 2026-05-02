'use client';

import { Navbar } from '../components/ui/Navbar';
import { Hero } from '../components/ui/Hero';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Target, TrendingUp, BookOpen, Brain } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Advanced AI generates personalized quizzes and summaries tailored to your content"
    },
    {
      icon: Sparkles,
      title: "Smart Summaries",
      description: "Get engaging, fun-to-read summaries that make complex topics easy to understand"
    },
    {
      icon: Target,
      title: "Adaptive Quizzes",
      description: "Dynamic quiz generation that adapts to your learning pace and style"
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your learning journey with detailed analytics and performance insights"
    },
    {
      icon: Zap,
      title: "Instant Feedback",
      description: "AI explains your mistakes and helps you learn from them immediately"
    },
    {
      icon: BookOpen,
      title: "Multi-Format Support",
      description: "Upload PDFs, text, or multiple files - we handle it all seamlessly"
    }
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 font-sans overflow-hidden">
      <Navbar />
      <Hero />
      
      {/* Features Section */}
      <section className="relative py-24 px-8 bg-zinc-50/50 dark:bg-zinc-900/30 border-y border-zinc-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-zinc-900 dark:text-white">
              Supercharge Your Learning
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
              Everything you need to transform your study materials into an interactive learning experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">{feature.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative bg-blue-600 rounded-[3rem] p-12 text-center overflow-hidden shadow-2xl shadow-blue-600/20"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white tracking-tight">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                Join thousands of students who are already learning smarter with AI-powered education.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <button className="h-14 px-8 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl w-full sm:w-auto">
                    Get Started Free
                  </button>
                </Link>
                <Link href="/login">
                  <button className="h-14 px-8 bg-blue-700/50 hover:bg-blue-700 border border-blue-400/30 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10 px-8 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">EduGenius</span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            © 2026 EduGenius. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
