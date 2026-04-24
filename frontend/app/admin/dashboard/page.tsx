'use client';
import { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Video, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Clock,
  ChevronRight,
  MessageSquare,
  ArrowUpRight,
  Zap,
  Book,
  FileText,
  Plus,
  Send,
  Layout,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { getDashboardStats, getLiveAttendance } from '@/lib/api/admin';
import { useAuth } from '@/context/AuthContext';
import { AdminPageHeader } from '@/components/shared/AdminPageHeader';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  liveSessions: number;
  todayAttendanceRate: number;
  studentGrowth: number;
  recentUsers: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: string;
  }[];
  classDistribution: {
    name: string;
    count: number;
  }[];
  alerts: {
    pendingGrades: number;
    unassignedClasses: number;
    unpublishedSchedules: number;
  };
  contentStats: {
    courses: number;
    materials: number;
    quizzes: number;
  };
  recentAnnouncements: {
    _id: string;
    title: string;
    type: string;
    createdAt: string;
    isPublished: boolean;
  }[];
  recentSubmissions: {
    _id: string;
    studentId: { firstName: string; lastName: string };
    exerciseId: { title: string };
    status: string;
    createdAt: string;
  }[];
}

interface LiveSession {
  sessionId: string;
  title: string;
  class?: { name: string; code: string };
  subject?: { name: string };
  teacher?: { firstName: string; lastName: string };
  startedAt?: string;
  currentParticipants: number;
  meetingUrl: string;
}

const StatCard = ({ icon: Icon, label, value, color, delay, subValue }: { icon: React.ElementType; label: string; value: string | number; color: string; delay: number; subValue?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white group-hover:scale-105 transition-transform">{value}</p>
          {subValue && <span className="text-[10px] font-bold text-emerald-500">{subValue}</span>}
        </div>
      </div>
      <div className={cn("rounded-xl p-2.5 shadow-md", color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  </motion.div>
);

const QuickAction = ({ icon: Icon, label, href, color, iconColor = "text-white" }: { icon: React.ElementType; label: string; href: string; color: string; iconColor?: string }) => (
  <Link href={href} className="group">
    <div className="flex flex-col items-center gap-2">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg", color)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 text-center uppercase tracking-wider">{label}</span>
    </div>
  </Link>
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, live] = await Promise.allSettled([getDashboardStats(), getLiveAttendance()]);
        if (s.status === 'fulfilled') setStats(s.value);
        if (live.status === 'fulfilled') setLiveSessions(live.value || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-0 max-w-[1600px] mx-auto pb-10">
      <AdminPageHeader 
        title={`Bonjour, ${user?.firstName || 'Admin'} 👋`}
        subtitle="Aperçu global de l'écosystème"
        icon={Zap}
        iconColor="text-amber-500"
        className="mb-8"
        actions={
          <div className="hidden xl:flex items-center gap-6 mr-4">
            <div className="flex items-center gap-8">
                <QuickAction icon={Plus} label="Étudiant" href="/admin/users" color="bg-blue-500 shadow-blue-500/20" />
                <QuickAction icon={Send} label="Annonce" href="/admin/announcements" color="bg-purple-500 shadow-purple-500/20" />
                <QuickAction icon={CalendarDays} label="Planning" href="/admin/schedules" color="bg-emerald-500 shadow-emerald-500/20" />
                <div className="w-px h-10 bg-gray-100 dark:bg-white/10 mx-2" />
                <QuickAction icon={MessageSquare} label="Messages" href="/admin/messages" color="bg-gray-900 dark:bg-white shadow-gray-900/20" iconColor="text-white dark:text-gray-900" />
            </div>
          </div>
        }
      />

      {/* Main stats cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard 
          icon={Users} 
          label="Étudiants" 
          value={stats?.totalStudents ?? '0'} 
          subValue={stats?.studentGrowth ? `+${stats.studentGrowth} ce mois` : undefined}
          color="bg-gradient-to-tr from-blue-500 to-blue-600 shadow-blue-500/20" 
          delay={0.1} 
        />
        <StatCard icon={GraduationCap} label="Enseignants" value={stats?.totalTeachers ?? '0'} color="bg-gradient-to-tr from-purple-500 to-purple-600 shadow-purple-500/20" delay={0.2} />
        <StatCard icon={BookOpen} label="Classes" value={stats?.totalClasses ?? '0'} color="bg-gradient-to-tr from-emerald-500 to-emerald-600 shadow-emerald-500/20" delay={0.3} />
        <StatCard icon={Video} label="Sessions Direct" value={stats?.liveSessions ?? '0'} color="bg-gradient-to-tr from-rose-500 to-rose-600 shadow-rose-500/20" delay={0.4} />
        <StatCard
          icon={TrendingUp}
          label="Présence Hebdo"
          value={stats ? `${stats.todayAttendanceRate}%` : '0%'}
          color="bg-gradient-to-tr from-amber-500 to-amber-600 shadow-amber-500/20"
          delay={0.5}
        />
      </div>

      {/* Platform Content Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600">
              <Book size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Cours Total</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{stats?.contentStats?.courses ?? 0}</p>
            </div>
          </div>
          <ArrowUpRight className="text-blue-400" size={16} />
        </div>
        <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Supports</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{stats?.contentStats?.materials ?? 0}</p>
            </div>
          </div>
          <ArrowUpRight className="text-purple-400" size={16} />
        </div>
        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Quiz Actifs</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{stats?.contentStats?.quizzes ?? 0}</p>
            </div>
          </div>
          <ArrowUpRight className="text-emerald-400" size={16} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
            {/* Live sessions widget */}
            <motion.div 
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm"
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Sessions en cours ({liveSessions.length})</h2>
                    </div>
                </div>
                {liveSessions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                        <Video size={32} className="mx-auto text-gray-300 mb-2 opacity-50" />
                        <p className="text-xs text-gray-500 font-medium tracking-tight">Le campus est calme. Aucune session en direct pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {liveSessions.map((s: LiveSession) => (
                            <div key={s.sessionId} className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-black/20 hover:border-blue-500/50 transition-all group shadow-sm hover:shadow-md">
                                <div className="flex flex-col h-full">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{s.class?.name} — {s.subject?.name}</p>
                                        <p className="text-xs text-gray-500 font-medium mt-1">
                                            {s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : 'Enseignant non assigné'}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                                            <Activity className="h-3 w-3 animate-bounce" /> {s.currentParticipants} online
                                        </span>
                                        <a
                                            href={s.meetingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                        >
                                            Rejoindre <ChevronRight size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Announcements and Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Announcements Widget */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm"
                >
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Dernières Annonces</h2>
                        <Link href="/admin/announcements" className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">Voir tout</Link>
                    </div>
                    <div className="space-y-4">
                        {stats?.recentAnnouncements?.map((a: any) => (
                            <div key={a._id} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={cn(
                                        "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md tracking-wider",
                                        a.type === 'exam' ? "bg-amber-100 text-amber-700" :
                                        a.type === 'event' ? "bg-blue-100 text-blue-700" :
                                        "bg-purple-100 text-purple-700"
                                    )}>
                                        {a.type}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-medium">{new Date(a.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-500 transition-colors">{a.title}</p>
                            </div>
                        )) || (
                            <p className="text-center py-6 text-gray-400 text-[10px] italic">Aucune annonce récente.</p>
                        )}
                    </div>
                </motion.div>

                {/* Submissions Widget */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm"
                >
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Travaux Récents</h2>
                        <Link href="/admin/reports" className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">Rapports</Link>
                    </div>
                    <div className="space-y-4">
                        {stats?.recentSubmissions?.map((s: any) => (
                            <div key={s._id} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                                        {s.studentId.firstName} {s.studentId.lastName}
                                    </p>
                                    <p className="text-[9px] text-gray-500 truncate">{s.exerciseId.title}</p>
                                </div>
                                <span className="text-[8px] font-black text-gray-400 uppercase">{new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                        )) || (
                            <p className="text-center py-6 text-gray-400 text-[10px] italic">Aucun travail soumis.</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
             {/* Recent Users */}
             <motion.div 
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm flex flex-col"
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Nouveaux Membres</h2>
                    <Link href="/admin/users" className="text-blue-500 hover:text-blue-600 transition-colors">
                        <ArrowUpRight size={16} />
                    </Link>
                </div>
                <div className="space-y-3.5 flex-1">
                    {stats?.recentUsers?.map((u: any) => (
                        <div key={u._id} className="flex items-center gap-3 group">
                            <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm",
                                u.role === 'teacher' ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                            )}>
                                {u.firstName[0]}{u.lastName[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                    {u.firstName} {u.lastName}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-wider",
                                        u.role === 'teacher' ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                                    )}>
                                        {u.role}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-bold flex items-center gap-1">
                                        <Clock size={8} /> {new Date(u.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) || (
                        <p className="text-[10px] text-gray-400 py-4 italic text-center">Aucun utilisateur.</p>
                    )}
                </div>
                <Link href="/admin/users" className="mt-6 border-t border-gray-100 dark:border-white/5 pt-4 block">
                    <Button size="sm" variant="outline" className="w-full rounded-xl h-9 text-xs font-bold border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                        Gérer les utilisateurs
                    </Button>
                </Link>
             </motion.div>

            {/* Class distribution */}
            <motion.div 
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm"
            >
                <div className="mb-6">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Distribution des Classes</h2>
                    <p className="text-[11px] text-gray-500 font-medium lowercase italic">Top par effectif étudiant</p>
                </div>
                <div className="space-y-4">
                    {stats?.classDistribution?.map((item: any, idx: number) => {
                        const max = Math.max(...(stats?.classDistribution?.map((d: any) => d.count) || []), 1);
                        const percentage = (item.count / max) * 100;
                        return (
                            <div key={idx} className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                                    <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                                    <span className="text-blue-500">{item.count} élèves</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1 }}
                                        className={cn(
                                            "h-full rounded-full shadow-sm",
                                            idx === 0 ? "bg-blue-600" :
                                            idx === 1 ? "bg-purple-500" :
                                            idx === 2 ? "bg-emerald-500" :
                                            "bg-gray-400"
                                        )}
                                    />
                                </div>
                            </div>
                        );
                    }) || (
                        <p className="text-[11px] text-gray-400 text-center py-4 italic">Aucune donnée disponible.</p>
                    )}
                </div>
            </motion.div>

            {/* Quick Alerts */}
            <motion.div 
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20"
            >
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <h2 className="text-sm font-bold text-amber-900 dark:text-amber-400">Alertes Systéme</h2>
                </div>
                <div className="mt-4 space-y-3">
                    {!stats?.alerts || (stats.alerts.pendingGrades === 0 && stats.alerts.unassignedClasses === 0 && stats.alerts.unpublishedSchedules === 0) ? (
                        <p className="text-xs text-amber-800/80 dark:text-amber-500 font-medium italic">
                            Aucune alerte critique.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {stats.alerts.pendingGrades > 0 && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 bg-amber-100/50 dark:bg-amber-900/30 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                                    <div className="w-1 h-1 rounded-full bg-amber-600" />
                                    {stats.alerts.pendingGrades} notes à valider
                                </div>
                            )}
                            {stats.alerts.unassignedClasses > 0 && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 bg-amber-100/50 dark:bg-amber-900/30 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                                    <div className="w-1 h-1 rounded-full bg-amber-600" />
                                    {stats.alerts.unassignedClasses} classes sans profs
                                </div>
                            )}
                            {stats.alerts.unpublishedSchedules > 0 && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 bg-amber-100/50 dark:bg-amber-900/30 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                                    <div className="w-1 h-1 rounded-full bg-amber-600" />
                                    {stats.alerts.unpublishedSchedules} planning non publié
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
}
