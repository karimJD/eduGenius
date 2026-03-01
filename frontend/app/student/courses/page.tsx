'use client';

import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface Course {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  teacherId: {
    firstName: string;
    lastName: string;
  };
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/courses');
        setCourses(res.data);
      } catch (error) {
        console.error('Failed to fetch student courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            My Learning Library
          </h1>
          <p className="text-gray-400">Access all your course materials and AI-powered study tools.</p>
        </div>
      </header>

      <div className="flex items-center gap-4 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
          <Input
            type="text"
            placeholder="Search your courses..."
            className="pl-11 bg-white/5 border-white/10 py-6 rounded-2xl focus:ring-blue-500/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-white/5 border border-white/10 rounded-3xl animate-pulse" />
            ))
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-3xl">
              No courses available. Check with your teachers to join a class.
            </div>
          ) : (
            filteredCourses.map((course, idx) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all group relative overflow-hidden flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/10 uppercase">
                    <TrendingUp className="w-3 h-3" /> Active
                  </div>
                </div>

                <div className="space-y-2 flex-grow">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    {course.teacherId?.firstName} {course.teacherId?.lastName}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                   <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-gray-500">
                      <span>Progress</span>
                      <span className="text-white">45%</span>
                   </div>
                   <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full w-[45%]" />
                   </div>
                   <div className="flex items-center gap-4 text-[10px] text-gray-500 pt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 5 Chapters</span>
                      <span className="flex items-center gap-1"><Award className="w-3 h-3" /> 12 Quiz XP</span>
                   </div>
                </div>

                <Link href={`/student/courses/${course._id}`} className="absolute inset-0 z-10" />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
