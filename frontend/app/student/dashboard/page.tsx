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
  Bell,
  MapPin,
  Megaphone
} from 'lucide-react';
import api from '../../../lib/axios';
import { getAnnouncements } from '../../../lib/api/student';
import { API_BASE_URL } from '@/lib/api/axios';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { PageHeader } from '../../../components/student/PageHeader';
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

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  type: 'general' | 'assignment' | 'exam' | 'event';
  isPinned: boolean;
  createdAt: string;
  classId?: { name: string; code: string };
  teacherId?: { firstName: string; lastName: string };
  imageUrl?: string;
}

function getImageSrc(imageUrl: string): string {
  if (!imageUrl) return '';
  const s3Pattern = /https?:\/\/[^.]+\.s3\.[^.]+\.amazonaws\.com\/(.+)$/;
  const m = imageUrl.match(s3Pattern);
  if (m) {
    const key = m[1];
    return `${API_BASE_URL}/api/admin/announcements/image-proxy?key=${encodeURIComponent(key)}`;
  }
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

function AnnouncementSlideshow({ announcements }: { announcements: Announcement[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  const current = announcements[index];

  return (
    <div className="group relative overflow-hidden bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] p-5 flex items-center gap-6 transition-all hover:bg-indigo-500/[0.08]">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-xl shadow-indigo-500/20 relative overflow-hidden group/img">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent z-10" />
        {current.imageUrl && !current.imageUrl.includes('mock-s3-bucket') ? (
          <img 
            src={getImageSrc(current.imageUrl)} 
            alt={current.title} 
            className="w-full h-full object-cover relative z-0 transition-transform duration-500 group-hover/img:scale-110"
          />
        ) : (
          <Megaphone className="w-8 h-8 md:w-10 md:h-10 text-white relative z-20" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={current._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="space-y-1"
          >
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full">
                {current.priority === 'urgent' ? '🚨 Urgent' : '📢 Annonce'}
              </span>
              <span className="text-[10px] text-muted-foreground font-bold">• {new Date(current.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              {current.teacherId && (
                <span className="text-[10px] text-indigo-600/60 dark:text-indigo-400/60 font-bold">• {current.teacherId.firstName}</span>
              )}
            </div>
            <h4 className="text-lg font-black text-foreground dark:text-white tracking-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {current.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-1 font-medium">
              {current.content}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-end gap-3 shrink-0">
        <Button asChild size="sm" className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-indigo-500/10 bg-indigo-600 hover:bg-indigo-500 text-white">
          <Link href="/student/announcements">Détails</Link>
        </Button>
        {announcements.length > 1 && (
          <div className="flex gap-1.5 px-2">
            {announcements.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === index ? "bg-indigo-500 w-6" : "bg-indigo-500/20 w-1.5 hover:bg-indigo-500/40"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
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

  const [pendingExercises, setPendingExercises] = useState<any[]>([]);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Get Stats
        const statsRes = await api.get('/student/dashboard/stats');
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
        
        // Get pending exercises
        const exercisesRes = await api.get('/student/dashboard/pending-exercises');
        if (exercisesRes.data.success) {
          setPendingExercises(exercisesRes.data.data);
          setTotalPendingCount(exercisesRes.data.totalCount || exercisesRes.data.data.length);
        }

        // Get today schedule
        const scheduleRes = await api.get('/student/dashboard/today-schedule');
        if (scheduleRes.data.success) {
          setTodaySchedule(scheduleRes.data.data);
        }

        // Get Announcements
        const announcementsRes = await getAnnouncements();
        if (announcementsRes.success) {
          setAnnouncements(announcementsRes.data);
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
    { name: 'Comptes Rendus à Faire', value: totalPendingCount, icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Évaluations Prévues', value: stats.upcomingAssessments, icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { name: 'Taux de Présence', value: `${stats.attendanceRate}%`, icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10' },
    { name: 'Messages Non Lus', value: stats.unreadMessages, icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      {/* Header Section */}
      <PageHeader 
        title={`Bienvenue, ${user?.firstName}`}
        titleClassName="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-500 tracking-tight"
        description={
          <>
            Votre parcours d'apprentissage continue. Vous avez <strong className="text-foreground dark:text-white">{stats.pendingAssignments}</strong> devoirs en attente cette semaine.
          </>
        }
        icon={Sparkles}
        badgeText="Tableau de bord Élève"
        badgeClassName="bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
      />

      {/* Announcement Slideshow */}
      <AnimatePresence>
        {!loading && announcements.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <AnnouncementSlideshow announcements={announcements} />
          </motion.div>
        )}
      </AnimatePresence>

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
              className="p-6 bg-card dark:bg-[#111111] border border-border dark:border-[#222222] rounded-2xl group hover:border-gray-300 dark:hover:border-[#333333] transition-all relative overflow-hidden flex flex-col justify-between h-32"
            >
               {/* Background Glow */}
              <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity", stat.bg)} />
              
              <div className="flex justify-between items-start z-10 w-full mb-auto">
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">{stat.name}</p>
                <div className={cn("p-2 rounded-xl", stat.bg)}>
                  <Icon className={cn("w-5 h-5", stat.color)} />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground dark:text-white z-10">{loading ? '-' : stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main learning hub */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground dark:text-white">
                    <FileText className="w-6 h-6 text-indigo-400" />
                    Comptes rendu à rendre
                </h2>
                <Link href="/student/courses">
                    <Button variant="ghost" size="sm" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-500/10">Voir tout</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 bg-card dark:bg-[#111111] border border-border dark:border-[#222222] rounded-2xl animate-pulse" />
                    ))
                ) : pendingExercises.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground dark:text-gray-500 border border-dashed border-border dark:border-[#333333] rounded-2xl bg-muted/20 dark:bg-[#0a0a0a]">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                        Tous vos comptes rendus ont été soumis. Félicitations !
                    </div>
                ) : (
                    pendingExercises.map((ex, idx) => (
                        <motion.div
                            key={ex._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-6 bg-card dark:bg-[#111111] border border-border dark:border-[#222222] rounded-2xl hover:border-indigo-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all group cursor-pointer relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-foreground dark:group-hover:text-white transition-all duration-300">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-full uppercase tracking-wider">
                                    EXERCICE
                                </span>
                            </div>
                            <h3 className="font-bold text-lg mb-1 text-foreground dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{ex.name || ex.title}</h3>
                            <p className="text-sm text-muted-foreground dark:text-gray-500 mb-4 line-clamp-1">{ex.subjectName} • {ex.subjectCode}</p>
                            
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#222222]">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground dark:text-gray-500" />
                                    <span className="text-xs text-muted-foreground dark:text-gray-500 font-medium">
                                        {ex.dueDate ? `Échéance: ${new Date(ex.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : 'Pas d\'échéance'}
                                    </span>
                                </div>
                                <span className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                    Accéder <Sparkles className="w-3 h-3" />
                                </span>
                            </div>
                            <Link href={`/student/courses/${ex.classId}/${ex.subjectId}/exercises/${ex._id}`} className="absolute inset-0 z-10" />
                        </motion.div>
                    ))
                )}
                </AnimatePresence>
            </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
            {/* AI Call to action */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-[#1a1c2e] dark:to-[#2d1b36] border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group shadow-sm dark:shadow-lg dark:shadow-indigo-500/5">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-12">
                    <Sparkles size={120} className="text-indigo-400 dark:text-indigo-300" />
                </div>
                <div className="absolute top-0 right-0 p-4">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                </div>
                <h3 className="font-bold text-xl flex items-center gap-2 mb-3 text-foreground dark:text-white">
                    <BrainCircuitIcon className="w-6 h-6 text-purple-400" />
                    Assistant IA
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 relative z-10 leading-relaxed">
                  Générez des résumés de cours, des flashcards ou des quiz d'entraînement avec l'IA d'EduGenius.
                </p>
                <Link href="/student/ai" className="block relative z-10">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-foreground dark:text-white font-semibold h-12 rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-500/25">
                      Essayer maintenant
                  </Button>
                </Link>
            </div>

            {/* Today's Schedule Agenda Widget */}
            <div className="bg-card dark:bg-[#111111] border border-border dark:border-[#222222] rounded-3xl p-6 space-y-4 shadow-sm dark:shadow-lg dark:shadow-black">
                <h3 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    Agenda du jour
                </h3>
                <div className="space-y-3">
                  {todaySchedule.length === 0 ? (
                    <div className="text-sm text-muted-foreground dark:text-gray-500 text-center py-4 border border-dashed border-border dark:border-[#333333] rounded-xl bg-muted/20 dark:bg-[#0a0a0a]">
                      Rien de prévu pour aujourd'hui
                    </div>
                  ) : (
                    todaySchedule.map((entry, idx) => (
                      <div key={idx} className="flex flex-col gap-1 p-3 bg-muted/50 dark:bg-[#1a1a1a] rounded-xl border border-border dark:border-[#2a2a2a]">
                          <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                  {entry.startTime} - {entry.endTime}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground dark:text-gray-500">{entry.sessionType}</span>
                          </div>
                          <p className="text-sm font-bold text-foreground dark:text-white mt-1">{entry.subjectId?.name || "Matière"}</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {entry.room || "En ligne"}
                          </p>
                      </div>
                    ))
                  )}
                </div>
                <Link href="/student/schedule" className="block mt-4">
                  <Button variant="outline" className="w-full text-xs font-semibold h-10 border-border dark:border-[#333333] text-foreground dark:text-white hover:bg-muted dark:hover:bg-[#1a1a1a]">
                      Voir l'emploi du temps
                  </Button>
                </Link>
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
