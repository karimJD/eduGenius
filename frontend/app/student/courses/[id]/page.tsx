'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  BookOpen, 
  Sparkles, 
  FileText, 
  Clock,
  ChevronRight,
  PlayCircle,
  Download,
  CheckCircle2,
  GraduationCap,
  Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Course {
  _id: string;
  title: string;
  description: string;
  summary: string;
  quiz: any[];
  chapters: any[];
  createdAt: string;
  teacherId: {
    firstName: string;
    lastName: string;
  };
}

export default function StudentCourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'ai'>('content');

  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data);
      } catch (error) {
        console.error('Failed to fetch course details:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCourse();
  }, [id]);

  const handleGenerateSummary = async (style: string = 'cheatSheet') => {
    try {
      setGeneratingSummary(true);
      const res = await api.post('/ai/summary', { courseId: id, type: 'full', style });
      setCourse(prev => prev ? { ...prev, summary: res.data.content } : null);
    } catch (err) {
      console.error('Failed to generate summary:', err);
      alert('AI Generation failed. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateQuiz = async (type: string) => {
    try {
      setGeneratingQuiz(true);
      const res = await api.post('/ai/quiz/generate', { courseId: id, type });
      router.push(`/student/quiz/${res.data._id}`);
    } catch (err) {
      console.error('Failed to generate quiz:', err);
      alert('Failed to generate practice quiz.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!course) return <div className="text-center py-20 text-gray-400">Course not found.</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl border border-white/10">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-white tracking-tight">{course.title}</h1>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {course.teacherId?.firstName} {course.teacherId?.lastName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 5 Chapters</span>
                </div>
            </div>
        </div>
        <div className="flex gap-3">
            <Button variant="ghost" className="bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex gap-2 text-xs">
                <Download className="w-4 h-4" /> Save Offline
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex gap-2 font-bold px-8 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                <PlayCircle className="w-5 h-5" /> Continue Learning
            </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-white/5">
        <button 
            onClick={() => setActiveTab('content')}
            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'content' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
            Course Content
            {activeTab === 'content' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
        </button>
        <button 
            onClick={() => setActiveTab('ai')}
            className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'ai' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
            <Sparkles className="w-4 h-4" />
            AI Training Lab
            {activeTab === 'ai' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
                {activeTab === 'content' ? (
                    <motion.div 
                        key="content"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {course.chapters?.map((chapter: any, index: number) => (
                            <div key={index} className="bg-white/5 border border-white/10 rounded-3xl p-6 group hover:bg-white/10 transition-all border-l-4 border-l-blue-600">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                                            {index + 1}
                                        </div>
                                        <h3 className="font-bold text-lg text-white">{chapter.title}</h3>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-gray-700 group-hover:text-green-500 transition-colors" />
                                </div>
                                <div className="space-y-2 ml-14">
                                    {chapter.materials?.map((mat: any, mIdx: number) => (
                                        <div key={mIdx} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-300">{mat.name}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600 uppercase">12 MB</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="ai"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                    >
                        <section className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Sparkles size={140} />
                            </div>
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                                AI Personalized Summary
                            </h3>
                            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {course.summary || (generatingSummary ? 'Votre résumé est en cours de création par notre IA... ✨' : 'Click the button below to generate a smart summary of this course content.')}
                            </div>
                            {(!course.summary || generatingSummary) && (
                                <Button 
                                    onClick={() => handleGenerateSummary()}
                                    disabled={generatingSummary}
                                    className="mt-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 px-8 flex gap-2 font-bold shadow-lg shadow-purple-600/20 disabled:opacity-50"
                                >
                                   {generatingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                   {generatingSummary ? 'Génération en cours...' : 'Generate Magic Summary'}
                                </Button>
                            )}
                        </section>

                        <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
                             <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <CheckCircle2 className="w-5 h-5 text-orange-400" />
                                Smart Quiz Generation
                             </h3>
                             <p className="text-sm text-gray-500 mb-8 max-w-md italic font-medium">Ready for self-evaluation? Our AI will generate a quiz based on exactly what you've learned to test your knowledge.</p>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div 
                                    onClick={() => !generatingQuiz && handleGenerateQuiz('quick')}
                                    className={`p-6 bg-black/40 border border-white/5 rounded-2xl text-center space-y-3 hover:border-blue-500/30 transition-colors cursor-pointer group ${generatingQuiz ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quick Review</p>
                                    <p className="text-2xl font-bold text-white">5 Qs</p>
                                    <p className="text-[10px] text-gray-600">~ 2 Minutes</p>
                                    <Button variant="ghost" disabled={generatingQuiz} className="w-full h-8 text-[10px] uppercase font-bold text-blue-400 hover:bg-blue-500/10">Start</Button>
                                </div>
                                <div 
                                    onClick={() => !generatingQuiz && handleGenerateQuiz('deep')}
                                    className={`p-6 bg-black/40 border border-white/5 rounded-2xl text-center space-y-3 hover:border-purple-500/30 transition-colors cursor-pointer group ${generatingQuiz ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Deep Dive</p>
                                    <p className="text-2xl font-bold text-white">10 Qs</p>
                                    <p className="text-[10px] text-gray-600">~ 5 Minutes</p>
                                    <Button variant="ghost" disabled={generatingQuiz} className="w-full h-8 text-[10px] uppercase font-bold text-purple-400 hover:bg-purple-500/10">Start</Button>
                                </div>
                                <div 
                                    onClick={() => !generatingQuiz && handleGenerateQuiz('exam')}
                                    className={`p-6 bg-black/40 border border-white/5 rounded-2xl text-center space-y-3 hover:border-green-500/30 transition-colors cursor-pointer group ${generatingQuiz ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Exam Prep</p>
                                    <p className="text-2xl font-bold text-white">20 Qs</p>
                                    <p className="text-[10px] text-gray-600">~ 15 Minutes</p>
                                    <Button variant="ghost" disabled={generatingQuiz} className="w-full h-8 text-[10px] uppercase font-bold text-green-400 hover:bg-green-500/10">Start</Button>
                                </div>
                             </div>
                        </section>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Learning sidebar */}
        <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Overall Progress
                </h3>
                <div className="space-y-4">
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="bg-green-500 h-full rounded-full" />
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500 uppercase">Completion</span>
                        <span className="text-white">45%</span>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500 border-b border-white/5 pb-2">Course Stats</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Chapters</span>
                        <span className="text-sm font-bold text-white">{course.chapters?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Total Quiz Points</span>
                        <span className="text-sm font-bold text-white">125 XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Time Spent</span>
                        <span className="text-sm font-bold text-white">1h 45m</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
