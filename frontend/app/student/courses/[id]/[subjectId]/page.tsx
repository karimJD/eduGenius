'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  ChevronRight, 
  FileText, 
  Video, 
  File, 
  CheckCircle2, 
  Clock,
  ArrowLeft,
  Layout,
  PlayCircle,
  Download,
  ExternalLink,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/student/PageHeader';
import api from '@/lib/axios';

interface Material {
  _id: string;
  title?: string;
  name?: string;
  type: 'file' | 'video' | 'link';
  url: string;
  description?: string;
}

interface Exercise {
  _id: string;
  title?: string;
  name?: string;
  description: string;
  dueDate?: string;
  hasSubmitted?: boolean;
}

interface Chapter {
  _id: string;
  title: string;
  description: string;
  isPublished: boolean;
  materials: Material[];
  exercises: Exercise[];
}

interface Course {
  _id: string;
  title: string;
  description?: string;
  chapters: Chapter[];
  subjectId?: { name: string; code: string };
  teacherId?: { firstName: string; lastName: string; profileImage?: string };
}

export default function StudentCourseViewer() {
  const { id: classId, subjectId } = useParams<{ id: string, subjectId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const [courseRes, progRes] = await Promise.all([
          api.get(`/student/courses/${classId}?subjectId=${subjectId}`),
          api.get(`/student/courses/${classId}/progress?subjectId=${subjectId}`)
        ]);

        if (courseRes.data.success) {
          setCourse(courseRes.data.data);
        }
        if (progRes.data.success) {
          setProgress(progRes.data.data);
        }
      } catch (err: any) {
        console.error('Error fetching course data:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement du cours');
      } finally {
        setLoading(false);
      }
    };

    if (classId && subjectId) {
      fetchCourseData();
    }
  }, [classId, subjectId]);

  const calculatedProgress = useMemo(() => {
    if (!course?.chapters) return 0;
    
    let totalExercises = 0;
    let submittedExercises = 0;
    
    course.chapters.forEach(chapter => {
      if (chapter.exercises) {
        totalExercises += chapter.exercises.length;
        submittedExercises += chapter.exercises.filter(ex => ex.hasSubmitted).length;
      }
    });
    
    return totalExercises === 0 ? 0 : Math.round((submittedExercises / totalExercises) * 100);
  }, [course]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground dark:text-gray-400 font-medium">Chargement de votre cours...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">Oups !</h2>
        <p className="text-muted-foreground dark:text-gray-400 max-w-md mb-6">{error || "Nous n'avons pas pu trouver ce cours."}</p>
        <Button onClick={() => router.back()} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8">
      {/* Header */}
      <PageHeader 
        title={course.subjectId?.name || 'Matière'}
        description={course.description || "Explorez les chapitres, exercices et ressources de ce cours."}
        icon={BookOpen}
        badgeText={course.subjectId?.code || 'COURS'}
        badgeClassName="bg-blue-500/10 border-blue-500/20 text-blue-400"
        actions={
          <Button onClick={() => router.back()} variant="outline" className="gap-2 rounded-full">
            <ArrowLeft className="w-4 h-4" />
            Retour au cours
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-muted-foreground dark:text-gray-400 pt-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs overflow-hidden">
                {course.teacherId?.profileImage ? (
                  <img src={course.teacherId.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  course.teacherId?.firstName?.charAt(0) || 'T'
                )}
              </div>
              <span className="text-sm font-medium">Enseignant: <span className="text-foreground dark:text-white font-bold">{course.teacherId?.firstName} {course.teacherId?.lastName}</span></span>
            </div>
          </div>

          <div className="bg-card dark:bg-[#111111] border border-border dark:border-[#222222] p-5 rounded-3xl min-w-[240px] shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-muted-foreground dark:text-gray-400">Progression</span>
              <span className="text-lg font-black text-blue-400">{calculatedProgress}%</span>
            </div>
            <div className="h-2.5 w-full bg-muted dark:bg-[#222222] rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${calculatedProgress}%` }}
                 className="h-full bg-blue-500 rounded-full"
               />
            </div>
          </div>
        </div>

      {/* Chapters List */}
      <div className="pb-20">
        {course.chapters?.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border dark:border-[#222222] rounded-[3rem] bg-muted/20 dark:bg-[#0a0a0a]">
            <BookOpen className="w-16 h-16 text-muted-foreground dark:text-gray-700 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-muted-foreground dark:text-gray-400">Aucun contenu disponible</h3>
            <p className="text-gray-600 mt-2">L'enseignant n'a pas encore publié de contenu pour cette matière.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-white/5 ml-4 md:ml-8 space-y-16">
            {course.chapters.map((chapter, cIdx) => (
              <motion.section 
                key={chapter._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: cIdx * 0.1 }}
                className="relative pl-8 md:pl-14"
              >
                {/* Timeline node */}
                <div className="absolute -left-[17px] md:-left-[25px] top-4 w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm md:text-xl font-black shadow-xl shadow-blue-500/30 ring-8 ring-background dark:ring-[#0a0a0a]">
                  {cIdx + 1}
                </div>

                {/* Chapter Container */}
                <div className="bg-card/60 dark:bg-[#111111]/60 backdrop-blur-3xl border border-border dark:border-white/5 rounded-[2.5rem] p-6 md:p-10 space-y-8 hover:border-border dark:hover:border-white/10 transition-colors shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -mr-32 -mt-32 rounded-full pointer-events-none" />
                  
                  <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-black text-foreground dark:text-white uppercase tracking-tight leading-tight">{chapter.title}</h2>
                    {chapter.description && (
                      <p className="text-muted-foreground dark:text-gray-400 font-medium text-sm md:text-base leading-relaxed mt-4 max-w-3xl border-l-2 border-blue-500/40 pl-4">
                        {chapter.description}
                      </p>
                    )}
                  </div>

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Materials */}
                    {chapter.materials?.map((material) => (
                      <div 
                        key={material._id}
                        className="group relative bg-muted/40 dark:bg-[#1a1a1a]/40 backdrop-blur-xl border border-border dark:border-white/5 p-6 rounded-[2rem] hover:border-blue-500/30 hover:bg-muted/60 dark:hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col justify-between overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-16 -mt-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                            {material.type === 'video' ? <PlayCircle className="w-6 h-6" /> : <File className="w-6 h-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground dark:text-white text-lg truncate group-hover:text-blue-400 transition-colors uppercase leading-tight">
                              {material.name || material.title || 'Document'}
                            </h4>
                            <p className="text-xs text-muted-foreground dark:text-gray-500 font-medium uppercase tracking-tighter mt-0.5">
                              {material.type === 'video' ? 'Vidéo' : 'Document'}
                            </p>
                          </div>
                        </div>

                        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border dark:border-white/5 mt-auto">
                           <span className="text-[10px] font-black text-muted-foreground dark:text-gray-500 tracking-widest uppercase truncate max-w-[120px]">
                             {material.description || 'Ressource pédagogique'}
                           </span>
                           <a 
                             href={material.url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center gap-2 px-5 py-2 bg-muted dark:bg-white/5 border border-border dark:border-white/10 rounded-full text-xs font-bold text-foreground dark:text-white hover:bg-blue-600 hover:text-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                           >
                             {material.type === 'video' ? 'Regarder' : 'Ouvrir'}
                             <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                           </a>
                        </div>
                      </div>
                    ))}

                    {/* Exercises */}
                    {chapter.exercises?.map((exercise) => (
                      <div 
                        key={exercise._id}
                        className="group relative bg-background/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl border border-blue-500/20 p-6 rounded-[2rem] hover:border-blue-400/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col justify-between overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] -mr-16 -mt-16 rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                        <div className="relative z-10 flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                            <Layout className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground dark:text-white text-lg truncate group-hover:text-blue-400 transition-colors uppercase leading-tight">
                              {exercise.name || exercise.title || 'Exercice'}
                            </h4>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <Clock className="w-3.5 h-3.5 text-red-400" />
                                <span className="text-[10px] text-red-400 font-black uppercase tracking-tighter">
                                  {exercise.dueDate ? `Échéance: ${new Date(exercise.dueDate).toLocaleDateString()}` : 'Pas d\'échéance'}
                                </span>
                              </div>
                              {exercise.hasSubmitted && (
                                <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                                  <span className="text-[9px] text-green-400 font-extrabold uppercase tracking-widest leading-none mt-[1px]">
                                    Rendu envoyé
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border dark:border-white/5 mt-auto">
                           <span className="text-[10px] font-black text-muted-foreground dark:text-gray-500 tracking-widest uppercase">
                             Exercice à rendre
                           </span>
                           <Link 
                             href={`/student/courses/${classId}/${subjectId}/exercises/${exercise._id}`}
                             className={cn(
                               "flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300",
                               exercise.hasSubmitted 
                                 ? "bg-muted dark:bg-white/10 hover:bg-muted/80 dark:hover:bg-white/20 border border-border dark:border-white/10 shadow-lg text-foreground dark:text-white" 
                                 : "bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 text-white"
                             )}
                           >
                             {exercise.hasSubmitted ? 'Consulter' : 'Travailler'}
                             <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                           </Link>
                        </div>
                      </div>
                    ))}

                    {chapter.materials?.length === 0 && chapter.exercises?.length === 0 && (
                       <div className="col-span-full py-6 text-center text-muted-foreground dark:text-gray-600 font-bold text-xs uppercase tracking-widest border border-dashed border-border dark:border-[#222222] rounded-3xl">
                         Aucun élément dans ce chapitre
                       </div>
                    )}
                  </div>
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
