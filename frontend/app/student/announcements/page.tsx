'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/axios';
import {
  Bell,
  Megaphone,
  Calendar,
  AlertCircle,
  FileText,
  Pin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

export default function StudentAnnouncementsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'important' | 'class'>('all');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        // Using existing /student/classes endpoint to get enrolled classes
        // then fetching announcements for those classes if needed, or 
        // we can assume a simplified /student/announcements route exists
        // Since we didn't specify a dedicated student announcement route in backend earlier,
        // let's fetch classes, then fetch announcements for each class.
        // Actually, looking at the implementation plan, we proposed:
        // "Fetch from real API: /api/student/announcements or via class routes"
        
        // Let's try the direct route first, if it fails, fallback to class routes.
        // For EduGenius, let's fetch classes first, then announcements per class.
        const classesRes = await api.get('/student/classes');
        const classes = classesRes.data?.data || [];
        
        const allAnnouncements = [];
        for (const cls of classes) {
           try {
             const annRes = await api.get(`/teacher/announcements/${cls._id}`);
             // Add class context to each announcement
             const anns = annRes.data.map((a: any) => ({ ...a, className: cls.name }));
             allAnnouncements.push(...anns);
           } catch(e) { /* ignore individual class errors */ }
        }
        
        // Sort by pinned first, then by date desc
        allAnnouncements.sort((a, b) => {
           if (a.isPinned && !b.isPinned) return -1;
           if (!a.isPinned && b.isPinned) return 1;
           return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setAnnouncements(allAnnouncements);
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'important') return a.type === 'important' || a.isPinned;
    if (filter === 'class') return a.type === 'class';
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
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
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium w-fit"
          >
            <Megaphone className="w-4 h-4" />
            <span>Annonces & Actualités</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Tableau d'Affichage</h1>
          <p className="text-gray-400 max-w-xl">
             Restez informé des dernières nouvelles de l'école et de vos classes.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
           {/* Filters */}
           <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar">
             <Button
               onClick={() => setFilter('all')}
               className={cn("rounded-full px-6 transition-all", filter === 'all' ? "bg-white text-black hover:bg-gray-200" : "bg-[#111111] text-gray-400 hover:text-white border border-[#222222]")}
             >
               Toutes
             </Button>
             <Button
               onClick={() => setFilter('important')}
               className={cn("rounded-full px-6 transition-all", filter === 'important' ? "bg-red-500 text-white hover:bg-red-600" : "bg-[#111111] text-gray-400 hover:text-white border border-[#222222]")}
             >
               Importantes
             </Button>
             <Button
               onClick={() => setFilter('class')}
               className={cn("rounded-full px-6 transition-all", filter === 'class' ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-[#111111] text-gray-400 hover:text-white border border-[#222222]")}
             >
               Classes
             </Button>
           </div>

           {/* Announcements List */}
           <div className="space-y-4">
              <AnimatePresence>
                 {filteredAnnouncements.map((announcement, index) => (
                    <motion.div 
                       key={announcement._id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.05 }}
                       className={cn(
                          "bg-[#111111] border rounded-2xl p-6 relative overflow-hidden group",
                          announcement.isPinned || announcement.priority === 'urgent' || announcement.priority === 'high' ? "border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.05)]" : "border-[#222222]"
                       )}
                    >
                       {/* Background decoration for important announcements */}
                       {(announcement.isPinned || announcement.priority === 'urgent' || announcement.priority === 'high') && (
                          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />
                       )}

                       <div className="flex items-start gap-5 relative z-10">
                          <div className={cn(
                             "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                             announcement.priority === 'urgent' || announcement.priority === 'high' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                             announcement.type === 'assignment' || announcement.type === 'exam' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                             "bg-gray-800 border-gray-700 text-gray-300"
                          )}>
                             {announcement.isPinned ? <Pin className="w-5 h-5 fill-current" /> : <Bell className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                                   {announcement.title}
                                </h3>
                                {announcement.priority === 'urgent' || announcement.priority === 'high' && (
                                   <span className="text-[10px] uppercase tracking-wider font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
                                      Urgent
                                   </span>
                                )}
                             </div>
                             <p className="text-gray-400 leading-relaxed mb-4">
                                {announcement.content}
                             </p>
                             <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(announcement.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                <span>•</span>
                                <span>De : <span className="text-gray-300">{announcement.author}</span></span>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 ))}
                 
                 {filteredAnnouncements.length === 0 && (
                    <div className="bg-[#111111] border border-[#222222] rounded-2xl p-12 text-center text-gray-500">
                       <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-20" />
                       <p>Aucune annonce pour le moment.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
           <div className="bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                 <Bell size={100} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 relative z-10">Notifications SMS</h3>
              <p className="text-sm text-gray-400 mb-4 relative z-10">
                 Recevez les alertes urgentes (fermeture, absences profs) directement sur votre téléphone.
              </p>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 relative z-10">
                 Activer les alertes
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
