'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Megaphone, PlusCircle, Pin, Trash2, X, ChevronDown, AlertCircle, Info
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Class { _id: string; name: string; code: string }
interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: string;
  type: string;
  isPinned: boolean;
  createdAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-500 bg-red-500/10 border-red-500/20',
  high:   'text-orange-500 bg-orange-500/10 border-orange-500/20',
  normal: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  low:    'text-muted-foreground bg-muted border-border',
};

export default function AnnouncementsPage() {
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get('classId');

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal', type: 'general', isPinned: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/teacher/classes');
        const classList = res.data;
        setClasses(classList);

        if (classIdParam && classList.length > 0) {
          const target = classList.find((c: Class) => c._id === classIdParam);
          if (target) {
            selectClass(target);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [classIdParam]);

  const selectClass = async (cls: Class) => {
    setSelectedClass(cls);
    const r = await api.get(`/teacher/announcements/${cls._id}`).catch(() => ({ data: [] }));
    setAnnouncements(r.data);
  };

  const post = async () => {
    if (!selectedClass || !form.title || !form.content) return;
    setSaving(true);
    try {
      await api.post(`/teacher/announcements/${selectedClass._id}`, form);
      await selectClass(selectedClass);
      setForm({ title: '', content: '', priority: 'normal', type: 'general', isPinned: false });
      setCreating(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const togglePin = async (id: string) => {
    await api.patch(`/teacher/announcements/${id}/pin`);
    if (selectedClass) selectClass(selectedClass);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/teacher/announcements/${id}`);
    if (selectedClass) selectClass(selectedClass);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">Post announcements and updates for your students.</p>
        </div>
        {selectedClass && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
            <PlusCircle className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {/* Class tabs */}
      {loading ? <div className="flex gap-2">{[1, 2, 3].map(i => <div key={i} className="h-9 w-28 bg-muted rounded-full animate-pulse" />)}</div> :
        <div className="flex gap-2 flex-wrap">
          {classes.map(cls => (
            <button key={cls._id} onClick={() => selectClass(cls)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedClass?._id === cls._id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}>
              {cls.name}
            </button>
          ))}
        </div>
      }

      {/* Compose form */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">New Announcement</h3>
              <button onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Title *"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Content *" rows={4}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            <div className="flex items-center gap-3">
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm">
                <option value="low">Low Priority</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm">
                <option value="general">General</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="event">Event</option>
                <option value="reminder">Reminder</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))}
                  className="accent-primary" />
                Pin
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCreating(false)} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm">Cancel</button>
              <button onClick={post} disabled={saving || !form.title || !form.content}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
                {saving ? 'Posting...' : 'Post'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements list */}
      {selectedClass ? (
        announcements.length === 0 ? (
          <div className="py-14 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No announcements yet</p>
            <p className="text-sm mt-1">Click "New Announcement" to post one for {selectedClass.name}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann, i) => (
              <motion.div key={ann._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className={`p-5 bg-card border rounded-2xl space-y-2 ${ann.isPinned ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ann.isPinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />}
                        <p className="font-semibold text-foreground">{ann.title}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[ann.priority]}`}>
                          {ann.priority}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {ann.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => togglePin(ann._id)}
                        className={`p-1.5 rounded-lg transition-colors ${ann.isPinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-accent'}`}>
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(ann._id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="py-14 text-center text-muted-foreground">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select a class to view or create announcements.</p>
        </div>
      )}
    </div>
  );
}
