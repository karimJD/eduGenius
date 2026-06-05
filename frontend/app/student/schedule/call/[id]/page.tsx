'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSessionToken } from '@/lib/api/teacher';
import { DailyVideoRoom } from '@/components/video/DailyVideoRoom';
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Clock, 
  Users,
  Maximize2,
  Minimize2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function StudentVideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const initCall = async () => {
      try {
        setLoading(true);
        const sessionId = params.id as string;
        
        // 1. Get meeting token and room info
        // We use the same API as teachers because the backend handles role-based token properties
        const data = await getSessionToken(sessionId);
        setSessionData(data);
        
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
    router.push('/student/schedule');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-white/5 rounded-full" />
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Connexion à la salle de classe...
          </p>
          <p className="text-zinc-500 text-sm">Préparation de votre environnement d'apprentissage</p>
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
            onClick={() => router.push('/student/schedule')}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-xl h-12 font-bold uppercase tracking-widest text-xs"
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
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                Étudiant
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
               <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Classe: {sessionData.session.classId?.name || '...'}</span>
               <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Statut: <span className="text-emerald-500 animate-pulse">Live</span></span>
            </div>
          </div>
        </div>

          <Button
            onClick={toggleFullscreen}
            variant="ghost"
            className="rounded-xl h-11 bg-white/5 hover:bg-white/10 text-white px-4 border border-white/10 flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'Quitter Plein Écran' : 'Plein Écran'}
          </Button>
          <Button 
            onClick={handleLeave}
            variant="ghost"
            className="rounded-xl h-11 bg-white/5 hover:bg-white/10 text-white px-6 border border-white/10 font-bold uppercase tracking-widest text-[10px]"
          >
            Quitter le cours
          </Button>
        </div>
      </header>

      {/* Main video area */}
      <main className="flex-1 relative p-4 lg:p-6 bg-zinc-950">
        <DailyVideoRoom 
          roomUrl={sessionData.roomUrl}
          token={sessionData.token}
          isOwner={false}
          sessionTitle={sessionData.session.title}
          onLeave={handleLeave}
        />
      </main>
    </div>
  );
}
