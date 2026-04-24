'use client';

import { useEffect, useState } from 'react';
import {
  Video, PlusCircle, Calendar, Clock, Users, Play,
  Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface Session {
  _id: string;
  title: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduledStart: string;
  meetingUrl?: string;
  classId?: { _id: string; name: string; code: string };
  participants?: { studentId: string }[];
}

interface Class { _id: string; name: string; code: string }

const STATUS_STYLES: Record<string, string> = {
  live:      'bg-red-500/20 text-red-500',
  scheduled: 'bg-blue-500/20 text-blue-400',
  ended:     'bg-green-500/20 text-green-500',
  cancelled: 'bg-muted text-muted-foreground',
};

import { TeacherPageHeader } from '@/components/teacher/TeacherPageHeader';
import { Button } from '@/components/ui/button';

export default function TeacherSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', classId: '', scheduledStart: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        api.get('/sessions'),
        api.get('/teacher/classes'),
      ]);
      setSessions(sRes.data);
      setClasses(cRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/sessions', form);
      setOpen(false);
      setForm({ title: '', description: '', classId: '', scheduledStart: '' });
      load();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <TeacherPageHeader
        title="Sessions Live"
        subtitle="Planifiez et gérez vos cours interactifs en vidéo."
        category="Direct"
        icon={Video}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-lg shadow-primary/20">
                <PlusCircle className="w-4 h-4 mr-2" />
                Planifier une Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Video className="w-5 h-5 text-primary" /> Nouvelle Session Live
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={create} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Titre</label>
                  <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="ex: Introduction aux Algorithmes"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description optionnelle"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Classe</label>
                  <select required value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Sélectionner une classe</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date & Heure</label>
                  <input required type="datetime-local" value={form.scheduledStart}
                    onChange={e => setForm(p => ({ ...p, scheduledStart: e.target.value }))}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <Button type="submit" disabled={saving} className="w-full py-6 rounded-xl font-bold">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {saving ? 'Création de la salle Daily.co...' : 'Planifier la Session'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />


      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl flex flex-col items-center">
          <Video className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-medium text-lg">No sessions scheduled</p>
          <p className="text-sm mt-1">Schedule your first live session to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sessions.map((session, i) => (
              <motion.div key={session._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:border-primary/30 transition-all group">
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[session.status]}`}>
                      {session.status === 'live' ? '● Live' : session.status}
                    </span>
                    {session.classId && (
                      <span className="text-xs text-muted-foreground font-medium">{session.classId.code}</span>
                    )}
                  </div>

                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{session.title}</h3>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {session.scheduledStart && (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {new Date(session.scheduledStart).toLocaleDateString([], {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {new Date(session.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </>
                    )}
                    {session.participants && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        {session.participants.length} participants
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-border p-4">
                  <button
                    onClick={() => router.push(`/teacher/sessions/${session._id}`)}
                    disabled={session.status === 'ended' || session.status === 'cancelled'}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {session.status === 'live' ? 'Rejoindre' : session.status === 'ended' ? 'Terminée' : 'Lancer la session'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
