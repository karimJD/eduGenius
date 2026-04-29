'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, Layers, Check, Sparkles, FileText, BookOpen, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

interface GenerateFlashcardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classes: any[];
  onGenerate: (data: { 
    classId: string; 
    courseId: string;
    selectedChapters: string[];
    selectedMaterials: string[];
    count: number;
  }) => Promise<void>;
}

export function GenerateFlashcardsModal({
  open,
  onOpenChange,
  classId,
  classes,
  onGenerate,
}: GenerateFlashcardsModalProps) {
  const [subjectId, setSubjectId] = useState('');
  const [courseData, setCourseData] = useState<any>(null);
  const [selectionMode, setSelectionMode] = useState<'subject' | 'chapters' | 'materials'>('subject');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [fetchingStructure, setFetchingStructure] = useState(false);

  const subjects = (() => {
    if (!classes || !classId) return [];
    const cls = classes.find((c: any) => c._id === classId);
    if (!cls || !cls.assignedSubjects) return [];
    return cls.assignedSubjects.map((s: any) => ({
      id: s.subjectId._id,
      name: s.subjectId.name,
      code: s.subjectId.code
    }));
  })();

  useEffect(() => {
    setSubjectId('');
    setCourseData(null);
    setSelectedChapters([]);
    setSelectedMaterials([]);
    setExpandedChapters([]);
  }, [classId]);

  useEffect(() => {
    const fetchCourseStructure = async () => {
      if (!classId || !subjectId) return;
      try {
        setFetchingStructure(true);
        const res = await api.get(`/student/courses/${classId}?subjectId=${subjectId}`);
        if (res.data.success) {
          setCourseData(res.data.data);
          setSelectedChapters([]);
          setSelectedMaterials([]);
        }
      } catch (error) {
        console.error('Failed to fetch course structure:', error);
      } finally {
        setFetchingStructure(false);
      }
    };

    fetchCourseStructure();
  }, [classId, subjectId]);

  useEffect(() => {
    if (selectionMode === 'materials' && courseData?.chapters) {
      setExpandedChapters(courseData.chapters.map((c: any) => c._id));
    }
  }, [selectionMode, courseData]);

  const toggleChapter = (chapterId: string) => {
    setSelectedChapters(prev => {
      const isSelected = prev.includes(chapterId);
      if (isSelected) {
        return prev.filter(c => c !== chapterId);
      } else {
        return [...prev, chapterId];
      }
    });
  };

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId) ? prev.filter(m => m !== materialId) : [...prev, materialId]
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedChapters(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (courseData?.chapters) {
      if (selectionMode === 'chapters') {
        if (selectedChapters.length === courseData.chapters.length) {
          setSelectedChapters([]);
        } else {
          setSelectedChapters(courseData.chapters.map((c: any) => c._id));
        }
      } else if (selectionMode === 'materials') {
        const allMaterials = courseData.chapters.flatMap((c: any) => c.materials?.map((m: any) => m._id) || []);
        if (selectedMaterials.length === allMaterials.length) {
          setSelectedMaterials([]);
        } else {
          setSelectedMaterials(allMaterials);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !subjectId || !courseData?._id) return;

    try {
      setLoading(true);
      await onGenerate({ 
        classId, 
        courseId: courseData._id,
        selectedChapters: selectionMode === 'chapters' ? selectedChapters : [],
        selectedMaterials: selectionMode === 'materials' ? selectedMaterials : [],
        count
      });
      onOpenChange(false);
      // Reset state
      setSubjectId('');
      setCourseData(null);
      setSelectedChapters([]);
      setSelectedMaterials([]);
    } catch (error) {
      console.error('Failed to generate flashcards', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white dark:bg-[#111111] border-gray-200 dark:border-[#222222] text-foreground dark:text-white max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
               <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            Générer des Flashcards
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground dark:text-gray-500 uppercase tracking-wider">
              1. Matière
            </label>
            <select
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333333] text-foreground dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Choisir une matière...</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {fetchingStructure ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 border border-dashed border-gray-300 dark:border-[#333333] rounded-xl bg-gray-50 dark:bg-[#0a0a0a]">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-sm text-muted-foreground dark:text-gray-500">Chargement du contenu...</p>
            </div>
          ) : courseData && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground dark:text-gray-500 uppercase tracking-wider">
                2. Périmètre de génération
              </label>
              
              <div className="flex bg-gray-100 dark:bg-[#1a1a1a] rounded-xl p-1 mb-4">
                <button 
                  type="button" 
                  onClick={() => setSelectionMode('subject')} 
                  className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-all", selectionMode === 'subject' ? "bg-white dark:bg-[#2a2a2a] shadow text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground")}
                >
                  Toute la matière
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectionMode('chapters')} 
                  className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-all", selectionMode === 'chapters' ? "bg-white dark:bg-[#2a2a2a] shadow text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground")}
                >
                  Chapitres
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectionMode('materials')} 
                  className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-all", selectionMode === 'materials' ? "bg-white dark:bg-[#2a2a2a] shadow text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:text-foreground")}
                >
                  Documents
                </button>
              </div>

              {selectionMode === 'subject' && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    L'IA analysera l'ensemble du cours pour générer les flashcards.
                  </p>
                </div>
              )}

              {selectionMode !== 'subject' && (
                <>
                  <div className="flex justify-between items-center mt-4">
                    <label className="text-xs font-semibold text-muted-foreground dark:text-gray-500 uppercase tracking-wider">
                      3. Sélectionner le contenu
                    </label>
                    <button 
                      type="button" 
                      onClick={handleSelectAll}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-tighter"
                    >
                      {selectionMode === 'chapters' 
                        ? (selectedChapters.length === courseData.chapters.length ? "Tout désélectionner" : "Tout sélectionner")
                        : "Sélectionner tout"
                      }
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {courseData.chapters.map((chapter: any) => (
                      <div key={chapter._id} className="space-y-1">
                        <div 
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all group",
                            (selectionMode === 'chapters' && selectedChapters.includes(chapter._id))
                              ? "bg-indigo-500/10 border-indigo-500/50"
                              : "bg-gray-50 dark:bg-[#0a0a0a] border-gray-200 dark:border-[#222222] hover:border-gray-300 dark:hover:border-[#333333]",
                            selectionMode === 'materials' && "bg-gray-50/50 dark:bg-[#0a0a0a]/50"
                          )}
                        >
                          <div 
                            className={cn("flex items-center gap-3 flex-1", selectionMode === 'chapters' ? "cursor-pointer" : "cursor-default")} 
                            onClick={() => {
                              if (selectionMode === 'chapters') toggleChapter(chapter._id);
                            }}
                          >
                            {selectionMode === 'chapters' && (
                              <div className={cn(
                                "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                                selectedChapters.includes(chapter._id) ? "bg-indigo-500 border-indigo-500" : "border-gray-300 dark:border-[#444444]"
                              )}>
                                {selectedChapters.includes(chapter._id) && <Check className="w-3 h-3 text-foreground dark:text-white" />}
                              </div>
                            )}
                            <span className="text-sm font-medium">{chapter.title}</span>
                          </div>
                          
                          {selectionMode === 'materials' && (
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleExpand(chapter._id); }}
                              className="p-1 hover:bg-white/5 rounded-md transition-colors"
                            >
                              <ChevronDown className={cn(
                                "w-4 h-4 text-muted-foreground dark:text-gray-500 transition-transform duration-200", 
                                expandedChapters.includes(chapter._id) && "rotate-180"
                              )} />
                            </button>
                          )}
                        </div>

                        {selectionMode === 'materials' && expandedChapters.includes(chapter._id) && (
                          <div className="ml-8 space-y-1 py-1 border-l border-gray-200 dark:border-[#222222] pl-4">
                            {chapter.materials?.length > 0 ? (
                              chapter.materials.map((material: any) => {
                                const isPdf = material.type === 'pdf' || (material.type === 'file' && material.url?.toLowerCase().endsWith('.pdf'));
                                return (
                                <div 
                                  key={material._id}
                                  onClick={() => toggleMaterial(material._id)}
                                  className={cn(
                                    "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all",
                                    selectedMaterials.includes(material._id)
                                      ? "bg-indigo-500/5 border-indigo-500/30"
                                      : "bg-transparent border-transparent hover:bg-white/5"
                                  )}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                    selectedMaterials.includes(material._id) ? "bg-indigo-500 border-indigo-500" : "border-gray-300 dark:border-[#444444]"
                                  )}>
                                    {selectedMaterials.includes(material._id) && <Check className="w-2.5 h-2.5 text-foreground dark:text-white" />}
                                  </div>
                                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                                    {isPdf ? (
                                      <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                    ) : (
                                      <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    )}
                                    <span className="text-xs text-muted-foreground dark:text-gray-400 truncate font-medium">{material.name || material.title}</span>
                                  </div>
                                  {isPdf && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-tighter">
                                      PDF
                                    </span>
                                  )}
                                </div>
                              )})
                            ) : (
                              <div className="py-2 text-[10px] text-gray-600 italic">
                                Aucun document dans ce chapitre
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {courseData.chapters.length === 0 && (
                      <div className="text-center py-4 text-xs text-muted-foreground dark:text-gray-500 italic">
                        Aucun chapitre publié pour ce cours.
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground dark:text-gray-500 italic">
                    Note : Les fichiers PDF seront analysés en priorité pour la génération.
                  </p>
                </>
              )}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground dark:text-gray-500 uppercase tracking-wider">
              4. Nombre de cartes
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={cn(
                    "py-3 rounded-xl border font-bold transition-all",
                    count === n
                      ? "bg-indigo-500/10 border-indigo-500 text-foreground dark:text-white"
                      : "bg-gray-50 dark:bg-[#0a0a0a] border-gray-200 dark:border-[#333333] text-muted-foreground dark:text-gray-500 hover:border-gray-300 dark:hover:border-[#444444]"
                  )}
                >
                  {n} Cartes
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-[#222222]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300 dark:border-[#333333] text-gray-600 dark:text-gray-300 hover:text-foreground dark:hover:text-white"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !classId || !subjectId || (selectionMode === 'chapters' && selectedChapters.length === 0) || (selectionMode === 'materials' && selectedMaterials.length === 0)}
              className="bg-indigo-600 hover:bg-indigo-700 text-foreground dark:text-white min-w-[160px] font-bold"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer le deck
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
