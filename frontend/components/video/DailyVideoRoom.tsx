'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, Users, MessageSquare, Loader2, AlertCircle
} from 'lucide-react';

interface DailyVideoRoomProps {
  roomUrl: string;
  token: string;
  isOwner: boolean;
  sessionTitle: string;
  onLeave?: () => void;
}

export function DailyVideoRoom({ roomUrl, token, isOwner, sessionTitle, onLeave }: DailyVideoRoomProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build the Daily.co embed URL with the meeting token and desired parameters
  const embedUrl = (() => {
    try {
      const url = new URL(roomUrl);
      url.searchParams.set('t', token);
      url.searchParams.set('showLeaveButton', 'true');
      url.searchParams.set('showFullscreenButton', 'true');
      if (isOwner) {
        url.searchParams.set('isSharingScreen', 'false');
      }
      return url.toString();
    } catch {
      setError('Invalid room URL');
      return '';
    }
  })();

  useEffect(() => {
    // Listen for messages from the Daily.co iframe (leave event)
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.action === 'left-meeting' || e.data.action === 'error') {
        onLeave?.();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLeave]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-zinc-950 rounded-2xl border border-red-500/20">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px] bg-zinc-950 rounded-2xl overflow-hidden border border-white/10">
      {/* Loading overlay */}
      {!iframeLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 z-10">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-white font-semibold text-lg">{sessionTitle}</p>
          <p className="text-zinc-400 text-sm">Connexion à la session en cours...</p>
        </div>
      )}

      {/* Daily.co embedded iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
        className="w-full h-full border-0"
        style={{ minHeight: '600px' }}
        onLoad={() => setIframeLoaded(true)}
        title={sessionTitle}
      />
    </div>
  );
}
