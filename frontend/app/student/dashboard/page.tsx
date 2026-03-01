'use client';

import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Clock, 
  ChevronRight, 
  Target, 
  Flame, 
  Trophy,
  Activity,
  Sparkles,
  Calendar
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedQuizzes: 0,
    learningStreak: 5, // Placeholder
    totalXp: 1250 // Placeholder
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/courses');
        setCourses(res.data);
        setStats(prev => ({ ...prev, enrolledCourses: res.data.length }));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const statCards = [
    { name: 'Enrolled Courses', value: stats.enrolledCourses, icon: BookOpen, color: 'text-blue-400' },
    { name: 'Learning Streak', value: `${stats.learningStreak} Days`, icon: Flame, color: 'text-orange-400' },
    { name: 'Total XP', value: stats.totalXp, icon: Trophy, color: 'text-yellow-400' },
    { name: 'Target Goal', value: '85%', icon: Target, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Welcome back, {user?.firstName}
        </h1>
        <p className="text-gray-400">Your learning journey continues. You have 3 assignments due this week.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main learning hub */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    My Learning Hub
                </h2>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white">Recent</Button>
                    <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white">Favorites</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
                    ))
                ) : courses.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                        No courses joined yet. Join a class to start learning.
                    </div>
                ) : (
                    courses.map((course, idx) => (
                        <motion.div
                            key={course._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group cursor-pointer relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-1 rounded">
                                    COURSE
                                </span>
                            </div>
                            <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors uppercase tracking-widest">{course.title}</h3>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-4">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '45%' }}
                                    className="bg-blue-600 h-full rounded-full"
                                />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-500">
                                <span>45% Complete</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 2h left</span>
                            </div>
                            <Link href={`/student/courses/${course._id}`} className="absolute inset-0" />
                        </motion.div>
                    ))
                )}
                </AnimatePresence>
            </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Sparkles size={100} />
                </div>
                <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    AI Study Buddy
                </h3>
                <p className="text-sm text-gray-400 mb-4">You have a quiz due tomorrow. Should we generate a summary for 'Chapter 4' to help you review?</p>
                <Button className="w-full bg-white text-black font-bold h-12 rounded-xl active:scale-95 transition-all">
                    Generate Summary
                </Button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    Upcoming Classes
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                        <div className="w-2 h-10 bg-purple-500 rounded-full" />
                        <div>
                            <p className="text-sm font-bold truncate">Physics Grade 10</p>
                            <p className="text-[10px] text-gray-500">Starts in 45 mins • Room 302</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
