'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/axios';
import { useRouter } from 'next/navigation';
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

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/courses');
        if (res.data.success) {
          const coursesData = res.data.data;
          setCourses(coursesData);

          // If student only has one class, redirect to the subject selector directly
          if (coursesData.length === 1) {
            router.replace(`/student/courses/${coursesData[0]._id}`);
          }
        }
      } catch (error) {
        console.error('Error fetching student courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [router]);

  const filteredCourses = courses.filter(cls => 
    cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cls.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.departmentId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div >
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

      {/* Classes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-[#111111] border border-[#222222] rounded-2xl h-72 animate-pulse"
            />
          ))
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-[#333333] rounded-2xl bg-[#0a0a0a]">
            <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#222222]">
              <BookOpen className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aucun espace de cours</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Vous n'êtes inscrit dans aucune classe pour le moment.
            </p>
          </div>
        ) : (
          filteredCourses.map((cls) => {
            const subjectCount = cls.assignedSubjects?.length || 0;
            
            return (
              <div
                key={cls._id}
                className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all group flex flex-col relative"
              >
                  {/* Header area */}
                  <div className="h-32 bg-gradient-to-br from-[#1a1c2e] to-[#0f172a] relative overflow-hidden border-b border-[#222222]">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-indigo-900 to-black"></div>
                    
                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-wider uppercase">
                          Espace de classe
                        </span>
                        
                        <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="text-xs font-medium text-gray-300">
                          {cls.departmentId?.name || "Sans département"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                      {cls.name}
                    </h3>
                    <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-6">
                      Code: {cls.code}
                    </p>

                    <div className="mt-auto space-y-4">
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Filter className="w-3.5 h-3.5" />
                          <span>{subjectCount} Matières</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5" />
                          <span>Accéder au contenu</span>
                        </div>
                      </div>
                    </div>

                    {/* Click Overlay */}
                    <Link href={`/student/courses/${cls._id}`} className="absolute inset-0 z-10">
                      <span className="sr-only">Voir la classe {cls.name}</span>
                    </Link>
                  </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
