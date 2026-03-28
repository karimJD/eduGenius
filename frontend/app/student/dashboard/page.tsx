'use client';

import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Flame, 
  Trophy,
  Activity,
  Sparkles,
  Calendar,
  Layers,
  FileText,
  MessageCircle,
  Bell
} from 'lucide-react';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

interface DashboardStats {
  enrolledClasses: number;
  upcomingAssessments: number;
  pendingAssignments: number;
  overallGPA: number;
  attendanceRate: number;
  unreadAnnouncements: number;
  unreadMessages: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    enrolledClasses: 0,
    upcomingAssessments: 0,
    pendingAssignments: 0,
    overallGPA: 0,
    attendanceRate: 100,
    unreadAnnouncements: 0,
    unreadMessages: 0
  });

  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Get Stats
        const statsRes = await api.get('/student/dashboard/stats');
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
        
        // Get recent courses (we can reuse the classes endpoint or create a specific courses one)
        // For now let's just fetch classes to show in learning hub
        const coursesRes = await api.get('/student/classes');
        if (coursesRes.data.success) {
          setCourses(coursesRes.data.data.slice(0, 4)); // Get up to 4 recent classes
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'student') {
      fetchDashboardData();
    }
  }, [user]);

  const statCards = [
    { name: 'Classes Inscrites', value: stats.enrolledClasses, icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Évaluations Prévues', value: stats.upcomingAssessments, icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { name: 'Taux de Présence', value: `${stats.attendanceRate}%`, icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10' },
    { name: 'Messages Non Lus', value: stats.unreadMessages, icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <header className="flex flex-col gap-2 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium w-fit mb-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Tableau de bord Élève</span>
        </motion.div>
        <h1 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight">
          Bienvenue, {user?.firstName}
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Votre parcours d'apprentissage continue. Vous avez <strong className="text-white">{stats.pendingAssignments}</strong> devoirs en attente cette semaine.
        </p>
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
              className="p-6 bg-[#111111] border border-[#222222] rounded-2xl group hover:border-[#333333] transition-all relative overflow-hidden flex flex-col justify-between h-32"
            >
               {/* Background Glow */}
              <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity", stat.bg)} />
              
              <div className="flex justify-between items-start z-10 w-full mb-auto">
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <div className={cn("p-2 rounded-xl", stat.bg)}>
                  <Icon className={cn("w-5 h-5", stat.color)} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white z-10">{loading ? '-' : stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main learning hub */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <BookOpen className="w-6 h-6 text-indigo-400" />
                    Mes Classes Récentes
                </h2>
                <Link href="/student/classes">
                    <Button variant="ghost" size="sm" className="text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">Voir tout</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 bg-[#111111] border border-[#222222] rounded-2xl animate-pulse" />
                    ))
                ) : courses.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-[#333333] rounded-2xl bg-[#0a0a0a]">
                        <BookOpen className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        Vous n'êtes inscrit à aucune classe pour le moment.
                    </div>
                ) : (
                    courses.map((cls, idx) => (
                        <motion.div
                            key={cls._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-6 bg-[#111111] border border-[#222222] rounded-2xl hover:border-indigo-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all group cursor-pointer relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-full uppercase tracking-wider">
                                    CLASSE
                                </span>
                            </div>
                            <h3 className="font-bold text-lg mb-1 text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">{cls.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-1">{cls.subject} • Nv. {cls.level}</p>
                            
                            {/* Make a fake progress bar just for UI effect */}
                            <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden mb-3">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.floor(Math.random() * 60) + 20}%` }}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>En cours</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-indigo-400" /> Récemment</span>
                            </div>
                            <Link href={`/student/classes/${cls._id}`} className="absolute inset-0 z-10" />
                        </motion.div>
                    ))
                )}
                </AnimatePresence>
            </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
            {/* AI Call to action */}
            <div className="bg-gradient-to-br from-[#1a1c2e] to-[#2d1b36] border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group shadow-lg shadow-indigo-500/5">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-12">
                    <Sparkles size={120} className="text-indigo-300" />
                </div>
                <div className="absolute top-0 right-0 p-4">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                </div>
                <h3 className="font-bold text-xl flex items-center gap-2 mb-3 text-white">
                    <BrainCircuitIcon className="w-6 h-6 text-purple-400" />
                    Assistant IA
                </h3>
                <p className="text-sm text-gray-300 mb-6 relative z-10 leading-relaxed">
                  Générez des résumés de cours, des flashcards ou des quiz d'entraînement avec l'IA d'EduGenius.
                </p>
                <Link href="/student/ai" className="block relative z-10">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-12 rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-500/25">
                      Essayer maintenant
                  </Button>
                </Link>
            </div>

            {/* Notifications Widget */}
            <div className="bg-[#111111] border border-[#222222] rounded-3xl p-6 space-y-4 shadow-lg shadow-black">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    Annonces Récentes
                    {stats.unreadAnnouncements > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                        {stats.unreadAnnouncements}
                      </span>
                    )}
                </h3>
                <div className="space-y-3">
                  {stats.unreadAnnouncements === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4 border border-dashed border-[#333333] rounded-xl">
                      Aucune nouvelle annonce
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] group hover:border-[#3a3a3a] transition-all cursor-pointer">
                        <div className="w-2 h-10 bg-yellow-500 rounded-full" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">Nouvelle Annonce</p>
                            <p className="text-xs text-gray-500 truncate">Vérifiez la page des annonces</p>
                        </div>
                    </div>
                  )}
                  <Link href="/student/announcements" className="block text-center text-xs text-indigo-400 hover:text-indigo-300 mt-2 font-medium">
                    Voir toutes les annonces →
                  </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// Inline icon component since BrainCircuit wasn't imported at top to avoid messing up imports of lucide
function BrainCircuitIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 20V4.5z" />
      <path d="M16 8V5c0-1.1.9-2 2-2" />
      <path d="M12 13h4" />
      <path d="M12 18h6a2 2 0 0 1 2 2v1" />
      <path d="M19 13v-5" />
      <path d="M22 9h-3" />
    </svg>
  );
}
