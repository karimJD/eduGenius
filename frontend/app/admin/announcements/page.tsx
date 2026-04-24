'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Megaphone, Plus, Trash2, Calendar, Users, 
  ChevronRight, AlertCircle, Clock, Filter,
  Pause, Play, Timer, Ban, Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/shared/AdminPageHeader';
import { getAnnouncements, deleteAnnouncement, toggleAnnouncementStatus } from '@/lib/api/admin';
import { API_BASE_URL } from '@/lib/api/axios';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CreateAnnouncementModal } from '@/components/admin/CreateAnnouncementModal';
import { toast } from 'sonner';
import clsx from 'clsx';

/** Convert an imageUrl to a displayable src.
 *  - S3 URLs  → routed through /api/admin/announcements/image-proxy?key=...
 *  - Relative  → prefixed with API_BASE_URL
 *  - Other     → returned as-is
 */
function getImageSrc(imageUrl: string): string {
  const s3Pattern = /https?:\/\/[^.]+\.s3\.[^.]+\.amazonaws\.com\/(.+)$/;
  const m = imageUrl.match(s3Pattern);
  if (m) {
    const key = m[1];
    return `${API_BASE_URL}/api/admin/announcements/image-proxy?key=${encodeURIComponent(key)}`;
  }
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  teacherId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  targetType: 'all_students' | 'all_teachers' | 'specific_classes' | 'all';
  targetClasses?: { name: string; code: string }[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  type: 'general' | 'assignment' | 'exam' | 'event' | 'reminder';
  isPublished: boolean;
  publishAt?: string;
  expiresAt?: string;
  imageUrl?: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnnouncements();
      const list = data.announcements || [];
      console.log('[Announcements] Fetched', list.length, 'announcements');
      list.forEach((a: Announcement) => {
        console.log(`[Announcements] id=${a._id} imageUrl=${a.imageUrl ?? 'null'}`);
      });
      setAnnouncements(list);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des annonces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;
    try {
      await deleteAnnouncement(id);
      toast.success("Annonce supprimée");
      fetchAnnouncements();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAnnouncementStatus(id, !currentStatus);
      toast.success(!currentStatus ? "Annonce reprise" : "Annonce arrêtée");
      fetchAnnouncements();
    } catch (err) {
      toast.error("Erreur lors du changement de statut");
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

  const getTargetLabel = (announcement: Announcement) => {
    switch (announcement.targetType) {
      case 'all': return 'Tout le monde';
      case 'all_students': return 'Tous les étudiants';
      case 'all_teachers': return 'Tous les professeurs';
      case 'specific_classes': 
        return announcement.targetClasses?.map(c => c.code).join(', ') || 'Classes spécifiques';
      default: return 'Général';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-slate-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Annonces" 
        subtitle="Gérez les communications de l'établissement"
        icon={Megaphone}
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="rounded-xl px-5 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Annonce
          </Button>
        }
      />

      <div className="grid gap-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Clock className="h-8 w-8 animate-spin text-primary opacity-20" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border shadow-inner">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <p className="text-muted-foreground font-medium">Aucune annonce trouvée</p>
            <Button variant="link" onClick={() => setIsModalOpen(true)} className="font-bold">Créer votre première annonce</Button>
          </div>
        ) : (
          announcements.map((announcement) => {
            const status = getStatus(announcement);
            const StatusIcon = status.icon;
            
            return (
              <div key={announcement._id} className={clsx(
                "bg-card rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group overflow-hidden relative flex flex-col md:flex-row",
                !announcement.isPublished && "opacity-70 grayscale-[0.3]"
              )}>
                {!announcement.isPublished && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-400" />
                )}
                
                {announcement.imageUrl && !announcement.imageUrl.includes('mock-s3-bucket') && (() => {
                  const src = getImageSrc(announcement.imageUrl!);
                  console.log(`[Announcements] Rendering image for id=${announcement._id} src=${src}`);
                  return (
                    <div className="md:w-64 w-full h-48 md:h-auto overflow-hidden relative group/img bg-muted">
                      <img 
                        src={src} 
                        alt={announcement.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                        onLoad={() => console.log(`[Announcements] Image LOADED OK for id=${announcement._id}`)}
                        onError={(e) => {
                          console.error(`[Announcements] Image FAILED for id=${announcement._id} src=${src}`);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                         <Maximize2 className="text-white h-6 w-6" />
                      </div>
                    </div>
                  );
                })()}

                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={clsx("rounded-lg h-6 px-3 text-[10px] font-black border-none", getPriorityColor(announcement.priority))}>
                          {announcement.priority.toUpperCase()}
                        </Badge>
                        <div className={clsx("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border capitalize shadow-sm", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(announcement.createdAt), 'dd/MM/yy à HH:mm')}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-foreground tracking-tight">{announcement.title}</h3>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleStatus(announcement._id, announcement.isPublished)}
                        className={clsx(
                          "rounded-xl h-10 w-10 transition-all",
                          announcement.isPublished ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                        )}
                        title={announcement.isPublished ? "Arrêter l'annonce" : "Reprendre l'annonce"}
                      >
                        {announcement.isPublished ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(announcement._id)}
                        className="rounded-xl h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground/80 text-sm mb-6 line-clamp-3 leading-relaxed font-medium flex-1">
                    {announcement.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between pt-5 border-t border-border/50 gap-4 mt-auto">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <div className="p-1 px-2 bg-muted rounded-md text-foreground/70">CIBLE</div>
                        <span className="text-foreground font-extrabold">{getTargetLabel(announcement)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <div className="p-1 px-2 bg-muted rounded-md text-foreground/70">AUTEUR</div>
                        <span className="text-foreground font-extrabold whitespace-nowrap">{announcement.teacherId.firstName} {announcement.teacherId.lastName}</span>
                      </div>
                    </div>

                    {(announcement.publishAt || announcement.expiresAt) && (
                      <div className="flex items-center gap-3 ml-auto">
                        {announcement.publishAt && (
                          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50">
                            <span className="uppercase tracking-widest opacity-60">Début:</span>
                            <span className="text-foreground/70 italic font-medium">{format(new Date(announcement.publishAt), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                          </div>
                        )}
                        {announcement.expiresAt && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50">
                            <span className="uppercase tracking-widest opacity-60">Fin:</span>
                            <span className="text-foreground/70 italic font-medium">{format(new Date(announcement.expiresAt), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreateAnnouncementModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchAnnouncements}
      />
    </div>
  );
}
