'use client';
import { useEffect, useState } from 'react';
import { getLiveAttendance, endSession } from '@/lib/api/admin';
import { Activity, Clock, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveSession {
  sessionId: string;
  title: string;
  class?: { name: string; code: string };
  subject?: { name: string; code: string };
  teacher?: { firstName: string; lastName: string };
  startedAt?: string;
  currentParticipants: number;
  meetingUrl: string;
}

export default function LiveAttendancePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const data = await getLiveAttendance();
      setSessions(data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleEnd = async (id: string) => {
    if (!confirm('Terminer cette session et calculer la présence ?')) return;
    setEnding(id);
    try {
      await endSession(id);
      fetchSessions();
    } catch { alert('Erreur lors de la terminaison de la session'); } finally { setEnding(null); }
  };

  const getDuration = (startedAt?: string) => {
    if (!startedAt) return '—';
    const diff = Math.round((Date.now() - new Date(startedAt).getTime()) / 60000);
    return `${diff} min`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <span className="relative h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            Surveillance en Direct
          </h1>
          <p className="text-muted-foreground">{sessions.length} session(s) active(s) · actualisation auto toutes les 10s</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions}>Rafraîchir</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <span className="mr-2 animate-spin">⟳</span> Chargement...
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Video className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucune session en cours</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sessions.map(session => (
            <div key={session.sessionId} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{session.class?.name}</h3>
                  <p className="text-sm text-muted-foreground">{session.subject?.name}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                  <Activity className="h-3 w-3" /> En direct
                </span>
              </div>

              {/* Info */}
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{session.currentParticipants} participant(s) actif(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Durée : {getDuration(session.startedAt)}</span>
                </div>
                {session.teacher && (
                  <p>Enseignant : {session.teacher.firstName} {session.teacher.lastName}</p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg border border-border py-2 text-center text-sm hover:bg-muted"
                >
                  Rejoindre
                </a>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEnd(session.sessionId)}
                  disabled={ending === session.sessionId}
                >
                  {ending === session.sessionId ? '...' : 'Terminer'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
