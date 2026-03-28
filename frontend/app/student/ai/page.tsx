'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/axios';
import {
  BrainCircuit,
  FileText,
  Layers,
  Sparkles,
  Zap,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Clock,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import Image from 'next/image';
import { GenerateSummaryModal } from '@/components/student/GenerateSummaryModal';
import { QuizPlayer } from '@/components/student/QuizPlayer';
import { FlashcardViewer } from '@/components/student/FlashcardViewer';

type TabType = 'overview' | 'summaries' | 'flashcards' | 'quizzes';

export default function StudentAIPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [summaries, setSummaries] = useState<any[]>([]);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  
  
  // Quiz Player State
  const [activeQuizCourseId, setActiveQuizCourseId] = useState<string | null>(null);

  // Flashcards State
  const [activeFlashcardDeck, setActiveFlashcardDeck] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summariesRes, historyRes, classesRes] = await Promise.all([
        api.get('/student/ai-tools/summaries'),
        api.get('/student/ai-tools/practice-quizzes/history'),
        api.get('/student/classes')
      ]);
      
      if (summariesRes.data.success) setSummaries(summariesRes.data.data);
      if (historyRes.data.success) setQuizHistory(historyRes.data.data);
      if (classesRes.data.success) {
        setClasses(classesRes.data.data);
        if (classesRes.data.data.length > 0) {
          setSelectedClassId(classesRes.data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateSummary = async (data: { classId: string; style: string }) => {
    await api.post('/ai/summary', data);
    // Reload summaries after generating
    await loadData();
    setActiveTab('summaries');
  };

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!selectedClassId) return;
      try {
        setLoadingFlashcards(true);
        const res = await api.get(`/student/ai-tools/flashcards/${selectedClassId}`);
        if (res.data.success) {
          setFlashcards(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      } finally {
        setLoadingFlashcards(false);
      }
    };

    if (activeTab === 'flashcards' && selectedClassId) {
      fetchFlashcards();
    }
  }, [selectedClassId, activeTab]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium w-fit"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Assistant IA EduGenius</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Outils d'Étude IA</h1>
          <p className="text-gray-400 max-w-xl">
            Générez des résumés, des flashcards et des quiz d'entraînement personnalisés grâce à l'Intelligence Artificielle.
          </p>
        </div>
        
        <div className="flex gap-2">
           <Button 
             onClick={() => setSummaryModalOpen(true)}
             className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-purple-500/25"
           >
             <Sparkles className="w-4 h-4 mr-2" />
             Générer du contenu
           </Button>
        </div>
      </div>
      
      <GenerateSummaryModal 
        open={summaryModalOpen} 
        onOpenChange={setSummaryModalOpen}
        classes={classes}
        onGenerate={handleGenerateSummary}
      />

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto pb-2 custom-scrollbar border-b border-[#222222]">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: Sparkles },
          { id: 'summaries', label: 'Mes Résumés', icon: FileText },
          { id: 'flashcards', label: 'Flashcards', icon: Layers },
          { id: 'quizzes', label: 'Quiz d\'entraînement', icon: CheckCircle2 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all whitespace-nowrap relative",
              activeTab === tab.id 
                ? "text-purple-400" 
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="ai-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Areas */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#222222] rounded-full"></div>
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                <BrainCircuit className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* === OVERVIEW TAB === */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tool Cards */}
                  {[
                    {
                      title: "Générateur de Résumés",
                      desc: "Condensez de longs chapitres en résumés clairs et concis. Idéal pour les révisions de dernière minute.",
                      icon: FileText,
                      color: "from-blue-500/20 to-indigo-500/20",
                      iconColor: "text-blue-400",
                      count: summaries.length,
                      action: () => setActiveTab('summaries')
                    },
                    {
                      title: "Créateur de Flashcards",
                      desc: "Mémorisez plus vite. L'IA extrait les concepts clés et crée des cartes mémoires intelligentes.",
                      icon: Layers,
                      color: "from-purple-500/20 to-pink-500/20",
                      iconColor: "text-purple-400",
                      count: flashcards.length || 0,
                      action: () => setActiveTab('flashcards')
                    },
                    {
                      title: "Test de Connaissances",
                      desc: "Évaluez votre niveau avec des quiz générés sur mesure sur n'importe quel sujet abordé en cours.",
                      icon: CheckCircle2,
                      color: "from-green-500/20 to-emerald-500/20",
                      iconColor: "text-green-400",
                      count: quizHistory.length,
                      action: () => setActiveTab('quizzes')
                    }
                  ].map((tool, idx) => (
                     <div key={idx} className="bg-[#111111] border border-[#222222] rounded-2xl p-6 hover:border-[#333333] transition-all group flex flex-col">
                        <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 transition-transform group-hover:scale-110", tool.color)}>
                          <tool.icon className={cn("w-6 h-6", tool.iconColor)} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{tool.title}</h3>
                        <p className="text-gray-400 text-sm flex-1 mb-6">{tool.desc}</p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#222222]">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {tool.count} généré(s)
                          </span>
                          <button onClick={tool.action} className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            Voir <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                     </div>
                  ))}

                  {/* Recommendations */}
                  <div className="md:col-span-3 bg-gradient-to-r from-[#1a1c2e] to-[#2d1b36] border border-purple-500/20 rounded-2xl p-6 lg:p-8 relative overflow-hidden flex flex-col lg:flex-row items-center gap-8 shadow-lg">
                    <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                      <BrainCircuit size={200} className="text-purple-300" />
                    </div>
                    
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30 relative z-10">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex-1 text-center lg:text-left relative z-10">
                      <h3 className="text-2xl font-bold text-white mb-2">Recommandation de l'IA</h3>
                      <p className="text-purple-200">
                        D'après vos récents résultats de quiz, nous vous suggérons de générer un résumé sur le chapitre <strong>"Cinématique"</strong> en Physique. Vous semblez avoir quelques difficultés sur ce sujet.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => setSummaryModalOpen(true)}
                      className="shrink-0 bg-white text-black hover:bg-gray-100 font-bold px-6 py-6 rounded-xl relative z-10"
                    >
                      Générer Résumé Pédagogique
                    </Button>
                  </div>
                </div>
              )}

              {/* === SUMMARIES TAB === */}
              {activeTab === 'summaries' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Vos Résumés Sauvegardés</h2>
                  </div>
                  
                  {summaries.length === 0 ? (
                    <EmptyState 
                      icon={FileText} 
                      title="Aucun résumé trouvé" 
                      description="Générez votre premier résumé IA pour gagner du temps dans vos révisions." 
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {summaries.map(summary => (
                        <div key={summary._id} className="bg-[#111111] border border-[#222222] rounded-xl p-5 hover:border-blue-500/30 transition-all cursor-pointer group">
                          <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(summary.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                            {summary.title || "Résumé IA"}
                          </h3>
                          <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                            {summary.content}
                          </p>
                          <div className="flex items-center gap-2">
                             <span className="px-2 py-1 bg-[#1a1a1a] border border-[#333333] rounded-md text-[10px] uppercase text-gray-400 font-semibold tracking-wider">
                               {summary.aiGenerationParams?.difficulty || 'Standard'}
                             </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* === FLASHCARDS TAB === */}
              {activeTab === 'flashcards' && (
                 <div className="space-y-6">
                 {activeFlashcardDeck ? (
                   <FlashcardViewer 
                     deck={activeFlashcardDeck} 
                     onClose={() => setActiveFlashcardDeck(null)} 
                   />
                 ) : (
                   <>
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                       <h2 className="text-xl font-bold text-white">Vos Jeux de Flashcards</h2>
                       
                       <div className="flex items-center gap-2 w-full sm:w-auto">
                         <span className="text-sm text-gray-500 whitespace-nowrap">Classe:</span>
                         <select 
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="bg-[#111111] border border-[#333333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 w-full sm:w-48"
                         >
                           {classes.map(cls => (
                             <option key={cls._id} value={cls._id}>{cls.name}</option>
                           ))}
                           {classes.length === 0 && <option value="">Aucune classe</option>}
                         </select>
                       </div>
                     </div>
                     
                     {loadingFlashcards ? (
                        <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
                     ) : flashcards.length === 0 ? (
                       <EmptyState 
                         icon={Layers} 
                         title="Aucun jeu de flashcards" 
                         description="Sélectionnez une autre classe ou générez de nouvelles flashcards." 
                       />
                     ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {flashcards.map(deck => (
                           <div key={deck._id} className="bg-[#111111] border border-[#222222] rounded-xl p-5 hover:border-purple-500/30 transition-all cursor-pointer group flex flex-col items-center text-center">
                              <div className="relative mb-6 mt-2">
                                 <div className="w-16 h-20 bg-[#1a1a1a] border border-[#333333] rounded-lg -rotate-6 absolute top-0 left-0 transform origin-bottom-left transition-transform group-hover:-rotate-12"></div>
                                 <div className="w-16 h-20 bg-[#222222] border border-[#444444] rounded-lg rotate-6 absolute top-0 left-0 transform origin-bottom-right transition-transform group-hover:rotate-12"></div>
                                 <div className="w-16 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg relative z-10 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:-translate-y-2 transition-transform">
                                    <span className="font-bold text-white text-xl">{deck.flashcards?.length || 0}</span>
                                 </div>
                              </div>
                              <h3 className="font-bold text-white mb-2">{deck.title || "Jeu de cartes IA"}</h3>
                              <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                                 <Clock className="w-3 h-3" />
                                 Généré le {new Date(deck.createdAt).toLocaleDateString()}
                              </p>
                              <Button 
                                onClick={() => setActiveFlashcardDeck(deck)}
                                className="w-full bg-[#1a1a1a] border border-[#333333] text-white hover:bg-[#222222]"
                              >
                                Réviser
                              </Button>
                           </div>
                         ))}
                       </div>
                     )}
                   </>
                 )}
               </div>
              )}

              {/* === QUIZZES TAB === */}
              {activeTab === 'quizzes' && (
                <div className="space-y-6">
                  {activeQuizCourseId ? (
                     <QuizPlayer 
                       courseId={activeQuizCourseId}
                       onComplete={() => {
                         setActiveQuizCourseId(null);
                         loadData(); // reload history
                       }}
                       onCancel={() => setActiveQuizCourseId(null)}
                     />
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-white">Historique d'Entraînement</h2>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-sm text-gray-500 whitespace-nowrap">Nouveau Quiz:</span>
                          <select 
                             value={selectedClassId}
                             onChange={(e) => setActiveQuizCourseId(e.target.value)}
                             className="bg-purple-600 border border-purple-500 text-white font-bold rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 w-full sm:w-48 appearance-none cursor-pointer hover:bg-purple-700 transition-colors"
                          >
                            <option value="" disabled>Choisir un cours...</option>
                            {classes.map(cls => (
                              <option key={cls._id} value={cls._id}>{cls.name}</option>
                            ))}
                            {classes.length === 0 && <option value="" disabled>Aucune classe</option>}
                          </select>
                        </div>
                      </div>
                      
                      {quizHistory.length === 0 ? (
                        <EmptyState 
                          icon={CheckCircle2} 
                          title="Aucun entraînement" 
                          description="Générez un quiz d'entraînement pour tester vos connaissances." 
                        />
                      ) : (
                        <div className="space-y-4">
                          {quizHistory.map(quiz => (
                            <div key={quiz._id} className="bg-[#111111] border border-[#222222] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-green-500/30 transition-all">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0",
                                  quiz.percentage >= 80 ? "border-green-500 text-green-400 bg-green-500/10" :
                                  quiz.percentage >= 50 ? "border-yellow-500 text-yellow-400 bg-yellow-500/10" :
                                  "border-red-500 text-red-400 bg-red-500/10"
                                )}>
                                  <span className="font-bold text-sm">{Math.round(quiz.percentage)}%</span>
                                </div>
                                <div>
                                  <h3 className="font-bold text-white">{quiz.quizTitle || "Quiz d'entraînement IA"}</h3>
                                  <p className="text-sm text-gray-400">
                                    {quiz.score} / {quiz.totalPoints} points • {new Date(quiz.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <Button variant="outline" className="border-[#333333] text-white w-full sm:w-auto">
                                Revoir les réponses
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#333333] rounded-2xl bg-[#0a0a0a]">
      <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#222222]">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
