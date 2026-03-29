'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSessionToken, endVideoSession, startVideoSession } from '@/lib/api/teacher';
import { DailyVideoRoom } from '@/components/video/DailyVideoRoom';
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  PhoneOff, 
  Shield, 
  Clock, 
  Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        setLoading(true);
        const sessionId = params.id as string;
        
        // 1. Get meeting token and room info
        const data = await getSessionToken(sessionId);
        setSessionData(data);
        
        // 2. If user is owner, mark session as 'live' automatically
        if (data.isOwner && data.session.status !== 'live') {
          await startVideoSession(sessionId);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to initialize call:', err);
        setError(err.response?.data?.message || err.message || 'Impossible de rejoindre la session');
        setLoading(false);
      }
    };

    if (params.id) {
        initCall();
    }
  }, [params.id]);

  const handleLeave = () => {
    router.push('/teacher/schedule');
  };

  const handleEndSession = async () => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette session pour tous les participants ?')) return;
    
    try {
      await endVideoSession(params.id as string);
      toast.success('Session terminée');
      router.push('/teacher/schedule');
    } catch (err) {
      toast.error('Erreur lors de la fermeture de la session');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-white/5 rounded-full" />
          <div className="w-20 h-20 border-4 border-violet-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Sécurisation de votre connexion...
          </p>
          <p className="text-zinc-500 text-sm">Préparation de votre salle de classe virtuelle</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold italic">Erreur de connexion</h1>
            <p className="text-zinc-400">{error}</p>
          </div>
          <Button 
            onClick={() => router.push('/teacher/schedule')}
            className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl h-12"
          >
            Retour au planning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header bar */}
      <header className="h-20 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-20">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLeave}
            className="rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white">{sessionData.session.title}</h1>
              {sessionData.isOwner && (
                <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                  Organisateur
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
               <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Classe: {sessionData.session.classId?.name || '...'}</span>
               <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Statut: <span className="text-emerald-500">Live</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {sessionData.isOwner && (
            <Button 
              onClick={handleEndSession}
              variant="destructive"
              className="rounded-xl h-11 bg-red-500 hover:bg-red-600 border-none px-6 font-semibold"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Terminer la session
            </Button>
          )}
          <Button 
            onClick={handleLeave}
            variant="ghost"
            className="rounded-xl h-11 bg-white/5 hover:bg-white/10 text-white px-6 border border-white/10"
          >
            Quitter
          </Button>
        </div>
      </header>

      {/* Main video area */}
      <main className="flex-1 relative p-4 lg:p-6 bg-zinc-950">
        <DailyVideoRoom 
          roomUrl={sessionData.roomUrl}
          token={sessionData.token}
          isOwner={sessionData.isOwner}
          sessionTitle={sessionData.session.title}
          onLeave={handleLeave}
        />
      </main>
    </div>
  );
}
