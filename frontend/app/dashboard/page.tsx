'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Clock, ChevronRight } from 'lucide-react';
import { fetchCourses, Course } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/ui/Sidebar';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<Record<string, { questionsAnswered: number; correctAnswers: number }>>({});
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    try {
      const data = await fetchCourses();
      setCourses(data);
      
      // Fetch progress for each course
      if (user) {
        const progressData: Record<string, { questionsAnswered: number; correctAnswers: number }> = {};
        for (const course of data) {
          try {
            const response = await fetch(`http://localhost:5000/api/auth/progress/${course._id}`, {
              headers: {
                'Authorization': `Bearer ${user.token}`
              }
            });
            if (response.ok) {
              const progress = await response.json();
              progressData[course._id] = progress;
            }
          } catch (error) {
            console.error(`Error fetching progress for course ${course._id}:`, error);
          }
        }
        setUserProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <header className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back, continue your learning journey.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] border border-dashed border-white/10 rounded-2xl bg-white/5">
            <BookOpen className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-6">Start by creating your first AI-powered course.</p>
            <Link 
              href="/upload"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="absolute top-4 right-4 p-2 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                <div className="mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 text-blue-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold line-clamp-1 mb-2 group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {course.content}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                  {userProgress[course._id] && userProgress[course._id].questionsAnswered > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md font-medium">
                        {userProgress[course._id].questionsAnswered} Q
                      </span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md font-medium">
                        {Math.round((userProgress[course._id].correctAnswers / userProgress[course._id].questionsAnswered) * 100)}%
                      </span>
                    </div>
                  ) : (
                    <span className="px-2 py-1 bg-white/5 rounded-md text-gray-400">
                      Not started
                    </span>
                  )}
                </div>

                <Link href={`/dashboard/${course._id}`} className="absolute inset-0" />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
