'use client';

import { useEffect, useState } from 'react';
import { 
  Video, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Play,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function TeacherSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    scheduledAt: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sessionsRes, classesRes] = await Promise.all([
          api.get('/sessions'),
          api.get('/classes')
        ]);
        setSessions(sessionsRes.data);
        setClasses(classesRes.data);
      } catch (error) {
        console.error('Failed to fetch sessions data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/sessions', formData);
      setSessions([res.data, ...sessions]);
      setIsCreateModalOpen(false);
      setFormData({ title: '', description: '', classId: '', scheduledAt: '' });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Live Sessions</h1>
          <p className="text-gray-500 font-medium">Manage and host your interactive video classes.</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-6 flex gap-2 font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                <Plus className="w-5 h-5" /> Programmer une Session
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-white/10 text-white rounded-3xl sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Video className="text-blue-500" /> Nouvelle Session Live
                </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSession} className="space-y-5 py-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Titre de la séance</label>
                    <Input 
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="ex: Introduction à l'Algorithmique" 
                        className="bg-white/5 border-white/10 rounded-xl h-12"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Classe concernée</label>
                    <select 
                        required
                        value={formData.classId}
                        onChange={(e) => setFormData({...formData, classId: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-3 text-sm text-gray-300 focus:ring-blue-500/40"
                    >
                        <option value="">Sélectionner une classe</option>
                        {classes.map(cls => (
                            <option key={cls._id} value={cls._id}>{cls.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date et Heure</label>
                    <Input 
                        required
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                        className="bg-white/5 border-white/10 rounded-xl h-12 text-gray-300"
                    />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-blue-600/20">
                    Confirmer la Programmation
                </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.length === 0 && !loading && (
            <div className="col-span-full py-20 bg-white/5 border border-white/10 border-dashed rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-white/5 rounded-full text-gray-500">
                    <Video size={40} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Aucune session programmée</h3>
                    <p className="text-sm text-gray-500 font-medium">Commence par programmer ton premier cours en direct.</p>
                </div>
            </div>
        )}

        <AnimatePresence>
            {sessions.map((session, index) => (
                <motion.div 
                    key={session._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col"
                >
                    <div className="p-6 flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                                session.status === 'live' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                                {session.status === 'live' ? '● En Direct' : '● Programmé'}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>

                        <div>
                            <h3 className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors truncate">{session.title}</h3>
                            <p className="text-xs text-gray-500 font-bold mt-1 uppercase">{session.classId?.name}</p>
                        </div>

                        <div className="space-y-2 pt-2">
                           <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                <Calendar className="w-3.5 h-3.5" /> 
                                {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(session.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                    </div>

                    <div className="p-4 bg-black/40 border-t border-white/5">
                        <Button 
                            onClick={() => window.open(session.meetingLink, '_blank')}
                            className="w-full bg-white/5 hover:bg-white/10 text-white rounded-xl flex gap-2 font-bold"
                        >
                            <Play className="w-4 h-4 fill-current" /> Lancer la Séance
                        </Button>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
