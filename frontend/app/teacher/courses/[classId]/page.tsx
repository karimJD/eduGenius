'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, PlusCircle, Trash2, Eye, EyeOff, BookOpen,
  Link as LinkIcon, ChevronDown, ChevronUp, Edit2, Check, X,
  FileText, Video, File, Folder, FolderOpen, ClipboardList, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import Link from 'next/link';

interface Material { _id: string; name: string; type: string; url: string }
interface Chapter { _id: string; title: string; order: number; isPublished?: boolean; materials: Material[]; exercises: Material[] }
interface Submission { _id: string; studentId: { firstName: string; lastName: string; email: string; profilePicture?: string }; fileName: string; fileUrl: string; submittedAt: string; exerciseId: string }
interface Course { _id: string; title: string; chapters: Chapter[]; classId?: { _id: string; name: string } }

export default function CourseEditorPage() {
  const { classId } = useParams<{ classId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, 'cours' | 'exos' | 'rendus'>>({});
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState<Record<string, boolean>>({});
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [uploadingChapterId, setUploadingChapterId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'cours' | 'exos'>('cours');
  const [uploadProgress, setUploadProgress] = useState(0);

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


  const loadSubmissions = async (chId: string) => {
    setLoadingSubmissions(p => ({ ...p, [chId]: true }));
    try {
      const { data } = await api.get(`/teacher/courses/${classId}/chapters/${chId}/submissions`);
      setSubmissions(p => ({ ...p, [chId]: data }));
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(p => ({ ...p, [chId]: false }));
    }
  };

  const uploadFile = async (chId: string, file: File) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.split('.')[0]); 

    setUploadingChapterId(chId);
    setUploadProgress(10);

    const endpoint = uploadType === 'cours' 
      ? `/teacher/courses/${classId}/chapters/${chId}/upload`
      : `/teacher/courses/${classId}/chapters/${chId}/exercises/upload`;

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
    await api.delete(`/teacher/courses/${classId}/chapters/${chId}/materials/${mId}`);
    load();
  };

  const deleteExercise = async (chId: string, exId: string) => {
    await api.delete(`/teacher/courses/${classId}/chapters/${chId}/exercises/${exId}`);
    load();
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-8 mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/teacher/courses" 
          className="p-3 bg-card border border-border rounded-2xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            {course?.title || 'Gestion du Cours'}
          </h1>
          {course?.classId && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Espace de dépôt — {course.classId.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {(course?.chapters || []).map((ch, idx) => (
            <motion.div 
              key={ch._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative group flex flex-col bg-card border-2 transition-all duration-300 rounded-[2.5rem] overflow-hidden ${expanded[ch._id] ? 'border-primary shadow-2xl shadow-primary/10 ring-4 ring-primary/5' : 'border-border/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 shadow-sm'}`}
            >
              {/* Folder tab effect */}
              <div className={`absolute top-0 left-8 h-2 w-24 rounded-b-xl transition-colors duration-300 ${expanded[ch._id] ? 'bg-primary' : 'bg-muted-foreground/20 group-hover:bg-primary/40'}`} />

              <div className="p-8 pb-6 flex-1 flex flex-col pt-10">
                <div className="flex items-start justify-between mb-6">
                  <div 
                    onClick={() => setExpanded(p => ({ ...p, [ch._id]: !p[ch._id] }))}
                    className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center transition-all duration-500 cursor-pointer ${expanded[ch._id] ? 'bg-primary text-white scale-110 rotate-3 shadow-lg shadow-primary/30' : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:-rotate-3'}`}
                  >
                    {expanded[ch._id] ? <FolderOpen className="w-8 h-8" /> : <Folder className="w-8 h-8" />}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button onClick={() => togglePublish(ch._id)}
                      className={`p-2.5 rounded-xl transition-all ${ch.isPublished ? 'text-green-600 bg-green-500/10' : 'text-muted-foreground hover:bg-accent'}`}
                    >
                      {ch.isPublished ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                    </button>
                    <button onClick={() => deleteChapter(ch._id)}
                      className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  {editingChapter === ch._id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveChapterTitle(ch._id)}
                        className="w-full bg-background border-2 border-primary/30 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" />
                      <button onClick={() => saveChapterTitle(ch._id)} className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"><Check className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="group/title flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-black text-foreground tracking-tight leading-tight cursor-pointer"
                        onClick={() => setExpanded(p => ({ ...p, [ch._id]: !p[ch._id] }))}>
                        {ch.title}
                      </h3>
                      <button onClick={() => { setEditingChapter(ch._id); setEditTitle(ch.title); }}
                        className="opacity-0 group-hover/title:opacity-100 p-1.5 text-muted-foreground hover:text-primary transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    {ch.materials.length} Support{ch.materials.length > 1 ? 's' : ''} Déposé{ch.materials.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Expansion Panel with Tabs */}
              <AnimatePresence>
                {expanded[ch._id] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/40 bg-muted/20"
                  >
                    {/* Tab Navigation */}
                    <div className="flex p-2 gap-1 border-b border-border/40 bg-background/50">
                      {[ 
                        { id: 'cours', label: 'Cours', icon: BookOpen },
                        { id: 'exos', label: 'Exercices', icon: ClipboardList },
                        { id: 'rendus', label: 'Rendus', icon: GraduationCap }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTabs(p => ({ ...p, [ch._id]: tab.id as any }));
                            if (tab.id === 'rendus') loadSubmissions(ch._id);
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            (activeTabs[ch._id] || 'cours') === tab.id 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}
                        >
                          <tab.icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-6 pt-4 space-y-4">
                      {/* COURS TAB */}
                      {(activeTabs[ch._id] || 'cours') === 'cours' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-2.5">
                            {ch.materials.map(m => (
                              <div key={m._id} className="flex items-center gap-3 p-3.5 bg-background border border-border/60 rounded-2xl group/file hover:border-primary/30 hover:shadow-sm transition-all">
                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover/file:bg-primary group-hover/file:text-white transition-all">
                                  {m.type === 'pdf' ? <FileText className="w-4 h-4" /> : m.type === 'video' ? <Video className="w-4 h-4" /> : <File className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-foreground truncate">{m.name}</p>
                                  <a href={m.url} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-primary hover:underline uppercase tracking-widest">Voir</a>
                                </div>
                                <button onClick={() => deleteMaterial(ch._id, m._id)} className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover/file:opacity-100 transition-all">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {ch.materials.length === 0 && <p className="text-center py-4 text-[10px] font-bold text-muted-foreground uppercase">Aucun support de cours</p>}
                          </div>
                          <button onClick={() => { setUploadType('cours'); setUploadingChapterId(ch._id); }} className="w-full flex items-center justify-center gap-2 py-4 bg-primary/5 border-2 border-dashed border-primary/20 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/10 hover:border-primary/40 transition-all group">
                            <PlusCircle className="w-4 h-4 group-hover:scale-110 transition-transform" /> Ajouter un Support
                          </button>
                        </div>
                      )}

                      {/* EXERCICES TAB */}
                      {activeTabs[ch._id] === 'exos' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-2.5">
                            {(ch.exercises || []).map(ex => (
                              <div key={ex._id} className="flex items-center gap-3 p-3.5 bg-background border border-border/60 rounded-2xl group/file hover:border-blue-300/30 hover:shadow-sm transition-all">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover/file:bg-blue-600 group-hover/file:text-white transition-all">
                                  <ClipboardList className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-foreground truncate">{ex.name}</p>
                                  <a href={ex.url} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Exercice</a>
                                </div>
                                <button onClick={() => deleteExercise(ch._id, ex._id)} className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover/file:opacity-100 transition-all">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {(ch.exercises || []).length === 0 && <p className="text-center py-4 text-[10px] font-bold text-muted-foreground uppercase">Aucun exercice déposé</p>}
                          </div>
                          <button onClick={() => { setUploadType('exos'); setUploadingChapterId(ch._id); }} className="w-full flex items-center justify-center gap-2 py-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 hover:bg-blue-100/50 hover:border-blue-400 transition-all group">
                            <PlusCircle className="w-4 h-4 group-hover:scale-110 transition-transform" /> Déposer un Exercice
                          </button>
                        </div>
                      )}

                      {/* RENDUS TAB */}
                      {activeTabs[ch._id] === 'rendus' && (
                        <div className="space-y-4">
                          {loadingSubmissions[ch._id] ? (
                            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                          ) : (
                            <div className="grid grid-cols-1 gap-2.5">
                              {(submissions[ch._id] || []).map(sub => (
                                <div key={sub._id} className="flex items-center gap-3 p-3.5 bg-background border border-border/60 rounded-2xl group/file">
                                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden border border-border shadow-sm">
                                    {sub.studentId.profilePicture ? <img src={sub.studentId.profilePicture} className="w-full h-full object-cover" /> : <GraduationCap className="w-5 h-5 text-muted-foreground" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-black text-foreground truncate">{sub.studentId.firstName} {sub.studentId.lastName}</p>
                                      <span className="text-[7px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        {ch.exercises?.find(e => e._id === sub.exerciseId)?.name || 'Exercice'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                       <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-green-600 hover:underline uppercase tracking-widest">{sub.fileName}</a>
                                       <span className="text-[8px] text-muted-foreground uppercase font-medium">• {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(submissions[ch._id] || []).length === 0 && <p className="text-center py-4 text-[10px] font-bold text-muted-foreground uppercase">Aucun rendu pour le moment</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Folder Button */}
        {!addingChapter ? (
          <button onClick={() => setAddingChapter(true)}
            className="flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed border-border/80 rounded-[2.5rem] hover:border-primary/40 hover:bg-primary/5 transition-all group group/add">
            <div className="w-16 h-16 rounded-[1.75rem] border-2 border-dashed border-border/80 flex items-center justify-center text-muted-foreground group-hover:border-primary/40 group-hover:text-primary transition-all duration-500 group-hover:rotate-12">
              <PlusCircle className="w-8 h-8" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary">Nouveau Dossier</span>
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col p-8 bg-card border-2 border-primary/30 rounded-[2.5rem] shadow-xl shadow-primary/5"
          >
            <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                 <Folder className="w-6 h-6" />
               </div>
               <span className="text-sm font-black uppercase tracking-widest text-primary">Création Dossier</span>
            </div>
            <input
              autoFocus
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addChapter()}
              placeholder="Nom du chapitre..."
              className="w-full bg-background border border-border rounded-xl px-5 py-4 mb-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-3">
              <button onClick={addChapter} className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Créer</button>
              <button onClick={() => setAddingChapter(false)} className="p-3 bg-muted text-muted-foreground rounded-xl transition-all"><X className="w-5 h-5" /></button>
            </div>
          </motion.div>
        )}
      </div>


      {/* Modal Upload */}
      <AnimatePresence>
        {uploadingChapterId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      {uploadType === 'cours' ? <FileText className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                    </div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      {uploadType === 'cours' ? 'Déposer un support' : 'Déposer un exercice'}
                    </h3>
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
                  
                  <div className={`p-12 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all ${uploadProgress > 0 ? 'bg-muted border-border' : 'border-border/60 group-hover:border-primary group-hover:bg-primary/5'}`}>
                    {uploadProgress > 0 ? (
                      <div className="w-full space-y-6">
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin flex items-center justify-center shadow-lg shadow-primary/20 ${uploadProgress === 100 ? 'animate-none border-t-primary' : ''}`}>
                             {uploadProgress === 100 ? <Check className="w-8 h-8 text-primary" /> : <span className="text-[10px] font-black text-primary">{uploadProgress}%</span>}
                          </div>
                          <p className="text-sm font-black text-foreground uppercase tracking-widest">
                            {uploadProgress === 100 ? 'Chargement terminé !' : 'Envoi vers S3...'}
                          </p>
                        </div>
                        <div className="w-full h-2 bg-background border border-border rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-primary/20">
                          <PlusCircle className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black text-foreground mb-1 tracking-tight">Glissez votre fichier ici</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">PDF, Word, PPT ou Vidéo (Max 10 Mo)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-widest">
                    Les fichiers sont stockés en toute sécurité sur AWS S3 et seront accessibles immédiatement par vos élèves.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
