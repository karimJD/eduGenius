'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, PlusCircle, Trash2, Eye, EyeOff, BookOpen,
  Link as LinkIcon, ChevronDown, ChevronUp, Edit2, Check, X
} from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';

interface Material { _id: string; name: string; type: string; url: string }
interface Chapter { _id: string; title: string; order: number; isPublished?: boolean; materials: Material[] }
interface Course { _id: string; title: string; chapters: Chapter[]; classId?: { _id: string; name: string } }

export default function CourseEditorPage() {
  const { classId } = useParams<{ classId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Record<string, { name: string; url: string; type: string }>>({});
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const load = () =>
    api.get(`/teacher/courses/${classId}`)
      .then(r => { setCourse(r.data); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, [classId]);

  const addChapter = async () => {
    if (!newChapterTitle.trim()) return;
    await api.post(`/teacher/courses/${classId}/chapters`, { title: newChapterTitle });
    setNewChapterTitle('');
    setAddingChapter(false);
    load();
  };

  const deleteChapter = async (chId: string) => {
    if (!confirm('Delete this chapter and all its materials?')) return;
    await api.delete(`/teacher/courses/${classId}/chapters/${chId}`);
    load();
  };

  const togglePublish = async (chId: string) => {
    await api.patch(`/teacher/courses/${classId}/chapters/${chId}/publish`);
    load();
  };

  const saveChapterTitle = async (chId: string) => {
    await api.put(`/teacher/courses/${classId}/chapters/${chId}`, { title: editTitle });
    setEditingChapter(null);
    load();
  };

  const addMaterial = async (chId: string) => {
    const m = newMaterial[chId];
    if (!m?.name || !m?.url) return;
    await api.post(`/teacher/courses/${classId}/chapters/${chId}/materials`, {
      name: m.name,
      url: m.url,
      type: m.type || 'link',
    });
    setNewMaterial(prev => ({ ...prev, [chId]: { name: '', url: '', type: 'link' } }));
    load();
  };

  const deleteMaterial = async (chId: string, mId: string) => {
    await api.delete(`/teacher/courses/${classId}/chapters/${chId}/materials/${mId}`);
    load();
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/courses" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{course?.title || 'Course Materials'}</h1>
          {course?.classId && <p className="text-sm text-muted-foreground">{course.classId.name}</p>}
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-3">
        {(course?.chapters || []).map((ch) => (
          <div key={ch._id} className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Chapter header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => setExpanded(p => ({ ...p, [ch._id]: !p[ch._id] }))}
                className="text-muted-foreground hover:text-foreground">
                {expanded[ch._id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {editingChapter === ch._id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-1 text-sm" />
                  <button onClick={() => saveChapterTitle(ch._id)} className="text-green-500"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingChapter(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <span className="flex-1 font-medium text-foreground">{ch.title}</span>
              )}
              <div className="flex items-center gap-2">
                {!editingChapter && (
                  <button onClick={() => { setEditingChapter(ch._id); setEditTitle(ch.title); }}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => togglePublish(ch._id)}
                  className={`p-1.5 rounded-lg hover:bg-accent ${ch.isPublished ? 'text-green-500' : 'text-muted-foreground'}`}
                  title={ch.isPublished ? 'Unpublish' : 'Publish'}>
                  {ch.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => deleteChapter(ch._id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {expanded[ch._id] && (
              <div className="border-t border-border px-4 pb-4 space-y-3 pt-3">
                {/* Materials */}
                {ch.materials.map(m => (
                  <div key={m._id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
                    <LinkIcon className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <a href={m.url} target="_blank" rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary truncate block">{m.url}</a>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">{m.type}</span>
                    <button onClick={() => deleteMaterial(ch._id, m._id)}
                      className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add material form */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Material name" value={newMaterial[ch._id]?.name || ''}
                      onChange={e => setNewMaterial(p => ({ ...p, [ch._id]: { ...(p[ch._id] || {}), name: e.target.value } }))}
                      className="px-3 py-2 bg-background border border-border rounded-xl text-sm" />
                    <select value={newMaterial[ch._id]?.type || 'link'}
                      onChange={e => setNewMaterial(p => ({ ...p, [ch._id]: { ...(p[ch._id] || {}), type: e.target.value } }))}
                      className="px-3 py-2 bg-background border border-border rounded-xl text-sm">
                      <option value="link">Link</option>
                      <option value="pdf">PDF</option>
                      <option value="video">Video</option>
                      <option value="doc">Document</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input placeholder="URL (https://...)" value={newMaterial[ch._id]?.url || ''}
                      onChange={e => setNewMaterial(p => ({ ...p, [ch._id]: { ...(p[ch._id] || {}), url: e.target.value } }))}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm" />
                    <button onClick={() => addMaterial(ch._id)}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add chapter */}
      {addingChapter ? (
        <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
          <BookOpen className="w-4 h-4 text-primary shrink-0" />
          <input
            autoFocus
            value={newChapterTitle}
            onChange={e => setNewChapterTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addChapter()}
            placeholder="Chapter title..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <button onClick={addChapter} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
            Add
          </button>
          <button onClick={() => setAddingChapter(false)} className="p-1.5 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button onClick={() => setAddingChapter(true)}
          className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-border rounded-2xl text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
          <PlusCircle className="w-4 h-4" /> Add Chapter
        </button>
      )}
    </div>
  );
}
