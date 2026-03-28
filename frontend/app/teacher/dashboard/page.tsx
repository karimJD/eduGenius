'use client';

import { useEffect, useState } from 'react';
import {
  Users, BookOpen, Video, ClipboardList, CheckSquare,
  Calendar, Megaphone, ChevronRight, TrendingUp, Clock,
  Plus, Pin, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  getDashboardStats, 
  getUpcomingSessions, 
  getRecentAnnouncements 
} from '@/lib/api/teacher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Stats {
  totalClasses: number;
  totalStudents: number;
  totalAssessments: number;
  pendingGrading: number;
  upcomingSessions: number;
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
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, sessionsData, announcementsData] = await Promise.all([
          getDashboardStats(),
          getUpcomingSessions(),
          getRecentAnnouncements()
        ]);
        
        setStats(statsData);
        setSessions(sessionsData);
        setAnnouncements(announcementsData);
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
    { label: 'Évaluations', value: stats?.totalAssessments, icon: ClipboardList, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Corrections', value: stats?.pendingGrading, icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const quickLinks = [
    { href: '/teacher/quizzes/new', label: 'Créer Quiz', icon: Plus, color: 'bg-primary/10 text-primary' },
    { href: '/teacher/schedule', label: 'Mon Planning', icon: Calendar, color: 'bg-blue-500/10 text-blue-500' },
    { href: '/teacher/grading', label: 'Corriger', icon: CheckSquare, color: 'bg-amber-500/10 text-amber-500' },
    { href: '/teacher/announcements', label: 'Annoncer', icon: Megaphone, color: 'bg-purple-500/10 text-purple-500' },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Bonjour,{' '}
            <span className="text-primary">{user?.firstName}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">Voici un aperçu de vos activités d'aujourd'hui.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="rounded-xl">
                <Link href="/teacher/schedule">Voir Planning</Link>
            </Button>
            <Button className="rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Cours
            </Button>
        </div>
      </header>

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
                    <Button size="sm" variant="secondary" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Détails
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Announcements */}
          <section className="bg-card border border-border rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" /> Annonces Récentes
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground hover:text-primary">
                <Link href="/teacher/announcements">Gérer</Link>
              </Button>
            </div>

            <div className="space-y-4">
               {loading ? (
                   [1, 2].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)
               ) : announcements.length === 0 ? (
                   <div className="py-12 text-center bg-muted/30 border border-dashed border-border rounded-2xl">
                        <Megaphone className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Aucune annonce publiée</p>
                   </div>
               ) : (
                   announcements.map(ann => (
                       <div key={ann._id} className="p-4 border border-border rounded-2xl space-y-3 hover:border-primary/30 transition-colors relative group">
                           {ann.isPinned && (
                               <Pin className="w-3.5 h-3.5 text-primary absolute top-4 right-4 fill-primary" />
                           )}
                           <div className="flex items-start justify-between gap-4">
                               <div className="space-y-1">
                                   <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm text-foreground">{ann.title}</h4>
                                        <span className={cn(
                                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                                            ann.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                                            ann.priority === 'high' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
                                        )}>
                                            {ann.priority}
                                        </span>
                                   </div>
                                   <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                               </div>
                           </div>
                           <div className="flex items-center justify-between pt-2 border-t border-border/50">
                               <div className="flex items-center gap-3">
                                   <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                                       <Calendar className="w-3 h-3" />
                                       {new Date(ann.createdAt).toLocaleDateString()}
                                   </span>
                                   {ann.classId && (
                                       <Badge variant="secondary" className="text-[9px] font-bold py-0">{ann.classId.name}</Badge>
                                   )}
                               </div>
                               <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold">Voir</Button>
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
