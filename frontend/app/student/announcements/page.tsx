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
  Pin,
  Clock,
  User as UserIcon,
  Search,
  Filter,
  CheckCircle2,
  Trophy,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { PageHeader } from '../../../components/student/PageHeader';
import { cn } from '../../../lib/utils';

type AnnouncementType = 'all' | 'important' | 'class';

export default function StudentAnnouncementsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [filter, setFilter] = useState<AnnouncementType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/other/announcements');
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(a => {
    // Search filter
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Type filter
    if (filter === 'all') return true;
    if (filter === 'important') return a.priority === 'urgent' || a.priority === 'high' || a.isPinned;
    if (filter === 'class') return a.targetType === 'specific_classes' || a.classId;
    return true;
  });

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getIcon = (type: string, isPinned: boolean) => {
    if (isPinned) return <Pin className="w-5 h-5 fill-current" />;
    switch (type) {
      case 'assignment': return <FileText className="w-5 h-5" />;
      case 'exam': return <AlertCircle className="w-5 h-5" />;
      case 'event': return <Trophy className="w-5 h-5" />;
      case 'reminder': return <Clock className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Chargement des annonces...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <PageHeader 
        title="Tableau d'Affichage"
        description="Restez informé des dernières nouvelles de l'école et de vos classes."
        icon={Megaphone}
        badgeText="Annonces & Actualités"
        badgeClassName="bg-blue-500/10 border-blue-500/20 text-blue-500"
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white dark:bg-[#111111] p-4 rounded-2xl border border-gray-200 dark:border-[#222222] shadow-sm dark:shadow-none">
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#222222]">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  filter === 'all' 
                    ? "bg-white dark:bg-[#333333] text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilter('important')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  filter === 'important' 
                    ? "bg-white dark:bg-[#333333] text-red-600 dark:text-red-400 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Importantes
              </button>
              <button
                onClick={() => setFilter('class')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  filter === 'class' 
                    ? "bg-white dark:bg-[#333333] text-orange-600 dark:text-orange-400 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Ma Classe
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Rechercher une annonce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222222] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Announcements List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAnnouncements.map((announcement, index) => (
                <motion.div 
                  key={announcement._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "bg-white dark:bg-[#111111] border rounded-2xl p-5 sm:p-6 relative overflow-hidden group shadow-sm dark:shadow-none hover:border-blue-500/30 transition-all",
                    announcement.isPinned || announcement.priority === 'urgent' || announcement.priority === 'high' 
                      ? "border-red-500/20 dark:border-red-500/30" 
                      : "border-gray-200 dark:border-[#222222]"
                  )}
                >
                  {/* Priority Indicator Line */}
                  {(announcement.isPinned || announcement.priority === 'urgent') && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                  )}

                  <div className="flex items-start gap-4 sm:gap-6 relative z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                      getPriorityStyles(announcement.priority)
                    )}>
                      {getIcon(announcement.type, announcement.isPinned)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground dark:text-white line-clamp-1">
                          {announcement.title}
                        </h3>
                        {announcement.isPinned && (
                          <span className="text-[9px] uppercase tracking-widest font-black bg-blue-500 text-white px-2 py-0.5 rounded shadow-sm">
                            Épinglé
                          </span>
                        )}
                        {(announcement.priority === 'urgent' || announcement.priority === 'high') && (
                          <span className="text-[9px] uppercase tracking-widest font-black bg-red-500 text-white px-2 py-0.5 rounded shadow-sm">
                            Important
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm sm:text-base text-muted-foreground dark:text-gray-400 leading-relaxed mb-6 whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground dark:text-gray-500 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#222222]">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>
                            De : <span className="text-foreground dark:text-gray-300">
                              {announcement.teacherId ? `${announcement.teacherId.firstName} ${announcement.teacherId.lastName}` : 'Administration'}
                            </span>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground dark:text-gray-500 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#222222]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(announcement.createdAt).toLocaleDateString('fr-FR', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>

                        {announcement.classId && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 ml-auto">
                            <Filter className="w-3.5 h-3.5" />
                            <span>{announcement.classId.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredAnnouncements.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl p-16 text-center shadow-sm"
              >
                <div className="w-20 h-20 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Megaphone className="w-10 h-10 text-muted-foreground dark:text-gray-600 opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">Aucune annonce trouvée</h3>
                <p className="text-muted-foreground dark:text-gray-500 max-w-xs mx-auto">
                  {searchQuery 
                    ? `Aucun résultat pour "${searchQuery}". Essayez d'autres mots-clés.`
                    : "Il n'y a pas d'annonces disponibles pour le moment."}
                </p>
                {searchQuery && (
                  <Button 
                    variant="link" 
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-blue-500 font-bold"
                  >
                    Effacer la recherche
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group shadow-lg shadow-blue-500/5">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Bell size={120} className="text-blue-500" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground dark:text-white mb-2">Notifications Alertes</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6 leading-relaxed">
                Ne manquez aucune information importante. Les alertes urgentes sont également envoyées par email.
              </p>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 font-bold rounded-xl h-10">
                Gérer mes préférences
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Récapitulatif
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground dark:text-gray-400">Total Annonces</span>
                <span className="font-bold text-foreground dark:text-white">{announcements.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground dark:text-gray-400">Importantes</span>
                <span className="font-bold text-red-500">{announcements.filter(a => a.priority === 'urgent' || a.priority === 'high').length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground dark:text-gray-400">Épinglées</span>
                <span className="font-bold text-blue-500">{announcements.filter(a => a.isPinned).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
