'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/axios';
import {
  Video, Calendar, Clock, Users, MonitorPlay, PlayCircle, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { useRouter } from 'next/navigation';

type TabType = 'upcoming' | 'recordings';

interface Session {
  _id: string;
  title: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduledStart: string;
  classId?: { name: string };
  teacherId?: { firstName: string; lastName: string };
  recording?: { isRecorded: boolean; recordingFile?: string; recordingDuration?: number };
}

export default function StudentVideoSessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await api.get('/sessions');
        setSessions(res.data);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const upcoming = sessions.filter(s => s.status === 'scheduled' || s.status === 'live');
  const recordings = sessions.filter(s => s.status === 'ended' && s.recording?.isRecorded);

  const getStatusConfig = (status: string) => {
    if (status === 'live') return { label: 'En direct', className: 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse' };
    return { label: 'Planifié', className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium w-fit"
          >
            <MonitorPlay className="w-4 h-4" />
            <span>Visioconférences</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Cours en Direct</h1>
          <p className="text-gray-400 max-w-xl">
            Rejoignez vos cours en direct et revoyez les enregistrements des sessions passées.
          </p>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#222222] rounded-3xl overflow-hidden shadow-xl">
        {/* Tabs */}
        <div className="flex p-4 border-b border-[#222222] gap-4 bg-[#0a0a0a]">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              "px-6 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2",
              activeTab === 'upcoming'
                ? "bg-[#222222] text-white shadow border border-[#333333]"
                : "text-gray-500 hover:text-gray-300 hover:bg-[#151515]"
            )}
          >
            <Video className="w-4 h-4" />
            Sessions à venir
            <span className={cn(
              "ml-2 px-2 py-0.5 rounded-full text-xs",
              activeTab === 'upcoming' ? "bg-indigo-500 text-white" : "bg-[#222222] text-gray-400"
            )}>
              {upcoming.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={cn(
              "px-6 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2",
              activeTab === 'recordings'
                ? "bg-[#222222] text-white shadow border border-[#333333]"
                : "text-gray-500 hover:text-gray-300 hover:bg-[#151515]"
            )}
          >
            <PlayCircle className="w-4 h-4" />
            Enregistrements
            <span className={cn(
              "ml-2 px-2 py-0.5 rounded-full text-xs",
              activeTab === 'recordings' ? "bg-indigo-500 text-white" : "bg-[#222222] text-gray-400"
            )}>
              {recordings.length}
            </span>
          </button>
        </div>

        <div className="p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'upcoming' ? (
              <motion.div
                key="upcoming"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {upcoming.length === 0 ? (
                  <div className="text-center p-12 text-gray-500 border border-dashed border-[#333333] rounded-2xl">
                    <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Aucune session vidéo prévue pour le moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {upcoming.map(session => {
                      const statusCfg = getStatusConfig(session.status);
                      const canJoin = session.status === 'live';
                      return (
                        <div key={session._id} className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-2xl p-6 flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-[#222222] px-2 py-1 rounded">
                                {session.classId?.name || 'Classe'}
                              </span>
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1.5 border ${statusCfg.className}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                {statusCfg.label}
                              </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 leading-tight">{session.title}</h3>
                            {session.teacherId && (
                              <p className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {session.teacherId.firstName} {session.teacherId.lastName}
                              </p>
                            )}

                            <div className="space-y-2 mb-6">
                              {session.scheduledStart && (
                                <>
                                  <div className="flex items-center gap-3 text-sm text-gray-300 bg-[#222222] p-3 rounded-xl border border-[#333333]">
                                    <Calendar className="w-4 h-4 text-indigo-400" />
                                    {new Date(session.scheduledStart).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-300 bg-[#222222] p-3 rounded-xl border border-[#333333]">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    {new Date(session.scheduledStart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <Button
                            onClick={() => canJoin && router.push(`/student/sessions/${session._id}`)}
                            disabled={!canJoin}
                            className={cn(
                              "w-full font-bold h-12 rounded-xl transition-all shadow-lg",
                              canJoin
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                                : "bg-[#222222] text-gray-500 border border-[#333333] cursor-not-allowed"
                            )}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            {canJoin ? 'Rejoindre maintenant' : 'Pas encore démarré'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="recordings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {recordings.length === 0 ? (
                  <div className="text-center p-12 text-gray-500 border border-dashed border-[#333333] rounded-2xl">
                    <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Aucun enregistrement disponible.</p>
                    <p className="text-xs mt-2 text-gray-600">Les enregistrements apparaissent ici après la fin d'une session.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {recordings.map(rec => (
                      <div key={rec._id} className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-2xl overflow-hidden group hover:border-[#444444] transition-all">
                        <div className="aspect-video relative bg-gradient-to-br from-[#222222] to-[#111111] flex items-center justify-center border-b border-[#2b2b2b]">
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-2xl">
                              <PlayCircle className="w-8 h-8 text-white ml-1" />
                            </div>
                          </div>
                          <MonitorPlay className="w-12 h-12 text-[#333333]" />
                          {rec.recording?.recordingDuration && (
                            <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-md">
                              {Math.round(rec.recording.recordingDuration / 60)}m
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-[#222222] px-2 py-0.5 rounded">
                              {rec.classId?.name || 'Classe'}
                            </span>
                          </div>
                          <h3 className="font-bold text-white mb-1 group-hover:text-teal-400 transition-colors line-clamp-2">{rec.title}</h3>
                          {rec.teacherId && (
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                              <span>{rec.teacherId.firstName} {rec.teacherId.lastName}</span>
                              <span>{new Date(rec.scheduledStart).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
