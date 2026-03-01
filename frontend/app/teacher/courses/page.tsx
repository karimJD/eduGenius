'use client';

import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  ChevronRight, 
  Clock, 
  FileText,
  Trash2,
  Sparkles,
  BarChart2
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface Course {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  createdAt: string;
  quiz?: any[];
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this course? All associated quizzes and summaries will be removed.')) {
      try {
        await api.delete(`/courses/${id}`);
        fetchCourses();
      } catch (error) {
        console.error('Failed to delete course:', error);
      }
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Course Management
          </h1>
          <p className="text-gray-400">Organize your teaching materials and AI-generated content.</p>
        </div>
        <Link href="/teacher/courses/new">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-6 rounded-2xl flex gap-2 font-semibold shadow-lg shadow-green-500/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New AI Course
          </Button>
        </Link>
      </header>

      <div className="flex items-center gap-4 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-green-500 transition-colors" />
          <Input
            type="text"
            placeholder="Search your courses..."
            className="pl-11 bg-white/5 border-white/10 py-6 rounded-2xl focus:ring-green-500/40"
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
              No courses found. Create your first course using AI.
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
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText size={80} />
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/20 flex items-center justify-center text-green-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1 h-fit">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(course._id)} className="rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 flex-grow">
                  <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors line-clamp-2 leading-tight">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(course.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                   <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-gray-500">
                      <span>Resources</span>
                      <span className="text-green-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Ready
                      </span>
                   </div>
                   <div className="flex gap-2">
                      <div title="AI Summary" className={`p-2 rounded-lg border ${course.summary ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-white/5 border-white/10 text-gray-600'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div title="AI Quiz" className={`p-2 rounded-lg border ${course.quiz?.length ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/10 text-gray-600'}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div title="Analytics" className="p-2 rounded-lg border bg-white/5 border-white/10 text-gray-600">
                        <BarChart2 className="w-4 h-4" />
                      </div>
                   </div>
                </div>

                <Link href={`/teacher/courses/${course._id}`} className="absolute top-0 left-0 w-full h-[70%] z-0" />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
