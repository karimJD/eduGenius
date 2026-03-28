'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/axios';
import {
  BookOpen,
  Search,
  Filter,
  PlayCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import Image from 'next/image';

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/courses');
        if (res.data.success) {
          setCourses(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching student courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course => 
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.classId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium w-fit"
          >
            <BookOpen className="w-4 h-4" />
            <span>Mes Cours</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Apprentissage</h1>
          <p className="text-gray-400 max-w-xl">
            Reprenez là où vous vous étiez arrêté. Accédez aux chapitres, vidéos et ressources de vos cours.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher un cours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600 shadow-sm"
          />
        </div>
        <Button variant="outline" className="h-[50px] bg-[#111111] border-[#222222] text-white hover:bg-[#1a1a1a] gap-2 rounded-xl">
          <Filter className="w-4 h-4" />
          Filtrer
        </Button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#111111] border border-[#222222] rounded-2xl h-72 animate-pulse"
              />
            ))
          ) : filteredCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full py-16 text-center border border-dashed border-[#333333] rounded-2xl bg-[#0a0a0a]"
            >
              <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#222222]">
                <BookOpen className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Aucun cours trouvé</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {searchQuery 
                  ? "Aucun cours ne correspond à votre recherche." 
                  : "Aucun cours n'a encore été ajouté aux classes dans lesquelles vous êtes inscrit."}
              </p>
            </motion.div>
          ) : (
            filteredCourses.map((course, idx) => {
              const progress = course.progress || 0;
              const isCompleted = progress === 100;
              
              return (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all group flex flex-col relative"
                >
                  {/* Thumbnail / Header area */}
                  <div className="h-32 bg-gradient-to-br from-[#1a1c2e] to-[#0f172a] relative overflow-hidden border-b border-[#222222]">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-indigo-900 to-black"></div>
                    
                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border",
                          isCompleted 
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : progress > 0 
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              : "bg-gray-500/10 border-gray-500/20 text-gray-400"
                        )}>
                          {isCompleted ? 'Complété' : progress > 0 ? 'En cours' : 'Non commencé'}
                        </span>
                        
                        <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white">
                          <PlayCircle className="w-4 h-4" />
                        </div>
                      </div>
                      
                      {/* Teacher minimal info */}
                      <div className="flex items-center gap-2 mt-auto">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-200 font-bold overflow-hidden">
                          {course.teacherId?.profileImage ? (
                            <img src={course.teacherId.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            course.teacherId?.firstName?.charAt(0) || 'P'
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-300">
                          {course.teacherId?.firstName} {course.teacherId?.lastName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-6">
                      {course.description || "Aucune description fournie pour ce cours."}
                    </p>

                    <div className="mt-auto space-y-4">
                      {/* Class Badge */}
                      {course.classId && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Matière: {course.classId.subject}</span>
                          <span className="mx-1">•</span>
                          <span>{course.chapters?.length || 0} chapitres</span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className={cn(
                            "font-medium", 
                            isCompleted ? "text-green-400" : progress > 0 ? "text-blue-400" : "text-gray-500"
                          )}>
                            Progression
                          </span>
                          <span className="font-bold text-gray-300">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#222222] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn(
                              "h-full rounded-full",
                              isCompleted ? "bg-green-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Click Overlay */}
                    <Link href={`/student/courses/${course._id}`} className="absolute inset-0 z-10">
                      <span className="sr-only">Voir le cours {course.title}</span>
                    </Link>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
