'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, FileText, List, Layers, Check, ChevronDown, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

interface GenerateSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classes: any[];
  onGenerate: (data: { 
    classId: string; 
    courseId: string;
    selectedChapters: string[];
    selectedMaterials: string[];
    style: string;
  }) => Promise<void>;
}

const STYLES = [
  {
    id: 'detailed',
    title: 'Détaillé',
    desc: 'Un résumé complet couvrant tous les aspects.',
    icon: FileText,
  },
  {
    id: 'bullets',
    title: 'Points clés',
    desc: 'Idéal pour une lecture rapide et directe.',
    icon: List,
  },
  {
    id: 'cheatSheet',
    title: 'Fiche Mémo',
    desc: 'Focus sur les formules et concepts essentiels.',
    icon: Layers,
  },
];

export function GenerateSummaryModal({
  open,
  onOpenChange,
  classId,
  classes,
  onGenerate,
}: GenerateSummaryModalProps) {
  const [subjectId, setSubjectId] = useState('');
  const [courseData, setCourseData] = useState<any>(null);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [style, setStyle] = useState('detailed');
  const [loading, setLoading] = useState(false);
  const [fetchingStructure, setFetchingStructure] = useState(false);

  const subjects = classes || [];

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

  const toggleChapter = (chapterId: string) => {
    setSelectedChapters(prev => {
      const isSelected = prev.includes(chapterId);
      if (isSelected) {
        return prev.filter(c => c !== chapterId);
      } else {
        return [...prev, chapterId];
      }
    });

    // If we select/deselect a chapter, we might want to automatically select/deselect its materials?
    // Let's keep them separate for now but allow expansion.
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
      if (selectedChapters.length === courseData.chapters.length) {
        setSelectedChapters([]);
        setSelectedMaterials([]);
      } else {
        setSelectedChapters(courseData.chapters.map((c: any) => c._id));
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
        selectedChapters,
        selectedMaterials,
        style 
      });
      onOpenChange(false);
      // Reset state
      setSubjectId('');
      setCourseData(null);
      setSelectedChapters([]);
      setSelectedMaterials([]);
    } catch (error) {
      console.error('Failed to generate summary', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-[#111111] border-[#222222] text-white max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
               <BrainCircuit className="w-5 h-5 text-purple-400" />
            </div>
            Assistant IA EduGenius
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              1. Matière
            </label>
            <select
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333333] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
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
            <div className="flex flex-col items-center justify-center py-8 gap-3 border border-dashed border-[#333333] rounded-xl bg-[#0a0a0a]">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              <p className="text-sm text-gray-500">Chargement du contenu du cours...</p>
            </div>
          ) : courseData && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  3. Sélectionner le contenu
                </label>
                <button 
                  type="button" 
                  onClick={handleSelectAll}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase tracking-tighter"
                >
                  {selectedChapters.length === courseData.chapters.length ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {courseData.chapters.map((chapter: any) => (
                  <div key={chapter._id} className="space-y-1">
                    <div 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all group",
                        selectedChapters.includes(chapter._id)
                          ? "bg-purple-500/10 border-purple-500/50"
                          : "bg-[#0a0a0a] border-[#222222] hover:border-[#333333]"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleChapter(chapter._id)}>
                        <div className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                          selectedChapters.includes(chapter._id) ? "bg-purple-500 border-purple-500" : "border-[#444444]"
                        )}>
                          {selectedChapters.includes(chapter._id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium">{chapter.title}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(chapter._id); }}
                        className="p-1 hover:bg-white/5 rounded-md transition-colors"
                      >
                        <ChevronDown className={cn(
                          "w-4 h-4 text-gray-500 transition-transform duration-200", 
                          expandedChapters.includes(chapter._id) && "rotate-180"
                        )} />
                      </button>
                    </div>

                    {expandedChapters.includes(chapter._id) && (
                      <div className="ml-8 space-y-1 py-1 border-l border-[#222222] pl-4">
                        {chapter.materials?.length > 0 ? (
                          chapter.materials.map((material: any) => (
                            <div 
                              key={material._id}
                              onClick={() => toggleMaterial(material._id)}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all",
                                selectedMaterials.includes(material._id)
                                  ? "bg-purple-500/5 border-purple-500/30"
                                  : "bg-transparent border-transparent hover:bg-white/5"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                selectedMaterials.includes(material._id) ? "bg-purple-500 border-purple-500" : "border-[#444444]"
                              )}>
                                {selectedMaterials.includes(material._id) && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex items-center gap-2 overflow-hidden flex-1">
                                {material.type === 'pdf' ? (
                                  <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                ) : (
                                  <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                )}
                                <span className="text-xs text-gray-400 truncate font-medium">{material.name}</span>
                              </div>
                              {material.type === 'pdf' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-tighter">
                                  PDF
                                </span>
                              )}
                            </div>
                          ))
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
                  <div className="text-center py-4 text-xs text-gray-500 italic">
                    Aucun chapitre publié pour ce cours.
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-500 italic">
                Note : Sélectionnez des chapitres entiers ou des documents spécifiques. Les PDFs seront analysés en priorité.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              4. Style du contenu
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-xl border transition-all text-left group",
                    style === s.id
                      ? "bg-purple-500/10 border-purple-500"
                      : "bg-[#0a0a0a] border-[#333333] hover:border-[#444444]"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-colors",
                    style === s.id ? "bg-purple-500/20" : "bg-[#1a1a1a] group-hover:bg-[#222222]"
                  )}>
                    <s.icon className={cn(
                      "w-4 h-4",
                      style === s.id ? "text-purple-400" : "text-gray-500"
                    )} />
                  </div>
                  <span className={cn(
                    "font-bold text-sm mb-1",
                    style === s.id ? "text-white" : "text-gray-300"
                  )}>{s.title}</span>
                  <span className="text-[10px] text-gray-500 leading-tight">
                    {s.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#222222]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#333333] text-gray-300 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !classId || !subjectId || (courseData?.chapters?.length > 0 && selectedChapters.length === 0)}
              className="bg-purple-600 hover:bg-purple-700 text-white min-w-[160px] font-bold"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération...</span>
                </div>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  Générer avec l'IA
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

