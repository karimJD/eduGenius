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
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <Navbar />
      <Hero />
      
      {/* Features Section */}
      <section className="relative py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Supercharge Your Learning
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to transform your study materials into an interactive learning experience
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
                className="group relative bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
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
            className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-3xl p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of students who are already learning smarter with AI-powered education
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25">
                    Get Started Free
                  </button>
                </Link>
                <Link href="/login">
                  <button className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-xl">eduGenius</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 eduGenius. AI-Powered Learning Platform.
          </p>
        </div>
      </footer>
    </main>
  );
}
