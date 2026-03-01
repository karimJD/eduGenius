'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Video, 
  PlusCircle, 
  ChevronRight, 
  Clock, 
  Activity,
  Calendar,
  Sparkles
} from 'lucide-react';
import api from '@/lib/axios';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalCourses: 0,
    activeSessions: 0
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, coursesRes] = await Promise.all([
          api.get('/classes'),
          api.get('/courses')
        ]);
        
        const totalStudents = classesRes.data.reduce((acc: number, curr: any) => acc + (curr.studentIds?.length || 0), 0);
        
        setStats({
          totalStudents,
          totalClasses: classesRes.data.length,
          totalCourses: coursesRes.data.length,
          activeSessions: 0 // Placeholder for real-time sessions
        });
        
        setClasses(classesRes.data.slice(0, 3));
        setCourses(coursesRes.data.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch teacher dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { name: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-400', border: 'border-blue-500/20' },
    { name: 'Your Classes', value: stats.totalClasses, icon: Calendar, color: 'text-purple-400', border: 'border-purple-500/20' },
    { name: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-green-400', border: 'border-green-500/20' },
    { name: 'Active Sessions', value: stats.activeSessions, icon: Video, color: 'text-orange-400', border: 'border-orange-500/20' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
          Teacher Overview
        </h1>
        <p className="text-gray-400">Manage your classes, courses, and track student progression.</p>
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
              className={`p-6 bg-white/5 border ${stat.border} rounded-2xl relative group overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
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
        {/* Classes Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              My Classes
            </h2>
            <Link href="/teacher/classes" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />)
            ) : classes.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                    No classes found. Create one to get started.
                </div>
            ) : (
                classes.map((cls) => (
                    <div key={cls._id} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded uppercase tracking-wider">
                                {cls.code}
                            </span>
                            <Link href={`/teacher/classes/${cls._id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlusCircle className="w-5 h-5 text-gray-500" />
                            </Link>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{cls.name}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {cls.studentIds.length} Students
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {cls.schedule?.length || 0} Slots/Week
                            </span>
                        </div>
                    </div>
                ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/5 rounded-3xl p-8 mt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold flex items-center gap-2 justify-center md:justify-start">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  AI Content Generator
                </h3>
                <p className="text-gray-400 max-w-md">Instantly create courses, quizzes, and summaries using our advanced AI engine.</p>
              </div>
              <Link
                href="/teacher/courses/new"
                className="bg-white text-black px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform active:scale-95"
              >
                <PlusCircle className="w-5 h-5" />
                Create Course
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Courses/Content Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-400" />
              Recent Courses
            </h2>
          </div>

          <div className="space-y-4">
            {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />)
            ) : courses.length === 0 ? (
                <div className="py-8 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                    No courses yet.
                </div>
            ) : (
                courses.map((course) => (
                    <motion.div
                        key={course._id}
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{course.title}</h4>
                            <p className="text-xs text-gray-500">{new Date(course.createdAt).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                    </motion.div>
                ))
            )}
          </div>
          
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
            <h3 className="font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-400 transition-all">My Profile</button>
                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-400 transition-all">Support</button>
                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-400 transition-all">Announcements</button>
                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-400 transition-all">Settings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
