'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Megaphone, Plus, Trash2, Calendar, Clock, 
  Play, Timer, Ban, Maximize2, Pin, ChevronRight
} from 'lucide-react';
import api from '@/lib/api/axios';
import { API_BASE_URL } from '@/lib/api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { TeacherPageHeader } from '@/components/teacher/TeacherPageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { CreateAnnouncementModal } from '@/components/teacher/CreateAnnouncementModal';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { Filter } from 'lucide-react';

interface Class { _id: string; name: string; code: string }

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  type: 'general' | 'assignment' | 'exam' | 'event' | 'reminder';
  isPinned: boolean;
  isPublished: boolean;
  publishAt?: string;
  expiresAt?: string;
  imageUrl?: string;
  createdAt: string;
  teacherId: string;
}

function getImageSrc(imageUrl: string): string {
  if (!imageUrl) return '';
  const s3Pattern = /https?:\/\/[^.]+\.s3\.[^.]+\.amazonaws\.com\/(.+)$/;
  const m = imageUrl.match(s3Pattern);
  if (m) {
    const key = m[1];
    return `${API_BASE_URL}/api/admin/announcements/image-proxy?key=${encodeURIComponent(key)}`;
  }
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'normal': return 'bg-blue-500 text-white';
    case 'low': return 'bg-slate-500 text-white';
    default: return 'bg-slate-500 text-white';
  }
};

const getStatus = (announcement: Announcement) => {
  if (!announcement.isPublished) return { label: 'Arrêté', color: 'bg-slate-200 text-slate-600', icon: Ban };
  
  const now = new Date();
  if (announcement.publishAt && isAfter(new Date(announcement.publishAt), now)) {
    return { label: 'Planifié', color: 'bg-amber-100 text-amber-600', icon: Clock };
  }
  
  if (announcement.expiresAt && isBefore(new Date(announcement.expiresAt), now)) {
    return { label: 'Expiré', color: 'bg-red-100 text-red-600', icon: Timer };
  }
  
  return { label: 'Actif', color: 'bg-emerald-100 text-emerald-600', icon: Play };
};

export default function AnnouncementsPage() {
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get('classId');

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const { user } = useAuth();

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/teacher/classes');
      const classList = res.data;
      setClasses(classList);

      if (classIdParam && classList.length > 0) {
        const target = classList.find((c: Class) => c._id === classIdParam);
        if (target) {
          setSelectedClass(target);
          fetchAnnouncements(target._id);
        }
      } else if (classList.length > 0) {
        setSelectedClass(classList[0]);
        fetchAnnouncements(classList[0]._id);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement des classes");
    } finally {
      setLoading(false);
    }
  }, [classIdParam]);

  const fetchAnnouncements = async (classId: string) => {
    setAnnouncementsLoading(true);
    try {
      const res = await api.get(`/api/teacher/announcements/${classId}`);
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement des annonces");
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    fetchAnnouncements(cls._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;
    try {
      await api.delete(`/api/teacher/announcements/${id}`);
      toast.success("Annonce supprimée");
      if (selectedClass) fetchAnnouncements(selectedClass._id);
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await api.patch(`/api/teacher/announcements/${id}/pin`);
      if (selectedClass) fetchAnnouncements(selectedClass._id);
    } catch (err) {
      toast.error("Erreur lors de la modification de l'épinglage");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <TeacherPageHeader
        title="Annonces"
        subtitle="Communiquez avec vos étudiants et gérez les mises à jour de vos classes."
        category="Communication"
        icon={Megaphone}
        actions={
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Annonce
          </Button>
        }
      />

      {/* Class tabs - Premium Style */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-2 rounded-2xl flex gap-2 flex-wrap items-center">
        <div className="px-3 py-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border-r border-border/50 mr-2">
          <ChevronRight className="w-3 h-3" />
          Filtrer par classe
        </div>
        {loading ? (
          <div className="flex gap-2 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-9 w-24 bg-muted rounded-xl" />)}
          </div>
        ) : (
          classes.map(cls => (
            <button
              key={cls._id}
              onClick={() => handleSelectClass(cls)}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                selectedClass?._id === cls._id 
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20" 
                  : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              {cls.name} ({cls.code})
            </button>
          ))
        )}
      </div>

      {/* Visibility Filters */}
      <div className="flex gap-2 items-center bg-card/30 p-1 rounded-xl w-fit border border-border/40">
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
            filter === 'all' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Toutes les annonces
        </button>
        <button
          onClick={() => setFilter('mine')}
          className={clsx(
            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
            filter === 'mine' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter className="w-3 h-3 text-primary" />
          Mes annonces
        </button>
      </div>

      <div className="grid gap-6">
        {announcementsLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Clock className="h-8 w-8 animate-spin text-primary opacity-20" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border shadow-inner flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full opacity-20">
              <Megaphone className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground font-bold text-lg">Aucune annonce pour cette classe</p>
              <p className="text-muted-foreground/60 text-sm">Cliquez sur le bouton ci-dessus pour publier votre première annonce.</p>
            </div>
            <Button variant="outline" onClick={() => setIsModalOpen(true)} className="rounded-xl font-bold mt-2">
              Créer une annonce
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {announcements
              .filter(ann => filter === 'all' || ann.teacherId === user?._id)
              .map((ann, i) => {
                const status = getStatus(ann);
                const StatusIcon = status.icon;
                const isOwner = ann.teacherId === user?._id;
                
                return (
                <motion.div 
                  key={ann._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className={clsx(
                    "bg-card rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group overflow-hidden relative flex flex-col md:flex-row",
                    !ann.isPublished && "opacity-70 grayscale-[0.3]",
                    ann.isPinned && "border-primary/30 ring-1 ring-primary/10"
                  )}>
                    {ann.isPinned && (
                      <div className="absolute top-0 right-10 bg-primary text-white p-1 px-3 rounded-b-xl shadow-sm z-10">
                        <Pin className="w-3 h-3" />
                      </div>
                    )}

                    {ann.imageUrl && (
                      <div className="md:w-72 w-full h-48 md:h-auto overflow-hidden relative group/img bg-muted">
                        <img 
                          src={getImageSrc(ann.imageUrl)} 
                          alt={ann.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                           <Maximize2 className="text-white h-6 w-6" />
                        </div>
                      </div>
                    )}

                    <div className="flex-1 p-6 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={clsx("rounded-lg h-6 px-3 text-[10px] font-black border-none", getPriorityColor(ann.priority))}>
                              {ann.priority.toUpperCase()}
                            </Badge>
                            <div className={clsx("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border capitalize shadow-sm", status.color)}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(ann.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                            {ann.title}
                          </h3>
                        </div>
                        
                        {isOwner && (
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleTogglePin(ann._id)}
                              className={clsx(
                                "rounded-xl h-10 w-10 transition-all",
                                ann.isPinned ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent"
                              )}
                              title={ann.isPinned ? "Désépingler" : "Épingler"}
                            >
                              <Pin className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(ann._id)}
                              className="rounded-xl h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground/80 text-sm mb-6 whitespace-pre-wrap leading-relaxed font-medium flex-1">
                        {ann.content}
                      </p>

                      <div className="flex flex-wrap items-center justify-between pt-5 border-t border-border/50 gap-4 mt-auto">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            <div className="p-1 px-2 bg-muted rounded-md text-foreground/70">TYPE</div>
                            <span className="text-foreground font-extrabold">{ann.type}</span>
                          </div>
                        </div>

                        {(ann.publishAt || ann.expiresAt) && (
                          <div className="flex items-center gap-3">
                            {ann.publishAt && (
                              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50">
                                <span className="uppercase tracking-widest opacity-60">Publié le:</span>
                                <span className="text-foreground/70 italic font-medium">{format(new Date(ann.publishAt), 'dd MMM yyyy', { locale: fr })}</span>
                              </div>
                            )}
                            {ann.expiresAt && (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50">
                                <span className="uppercase tracking-widest opacity-60">Expire:</span>
                                <span className="text-foreground/70 italic font-medium">{format(new Date(ann.expiresAt), 'dd MMM yyyy', { locale: fr })}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <CreateAnnouncementModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => selectedClass && fetchAnnouncements(selectedClass._id)}
        classes={classes}
        initialClassId={selectedClass?._id}
      />
    </div>
  );
}
