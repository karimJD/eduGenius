'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, Trophy, Check, Zap, ChevronDown, FileText, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

interface GenerateQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classes: any[];
  onGenerate: (data: { 
    classId: string; 
    courseId: string;
    selectedChapters: string[];
    selectedMaterials: string[];
    difficulty: string;
    questionCount: number;
  }) => Promise<void>;
}

const DIFFICULTIES = [
  { id: 'Easy', label: 'Facile', color: 'text-green-400' },
  { id: 'Medium', label: 'Moyen', color: 'text-yellow-400' },
  { id: 'Hard', label: 'Difficile', color: 'text-red-400' },
];

export function GenerateQuizModal({
  open,
  onOpenChange,
  classId,
  classes,
  onGenerate,
}: GenerateQuizModalProps) {
  const [subjectId, setSubjectId] = useState('');
  const [courseData, setCourseData] = useState<any>(null);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
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
        difficulty,
        questionCount
      });
      onOpenChange(false);
      // Reset state
      setSubjectId('');
      setCourseData(null);
      setSelectedChapters([]);
      setSelectedMaterials([]);
    } catch (error) {
      console.error('Failed to generate quiz', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-[#111111] border-[#222222] text-white max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
               <Trophy className="w-5 h-5 text-green-400" />
            </div>
            Entraînement IA
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
              className="w-full bg-[#0a0a0a] border border-[#333333] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
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
              <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
              <p className="text-sm text-gray-500">Chargement du contenu...</p>
            </div>
          ) : courseData && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  3. Chapitres inclus
                </label>
                <button 
                  type="button" 
                  onClick={handleSelectAll}
                  className="text-[10px] text-green-400 hover:text-green-300 font-bold uppercase tracking-tighter"
                >
                  {selectedChapters.length === courseData.chapters.length ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {courseData.chapters.map((chapter: any) => (
                  <div 
                    key={chapter._id}
                    onClick={() => toggleChapter(chapter._id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      selectedChapters.includes(chapter._id)
                        ? "bg-green-500/10 border-green-500/50"
                        : "bg-[#0a0a0a] border-[#222222] hover:border-[#333333]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                        selectedChapters.includes(chapter._id) ? "bg-green-500 border-green-500" : "border-[#444444]"
                      )}>
                        {selectedChapters.includes(chapter._id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{chapter.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                4. Difficulté
              </label>
              <div className="flex flex-col gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                      difficulty === d.id
                        ? "bg-[#1a1a1a] border-green-500 text-white"
                        : "bg-[#0a0a0a] border-[#222222] text-gray-500 hover:border-[#333333]"
                    )}
                  >
                    <span className="text-sm font-bold">{d.label}</span>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      difficulty === d.id ? (d.id === 'Easy' ? 'bg-green-400' : d.id === 'Medium' ? 'bg-yellow-400' : 'bg-red-400') : 'bg-gray-700'
                    )} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                5. Nombre de questions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuestionCount(n)}
                    className={cn(
                      "py-3 rounded-xl border font-bold transition-all text-sm",
                      questionCount === n
                        ? "bg-green-500/10 border-green-500 text-white"
                        : "bg-[#0a0a0a] border-[#222222] text-gray-500 hover:border-[#333333]"
                    )}
                  >
                    {n} Q
                  </button>
                ))}
              </div>
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
              className="bg-green-600 hover:bg-green-700 text-white min-w-[160px] font-bold"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération...</span>
                </div>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Lancer le Test
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
