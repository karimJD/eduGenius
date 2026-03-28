'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/axios';
import {
  BookOpen,
  Search,
  Filter,
  Users,
  Calendar,
  ChevronRight,
  GraduationCap,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import Image from 'next/image';

export default function StudentClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/classes');
        if (res.data.success) {
          setClasses(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching student classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const filteredClasses = classes.filter(cls => 
    cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cls.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium w-fit"
          >
            <BookOpen className="w-4 h-4" />
            <span>Mes Classes</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Classes Inscrites</h1>
          <p className="text-gray-400 max-w-xl">
            Retrouvez ici toutes les classes auxquelles vous êtes inscrit. Accédez au contenu, aux devoirs et aux annonces.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher une classe, une matière..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600 shadow-sm"
          />
        </div>
        <Button variant="outline" className="h-[50px] bg-[#111111] border-[#222222] text-white hover:bg-[#1a1a1a] gap-2 rounded-xl">
          <Filter className="w-4 h-4" />
          Filtrer
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#111111] border border-[#222222] rounded-2xl h-64 animate-pulse"
              />
            ))
          ) : filteredClasses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full py-16 text-center border border-dashed border-[#333333] rounded-2xl bg-[#0a0a0a]"
            >
              <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#222222]">
                <BookOpen className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Aucune classe trouvée</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {searchQuery 
                  ? "Aucune classe ne correspond à votre recherche." 
                  : "Vous n'êtes inscrit à aucune classe pour le moment."}
              </p>
            </motion.div>
          ) : (
            filteredClasses.map((cls, idx) => (
              <motion.div
                key={cls._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all group flex flex-col relative"
              >
                {/* Decorative Top Banner */}
                <div className="h-16 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 relative">
                  <div className="absolute -bottom-6 left-6 w-12 h-12 bg-[#111111] rounded-xl border border-[#222222] flex items-center justify-center p-2">
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                      {cls.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {cls.name}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#1a1a1a] border border-[#333333] text-gray-400">
                      Nv. {cls.level}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-6 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    {cls.subject}
                  </p>

                  {/* Teacher Info */}
                  <div className="mt-auto pt-4 border-t border-[#222222] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-gray-400 text-xs font-bold overflow-hidden relative">
                        {cls.teacher?.profileImage ? (
                          <Image src={cls.teacher.profileImage} alt={cls.teacher.lastName} fill className="object-cover" />
                        ) : (
                          cls.teacher?.lastName?.charAt(0) || 'P'
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Professeur</p>
                        <p className="text-sm font-medium text-gray-300">
                          {cls.teacher?.firstName} {cls.teacher?.lastName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Click Overlay */}
                  <Link href={`/student/classes/${cls._id}`} className="absolute inset-0 z-10">
                    <span className="sr-only">Voir la classe {cls.name}</span>
                  </Link>

                  {/* Action Button that appears on hover */}
                  <div className="absolute right-6 bottom-6 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all z-20">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
