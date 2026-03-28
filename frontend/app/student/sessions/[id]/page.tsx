'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { DailyVideoRoom } from '@/components/video/DailyVideoRoom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
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
    classId?: { name: string };
  };
}

export default function StudentLiveSessionPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.post(`/sessions/${id}/token`);
        setData(res.data);
      } catch (err: any) {
        if (err.response?.data?.session?.status === 'scheduled') {
          setError('La session n\'a pas encore commencé. Revenez quand l\'enseignant la démarre.');
        } else {
          setError(err.response?.data?.message || 'Impossible de rejoindre la session.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#0a0a0a]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#222222] rounded-full" />
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <p className="text-white font-semibold">Connexion à la session...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-[#0a0a0a] p-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Impossible de rejoindre</h2>
          <p className="text-gray-400 max-w-sm">{error}</p>
        </div>
        <Link
          href="/student/video"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#222222] bg-[#111111] shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/student/video" className="text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold text-white">{data.session.title}</span>
            {data.session.classId && (
              <span className="text-xs text-gray-500 bg-[#222222] px-2 py-0.5 rounded-full">
                {data.session.classId.name}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
          ● En direct
        </span>
      </header>

      {/* Video Area */}
      <div className="flex-1 p-4 overflow-hidden">
        <DailyVideoRoom
          roomUrl={data.roomUrl}
          token={data.token}
          isOwner={false}
          sessionTitle={data.session.title}
          onLeave={() => router.push('/student/video')}
        />
      </div>
    </div>
  );
}
