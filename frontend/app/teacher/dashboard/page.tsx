'use client';

import { useEffect, useState } from 'react';
import {
  Users, BookOpen, Video, ClipboardList, CheckSquare,
  Calendar, Megaphone, ChevronRight, TrendingUp, Clock,
  Plus, Pin, AlertCircle, Check
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  getDashboardStats, 
  getUpcomingSessions, 
  getRecentAnnouncements,
  getPendingWorkSubmissions
} from '@/lib/api/teacher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TeacherPageHeader } from '@/components/teacher/TeacherPageHeader';
import { API_BASE_URL } from '@/lib/api/axios';

/** Convert an imageUrl to a displayable src. */
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

interface Stats {
  totalClasses: number;
  totalStudents: number;
  totalAssessments: number;
  pendingGrading: number;
  pendingWork: number;
  todaySessions: number;
}

interface Session {
  _id: string;
  title: string;
  scheduledAt: string;
  status: string;
  classId?: { name: string; code: string };
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

interface PendingWork {
  _id: string;
  studentId: { firstName: string; lastName: string; profileImage?: string };
  classId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
  chapterId: string;
  exerciseId: string;
  exerciseName: string;
  fileName: string;
  submittedAt: string;
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
    <div className="group relative overflow-hidden bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-[2rem] p-5 flex items-center gap-6 transition-all hover:bg-primary/[0.08]">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-xl shadow-primary/20 relative overflow-hidden group/img">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent z-10" />
        {current.imageUrl && !current.imageUrl.includes('mock-s3-bucket') ? (
          <img 
            src={getImageSrc(current.imageUrl)} 
            alt={current.title} 
            className="w-full h-full object-cover relative z-0 transition-transform duration-500 group-hover/img:scale-110"
          />
        ) : (
          <Megaphone className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground relative z-20" />
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
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5">
                {current.priority === 'urgent' ? '🚨 Urgent' : '📢 Annonce'}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-bold">• {new Date(current.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              {current.teacherId && (
                <span className="text-[10px] text-primary/60 font-bold">• {current.teacherId.firstName}</span>
              )}
            </div>
            <h4 className="text-lg font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
              {current.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-1 font-medium">
              {current.content}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-end gap-3 shrink-0">
        <Button asChild size="sm" className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-primary/10">
          <Link href="/teacher/announcements">Détails</Link>
        </Button>
        {announcements.length > 1 && (
          <div className="flex gap-1.5 px-2">
            {announcements.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === index ? "bg-primary w-6" : "bg-primary/20 w-1.5 hover:bg-primary/40"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingWork, setPendingWork] = useState<PendingWork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, sessionsData, announcementsData, pendingWorkData] = await Promise.all([
          getDashboardStats(),
          getUpcomingSessions(),
          getRecentAnnouncements(),
          getPendingWorkSubmissions()
        ]);
        
        setStats(statsData);
        setSessions(sessionsData);
        setAnnouncements(announcementsData);
        setPendingWork(pendingWorkData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      loadDashboardData();
    }
  }, [user?._id]);

  const statCards = [
    { label: 'Mes Classes', value: stats?.totalClasses, icon: Calendar, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Total Étudiants', value: stats?.totalStudents, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Rendus à corriger', value: (stats?.pendingWork ?? 0) + (stats?.pendingGrading ?? 0), icon: ClipboardList, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Séances aujourd’hui', value: stats?.todaySessions, icon: Video, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const quickLinks = [
    { href: '/teacher/quizzes/new', label: 'Créer Quiz', icon: Plus, color: 'bg-primary/10 text-primary' },
    { href: '/teacher/schedule', label: 'Mon Planning', icon: Calendar, color: 'bg-blue-500/10 text-blue-500' },
    { href: '/teacher/grading', label: 'Corriger', icon: CheckSquare, color: 'bg-amber-500/10 text-amber-500' },
    { href: '/teacher/announcements', label: 'Annoncer', icon: Megaphone, color: 'bg-purple-500/10 text-purple-500' },
  ];

  return (
    <div className="space-y-8 mx-auto">
      {/* Header Section */}
      <TeacherPageHeader
        title={`Bon ${getTimeOfDay()}, ${user?.firstName} 👋`}
        subtitle="Voici un aperçu de vos activités d'aujourd'hui."
        actions={
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="rounded-xl border-border hover:bg-accent transition-all hidden sm:flex">
                <Link href="/teacher/schedule">
                   <Calendar className="w-4 h-4 mr-2" />
                   Voir Planning
                </Link>
            </Button>
            <Button asChild className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                <Link href="/teacher/courses">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Cours
                </Link>
            </Button>
          </div>
        }
      />

      {/* Announcement Slideshow */}
      <AnimatePresence>
        {!loading && announcements.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <AnnouncementSlideshow announcements={announcements} />
          </motion.div>
        )}
      </AnimatePresence>


      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 bg-card border border-border rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center ${card.color} shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? <span className="inline-block w-8 h-6 bg-muted rounded animate-pulse" /> : (card.value ?? 0)}
                </p>
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sessions & Announcements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming sessions */}
          <section className="bg-card border border-border rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" /> Séances à Venir
              </h2>
              <Link href="/teacher/sessions" className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                Tout voir <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid gap-4">
              {loading ? (
                [1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)
              ) : sessions.length === 0 ? (
                <div className="py-12 text-center bg-muted/30 border border-dashed border-border rounded-2xl">
                    <Video className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Aucune séance programmée</p>
                </div>
              ) : (
                sessions.map(session => (
                  <div key={session._id} className="flex items-center gap-4 p-4 border border-border rounded-2xl hover:bg-muted/50 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Video className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground truncate">{session.title}</p>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">{session.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(session.scheduledAt).toLocaleString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {session.classId && (
                           <p className="text-xs text-muted-foreground flex items-center gap-1">
                               <Users className="w-3.5 h-3.5" />
                               {session.classId.name}
                           </p>
                        )}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="secondary" className="rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <Link href="/teacher/schedule">Détails</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Exercises to Grade */}
          <section className="bg-card border border-border rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" /> Travaux à corriger
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground hover:text-primary">
                <Link href="/teacher/courses">Voir tout</Link>
              </Button>
            </div>

            <div className="space-y-4">
               {loading ? (
                   [1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)
               ) : pendingWork.length === 0 ? (
                   <div className="py-12 text-center bg-muted/30 border border-dashed border-border rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                          <Check className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="text-sm font-bold text-foreground">Tout est à jour !</p>
                        <p className="text-xs text-muted-foreground mt-1">Aucun nouvel exercice en attente de correction.</p>
                   </div>
               ) : (
                   pendingWork.map(work => (
                       <div key={work._id} className="p-4 border border-border rounded-2xl hover:border-primary/30 transition-all group bg-background/50">
                           <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden border border-border shrink-0">
                                  {work.studentId.profileImage ? (
                                    <img src={work.studentId.profileImage} alt={work.studentId.firstName} className="w-full h-full object-cover" />
                                  ) : (
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                  )}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="flex items-center justify-between">
                                      <h4 className="font-bold text-sm text-foreground truncate">
                                        {work.studentId.firstName} {work.studentId.lastName}
                                      </h4>
                                      <span className="text-[10px] text-muted-foreground font-medium">
                                        {new Date(work.submittedAt).toLocaleDateString('fr-FR')}
                                      </span>
                                   </div>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <p className="text-xs text-primary font-bold truncate">{work.exerciseName}</p>
                                      <div className="w-1 h-1 rounded-full bg-border" />
                                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{work.classId.name}</p>
                                   </div>
                               </div>
                               <Button asChild size="sm" className="rounded-xl h-8 px-4 text-[10px] font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                   <Link href={`/teacher/courses/${work.classId._id}/${work.subjectId._id}`}>Corriger</Link>
                               </Button>
                           </div>
                       </div>
                   ))
               )}
            </div>
          </section>
        </div>

        {/* Right Column: Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <section className="bg-card border border-border rounded-3xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Actions Rapides
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map(ql => {
                const Icon = ql.icon;
                return (
                  <Link
                    key={ql.href}
                    href={ql.href}
                    className="flex flex-col items-center gap-2 p-4 bg-muted/30 border border-border rounded-2xl hover:bg-primary/5 hover:border-primary/20 transition-all text-center group"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200", ql.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground">{ql.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Pending Alerts */}
          {(stats?.pendingGrading ?? 0) > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6 space-y-4"
              >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                      <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="font-bold text-amber-500">Corrections en attente</h3>
                      <p className="text-xs text-muted-foreground mt-1">Vous avez <span className="font-bold text-foreground">{stats?.pendingGrading}</span> copies à corriger.</p>
                  </div>
                  <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20">
                      <Link href="/teacher/grading">Commencer</Link>
                  </Button>
              </motion.div>
          )}

          {/* Tips / Info */}
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
              <BookOpen className="w-6 h-6 text-primary mb-3" />
              <h4 className="font-bold text-sm text-foreground">Astuce du jour</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Utilisez les séances en direct pour interagir avec vos étudiants et répondre à leurs questions en temps réel.
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'matin';
  if (h < 17) return 'après-midi';
  return 'soir';
}
