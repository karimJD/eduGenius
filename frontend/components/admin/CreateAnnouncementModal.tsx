'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { createAnnouncement, getClasses } from '@/lib/api/admin';
import { toast } from 'sonner';
import { Megaphone, Users, Calendar, Clock, Check, Infinity, Image as ImageIcon, X, Upload } from 'lucide-react';
import clsx from 'clsx';

interface Cls {
  _id: string;
  name: string;
  code: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAnnouncementModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Cls[]>([]);
  const [keepRunning, setKeepRunning] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetType: 'all' as 'all' | 'all_students' | 'all_teachers' | 'specific_classes',
    targetClasses: [] as string[],
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    type: 'general' as 'general' | 'assignment' | 'exam' | 'event' | 'reminder',
    publishAt: '',
    expiresAt: '',
    isPinned: false,
  });

  useEffect(() => {
    if (isOpen) {
      getClasses().then(data => setClasses(Array.isArray(data) ? data : data.classes || []));
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setFormData(p => ({ ...p, publishAt: now.toISOString().slice(0, 16) }));
    } else {
      resetForm();
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image valide");
        return;
      }
      // Revoke previous object URL to free memory
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('targetType', formData.targetType);
      data.append('targetClasses', JSON.stringify(formData.targetClasses));
      data.append('priority', formData.priority);
      data.append('type', formData.type);
      data.append('isPinned', String(formData.isPinned));
      data.append('publishAt', formData.publishAt);
      data.append('expiresAt', keepRunning ? 'null' : formData.expiresAt);
      
      if (imageFile) {
        data.append('image', imageFile);
      }

      await createAnnouncement(data);
      toast.success('Annonce créée avec succès');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Erreur lors de la création de l'annonce");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      targetType: 'all',
      targetClasses: [],
      priority: 'normal',
      type: 'general',
      publishAt: '',
      expiresAt: '',
      isPinned: false,
    });
    setKeepRunning(true);
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const toggleClass = (id: string) => {
    setFormData(prev => ({
      ...prev,
      targetClasses: prev.targetClasses.includes(id)
        ? prev.targetClasses.filter(c => c !== id)
        : [...prev.targetClasses, id]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-0">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black">
              <div className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                <Megaphone className="h-6 w-6" />
              </div>
              Nouvelle Annonce
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider opacity-60">Titre de l'annonce</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Changement d'horaire ou Rappel d'examen"
                    value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    required
                    className="rounded-xl border-muted bg-white/50 backdrop-blur-sm focus:ring-primary shadow-sm h-12 text-base font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider opacity-60">Message détaillé</Label>
                  <textarea
                    id="content"
                    rows={6}
                    placeholder="Saisissez votre message ici..."
                    className="w-full rounded-2xl border border-muted bg-white/50 backdrop-blur-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm resize-none font-medium"
                    value={formData.content}
                    onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Image (Optionnel)</Label>
                  {imagePreview ? (
                    <div className="relative group rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg aspect-video bg-muted cursor-pointer">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className={clsx(
                          "w-full h-full object-cover transition-all duration-500",
                          loading ? "scale-105 blur-[2px] opacity-50" : "group-hover:scale-105"
                        )}
                        onClick={() => !loading && fileInputRef.current?.click()}
                      />
                      
                      {/* Submission loading overlay */}
                      {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-[1px] z-40">
                          <div className="relative">
                            <div className="h-12 w-12 rounded-full border-4 border-primary/20 animate-ping absolute inset-0" />
                            <div className="h-12 w-12 rounded-full border-4 border-t-primary border-transparent animate-spin relative" />
                          </div>
                          <span className="mt-4 text-xs font-black text-primary animate-pulse tracking-[0.2em] uppercase">
                            Transfert en cours...
                          </span>
                        </div>
                      )}

                      {/* Hover overlay */}
                      {!loading && (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="flex flex-col items-center gap-2 text-white">
                            <Upload className="h-6 w-6" />
                            <span className="text-xs font-bold font-inter tracking-wide">Changer l'image</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={loading}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className={clsx(
                          "absolute top-3 right-3 p-2 bg-destructive text-white rounded-full shadow-xl transition-all z-50 flex items-center justify-center border-2 border-white/20",
                          loading ? "opacity-0 scale-0" : "hover:scale-110 active:scale-95"
                        )}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-white/30 cursor-pointer hover:bg-white/50 hover:border-primary/50 transition-all group"
                    >
                      <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold">Cliquez pour ajouter une image</p>
                        <p className="text-[10px] text-muted-foreground">PNG, JPG, formats web supportés (max 5MB)</p>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>

              <div className="space-y-6 bg-muted/30 p-5 rounded-3xl border border-border/50">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Configuration</Label>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Priorité</Label>
                    <select
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium"
                      value={formData.priority}
                      onChange={e => setFormData(p => ({ ...p, priority: e.target.value as any }))}
                    >
                      <option value="low">Basse</option>
                      <option value="normal">Normale</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Type d'annonce</Label>
                    <select
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium"
                      value={formData.type}
                      onChange={e => setFormData(p => ({ ...p, type: e.target.value as any }))}
                    >
                      <option value="general">Général</option>
                      <option value="assignment">Devoir</option>
                      <option value="exam">Examen</option>
                      <option value="event">Événement</option>
                      <option value="reminder">Rappel</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Label className="text-xs font-bold">Épingler en haut</Label>
                    <Switch 
                      checked={formData.isPinned} 
                      onCheckedChange={(val) => setFormData(p => ({ ...p, isPinned: val }))}
                      className="scale-75 origin-right"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 space-y-4 font-inter">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Planification</Label>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Début
                    </Label>
                    <Input
                      type="datetime-local"
                      className="rounded-xl text-xs h-9 px-2"
                      value={formData.publishAt}
                      onChange={e => setFormData(p => ({ ...p, publishAt: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-2">
                        <Infinity className="h-3 w-3" /> Illimitée
                      </Label>
                      <Switch 
                        checked={keepRunning} 
                        onCheckedChange={setKeepRunning}
                        className="scale-75 origin-right"
                      />
                    </div>
                    
                    {!keepRunning && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-xs font-bold flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Fin
                        </Label>
                        <Input
                          type="datetime-local"
                          className="rounded-xl text-xs h-9 px-2"
                          value={formData.expiresAt}
                          onChange={e => setFormData(p => ({ ...p, expiresAt: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-white/50 p-6 rounded-3xl border border-border/50 shadow-sm">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <Users className="h-4 w-4" /> Ciblage de l'audience
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'all', label: 'Tout le monde' },
                  { id: 'all_students', label: 'Tous les étudiants' },
                  { id: 'all_teachers', label: 'Tous les profs' },
                  { id: 'specific_classes', label: 'Classes spécifiques' },
                ].map(target => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, targetType: target.id as any }))}
                    className={clsx(
                      "px-3 py-3 rounded-2xl text-[10px] font-bold transition-all border text-center leading-tight h-full flex items-center justify-center",
                      formData.targetType === target.id
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                        : "bg-white text-muted-foreground border-border hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    {target.label}
                  </button>
                ))}
              </div>

              {formData.targetType === 'specific_classes' && (
                <div className="mt-4 p-4 bg-primary/5 rounded-2xl space-y-3 border border-primary/10 animate-in zoom-in-95 duration-300">
                  <Label className="text-[10px] uppercase tracking-wider font-extrabold text-primary opacity-70">Sélectionner les classes cibles ({formData.targetClasses.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {classes.map(c => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => toggleClass(c._id)}
                        className={clsx(
                          "flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold border transition-all",
                          formData.targetClasses.includes(c._id)
                            ? "bg-primary border-primary text-white shadow-sm"
                            : "bg-white border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <span className="truncate">{c.code}</span>
                        {formData.targetClasses.includes(c._id) && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-6 pb-6 pr-6">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl font-bold h-12 px-6">
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="rounded-xl px-12 h-12 shadow-xl shadow-primary/20 font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]">
                {loading ? 'Publication...' : 'Publier maintenant'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
