'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/axios';
import {
  initializeSocket,
  onSummaryGenerated,
  onSummaryError,
} from '../../../lib/socket';
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
  CheckCircle2,
  X,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { PageHeader } from '../../../components/student/PageHeader';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import Image from 'next/image';
import { GenerateSummaryModal } from '@/components/student/GenerateSummaryModal';
import { GenerateFlashcardsModal } from '@/components/student/GenerateFlashcardsModal';
import { GenerateQuizModal } from '@/components/student/GenerateQuizModal';
import { QuizPlayer } from '@/components/student/QuizPlayer';
import { FlashcardViewer } from '@/components/student/FlashcardViewer';
import SummaryViewer from '@/components/student/SummaryViewer';

type TabType = 'overview' | 'summaries' | 'flashcards' | 'quizzes';

export default function StudentAIPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const [summaries, setSummaries] = useState<any[]>([]);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);

  // Modals state
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  // Viewer state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [activeFlashcardDeck, setActiveFlashcardDeck] = useState<any | null>(
    null,
  );
  const [activeSummary, setActiveSummary] = useState<any | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  const loadingMessages = [
    'Génération de votre résumé en cours...',
    'Extraction du contenu des fichiers PDF...',
    "Analyse intelligente avec l'IA...",
    'Création du résumé pédagogique...',
    'Finalisation de votre contenu...',
    'Presque terminé !',
  ];

  useEffect(() => {
    if (summaries.some((s) => s.generating)) {
      const interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2500); // Change every 2.5 seconds
      return () => clearInterval(interval);
    }
  }, [summaries]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summariesRes, historyRes, aiCoursesRes] = await Promise.all([
        api.get('/student/ai/summaries'),
        api.get('/student/ai/practice-quizzes/history'),
        api.get('/student/courses'),
      ]);

      if (summariesRes.data.success) {
        setSummaries(summariesRes.data.data);
      }
      if (historyRes.data.success) setQuizHistory(historyRes.data.data);
      if (aiCoursesRes.data.success) {
        setClasses(aiCoursesRes.data.data);
        const flattenedSubjects: any[] = [];
        aiCoursesRes.data.data.forEach((cls: any) => {
          cls.assignedSubjects?.forEach((sub: any) => {
            if (sub.subjectId) {
              flattenedSubjects.push({
                ...sub.subjectId,
                classId: cls._id,
                className: cls.name,
              });
            }
          });
        });
        setSubjects(flattenedSubjects);
      }
    } catch (error) {
      console.error('Error fetching AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Initialize socket and listen for summary generation events
    if (user?._id) {
      const socket = initializeSocket(user._id);

      const unsubscribeSummaryGenerated = onSummaryGenerated(
        (response: any) => {
          if (response.success && response.data) {
            setSummaries((prev) =>
              prev
                .map((s) => (s._id === response.data._id ? response.data : s))
                .filter((s) => !s.generating),
            );
            setNotification('Votre résumé a été généré avec succès !');
            setTimeout(() => setNotification(null), 5000);
          }
        },
      );

      const unsubscribeSummaryError = onSummaryError((error: any) => {
        const message =
          error.message || 'Une erreur est survenue lors de la génération';
        // Remove placeholder on error
        setSummaries((prev) => prev.filter((s) => !s.generating));
        setNotification(`Erreur: ${message}`);
        setTimeout(() => setNotification(null), 5000);
      });

      return () => {
        unsubscribeSummaryGenerated();
        unsubscribeSummaryError();
      };
    }
  }, []);

  const handleGenerateSummary = async (data: any) => {
    setSummaryModalOpen(false); // Close modal immediately
    const placeholderId = Date.now().toString();
    const placeholder = {
      _id: placeholderId,
      generating: true,
      title: 'Génération en cours...',
      content: '',
      createdAt: new Date(),
      aiGenerationParams: { difficulty: 'Génération...' },
    };
    setSummaries((prev) => [placeholder, ...prev]);
    setActiveTab('summaries');

    try {
      // Fire and forget - socket will handle the completion
      await api.post('/student/ai/generate-summary', data);
    } catch (error) {
      console.error('Error generating summary:', error);
      // Remove placeholder on error
      setSummaries((prev) => prev.filter((s) => s._id !== placeholderId));
      setNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
      );
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleGenerateFlashcards = async (data: any) => {
    try {
      const res = await api.post('/student/ai/generate-flashcards', data);
      if (res.data.success) {
        setFlashcards((prev) => [res.data.data, ...prev]);
        setActiveFlashcardDeck(res.data.data);
        setActiveTab('flashcards');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
    }
  };

  const handleGenerateQuiz = async (data: any) => {
    try {
      const res = await api.post('/student/ai/generate-practice-quiz', data);
      if (res.data.success) {
        setIsReviewMode(false);
        setActiveQuizId(res.data.data._id);
        setActiveTab('quizzes');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
    }
  };

  const handleDeleteSummary = async (summaryId: string) => {
    try {
      await api.delete(`/student/ai/summaries/${summaryId}`);
      setSummaries((prev) => prev.filter((s) => s._id !== summaryId));
    } catch (error) {
      console.error('Error deleting summary:', error);
    }
  };

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        setLoadingFlashcards(true);
        const res = await api.get('/student/ai/flashcards/all');
        if (res.data.success) {
          setFlashcards(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      } finally {
        setLoadingFlashcards(false);
      }
    };

    if (activeTab === 'flashcards') {
      fetchFlashcards();
    }
  }, [activeTab]);

  return (
    <div className='space-y-8'>
      {/* Notification */}
      {notification && (
        <div className='bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-600 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2'>
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className='text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      )}

      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10 mb-8'>
        <PageHeader
          title="Outils d'Étude IA"
          description="Générez des résumés, des flashcards et des quiz d'entraînement personnalisés grâce à l'Intelligence Artificielle."
          icon={BrainCircuit}
          badgeText='Assistant IA EduGenius'
          badgeClassName='bg-purple-500/10 border-purple-500/20 text-purple-400'
        />
      </div>

      <GenerateSummaryModal
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        classId={classes[0]?._id || ''}
        classes={classes}
        onGenerate={handleGenerateSummary}
      />
      <GenerateFlashcardsModal
        open={flashcardsModalOpen}
        onOpenChange={setFlashcardsModalOpen}
        classId={classes[0]?._id || ''}
        classes={classes}
        onGenerate={handleGenerateFlashcards}
      />
      <GenerateQuizModal
        open={quizModalOpen}
        onOpenChange={setQuizModalOpen}
        classId={classes[0]?._id || ''}
        classes={classes}
        onGenerate={handleGenerateQuiz}
      />

      {/* Navigation Tabs */}
      <div className='flex overflow-x-auto pb-2 custom-scrollbar border-b border-border dark:border-[#222222]'>
        {[
          { id: 'overview', label: "Vue d'ensemble", icon: Sparkles },
          { id: 'summaries', label: 'Mes Résumés', icon: FileText },
          { id: 'flashcards', label: 'Flashcards', icon: Layers },
          { id: 'quizzes', label: "Quiz d'entraînement", icon: CheckCircle2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabType);
              if (tab.id !== 'quizzes') setActiveQuizId(null);
              if (tab.id !== 'flashcards') setActiveFlashcardDeck(null);
            }}
            className={cn(
              'flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all whitespace-nowrap relative',
              activeTab === tab.id
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200 hover:bg-muted dark:hover:bg-white/5',
            )}
          >
            <tab.icon className='w-4 h-4' />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId='ai-tab-indicator'
                className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500'
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Areas */}
      <div className='min-h-[400px]'>
        <AnimatePresence mode='wait'>
          {loading ? (
            <motion.div
              key='loader'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='flex justify-center items-center h-64'
            >
              <div className='relative'>
                <div className='w-16 h-16 border-4 border-gray-200 dark:border-[#222222] rounded-full'></div>
                <div className='w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute inset-0'></div>
                <BrainCircuit className='w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' />
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
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  {/* Tool Cards */}
                  {[
                    {
                      title: 'Générateur de Résumés',
                      desc: 'Condensez de longs chapitres en résumés clairs et concis. Idéal pour les révisions de dernière minute.',
                      icon: FileText,
                      color: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
                      iconColor: 'text-blue-600 dark:text-blue-400',
                      count: summaries.length,
                      action: () => setActiveTab('summaries'),
                    },
                    {
                      title: 'Créateur de Flashcards',
                      desc: "Mémorisez plus vite. L'IA extrait les concepts clés et crée des cartes mémoires intelligentes.",
                      icon: Layers,
                      color: 'from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20',
                      iconColor: 'text-purple-600 dark:text-purple-400',
                      count: flashcards.length || 0,
                      action: () => setActiveTab('flashcards'),
                    },
                    {
                      title: 'Test de Connaissances',
                      desc: "Évaluez votre niveau avec des quiz générés sur mesure sur n'importe quel sujet abordé en cours.",
                      icon: CheckCircle2,
                      color: 'from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20',
                      iconColor: 'text-green-600 dark:text-green-400',
                      count: quizHistory.length,
                      action: () => setActiveTab('quizzes'),
                    },
                  ].map((tool, idx) => (
                    <div
                      key={idx}
                      className='bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl p-6 hover:border-gray-300 dark:hover:border-[#333333] transition-all group flex flex-col shadow-sm dark:shadow-none'
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 transition-transform group-hover:scale-110',
                          tool.color,
                        )}
                      >
                        <tool.icon className={cn('w-6 h-6', tool.iconColor)} />
                      </div>
                      <h3 className='text-xl font-bold text-foreground dark:text-white mb-2'>
                        {tool.title}
                      </h3>
                      <p className='text-muted-foreground dark:text-gray-400 text-sm flex-1 mb-6'>
                        {tool.desc}
                      </p>

                      <div className='flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-[#222222]'>
                        <span className='text-xs font-semibold text-muted-foreground dark:text-gray-500 uppercase tracking-wider'>
                          {tool.count} généré(s)
                        </span>
                        <button
                          onClick={tool.action}
                          className='text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1 group-hover:gap-2 transition-all'
                        >
                          Voir <ChevronRight className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Recommendations */}
                  <div className='md:col-span-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-[#1a1c2e] dark:to-[#2d1b36] border border-purple-500/20 rounded-2xl p-6 lg:p-8 relative overflow-hidden flex flex-col lg:flex-row items-center gap-8 shadow-lg'>
                    <div className='absolute top-0 right-0 p-8 opacity-10 blur-xl'>
                      <BrainCircuit size={200} className='text-purple-300' />
                    </div>

                    <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30 relative z-10'>
                      <Zap className='w-8 h-8 text-white' />
                    </div>

                    <div className='flex-1 text-center lg:text-left relative z-10'>
                      <h3 className='text-2xl font-bold text-foreground dark:text-white mb-2'>
                        Recommandation de l'IA
                      </h3>
                      <p className='text-purple-800 dark:text-purple-200'>
                        D'après vos récents résultats de quiz, nous vous
                        suggérons de générer un résumé sur le chapitre{' '}
                        <strong>"Cinématique"</strong> en Physique. Vous semblez
                        avoir quelques difficultés sur ce sujet.
                      </p>
                    </div>

                    <Button
                      onClick={() => setSummaryModalOpen(true)}
                      className='shrink-0 bg-purple-600 dark:bg-white text-white dark:text-black hover:bg-purple-700 dark:hover:bg-gray-100 font-bold px-6 py-6 rounded-xl relative z-10'
                    >
                      Générer Résumé Pédagogique
                    </Button>
                  </div>
                </div>
              )}

              {/* === SUMMARIES TAB === */}
              {activeTab === 'summaries' && (
                <div className='space-y-6'>
                  {activeSummary ? (
                    <SummaryViewer
                      summary={activeSummary}
                      onClose={() => setActiveSummary(null)}
                    />
                  ) : (
                    <>
                      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                        <h2 className='text-xl font-bold text-foreground dark:text-white'>
                          Vos Résumés Sauvegardés
                        </h2>

                        <div className='flex items-center gap-3'>
                          <Button
                            onClick={() => setSummaryModalOpen(true)}
                            className='bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl'
                          >
                            Nouveau Résumé
                          </Button>
                        </div>
                      </div>

                      {summaries.length === 0 ? (
                        <EmptyState
                          icon={FileText}
                          title='Aucun résumé trouvé'
                          description='Générez votre premier résumé IA à partir de vos cours pour gagner du temps dans vos révisions.'
                        />
                      ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                          {summaries.map((summary) => (
                            <div
                              key={summary._id}
                              onClick={() =>
                                !summary.generating && setActiveSummary(summary)
                              }
                              className={cn(
                                'bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl p-5 hover:border-blue-500/30 transition-all cursor-pointer group shadow-sm dark:shadow-none',
                                summary.generating &&
                                  'cursor-not-allowed opacity-75 animate-pulse',
                              )}
                            >
                              {summary.generating ? (
                                <div className='flex flex-col items-center justify-center h-32 space-y-4'>
                                  <div className='relative'>
                                    <BrainCircuit className='w-12 h-12 text-purple-500 animate-pulse' />
                                    <div className='absolute -top-1 -right-1 w-4 h-4 bg-purple-400 rounded-full animate-ping'></div>
                                  </div>
                                  <div className='text-center space-y-2'>
                                    <p className='text-sm font-medium text-foreground dark:text-gray-200 animate-fade-in'>
                                      {loadingMessages[currentLoadingMessage]}
                                    </p>
                                    <p className='text-xs text-muted-foreground dark:text-gray-400'>
                                      Veuillez patienter, cela peut prendre
                                      quelques instants
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className='flex justify-between items-start mb-3'>
                                    <div className='w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center'>
                                      <FileText className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                                    </div>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-xs text-muted-foreground dark:text-gray-500 flex items-center gap-1'>
                                        <Clock className='w-3 h-3' />
                                        {new Date(
                                          summary.createdAt,
                                        ).toLocaleDateString()}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSummary(summary._id);
                                        }}
                                        className='w-6 h-6 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                                      >
                                        <Trash2 className='w-3 h-3 text-red-500' />
                                      </button>
                                    </div>
                                  </div>
                                  <h3 className='font-bold text-foreground dark:text-white mb-2 line-clamp-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors'>
                                    Résumé {summary.course?.name || 'IA'}
                                  </h3>
                                  <p className='text-sm text-muted-foreground dark:text-gray-400 line-clamp-3 mb-4'>
                                    {summary.content}
                                  </p>
                                  <div className='flex items-center gap-2'>
                                    <span className='px-2 py-1 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-md text-[10px] uppercase text-muted-foreground dark:text-gray-400 font-semibold tracking-wider'>
                                      {summary.aiGenerationParams?.difficulty ||
                                        'Standard'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* === FLASHCARDS TAB === */}
              {activeTab === 'flashcards' && (
                <div className='space-y-6'>
                  {activeFlashcardDeck ? (
                    <FlashcardViewer
                      deck={activeFlashcardDeck}
                      onClose={() => setActiveFlashcardDeck(null)}
                    />
                  ) : (
                    <>
                      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                        <h2 className='text-xl font-bold text-foreground dark:text-white'>
                          Vos Jeux de Flashcards
                        </h2>

                        <div className='flex items-center gap-3'>
                          <Button
                            onClick={() => setFlashcardsModalOpen(true)}
                            className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl'
                          >
                            Nouveau Deck
                          </Button>
                        </div>
                      </div>

                      {loadingFlashcards ? (
                        <div className='py-12 flex justify-center'>
                          <div className='w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin' />
                        </div>
                      ) : flashcards.length === 0 ? (
                        <EmptyState
                          icon={Layers}
                          title='Aucun jeu de flashcards'
                          description='Générez de nouvelles flashcards à partir de vos cours pour booster votre mémoire.'
                        />
                      ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                          {flashcards.map((deck) => (
                            <div
                              key={deck._id}
                              className='bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl p-5 hover:border-purple-500/30 transition-all cursor-pointer group flex flex-col items-center text-center shadow-sm dark:shadow-none'
                              onClick={() => setActiveFlashcardDeck(deck)}
                            >
                              <div className='relative mb-6 mt-2'>
                                <div className='w-16 h-20 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-lg -rotate-6 absolute top-0 left-0 transform origin-bottom-left transition-transform group-hover:-rotate-12'></div>
                                <div className='w-16 h-20 bg-gray-200 dark:bg-[#222222] border border-gray-300 dark:border-[#444444] rounded-lg rotate-6 absolute top-0 left-0 transform origin-bottom-right transition-transform group-hover:rotate-12'></div>
                                <div className='w-16 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg relative z-10 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:-translate-y-2 transition-transform'>
                                  <span className='font-bold text-white text-xl'>
                                    {deck.flashcards?.length || 0}
                                  </span>
                                </div>
                              </div>
                              <h3 className='font-bold text-foreground dark:text-white mb-2'>
                                {deck.title || 'Jeu de cartes IA'}
                              </h3>
                              <p className='text-xs text-muted-foreground dark:text-gray-500 mb-4 flex items-center gap-1'>
                                <Clock className='w-3 h-3' />
                                Généré le{' '}
                                {new Date(deck.createdAt).toLocaleDateString()}
                              </p>
                              <Button className='w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] text-foreground dark:text-white hover:bg-gray-100 dark:hover:bg-[#222222]'>
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
                <div className='space-y-6'>
                  {activeQuizId ? (
                    <QuizPlayer
                      quizId={activeQuizId}
                      isReview={isReviewMode}
                      onComplete={() => {
                        setActiveQuizId(null);
                        setIsReviewMode(false);
                        loadData(); // reload history
                      }}
                      onCancel={() => {
                        setActiveQuizId(null);
                        setIsReviewMode(false);
                      }}
                    />
                  ) : (
                    <>
                      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                        <h2 className='text-xl font-bold text-foreground dark:text-white'>
                          Historique d'Entraînement
                        </h2>

                        <Button
                          onClick={() => setQuizModalOpen(true)}
                          className='bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-8'
                        >
                          Nouvel Entraînement
                        </Button>
                      </div>

                      {quizHistory.length === 0 ? (
                        <EmptyState
                          icon={CheckCircle2}
                          title='Aucun entraînement'
                          description="Générez un quiz d'entraînement pour tester vos connaissances."
                        />
                      ) : (
                        <div className='space-y-4'>
                          {quizHistory.map((quiz) => (
                            <div
                              key={quiz._id}
                              className='bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-green-500/30 transition-all shadow-sm dark:shadow-none'
                            >
                              <div className='flex items-center gap-4'>
                                <div
                                  className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0',
                                    quiz.percentage >= 80
                                      ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-500/10'
                                      : quiz.percentage >= 50
                                        ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10'
                                        : 'border-red-500 text-red-600 dark:text-red-400 bg-red-500/10',
                                  )}
                                >
                                  <span className='font-bold text-sm'>
                                    {Math.round(quiz.percentage)}%
                                  </span>
                                </div>
                                <div>
                                  <h3 className='font-bold text-foreground dark:text-white'>
                                    {quiz.quizTitle || "Quiz d'entraînement IA"}
                                  </h3>
                                  <p className='text-sm text-muted-foreground dark:text-gray-400'>
                                    {quiz.score} / {quiz.totalPoints} points •{' '}
                                    {new Date(
                                      quiz.createdAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <Button
                                variant='outline'
                                className='border-gray-300 dark:border-[#333333] bg-transparent hover:bg-gray-50 dark:hover:bg-[#222222] text-foreground dark:text-white w-full sm:w-auto'
                                onClick={() => {
                                  setIsReviewMode(true);
                                  setActiveQuizId(quiz._id);
                                }}
                              >
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

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className='flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-300 dark:border-[#333333] rounded-2xl bg-gray-50 dark:bg-[#0a0a0a]'>
      <div className='w-16 h-16 bg-white dark:bg-[#111111] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-[#222222] shadow-sm dark:shadow-none'>
        <Icon className='w-8 h-8 text-muted-foreground dark:text-gray-500' />
      </div>
      <h3 className='text-xl font-bold text-foreground dark:text-white mb-2'>
        {title}
      </h3>
      <p className='text-muted-foreground dark:text-gray-500 max-w-sm mx-auto'>
        {description}
      </p>
    </div>
  );
}
