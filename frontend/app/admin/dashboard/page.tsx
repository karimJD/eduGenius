'use client';
import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, Video, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { getDashboardStats, getLiveAttendance } from '@/lib/api/admin';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  liveSessions: number;
  todayAttendanceRate: number;
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

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </div>
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
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

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de Bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de l'établissement</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} label="Étudiants" value={stats?.totalStudents ?? '—'} color="bg-blue-500" />
        <StatCard icon={GraduationCap} label="Enseignants" value={stats?.totalTeachers ?? '—'} color="bg-violet-500" />
        <StatCard icon={BookOpen} label="Classes" value={stats?.totalClasses ?? '—'} color="bg-emerald-500" />
        <StatCard icon={Video} label="Sessions en direct" value={stats?.liveSessions ?? '—'} color="bg-rose-500" />
        <StatCard
          icon={TrendingUp}
          label="Présence aujourd'hui"
          value={stats ? `${stats.todayAttendanceRate}%` : '—'}
          color="bg-amber-500"
        />
      </div>

      {/* Live sessions widget */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          <h2 className="font-semibold">Sessions en cours ({liveSessions.length})</h2>
        </div>
        {liveSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune session active pour le moment.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveSessions.map((s) => (
              <div key={s.sessionId} className="rounded-xl border border-border p-4">
                <p className="font-medium">{s.class?.name} — {s.subject?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : ''}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3" /> {s.currentParticipants} participants
                  </span>
                  <a
                    href={s.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20"
                  >
                    Rejoindre
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="font-semibold text-amber-800 dark:text-amber-400">Alertes</h2>
        </div>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-500">
          Consultez les conflits d'emploi du temps et les taux de présence faibles dans les sections dédiées.
        </p>
      </div>
    </div>
  );
}
