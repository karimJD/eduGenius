'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, PlusCircle, Trash2, Eye, EyeOff, BookOpen,
  Check, X, Edit2, FileText, Video, File, Folder, FolderOpen,
  ClipboardList, GraduationCap, Users, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TeacherPageHeader } from '@/components/teacher/TeacherPageHeader';
import { Button } from '@/components/ui/button';

interface Material { _id: string; name: string; type: string; url: string; uploadedAt?: string; dueDate?: string; }
interface Chapter { _id: string; title: string; order: number; isPublished?: boolean; materials: Material[]; exercises: Material[] }
interface Submission { _id: string; studentId: { firstName: string; lastName: string; email: string; profilePicture?: string }; fileName: string; fileUrl: string; submittedAt: string; exerciseId: string; grade?: number; feedback?: string; }
interface Course { _id: string; title: string; chapters: Chapter[]; classId?: { _id: string; name: string }; subjectId?: { _id: string; name: string; code: string } }

const resolveMediaUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('.amazonaws.com/')) {
    try {
      const parsedUrl = new URL(url);
      const key = parsedUrl.pathname.substring(1); // Remove leading slash
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      return `${backendUrl}/admin/announcements/image-proxy?key=${encodeURIComponent(key)}`;
    } catch (e) {
      return url;
    }
  }
  if (url.startsWith('/uploads')) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const serverUrl = backendUrl.replace('/api', '');
    return `${serverUrl}${url}`;
  }
  return url;
};

export default function CourseEditorPage() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState<Record<string, boolean>>({});
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [showActivityChooser, setShowActivityChooser] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [uploadingChapterId, setUploadingChapterId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'cours' | 'exos'>('cours');
  const [uploadProgress, setUploadProgress] = useState(0);

  // New states for due dates and grading
  const [settingDueDateFor, setSettingDueDateFor] = useState<{chId: string, exId: string} | null>(null);
  const [dueDateInput, setDueDateInput] = useState('');
  
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState<number | ''>('');
  const [feedbackInput, setFeedbackInput] = useState('');
  
  // State for previewing files (PDF/Video) in a premium immersive modal
  const [previewItem, setPreviewItem] = useState<{ _id: string; name: string; url: string; type: string } | null>(null);

  const load = () =>
    api.get(`/teacher/courses/${classId}?subjectId=${subjectId}`)
      .then(r => { setCourse(r.data); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, [classId, subjectId]);

  const addChapter = async () => {
    if (!newChapterTitle.trim()) return;
    await api.post(`/teacher/courses/${classId}/chapters?subjectId=${subjectId}`, { title: newChapterTitle });
    setNewChapterTitle('');
    setAddingChapter(false);
    load();
  };

  const deleteChapter = async (chId: string) => {
    if (!confirm('Delete this section and all its contents?')) return;
    await api.delete(`/teacher/courses/${classId}/chapters/${chId}?subjectId=${subjectId}`);
    load();
  };

  const togglePublish = async (chId: string) => {
    await api.patch(`/teacher/courses/${classId}/chapters/${chId}/publish?subjectId=${subjectId}`);
    load();
  };

  const saveChapterTitle = async (chId: string) => {
    await api.put(`/teacher/courses/${classId}/chapters/${chId}?subjectId=${subjectId}`, { title: editTitle });
    setEditingChapter(null);
    load();
  };

  const loadSubmissions = async (chId: string) => {
    setLoadingSubmissions(p => ({ ...p, [chId]: true }));
    try {
      const { data } = await api.get(`/teacher/courses/${classId}/chapters/${chId}/submissions?subjectId=${subjectId}`);
      setSubmissions(p => ({ ...p, [chId]: data }));
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(p => ({ ...p, [chId]: false }));
    }
  };

  const toggleSubmissions = (chId: string, exId: string) => {
    if (!submissions[chId] && !loadingSubmissions[chId]) {
      loadSubmissions(chId);
    }
    setExpandedExercises(p => ({ ...p, [exId]: !p[exId] }));
  };

  const uploadFile = async (chId: string, file: File) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.split('.')[0]); 

    setUploadProgress(10);

    const endpoint = uploadType === 'cours' 
      ? `/teacher/courses/${classId}/chapters/${chId}/upload?subjectId=${subjectId}`
      : `/teacher/courses/${classId}/chapters/${chId}/exercises/upload?subjectId=${subjectId}`;

    try {
      const progressInt = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 500);

      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      clearInterval(progressInt);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadingChapterId(null);
        setUploadProgress(0);
        load();
      }, 500);
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.error || 'Failed to upload file.');
      setUploadingChapterId(null);
      setUploadProgress(0);
    }
  };

  const deleteMaterial = async (chId: string, mId: string) => {
    await api.delete(`/teacher/courses/${classId}/chapters/${chId}/materials/${mId}?subjectId=${subjectId}`);
    load();
  };

  const deleteExercise = async (chId: string, exId: string) => {
    await api.delete(`/teacher/courses/${classId}/chapters/${chId}/exercises/${exId}?subjectId=${subjectId}`);
    load();
  };

  const saveDueDate = async () => {
    if (!settingDueDateFor || !dueDateInput) return;
    await api.patch(`/teacher/courses/${classId}/chapters/${settingDueDateFor.chId}/exercises/${settingDueDateFor.exId}/due-date?subjectId=${subjectId}`, { dueDate: dueDateInput });
    setSettingDueDateFor(null);
    setDueDateInput('');
    load();
  };

  const saveGrade = async (chId: string, subId: string) => {
    await api.patch(`/teacher/courses/${classId}/chapters/${chId}/submissions/${subId}/grade?subjectId=${subjectId}`, { grade: Number(gradeInput), feedback: feedbackInput });
    setGradingSubmissionId(null);
    loadSubmissions(chId);
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-8 mx-auto relative">
      <TeacherPageHeader
        title={course?.subjectId?.name || 'Gestion du Cours'}
        subtitle={`Dossier Matière — ${course?.classId?.name} ${course?.subjectId?.code ? `(${course.subjectId.code})` : ''}`}
        category="Espace de Dépôt"
        icon={BookOpen}
        stats={[
          { label: 'Chapitres', value: course?.chapters?.length || 0, icon: Folder },
          { label: 'Supports', value: course?.chapters?.reduce((acc, ch) => acc + (ch.materials?.length || 0), 0) || 0, icon: FileText },
          { label: 'Exercices', value: course?.chapters?.reduce((acc, ch) => acc + (ch.exercises?.length || 0), 0) || 0, icon: ClipboardList }
        ]}
        actions={
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-2xl text-xs font-bold gap-2"
            onClick={() => router.push(`/teacher/courses/${classId}`)}
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
        }
      />

      {/* Sections List */}
      <div className="flex flex-col gap-6">
        <AnimatePresence>
          {(course?.chapters || []).map((ch, idx) => {
            const allItems = [
              ...(ch.materials || []).map(m => ({ ...m, _modelType: 'cours' as const })),
              ...(ch.exercises || []).map(e => ({ ...e, _modelType: 'exos' as const }))
            ].sort((a, b) => a._id.localeCompare(b._id));

            return (
              <motion.div 
                key={ch._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative group flex flex-col bg-card border transition-all duration-300 rounded-[2rem] overflow-hidden ${expanded[ch._id] ? 'border-primary/50 shadow-xl shadow-primary/5' : 'border-border/60 hover:border-border hover:shadow-md'}`}
              >
                {/* Header (Section Title) */}
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(p => ({ ...p, [ch._id]: !p[ch._id] }))}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 ${expanded[ch._id] ? 'bg-primary text-white scale-105' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
                      {expanded[ch._id] ? <FolderOpen className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                    </div>

                    <div className="flex-1" onClick={e => e.stopPropagation()}>
                      {editingChapter === ch._id ? (
                        <div className="flex items-center gap-2">
                          <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveChapterTitle(ch._id)}
                            className="bg-background border-2 border-primary/30 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none w-1/2" />
                          <button onClick={() => saveChapterTitle(ch._id)} className="p-2 bg-primary text-white rounded-xl"><Check className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="group/title flex items-center gap-2">
                          <h3 
                            className="text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors cursor-pointer"
                            onClick={() => setExpanded(p => ({ ...p, [ch._id]: !p[ch._id] }))}
                          >
                            {ch.title}
                          </h3>
                          <button onClick={(e) => { e.stopPropagation(); setEditingChapter(ch._id); setEditTitle(ch.title); }}
                            className="opacity-0 group-hover/title:opacity-100 p-1.5 text-muted-foreground hover:text-primary transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 mt-1">
                        {allItems.length} élément{allItems.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => togglePublish(ch._id)}
                      className={`p-2.5 rounded-xl transition-all ${ch.isPublished ? 'text-green-600 bg-green-500/10 hover:bg-green-500/20' : 'text-muted-foreground hover:bg-accent'}`}
                      title={ch.isPublished ? 'Publié' : 'Non publié'}
                    >
                      {ch.isPublished ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button onClick={() => deleteChapter(ch._id)}
                      className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      title="Supprimer la section"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Content (The Flat List) */}
                <AnimatePresence>
                  {expanded[ch._id] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/40 bg-zinc-50/30 dark:bg-zinc-900/20"
                    >
                      <div className="p-6 md:p-8 space-y-4">
                        {allItems.length === 0 ? (
                          <div className="py-8 border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center text-center">
                            <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm font-bold text-muted-foreground">Aucun document ou exercice</p>
                            <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">Ajoutez une ressource pour commencer à remplir cette section.</p>
                          </div>
                        ) : (
                          <div className="space-y-4 relative before:absolute before:inset-y-4 before:left-[19px] before:w-px before:bg-border/60">
                            {allItems.map(item => (
                              <div key={`${item._modelType}-${item._id}`} className="relative pl-12 group/item">
                                {/* Timeline Dot */}
                                <div className="absolute left-[15px] top-4 w-[9px] h-[9px] rounded-full bg-border border-2 border-background group-hover/item:border-primary group-hover/item:bg-primary transition-colors z-10" />

                                {item._modelType === 'cours' ? (
                                  // Material
                                  <div 
                                    onClick={() => setPreviewItem(item)}
                                    className="flex items-center gap-4 p-4 bg-background border border-border/60 rounded-2xl hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all hover:bg-zinc-50/20"
                                  >
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                      {item.type === 'pdf' ? <FileText className="w-5 h-5" /> : item.type === 'video' ? <Video className="w-5 h-5" /> : <File className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                                      <div className="flex items-center gap-2 mt-0.5" onClick={e => e.stopPropagation()}>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Support</span>
                                        <button 
                                          onClick={() => setPreviewItem(item)}
                                          className="text-[10px] text-muted-foreground hover:text-primary hover:underline font-medium"
                                        >
                                          Visualiser
                                        </button>
                                        <span className="text-[10px] text-muted-foreground/40">•</span>
                                        <a href={resolveMediaUrl(item.url)} target="_blank" rel="noreferrer" className="text-[10px] text-muted-foreground hover:text-primary hover:underline font-medium">Télécharger</a>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteMaterial(ch._id, item._id); }} 
                                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  // Exercise
                                  <div className="flex flex-col gap-2">
                                    <div 
                                      onClick={() => setPreviewItem(item)}
                                      className="flex items-center gap-4 p-4 bg-background border border-border/60 rounded-2xl hover:border-blue-400/40 hover:shadow-sm cursor-pointer transition-all hover:bg-zinc-50/20 relative"
                                    >
                                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <ClipboardList className="w-5 h-5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                                        <div className="flex items-center gap-3 mt-1" onClick={e => e.stopPropagation()}>
                                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Exercice</span>
                                          
                                          {item.dueDate && (
                                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                              À rendre pour le {new Date(item.dueDate).toLocaleDateString()}
                                            </span>
                                          )}

                                          <button 
                                            onClick={() => setPreviewItem(item)}
                                            className="text-[10px] text-muted-foreground hover:text-blue-600 hover:underline font-medium"
                                          >
                                            Visualiser
                                          </button>

                                          <span className="text-[10px] text-muted-foreground/40">•</span>

                                          <a href={resolveMediaUrl(item.url)} target="_blank" rel="noreferrer" className="text-[10px] text-muted-foreground hover:text-blue-600 hover:underline font-medium">Consulter</a>
                                          
                                          <div className="w-1 h-1 rounded-full bg-border" />
                                          
                                          <button 
                                            onClick={() => toggleSubmissions(ch._id, item._id)}
                                            className="text-[10px] font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                                          >
                                            <Users className="w-3 h-3" />
                                            {expandedExercises[item._id] ? 'Masquer les rendus' : 'Voir les rendus'}
                                          </button>
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col gap-2 opacity-0 group-hover/item:opacity-100 transition-all">
                                        {settingDueDateFor?.chId === ch._id && settingDueDateFor?.exId === item._id ? (
                                          <div className="flex items-center gap-2">
                                            <input type="date" value={dueDateInput} onChange={e => setDueDateInput(e.target.value)} className="text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary" />
                                            <button onClick={saveDueDate} className="p-1.5 bg-primary text-white rounded"><Check className="w-3 h-3" /></button>
                                            <button onClick={() => setSettingDueDateFor(null)} className="p-1.5 bg-muted text-foreground rounded"><X className="w-3 h-3" /></button>
                                          </div>
                                        ) : (
                                          <div className="flex gap-2 justify-end">
                                            <button onClick={() => { setSettingDueDateFor({ chId: ch._id, exId: item._id }); setDueDateInput(item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''); }} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" title="Régler la date limite">
                                              <Calendar className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteExercise(ch._id, item._id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Submissions Section */}
                                    <AnimatePresence>
                                      {expandedExercises[item._id] && (
                                        <motion.div 
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="mt-2 ml-4 p-4 bg-background/50 border border-border/60 rounded-2xl shadow-inner space-y-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                              <GraduationCap className="w-3.5 h-3.5" />
                                              Travaux remis
                                            </h4>
                                            
                                            {loadingSubmissions[ch._id] ? (
                                              <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                                            ) : (
                                              <div className="space-y-2">
                                                {(submissions[ch._id] || []).filter(s => s.exerciseId === item._id).map(sub => (
                                                  <div key={sub._id} className="flex flex-col gap-2 p-3 bg-card border border-border/40 rounded-xl hover:border-primary/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center overflow-hidden border border-border shrink-0">
                                                        {sub.studentId.profilePicture ? <img src={sub.studentId.profilePicture} className="w-full h-full object-cover" /> : <GraduationCap className="w-4 h-4 text-muted-foreground" />}
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                          <p className="text-sm font-bold text-foreground truncate">{sub.studentId.firstName} {sub.studentId.lastName}</p>
                                                          {sub.grade !== undefined && sub.grade !== null && (
                                                            <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                                              Noté : {sub.grade}/20
                                                            </span>
                                                          )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                          <button 
                                                            onClick={() => setPreviewItem({ _id: sub._id, name: sub.fileName, url: sub.fileUrl, type: sub.fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'other' })}
                                                            className="text-[10px] font-bold text-green-600 hover:underline text-left truncate max-w-[150px] inline-block"
                                                          >
                                                            {sub.fileName}
                                                          </button>
                                                          <span className="text-[8px] text-muted-foreground uppercase font-medium line-clamp-1">— {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    
                                                    {gradingSubmissionId === sub._id ? (
                                                      <div className="mt-2 pl-11 space-y-2">
                                                        <input type="number" min="0" max="20" placeholder="Note /20" value={gradeInput} onChange={e => setGradeInput(Number(e.target.value))} className="w-24 text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary" />
                                                        <textarea placeholder="Commentaire (optionnel)" value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 min-h-[60px] resize-none focus:outline-none focus:border-primary" />
                                                        <div className="flex gap-2">
                                                          <button onClick={() => saveGrade(ch._id, sub._id)} className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-colors">Enregistrer</button>
                                                          <button onClick={() => setGradingSubmissionId(null)} className="px-3 py-1.5 bg-muted text-foreground text-[10px] font-bold rounded-lg hover:bg-muted/80 transition-colors">Annuler</button>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div className="pl-11 mt-1 flex justify-between items-center">
                                                        {sub.feedback ? (
                                                          <p className="text-xs text-muted-foreground italic truncate max-w-[200px]">"{sub.feedback}"</p>
                                                        ) : <span />}
                                                        <button 
                                                          onClick={() => { setGradingSubmissionId(sub._id); setGradeInput(sub.grade ?? ''); setFeedbackInput(sub.feedback || ''); }} 
                                                          className="text-[10px] font-bold text-primary hover:underline"
                                                        >
                                                          {sub.grade !== undefined && sub.grade !== null ? "Modifier la note" : "Évaluer"}
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                                {(submissions[ch._id] || []).filter(s => s.exerciseId === item._id).length === 0 && (
                                                  <p className="text-center py-4 text-[11px] font-medium text-muted-foreground">Aucun devoir remis pour le moment.</p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Activity Chooser Button */}
                        <div className="pt-6 pl-12">
                          <button 
                            onClick={() => setShowActivityChooser(ch._id)}
                            className="bg-transparent border border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-primary rounded-xl px-4 py-3 flex items-center gap-2 transition-all font-bold text-xs"
                          >
                            <PlusCircle className="w-4 h-4" />
                            Ajouter une activité ou une ressource
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Section Button */}
        {!addingChapter ? (
          <button onClick={() => setAddingChapter(true)}
            className="flex items-center gap-4 p-6 border-2 border-dashed border-border/80 rounded-[2rem] hover:border-primary/40 hover:bg-primary/5 transition-all group group/add text-left">
            <div className="w-12 h-12 rounded-[1.25rem] bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-sm font-black text-foreground group-hover:text-primary transition-colors">Ajouter une section</span>
              <span className="text-xs text-muted-foreground mt-0.5 block">Créer un nouveau chapitre ou une nouvelle semaine</span>
            </div>
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col p-6 bg-card border-2 border-primary/30 rounded-[2rem] shadow-xl shadow-primary/5"
          >
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <Folder className="w-5 h-5" />
               </div>
               <span className="text-sm font-black text-primary">Nouvelle section</span>
            </div>
            <input
              autoFocus
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addChapter()}
              placeholder="Nom de la section (ex: Semaine 1, Chapitre 2...)"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 mb-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddingChapter(false)} className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-bold rounded-xl transition-all">Annuler</button>
              <button onClick={addChapter} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 transition-all">Créer</button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Activity Chooser Modal */}
      <AnimatePresence>
        {showActivityChooser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowActivityChooser(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-foreground">Ajouter une Activité ou Ressource</h3>
                  <p className="text-sm text-muted-foreground mt-1">Choisissez le type de contenu à déposer dans cette section.</p>
                </div>
                <button onClick={() => setShowActivityChooser(null)} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-6 h-6 text-muted-foreground" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Support de cours */}
                <button 
                  onClick={() => {
                    setUploadType('cours');
                    setUploadingChapterId(showActivityChooser);
                    setShowActivityChooser(null);
                  }}
                  className="flex items-start text-left gap-5 p-6 bg-background border border-border/60 hover:border-primary/50 hover:bg-primary/5 rounded-[2rem] transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="block font-black text-base text-foreground mb-1 group-hover:text-primary transition-colors">Support de cours</span>
                    <span className="text-xs text-muted-foreground leading-relaxed">Fichiers, PDF, documents Word, présentations ou vidéos.</span>
                  </div>
                </button>

                {/* Exercice */}
                <button 
                  onClick={() => {
                    setUploadType('exos');
                    setUploadingChapterId(showActivityChooser);
                    setShowActivityChooser(null);
                  }}
                  className="flex items-start text-left gap-5 p-6 bg-background border border-border/60 hover:border-blue-400/50 hover:bg-blue-50/50 rounded-[2rem] transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shrink-0">
                    <ClipboardList className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="block font-black text-base text-foreground mb-1 group-hover:text-blue-600 transition-colors">Devoir / Exercice</span>
                    <span className="text-xs text-muted-foreground leading-relaxed">Créer une zone de dépôt où les élèves pourront soumettre leurs fichiers.</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Upload */}
      <AnimatePresence>
        {uploadingChapterId && !showActivityChooser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${uploadType === 'cours' ? 'bg-primary/10 text-primary' : 'bg-blue-100/50 text-blue-600'}`}>
                      {uploadType === 'cours' ? <FileText className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-foreground tracking-tight leading-tight">
                        {uploadType === 'cours' ? 'Déposer un support' : 'Déposer un exercice'}
                      </h3>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">{uploadType === 'cours' ? 'Ressource' : 'Activité'}</p>
                    </div>
                  </div>
                  {!uploadProgress || uploadProgress === 100 ? (
                    <button onClick={() => setUploadingChapterId(null)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  ) : null}
                </div>

                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4"
                    onChange={(e) => e.target.files?.[0] && uploadFile(uploadingChapterId, e.target.files[0])}
                    disabled={uploadProgress > 0 && uploadProgress < 100}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  />
                  
                  <div className={`p-12 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all ${uploadProgress > 0 ? 'bg-muted border-border' : `border-border/60 ${uploadType === 'cours' ? 'group-hover:border-primary group-hover:bg-primary/5' : 'group-hover:border-blue-400 group-hover:bg-blue-50/50'}`}`}>
                    {uploadProgress > 0 ? (
                      <div className="w-full space-y-6">
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-16 h-16 rounded-full border-4 border-t-transparent animate-spin flex items-center justify-center shadow-lg ${uploadType === 'cours' ? 'border-primary shadow-primary/20' : 'border-blue-500 shadow-blue-500/20'} ${uploadProgress === 100 ? `animate-none ${uploadType === 'cours' ? 'border-t-primary' : 'border-t-blue-500'}` : ''}`}>
                             {uploadProgress === 100 ? <Check className={`w-8 h-8 ${uploadType === 'cours' ? 'text-primary' : 'text-blue-500'}`} /> : <span className={`text-[10px] font-black ${uploadType === 'cours' ? 'text-primary' : 'text-blue-500'}`}>{uploadProgress}%</span>}
                          </div>
                          <p className="text-sm font-black text-foreground uppercase tracking-widest">
                            {uploadProgress === 100 ? 'Chargement terminé !' : 'Envoi en cours...'}
                          </p>
                        </div>
                        <div className="w-full h-2 bg-background border border-border rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className={`h-full ${uploadType === 'cours' ? 'bg-primary' : 'bg-blue-500'}`}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm ${uploadType === 'cours' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-blue-100/80 text-blue-600 border border-blue-200'}`}>
                          <PlusCircle className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black text-foreground mb-1 tracking-tight">Glissez votre fichier ici</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Fichiers bureautiques & Vidéos (Max 10 Mo)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-4 border rounded-2xl ${uploadType === 'cours' ? 'bg-green-50/50 border-green-100' : 'bg-blue-50/50 border-blue-100'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${uploadType === 'cours' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {uploadType === 'cours' ? <BookOpen className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                  </div>
                  <p className={`text-[10px] font-bold leading-relaxed uppercase tracking-widest ${uploadType === 'cours' ? 'text-green-800' : 'text-blue-800'}`}>
                    {uploadType === 'cours' ? 'Les étudiants pourront consulter et télécharger ce fichier.' : 'Les étudiants pourront soumettre leurs travaux sur cette activité.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Visualisation Premium */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl h-[90vh] bg-card border border-border rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header glassmorphism */}
              <div className="p-6 md:p-8 border-b border-border/60 bg-background/50 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    previewItem.type === 'pdf' ? 'bg-primary/10 text-primary border border-primary/20' : 
                    previewItem.type === 'video' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                    'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                  }`}>
                    {previewItem.type === 'pdf' ? <FileText className="w-6 h-6" /> : 
                     previewItem.type === 'video' ? <Video className="w-6 h-6" /> : 
                     <File className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-0.5">Visualisation en Direct</span>
                    <h3 className="text-lg font-black text-foreground tracking-tight leading-tight truncate max-w-md md:max-w-xl">
                      {previewItem.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a 
                    href={resolveMediaUrl(previewItem.url)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/80 border border-border text-foreground text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Ouvrir Original
                  </a>
                  <button 
                    onClick={() => setPreviewItem(null)} 
                    className="p-2.5 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/45 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Viewer body */}
              <div className="flex-1 bg-zinc-950/40 p-4 md:p-6 flex items-center justify-center overflow-hidden">
                {previewItem.type === 'pdf' ? (
                  <iframe 
                    src={`${resolveMediaUrl(previewItem.url)}#toolbar=1`} 
                    className="w-full h-full rounded-2xl border border-border/60 bg-white"
                    title={previewItem.name}
                  />
                ) : previewItem.type === 'video' || previewItem.url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/i) || previewItem.url.includes('recordings') ? (
                  <div className="w-full h-full flex items-center justify-center bg-black rounded-2xl overflow-hidden relative">
                    <video 
                      src={resolveMediaUrl(previewItem.url)} 
                      controls 
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 max-w-sm bg-card border border-border rounded-3xl p-8 shadow-sm">
                    <File className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                    <h4 className="text-base font-black text-foreground mb-2">Format non supporté pour la prévisualisation directe</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">Ce type de fichier ne peut pas être prévisualisé directement dans le navigateur. Vous pouvez l'ouvrir ou le télécharger.</p>
                    <a 
                      href={resolveMediaUrl(previewItem.url)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/20 hover:bg-primary/95 cursor-pointer"
                    >
                      Ouvrir le fichier
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
