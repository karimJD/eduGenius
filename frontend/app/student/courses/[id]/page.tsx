'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/axios';
import {
  BookOpen,
  PlayCircle,
  FileText,
  Download,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BrainCircuit,
  MessageSquare,
  BookmarkPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';
import { cn } from '../../../../lib/utils';
import { useParams, useRouter } from 'next/navigation';

export default function StudentCourseViewer() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeContentIndex, setActiveContentIndex] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({ 0: true });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/student/courses/${id}`);
        if (res.data.success) {
          setCourse(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching student course details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCourse();
  }, [id]);

  const toggleChapter = (index: number) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const markContentCompleted = async (chapterIdx: number, contentIdx: number) => {
    try {
      const chapterId = course.chapters[chapterIdx]._id;
      const contentId = course.chapters[chapterIdx].content[contentIdx]._id;
      
      const res = await api.post(`/student/courses/${id}/progress`, {
        chapterId,
        contentId
      });
      
      if (res.data.success) {
        // Optimistically update progress in UI
        const updatedCourse = { ...course };
        updatedCourse.progress = res.data.p_progress; // we might need accurate response structure from backend
        // For now, if we don't have exact progress object returned, assume it worked 
        // Better: re-fetch course entirely or update Local State carefully
        setCourse(res.data.data); // Assuming backend returns updated course info in `.data` OR we refetch:
      }
    } catch (error) {
      console.error('Failed to mark content as completed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-[#111111] border border-[#222222] rounded-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-gray-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Cours introuvable</h2>
          <p className="text-gray-400 mt-2">Ce cours n'existe pas ou vous n'y avez pas accès.</p>
        </div>
        <Button onClick={() => router.push('/student/courses')} variant="outline" className="border-[#333333]">
          Retour aux cours
        </Button>
      </div>
    );
  }

  const activeChapter = course.chapters?.[activeChapterIndex];
  const activeContent = activeChapter?.content?.[activeContentIndex];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a] border border-[#222222] rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-16 border-b border-[#222222] bg-[#111111] flex items-center px-4 md:px-6 justify-between shrink-0">
          <Link href="/student/courses" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-white px-3 py-1 bg-[#222222] rounded-full">
              {course.progress || 0}%
            </span>
            <Button variant="outline" size="sm" className="bg-[#111111] border-[#333333] text-gray-300 hover:text-white hidden sm:flex gap-2">
              <BookmarkPlus className="w-4 h-4" />
              Sauvegarder
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 hidden sm:flex gap-2 shadow-lg shadow-purple-500/20">
               <BrainCircuit className="w-4 h-4" />
               Aider avec l'IA
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
          {activeContent ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  {activeContent.type === 'video' || activeContent.type === 'youtube_link' ? (
                    <PlayCircle className="w-5 h-5" />
                  ) : activeContent.type === 'document' ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{activeContent.title}</h1>
                  <p className="text-gray-400 text-sm mt-1">{activeChapter.title}</p>
                </div>
              </div>

              {/* Content Viewer */}
              <div className="mt-8 bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden min-h-[400px]">
                {activeContent.type === 'text' && (
                  <div className="p-8 prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: activeContent.body || '<p>Aucun texte disponible.</p>' }} />
                )}
                {activeContent.type === 'youtube_link' && (
                  <div className="aspect-video w-full bg-black">
                    <iframe 
                      src={activeContent.url?.replace('watch?v=', 'embed/')} 
                      className="w-full h-full" 
                      allowFullScreen
                      title={activeContent.title}
                    />
                  </div>
                )}
                {activeContent.type === 'video' && (
                  <div className="aspect-video w-full bg-black flex items-center justify-center">
                    {activeContent.fileUrl ? (
                      <video src={activeContent.fileUrl} controls className="w-full h-full" />
                    ) : (
                      <div className="text-gray-500 font-medium">Vidéo non disponible</div>
                    )}
                  </div>
                )}
                {activeContent.type === 'document' && (
                  <div className="flex flex-col items-center justify-center h-64 p-8 text-center bg-[#111111]">
                    <FileText className="w-16 h-16 text-blue-500 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">Document Attaché</h3>
                    <p className="text-gray-400 mb-6 max-w-md">Téléchargez le document pour le lire sur votre appareil.</p>
                    <a href={activeContent.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2">
                        <Download className="w-4 h-4" />
                        Télécharger le document
                      </Button>
                    </a>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-8 flex items-center justify-between border-t border-[#222222] pt-6">
                 {/* This would be wired up to actual progress tracking using the API */}
                 <Button 
                    onClick={() => markContentCompleted(activeChapterIndex, activeContentIndex)}
                    className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 gap-2 font-medium"
                 >
                    <CheckCircle2 className="w-4 h-4" />
                    Marquer comme terminé
                 </Button>

                 <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="border-[#333333] text-gray-300"
                      disabled={activeChapterIndex === 0 && activeContentIndex === 0}
                      onClick={() => {
                        if (activeContentIndex > 0) {
                          setActiveContentIndex(activeContentIndex - 1);
                        } else if (activeChapterIndex > 0) {
                          setActiveChapterIndex(activeChapterIndex - 1);
                          setActiveContentIndex(course.chapters[activeChapterIndex - 1].content.length - 1);
                          setExpandedChapters(prev => ({ ...prev, [activeChapterIndex - 1]: true }));
                        }
                      }}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Précédent
                    </Button>
                    <Button 
                      className="bg-white text-black hover:bg-gray-200 font-semibold"
                      disabled={
                        activeChapterIndex === course.chapters?.length - 1 && 
                        activeContentIndex === activeChapter?.content?.length - 1
                      }
                      onClick={() => {
                        if (activeContentIndex < activeChapter.content.length - 1) {
                          setActiveContentIndex(activeContentIndex + 1);
                        } else if (activeChapterIndex < course.chapters.length - 1) {
                          setActiveChapterIndex(activeChapterIndex + 1);
                          setActiveContentIndex(0);
                          setExpandedChapters(prev => ({ ...prev, [activeChapterIndex + 1]: true }));
                        }
                      }}
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-[#111111] border border-[#222222] rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sélectionnez un contenu</h2>
              <p className="text-gray-500 max-w-sm">Choisissez une leçon dans le sommaire à droite pour commencer à apprendre.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar / Syllabus */}
      <div className="w-full lg:w-80 shrink-0 bg-[#0a0a0a] border border-[#222222] rounded-2xl flex flex-col overflow-hidden shadow-xl h-[400px] lg:h-full">
        <div className="p-5 border-b border-[#222222] bg-[#111111]">
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight">{course.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{course.chapters?.length || 0} chapitres</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {course.chapters?.map((chapter: any, cIdx: number) => {
            const isExpanded = expandedChapters[cIdx];
            const isActiveChapter = activeChapterIndex === cIdx;
            
            return (
              <div key={chapter._id} className="border border-[#222222] rounded-xl overflow-hidden bg-[#111111]">
                <button
                  onClick={() => toggleChapter(cIdx)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 text-left transition-colors",
                    isActiveChapter ? "bg-blue-500/5" : "hover:bg-[#1a1a1a]"
                  )}
                >
                  <span className={cn(
                    "font-medium text-sm pr-4",
                    isActiveChapter ? "text-blue-400" : "text-gray-300"
                  )}>
                    {cIdx + 1}. {chapter.title}
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0",
                    isExpanded && "rotate-180"
                  )} />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-3 pt-1 px-3 space-y-1">
                        {chapter.content?.map((content: any, cntIdx: number) => {
                          const isActive = activeChapterIndex === cIdx && activeContentIndex === cntIdx;
                          return (
                            <button
                              key={content._id}
                              onClick={() => {
                                setActiveChapterIndex(cIdx);
                                setActiveContentIndex(cntIdx);
                              }}
                              className={cn(
                                "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                                isActive 
                                  ? "bg-blue-500/10 border border-blue-500/20" 
                                  : "hover:bg-[#1a1a1a] border border-transparent"
                              )}
                            >
                              <div className="mt-0.5 shrink-0">
                                {content.type === 'video' || content.type === 'youtube_link' ? (
                                  <PlayCircle className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-gray-500")} />
                                ) : content.type === 'document' ? (
                                  <FileText className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-gray-500")} />
                                ) : (
                                  <BookOpen className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-gray-500")} />
                                )}
                              </div>
                              <span className={cn(
                                "text-[13px] leading-tight flex-1",
                                isActive ? "text-white font-medium" : "text-gray-400 font-normal"
                              )}>
                                {content.title}
                              </span>
                            </button>
                          );
                        })}
                        {(!chapter.content || chapter.content.length === 0) && (
                          <div className="p-3 text-xs text-gray-500 text-center">
                            Aucun contenu
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
