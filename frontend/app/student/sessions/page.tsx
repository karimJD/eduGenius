'use client';

import { useEffect, useState } from 'react';
import { 
  Video, 
  Calendar, 
  Clock, 
  Play,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function StudentSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await api.get('/sessions');
        setSessions(res.data);
      } catch (error) {
        console.error('Failed to fetch student sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleJoinSession = async (session: any) => {
    try {
      // Mark attendance
      await api.post('/attendance/auto', { 
        videoSessionId: session._id,
        classId: session.classId?._id || session.classId 
      });
      // Open meeting link
      window.open(session.meetingLink, '_blank');
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      // Still open the link even if attendance fails
      window.open(session.meetingLink, '_blank');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <header className="space-y-1">
        <h1 className="text-4xl font-black text-white tracking-tighter">Mes Cours en Direct</h1>
        <p className="text-gray-500 font-medium">Rejoins tes professeurs pour des sessions d'apprentissage interactives.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sessions List */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">Sessions à Venir</h2>
            
            {sessions.length === 0 && !loading && (
                <div className="py-20 bg-white/5 border border-white/10 rounded-3xl text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-400">
                        <Video size={30} />
                    </div>
                    <p className="text-gray-400 font-medium">Aucun cours en direct programmé pour le moment.</p>
                </div>
            )}

            <div className="space-y-4">
                {sessions.map((session, index) => (
                    <motion.div 
                        key={session._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 group hover:bg-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                        <div className="flex gap-6 items-center">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex flex-col items-center justify-center text-blue-400">
                                <span className="text-xs font-black uppercase">{new Date(session.scheduledAt).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                <span className="text-xl font-bold">{new Date(session.scheduledAt).getDate()}</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{session.title}</h3>
                                <div className="flex items-center gap-3 text-xs text-gray-500 font-bold">
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {session.classId?.name}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(session.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                             {session.status === 'live' ? (
                                <Button 
                                    onClick={() => handleJoinSession(session)}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 px-8 flex gap-2 font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                >
                                    <PlayCircle className="w-5 h-5" /> Rejoindre le Live
                                </Button>
                             ) : (
                                <Button disabled className="bg-white/5 text-gray-500 rounded-xl h-11 px-8 flex gap-2 font-bold cursor-not-allowed">
                                    <Lock className="w-4 h-4" /> Bientôt disponible
                                </Button>
                             )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Sidebar - Tips & Stats */}
        <div className="space-y-6">
            <section className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-3xl p-8 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" /> Préparation
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">Assure-toi d'avoir une bonne connexion internet et teste ton micro avant de rejoindre la session.</p>
                <div className="pt-4 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-500 uppercase">Prochain Cours</span>
                        <span className="text-blue-400">Dans 2 heures</span>
                    </div>
                </div>
            </section>

             <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> Ton Assiduité
                </h3>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white">92%</span>
                    <span className="text-xs text-green-500 font-bold mb-1.5">+2% ce mois</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[92%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                </div>
                <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-wider">Tu es parmi les 5% les plus assidus de ta classe ! 🏆</p>
            </section>
        </div>
      </div>
    </div>
  );
}

// Add Users import since I used it but missed in block
import { Users as UsersIcon } from 'lucide-react';
function Users({ className }: { className?: string }) {
    return <UsersIcon className={className} />;
}
