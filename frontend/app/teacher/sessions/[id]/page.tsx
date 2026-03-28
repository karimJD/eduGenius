'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { DailyVideoRoom } from '@/components/video/DailyVideoRoom';
import {
  Users, Radio, Clock, ArrowLeft, StopCircle, Loader2
} from 'lucide-react';
import Link from 'next/link';

interface SessionData {
  token: string;
  roomUrl: string;
  roomName: string;
  isOwner: boolean;
  session: {
    _id: string;
    title: string;
    status: string;
    classId?: { name: string; code: string };
  };
}

interface Participant {
  userId: string;
  userName: string;
  role: string;
  joinedAt: string;
}

export default function TeacherLiveSessionPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Get token + room info
        const tokenRes = await api.post(`/sessions/${id}/token`);
        setData(tokenRes.data);

        // Mark as live if scheduled
        if (tokenRes.data.session.status === 'scheduled') {
          await api.put(`/sessions/${id}/start`);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to join session');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleEndSession = async () => {
    if (!confirm('End this session for everyone?')) return;
    setEnding(true);
    try {
      await api.put(`/sessions/${id}/end`);
      router.push('/teacher/sessions');
    } catch (err) {
      console.error(err);
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-border rounded-full" />
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <p className="text-foreground font-semibold">Démarrage de la session...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-400 text-lg font-semibold">{error || 'Session introuvable'}</p>
        <Link href="/teacher/sessions" className="flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour aux sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/teacher/sessions" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold text-foreground">{data.session.title}</span>
            {data.session.classId && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {data.session.classId.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{participants.length} participants</span>
          </div>
          <button
            onClick={handleEndSession}
            disabled={ending}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
            Terminer la session
          </button>
        </div>
      </header>

      {/* Main Video Area */}
      <div className="flex-1 p-4 overflow-hidden">
        <DailyVideoRoom
          roomUrl={data.roomUrl}
          token={data.token}
          isOwner={data.isOwner}
          sessionTitle={data.session.title}
          onLeave={() => router.push('/teacher/sessions')}
        />
      </div>
    </div>
  );
}
