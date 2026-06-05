'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSessionToken, endVideoSession, startVideoSession, saveRecording } from '@/lib/api/teacher';
import { DailyVideoRoom } from '@/components/video/DailyVideoRoom';
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  PhoneOff, 
  Shield, 
  Clock, 
  Users,
  Video,
  VideoOff,
  Upload,
  Maximize2,
  Minimize2
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

  // --- Recording state ---
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Use a ref so uploadRecording always has the latest sessionData (avoids stale closure)
  const sessionDataRef = useRef<any>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        setLoading(true);
        const sessionId = params.id as string;
        
        // 1. Get meeting token and room info
        const data = await getSessionToken(sessionId);
        setSessionData(data);
        sessionDataRef.current = data;
        
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
    // Stop recording if active before leaving
    if (isRecording) handleStopRecording(false);
    router.push('/teacher/schedule');
  };

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
        // @ts-ignore — Chrome-specific hint to prefer current tab
        preferCurrentTab: true,
      });
      streamRef.current = stream;
      recordedChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        if (recordedChunksRef.current.length === 0) return;
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        await uploadRecording(blob);
      };

      recorder.start(1000); // collect data every second
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
      toast.success('Enregistrement démarré');

      // Auto-stop if user closes the screen share dialog
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      };
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toast.error("Impossible de démarrer l'enregistrement");
      }
    }
  }, []);

  const handleStopRecording = useCallback((showToast = true) => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (showToast) toast.info("Traitement de l'enregistrement...");
  }, []);

  const uploadRecording = useCallback(async (blob: Blob) => {
    const currentSession = sessionDataRef.current;
    if (!currentSession?.session?._id) {
      console.error('uploadRecording: sessionData not available');
      return;
    }
    setIsSaving(true);
    try {
      const result = await saveRecording(currentSession.session._id, blob);
      toast.success(`Enregistrement sauvegardé dans "${result.chapterTitle}"`);
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde de l'enregistrement");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, []); // no deps — uses ref instead

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndSession = async () => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette session pour tous les participants ?')) return;
    
    // If recording is active, stop it — upload will happen via recorder.onstop before redirect
    if (isRecording && mediaRecorderRef.current?.state === 'recording') {
      toast.info("Arrêt de l'enregistrement avant de terminer la session...");
      // Stop recording; onstop will call uploadRecording, then we navigate after
      mediaRecorderRef.current.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        if (recordedChunksRef.current.length > 0) {
          const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          await uploadRecording(blob);
        }
        try {
          await endVideoSession(params.id as string);
        } catch {}
        router.push('/teacher/schedule');
      };
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

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
            <>
              {/* Recording button */}
              {isRecording ? (
                <Button
                  onClick={() => handleStopRecording()}
                  className="rounded-xl h-11 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 font-semibold flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  REC {formatDuration(recordingDuration)}
                  <VideoOff className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleStartRecording}
                  disabled={isSaving}
                  className="rounded-xl h-11 bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/50 text-zinc-300 hover:text-violet-300 px-4 font-semibold flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Enregistrer
                </Button>
              )}
              <Button 
                onClick={handleEndSession}
                variant="destructive"
                className="rounded-xl h-11 bg-red-500 hover:bg-red-600 border-none px-6 font-semibold"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                Terminer la session
              </Button>
            </>
          )}
          <Button
            onClick={toggleFullscreen}
            variant="ghost"
            className="rounded-xl h-11 bg-white/5 hover:bg-white/10 text-white px-4 border border-white/10 flex items-center gap-2 font-semibold"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'Quitter Plein Écran' : 'Plein Écran'}
          </Button>
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
          sessionId={sessionData.session._id}
          onLeave={handleLeave}
        />
      </main>

      {/* Upload overlay */}
      {isSaving && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-4">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full mx-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-violet-400 animate-bounce" />
            </div>
            <div className="text-center">
              <p className="font-bold text-white text-lg">Sauvegarde en cours...</p>
              <p className="text-zinc-400 text-sm mt-1">L'enregistrement est uploadé vers le serveur</p>
            </div>
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          </div>
        </div>
      )}
    </div>
  );
}
